use serde::{Deserialize, Serialize};
use std::path::Path;
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

/// Check if a command is available on the system PATH.
fn command_exists(cmd: &str) -> bool {
    Command::new("which")
        .arg(cmd)
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
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

fn ensure_uv_venv(app: &AppHandle, project_path: &str) -> Result<(), String> {
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

    let venv_output = Command::new("uv")
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
) -> Result<(TokioCommand, String), String> {
    let mut command = if command_exists("uv") {
        let mut cmd = TokioCommand::new("uv");
        cmd.args(["run", "python", script_name]);
        (cmd, "uv".to_string())
    } else if command_exists("python3") {
        let mut cmd = TokioCommand::new("python3");
        cmd.arg(script_name);
        (cmd, "python3".to_string())
    } else if command_exists("python") {
        let mut cmd = TokioCommand::new("python");
        cmd.arg(script_name);
        (cmd, "python".to_string())
    } else {
        return Err("No Python interpreter found. Install uv, python3, or python.".to_string());
    };

    command
        .0
        .current_dir(project_path)
        .env("PYTHONUNBUFFERED", "1")
        .env("DASH_HOST", host)
        .env("DASH_PORT", format!("{}", port))
        .env("HOST", host)
        .env("PORT", format!("{}", port))
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    Ok(command)
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
    let has_uv = command_exists("uv");

    let has_python = command_exists("python3") || command_exists("python");

    let python_version = if has_uv {
        // Try getting version through uv
        Command::new("uv")
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
            .or_else(|| get_python_version("python3"))
            .or_else(|| get_python_version("python"))
    } else {
        get_python_version("python3").or_else(|| get_python_version("python"))
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
    let has_uv = command_exists("uv");
    let project = project_path.clone();
    let script = script_name.clone();

    tokio::spawn(async move {
        let result = if has_uv {
            match run_with_uv(&app, &project, &script) {
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

                    if command_exists("python3") {
                        run_with_python(&app, &project, &script, "python3")
                    } else if command_exists("python") {
                        run_with_python(&app, &project, &script, "python")
                    } else {
                        Err(format!(
                            "uv failed and no system Python was found. Original error: {}",
                            uv_err
                        ))
                    }
                }
            }
        } else if command_exists("python3") {
            run_with_python(&app, &project, &script, "python3")
        } else if command_exists("python") {
            run_with_python(&app, &project, &script, "python")
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

    if command_exists("uv") {
        ensure_uv_venv(&app, &project_path)?;
    }

    let (mut command, runtime_name) =
        build_python_app_command(&project_path, &script_name, &host, selected_port)?;

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

fn run_with_uv(app: &AppHandle, project_path: &str, script_name: &str) -> Result<(), String> {
    ensure_uv_venv(app, project_path)?;

    // Run the script with uv run
    let output = Command::new("uv")
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
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !stdout.is_empty() {
        let _ = app.emit(
            "python-output",
            PythonOutput {
                stream: "stdout".to_string(),
                data: stdout,
            },
        );
    }

    if !stderr.is_empty() {
        let _ = app.emit(
            "python-output",
            PythonOutput {
                stream: "stderr".to_string(),
                data: stderr,
            },
        );
    }

    let code = output.status.code();
    let _ = app.emit(
        "python-exit",
        PythonExit {
            code,
            success: output.status.success(),
        },
    );
}
