mod commands;
mod watchers;

use tauri::{AppHandle, State};
use watchers::fs_watcher::FileWatcher;

#[tauri::command]
fn start_watching(app: AppHandle, watcher: State<'_, FileWatcher>, path: String) -> Result<(), String> {
    watcher.watch(app, &path)
}

#[tauri::command]
fn stop_watching(watcher: State<'_, FileWatcher>) -> Result<(), String> {
    watcher.unwatch()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .manage(FileWatcher::new())
        .invoke_handler(tauri::generate_handler![
            // Filesystem commands
            commands::filesystem::read_file,
            commands::filesystem::write_file,
            commands::filesystem::create_file,
            commands::filesystem::create_dir,
            commands::filesystem::delete_path,
            commands::filesystem::rename_path,
            commands::filesystem::list_dir,
            // Workspace commands
            commands::workspace::list_projects,
            commands::workspace::create_project,
            commands::workspace::get_project_tree,
            // Python commands
            commands::python::run_python,
            commands::python::check_python_env,
            // Shell commands
            commands::shell::execute_command,
            // Watcher commands
            start_watching,
            stop_watching,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
