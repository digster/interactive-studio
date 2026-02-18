use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter};

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
                    let stderr_version =
                        String::from_utf8_lossy(&output.stderr).trim().to_string();
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

fn run_with_uv(app: &AppHandle, project_path: &str, script_name: &str) -> Result<(), String> {
    let venv_path = Path::new(project_path).join(".venv");

    // Create venv if it doesn't exist
    if !venv_path.exists() {
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
    }

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
