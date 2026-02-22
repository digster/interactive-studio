use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::net::TcpStream;
use tokio::process::{Child, Command as TokioCommand};
use tokio::time::{sleep, Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PythonEnvInfo {
    pub has_uv: bool,
    pub has_python: bool,
    pub python_version: Option<String>,
    pub has_venv: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PythonOutput {
    stream: String,
    data: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PythonExit {
    code: Option<i32>,
    success: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PythonAppReady {
    url: String,
}

struct ActivePythonApp {
    run_id: u64,
    child: Child,
}

#[derive(Clone)]
pub struct PythonProcessManager {
    active_app: Arc<Mutex<Option<ActivePythonApp>>>,
    run_counter: Arc<AtomicU64>,
}

impl Default for PythonProcessManager {
    fn default() -> Self {
        Self {
            active_app: Arc::new(Mutex::new(None)),
            run_counter: Arc::new(AtomicU64::new(0)),
        }
    }
}

impl PythonProcessManager {
    fn next_run_id(&self) -> u64 {
        self.run_counter.fetch_add(1, Ordering::SeqCst) + 1
    }

    fn lock_active_app(&self) -> Result<MutexGuard<'_, Option<ActivePythonApp>>, String> {
        self.active_app
            .lock()
            .map_err(|_| "Failed to acquire Python process lock".to_string())
    }

    fn has_active_run(&self, run_id: u64) -> bool {
        match self.lock_active_app() {
            Ok(guard) => guard
                .as_ref()
                .map(|active| active.run_id == run_id)
                .unwrap_or(false),
            Err(_) => false,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum PythonRuntimeKind {
    Uv,
    Python,
}

#[derive(Debug, Clone)]
struct PythonRuntime {
    kind: PythonRuntimeKind,
    executable: String,
    display_name: String,
}

fn format_runtime_display(base_name: &str, executable: &str) -> String {
    if executable == base_name {
        base_name.to_string()
    } else {
        format!("{} ({})", base_name, executable)
    }
}

/// Check whether a command can be spawned successfully with a probe flag.
fn command_runs(executable: &str, probe_args: &[&str]) -> bool {
    Command::new(executable)
        .args(probe_args)
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn resolve_executable_from_candidates(
    command_name: &str,
    probe_args: &[&str],
    candidates: &[PathBuf],
) -> Option<String> {
    if command_runs(command_name, probe_args) {
        return Some(command_name.to_string());
    }

    for candidate in candidates {
        if !candidate.is_file() {
            continue;
        }

        let executable = candidate.to_string_lossy().into_owned();
        if command_runs(&executable, probe_args) {
            return Some(executable);
        }
    }

    None
}

fn uv_candidate_paths() -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(home) = std::env::var("HOME") {
        candidates.push(Path::new(&home).join(".local/bin/uv"));
    }

    candidates.push(PathBuf::from("/opt/homebrew/bin/uv"));
    candidates.push(PathBuf::from("/usr/local/bin/uv"));

    candidates
}

fn resolve_uv_executable() -> Option<String> {
    resolve_executable_from_candidates("uv", &["--version"], &uv_candidate_paths())
}

fn resolve_python3_executable() -> Option<String> {
    if command_runs("python3", &["--version"]) {
        Some("python3".to_string())
    } else {
        None
    }
}

fn resolve_python_executable() -> Option<String> {
    if command_runs("python", &["--version"]) {
        Some("python".to_string())
    } else {
        None
    }
}

fn select_python_runtime(
    uv_executable: Option<String>,
    python3_executable: Option<String>,
    python_executable: Option<String>,
) -> Option<PythonRuntime> {
    if let Some(uv) = uv_executable {
        return Some(PythonRuntime {
            kind: PythonRuntimeKind::Uv,
            display_name: format_runtime_display("uv", &uv),
            executable: uv,
        });
    }

    if let Some(python3) = python3_executable {
        return Some(PythonRuntime {
            kind: PythonRuntimeKind::Python,
            display_name: format_runtime_display("python3", &python3),
            executable: python3,
        });
    }

    python_executable.map(|python| PythonRuntime {
        kind: PythonRuntimeKind::Python,
        display_name: format_runtime_display("python", &python),
        executable: python,
    })
}

fn resolve_python_runtime() -> Option<PythonRuntime> {
    select_python_runtime(
        resolve_uv_executable(),
        resolve_python3_executable(),
        resolve_python_executable(),
    )
}

fn build_uv_sync_args(project_dir: &Path) -> Vec<&'static str> {
    let mut args = vec!["sync"];
    if project_dir.join("uv.lock").exists() {
        args.push("--locked");
    }
    args
}

fn emit_stream_output(app: &AppHandle, stream: &str, data: String) {
    if data.is_empty() {
        return;
    }

    let _ = app.emit(
        "python-output",
        PythonOutput {
            stream: stream.to_string(),
            data,
        },
    );
}

fn emit_command_streams(app: &AppHandle, output: &std::process::Output) {
    emit_stream_output(
        app,
        "stdout",
        String::from_utf8_lossy(&output.stdout).to_string(),
    );
    emit_stream_output(
        app,
        "stderr",
        String::from_utf8_lossy(&output.stderr).to_string(),
    );
}

/// Get the Python version string from a given python binary.
fn get_python_version(python_cmd: &str) -> Option<String> {
    Command::new(python_cmd)
        .arg("--version")
        .output()
        .ok()
        .and_then(|output| {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if version.is_empty() {
                    // Some python versions output to stderr
                    let stderr_version = String::from_utf8_lossy(&output.stderr).trim().to_string();
                    if stderr_version.is_empty() {
                        None
                    } else {
                        Some(stderr_version)
                    }
                } else {
                    Some(version)
                }
            } else {
                None
            }
        })
}

fn ensure_uv_venv(app: &AppHandle, project_path: &str, uv_executable: &str) -> Result<(), String> {
    let venv_path = Path::new(project_path).join(".venv");
    if venv_path.exists() {
        return Ok(());
    }

    let _ = app.emit(
        "python-output",
        PythonOutput {
            stream: "stdout".to_string(),
            data: "Creating virtual environment with uv...\n".to_string(),
        },
    );

    let venv_output = Command::new(uv_executable)
        .arg("venv")
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to run 'uv venv': {}", e))?;

    if !venv_output.status.success() {
        let stderr = String::from_utf8_lossy(&venv_output.stderr).to_string();
        return Err(format!("Failed to create venv: {}", stderr));
    }

    Ok(())
}

fn sync_uv_project_dependencies(
    app: &AppHandle,
    project_path: &str,
    uv_executable: &str,
) -> Result<(), String> {
    let project_dir = Path::new(project_path);
    if !project_dir.join("pyproject.toml").exists() {
        return Ok(());
    }

    let args = build_uv_sync_args(project_dir);
    let command_label = format!("uv {}", args.join(" "));

    emit_stream_output(
        app,
        "stdout",
        format!("Syncing Python dependencies with {}...\n", command_label),
    );

    let sync_output = Command::new(uv_executable)
        .args(&args)
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to run '{}': {}", command_label, e))?;

    emit_command_streams(app, &sync_output);

    if !sync_output.status.success() {
        let stderr = String::from_utf8_lossy(&sync_output.stderr)
            .trim()
            .to_string();
        let detail = if stderr.is_empty() {
            format!("exit code {:?}", sync_output.status.code())
        } else {
            stderr
        };
        return Err(format!("{} failed: {}", command_label, detail));
    }

    Ok(())
}

fn find_available_port(host: &str, preferred_port: u16) -> Option<u16> {
    for offset in 0..=49u16 {
        let port = preferred_port.saturating_add(offset);
        if std::net::TcpListener::bind((host, port)).is_ok() {
            return Some(port);
        }
    }
    None
}

fn build_python_app_command(
    project_path: &str,
    script_name: &str,
    host: &str,
    port: u16,
    runtime: &PythonRuntime,
) -> Result<(TokioCommand, String), String> {
    let mut command = match runtime.kind {
        PythonRuntimeKind::Uv => {
            let mut cmd = TokioCommand::new(&runtime.executable);
            cmd.args(["run", "python", script_name]);
            cmd
        }
        PythonRuntimeKind::Python => {
            let mut cmd = TokioCommand::new(&runtime.executable);
            cmd.arg(script_name);
            cmd
        }
    };

    command
        .current_dir(project_path)
        .env("PYTHONUNBUFFERED", "1")
        .env("DASH_HOST", host)
        .env("DASH_PORT", format!("{}", port))
        .env("HOST", host)
        .env("PORT", format!("{}", port))
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    Ok((command, runtime.display_name.clone()))
}

async fn stream_process_output<R>(app: AppHandle, stream: &'static str, reader: R)
where
    R: tokio::io::AsyncRead + Unpin,
{
    let mut lines = BufReader::new(reader).lines();

    loop {
        match lines.next_line().await {
            Ok(Some(line)) => {
                let _ = app.emit(
                    "python-output",
                    PythonOutput {
                        stream: stream.to_string(),
                        data: format!("{}\n", line),
                    },
                );
            }
            Ok(None) => break,
            Err(err) => {
                let _ = app.emit(
                    "python-output",
                    PythonOutput {
                        stream: "stderr".to_string(),
                        data: format!("Failed to read {} stream: {}\n", stream, err),
                    },
                );
                break;
            }
        }
    }
}

fn spawn_app_exit_monitor(app: AppHandle, manager: PythonProcessManager, run_id: u64) {
    tokio::spawn(async move {
        loop {
            let wait_result = {
                let mut guard = match manager.lock_active_app() {
                    Ok(guard) => guard,
                    Err(err) => {
                        let _ = app.emit(
                            "python-output",
                            PythonOutput {
                                stream: "stderr".to_string(),
                                data: format!("{}\n", err),
                            },
                        );
                        return;
                    }
                };

                let Some(active) = guard.as_mut() else {
                    return;
                };

                if active.run_id != run_id {
                    return;
                }

                match active.child.try_wait() {
                    Ok(status) => status,
                    Err(err) => {
                        let _ = app.emit(
                            "python-output",
                            PythonOutput {
                                stream: "stderr".to_string(),
                                data: format!("Failed to poll Python app status: {}\n", err),
                            },
                        );
                        guard.take();
                        let _ = app.emit(
                            "python-exit",
                            PythonExit {
                                code: Some(1),
                                success: false,
                            },
                        );
                        return;
                    }
                }
            };

            if let Some(status) = wait_result {
                if let Ok(mut guard) = manager.lock_active_app() {
                    if guard
                        .as_ref()
                        .map(|active| active.run_id == run_id)
                        .unwrap_or(false)
                    {
                        guard.take();
                    }
                }

                let _ = app.emit(
                    "python-exit",
                    PythonExit {
                        code: status.code(),
                        success: status.success(),
                    },
                );
                return;
            }

            sleep(Duration::from_millis(200)).await;
        }
    });
}

fn spawn_readiness_probe(
    app: AppHandle,
    manager: PythonProcessManager,
    run_id: u64,
    host: String,
    port: u16,
    url: String,
) {
    tokio::spawn(async move {
        let deadline = Instant::now() + Duration::from_secs(20);

        loop {
            if !manager.has_active_run(run_id) {
                return;
            }

            if TcpStream::connect((host.as_str(), port)).await.is_ok() {
                let _ = app.emit("python-app-ready", PythonAppReady { url: url.clone() });
                let _ = app.emit(
                    "python-output",
                    PythonOutput {
                        stream: "stdout".to_string(),
                        data: format!("Python app is ready at {}\n", url),
                    },
                );
                return;
            }

            if Instant::now() >= deadline {
                let _ = app.emit(
                    "python-output",
                    PythonOutput {
                        stream: "stderr".to_string(),
                        data: format!("Timed out waiting for Python app at {}\n", url),
                    },
                );
                return;
            }

            sleep(Duration::from_millis(250)).await;
        }
    });
}

#[tauri::command]
pub fn check_python_env(project_path: String) -> Result<PythonEnvInfo, String> {
    let uv_executable = resolve_uv_executable();
    let python3_executable = resolve_python3_executable();
    let python_executable = resolve_python_executable();

    let has_uv = uv_executable.is_some();
    let has_python = has_uv || python3_executable.is_some() || python_executable.is_some();

    let python_version = if let Some(uv) = uv_executable {
        // Try getting version through uv
        Command::new(uv)
            .args(["python", "find"])
            .output()
            .ok()
            .and_then(|output| {
                if output.status.success() {
                    let python_path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    get_python_version(&python_path)
                } else {
                    None
                }
            })
            .or_else(|| {
                python3_executable
                    .as_deref()
                    .and_then(get_python_version)
                    .or_else(|| python_executable.as_deref().and_then(get_python_version))
            })
    } else {
        python3_executable
            .as_deref()
            .and_then(get_python_version)
            .or_else(|| python_executable.as_deref().and_then(get_python_version))
    };

    let has_venv = Path::new(&project_path).join(".venv").exists();

    Ok(PythonEnvInfo {
        has_uv,
        has_python,
        python_version,
        has_venv,
    })
}

#[tauri::command]
pub async fn run_python(
    app: AppHandle,
    project_path: String,
    script_name: String,
) -> Result<(), String> {
    let uv_executable = resolve_uv_executable();
    let python3_executable = resolve_python3_executable();
    let python_executable = resolve_python_executable();
    let project = project_path.clone();
    let script = script_name.clone();

    tokio::spawn(async move {
        let result = if let Some(uv) = uv_executable.as_deref() {
            match run_with_uv(&app, &project, &script, uv) {
                Ok(()) => Ok(()),
                Err(uv_err) => {
                    let _ = app.emit(
                        "python-output",
                        PythonOutput {
                            stream: "stderr".to_string(),
                            data: format!(
                                "uv execution failed ({}). Falling back to system Python...\n",
                                uv_err
                            ),
                        },
                    );

                    if let Some(python3) = python3_executable.as_deref() {
                        run_with_python(&app, &project, &script, python3)
                    } else if let Some(python) = python_executable.as_deref() {
                        run_with_python(&app, &project, &script, python)
                    } else {
                        Err(format!(
                            "uv failed and no system Python was found. Original error: {}",
                            uv_err
                        ))
                    }
                }
            }
        } else if let Some(python3) = python3_executable.as_deref() {
            run_with_python(&app, &project, &script, python3)
        } else if let Some(python) = python_executable.as_deref() {
            run_with_python(&app, &project, &script, python)
        } else {
            let _ = app.emit(
                "python-output",
                PythonOutput {
                    stream: "stderr".to_string(),
                    data: "No Python interpreter found. Install uv, python3, or python."
                        .to_string(),
                },
            );
            let _ = app.emit(
                "python-exit",
                PythonExit {
                    code: Some(1),
                    success: false,
                },
            );
            return;
        };

        if let Err(e) = result {
            let _ = app.emit(
                "python-output",
                PythonOutput {
                    stream: "stderr".to_string(),
                    data: format!("Execution error: {}", e),
                },
            );
            let _ = app.emit(
                "python-exit",
                PythonExit {
                    code: Some(1),
                    success: false,
                },
            );
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn run_python_app(
    app: AppHandle,
    manager: State<'_, PythonProcessManager>,
    project_path: String,
    script_name: String,
    host: Option<String>,
    port: Option<u16>,
) -> Result<(), String> {
    {
        let guard = manager.lock_active_app()?;
        if guard.is_some() {
            return Err(
                "A Python app is already running. Stop it before starting another.".to_string(),
            );
        }
    }

    let host = host
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "127.0.0.1".to_string());

    let requested_port = port.unwrap_or(8050);
    let selected_port = find_available_port(&host, requested_port).ok_or_else(|| {
        format!(
            "Could not find an open port near {} on {}",
            requested_port, host
        )
    })?;

    let runtime = resolve_python_runtime().ok_or_else(|| {
        "No Python interpreter found. Install uv, python3, or python.".to_string()
    })?;

    if runtime.kind == PythonRuntimeKind::Uv {
        ensure_uv_venv(&app, &project_path, &runtime.executable)?;
        sync_uv_project_dependencies(&app, &project_path, &runtime.executable)?;
    } else {
        let _ = app.emit(
            "python-output",
            PythonOutput {
                stream: "stderr".to_string(),
                data: "uv was not found. Falling back to system Python; install uv for automatic dependency sync.\n".to_string(),
            },
        );
    }

    let (mut command, runtime_name) =
        build_python_app_command(&project_path, &script_name, &host, selected_port, &runtime)?;

    let mut child = command
        .spawn()
        .map_err(|e| format!("Failed to start Python app with {}: {}", runtime_name, e))?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let run_id = manager.next_run_id();

    {
        let mut guard = manager.lock_active_app()?;
        if guard.is_some() {
            let _ = child.start_kill();
            return Err(
                "A Python app is already running. Stop it before starting another.".to_string(),
            );
        }

        *guard = Some(ActivePythonApp { run_id, child });
    }

    let url = format!("http://{}:{}/", host, selected_port);

    if selected_port != requested_port {
        let _ = app.emit(
            "python-output",
            PythonOutput {
                stream: "stdout".to_string(),
                data: format!(
                    "Requested port {} was unavailable, using {} instead.\n",
                    requested_port, selected_port
                ),
            },
        );
    }

    let _ = app.emit(
        "python-output",
        PythonOutput {
            stream: "stdout".to_string(),
            data: format!("Starting Python app '{}' on {}\n", script_name, url),
        },
    );

    if let Some(stdout_reader) = stdout {
        let app_clone = app.clone();
        tokio::spawn(async move {
            stream_process_output(app_clone, "stdout", stdout_reader).await;
        });
    }

    if let Some(stderr_reader) = stderr {
        let app_clone = app.clone();
        tokio::spawn(async move {
            stream_process_output(app_clone, "stderr", stderr_reader).await;
        });
    }

    spawn_app_exit_monitor(app.clone(), manager.inner().clone(), run_id);
    spawn_readiness_probe(
        app,
        manager.inner().clone(),
        run_id,
        host,
        selected_port,
        url,
    );

    Ok(())
}

#[tauri::command]
pub async fn stop_python_app(
    app: AppHandle,
    manager: State<'_, PythonProcessManager>,
) -> Result<(), String> {
    let active = {
        let mut guard = manager.lock_active_app()?;
        guard.take()
    };

    let Some(mut active) = active else {
        return Err("No running Python app to stop.".to_string());
    };

    let _ = app.emit(
        "python-output",
        PythonOutput {
            stream: "stdout".to_string(),
            data: "Stopping Python app...\n".to_string(),
        },
    );

    tokio::spawn(async move {
        let _ = active.child.kill().await;
        let status = active.child.wait().await.ok();
        let _ = app.emit(
            "python-exit",
            PythonExit {
                code: status.and_then(|s| s.code()),
                success: status.map(|s| s.success()).unwrap_or(false),
            },
        );
    });

    Ok(())
}

fn run_with_uv(
    app: &AppHandle,
    project_path: &str,
    script_name: &str,
    uv_executable: &str,
) -> Result<(), String> {
    ensure_uv_venv(app, project_path, uv_executable)?;

    // Run the script with uv run
    let output = Command::new(uv_executable)
        .args(["run", "python", script_name])
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to execute script with uv: {}", e))?;

    emit_process_output(app, &output);
    Ok(())
}

fn run_with_python(
    app: &AppHandle,
    project_path: &str,
    script_name: &str,
    python_cmd: &str,
) -> Result<(), String> {
    let output = Command::new(python_cmd)
        .arg(script_name)
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("Failed to execute script with {}: {}", python_cmd, e))?;

    emit_process_output(app, &output);
    Ok(())
}

fn emit_process_output(app: &AppHandle, output: &std::process::Output) {
    emit_command_streams(app, output);

    let code = output.status.code();
    let _ = app.emit(
        "python-exit",
        PythonExit {
            code,
            success: output.status.success(),
        },
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    #[cfg(unix)]
    use std::os::unix::fs::PermissionsExt;

    fn create_temp_dir(prefix: &str) -> PathBuf {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after epoch")
            .as_nanos();
        let dir = std::env::temp_dir().join(format!(
            "interactive-studio-python-{}-{}-{}",
            prefix,
            std::process::id(),
            timestamp
        ));
        fs::create_dir_all(&dir).expect("temp dir should be created");
        dir
    }

    fn remove_temp_dir(path: &Path) {
        let _ = fs::remove_dir_all(path);
    }

    #[cfg(unix)]
    fn write_executable_script(path: &Path) {
        fs::write(path, "#!/bin/sh\nexit 0\n").expect("script should be written");
        let mut permissions = fs::metadata(path)
            .expect("script metadata should exist")
            .permissions();
        permissions.set_mode(0o755);
        fs::set_permissions(path, permissions).expect("script should be executable");
    }

    #[cfg(unix)]
    #[test]
    fn resolve_executable_from_candidates_uses_absolute_candidate() {
        let temp_dir = create_temp_dir("uv-home");
        let uv_path = temp_dir.join("uv");
        write_executable_script(&uv_path);

        let resolved = resolve_executable_from_candidates(
            "definitely-not-real-uv-command",
            &["--version"],
            &[uv_path.clone()],
        );

        assert_eq!(resolved, Some(uv_path.to_string_lossy().into_owned()));
        remove_temp_dir(&temp_dir);
    }

    #[test]
    fn select_python_runtime_prefers_uv_when_available() {
        let runtime = select_python_runtime(
            Some("uv".to_string()),
            Some("python3".to_string()),
            Some("python".to_string()),
        )
        .expect("runtime should resolve");

        assert_eq!(runtime.kind, PythonRuntimeKind::Uv);
        assert_eq!(runtime.display_name, "uv");
        assert_eq!(runtime.executable, "uv");
    }

    #[test]
    fn select_python_runtime_falls_back_to_python3_without_uv() {
        let runtime = select_python_runtime(None, Some("python3".to_string()), None)
            .expect("runtime should resolve");

        assert_eq!(runtime.kind, PythonRuntimeKind::Python);
        assert_eq!(runtime.display_name, "python3");
        assert_eq!(runtime.executable, "python3");
    }

    #[test]
    fn build_uv_sync_args_uses_locked_sync_when_lock_exists() {
        let temp_dir = create_temp_dir("sync-locked");
        fs::write(temp_dir.join("uv.lock"), "").expect("lock file should be created");

        assert_eq!(build_uv_sync_args(&temp_dir), vec!["sync", "--locked"]);
        remove_temp_dir(&temp_dir);
    }

    #[test]
    fn build_uv_sync_args_uses_sync_without_lock() {
        let temp_dir = create_temp_dir("sync");
        assert_eq!(build_uv_sync_args(&temp_dir), vec!["sync"]);
        remove_temp_dir(&temp_dir);
    }
}
