use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FsChangeEvent {
    pub kind: String,
    pub path: String,
}

pub struct FileWatcher {
    watcher: Mutex<Option<RecommendedWatcher>>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self {
            watcher: Mutex::new(None),
        }
    }

    /// Start watching the given directory path recursively.
    /// Emits "fs-change" events to the Tauri frontend on file system changes.
    pub fn watch(&self, app: AppHandle, path: &str) -> Result<(), String> {
        let watch_path = path.to_string();
        let app_handle = app.clone();

        let watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            match res {
                Ok(event) => {
                    let kind = match event.kind {
                        EventKind::Create(_) => "create",
                        EventKind::Modify(_) => "modify",
                        EventKind::Remove(_) => "delete",
                        _ => return, // Ignore Access and Other events
                    };

                    for path in &event.paths {
                        let path_str = path.to_string_lossy().to_string();

                        // Skip hidden files and common noise
                        if let Some(file_name) = path.file_name() {
                            let name = file_name.to_string_lossy();
                            if name.starts_with('.')
                                || name.ends_with('~')
                                || name.ends_with(".swp")
                            {
                                continue;
                            }
                        }

                        let _ = app_handle.emit(
                            "fs-change",
                            FsChangeEvent {
                                kind: kind.to_string(),
                                path: path_str,
                            },
                        );
                    }
                }
                Err(e) => {
                    eprintln!("File watcher error: {:?}", e);
                }
            }
        })
        .map_err(|e| format!("Failed to create file watcher: {}", e))?;

        let mut guard = self
            .watcher
            .lock()
            .map_err(|e| format!("Failed to acquire watcher lock: {}", e))?;

        // Replace any existing watcher
        *guard = Some(watcher);

        if let Some(ref mut w) = *guard {
            w.watch(Path::new(&watch_path), RecursiveMode::Recursive)
                .map_err(|e| format!("Failed to watch path '{}': {}", watch_path, e))?;
        }

        Ok(())
    }

    /// Stop watching (drops the current watcher).
    pub fn unwatch(&self) -> Result<(), String> {
        let mut guard = self
            .watcher
            .lock()
            .map_err(|e| format!("Failed to acquire watcher lock: {}", e))?;
        *guard = None;
        Ok(())
    }
}

// Safety: FileWatcher uses Mutex internally, making it safe for concurrent access.
unsafe impl Send for FileWatcher {}
unsafe impl Sync for FileWatcher {}
