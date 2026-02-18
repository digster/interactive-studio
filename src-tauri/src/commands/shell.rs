use std::process::Command;
use tauri::AppHandle;

#[tauri::command]
pub fn execute_command(
    _app: AppHandle,
    command: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<String, String> {
    let mut cmd = Command::new(&command);
    cmd.args(&args);

    if let Some(ref working_dir) = cwd {
        cmd.current_dir(working_dir);
    }

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute command '{}': {}", command, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!(
            "Command '{}' failed with exit code {:?}\nstdout: {}\nstderr: {}",
            command,
            output.status.code(),
            stdout,
            stderr
        ))
    }
}
