use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;

use super::filesystem::FileEntry;

const DEFAULT_EXAMPLE_FILES: &[(&str, &str)] = &[
    (
        "hello-world/index.html",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/hello-world/index.html"
        )),
    ),
    (
        "hello-world/main.js",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/hello-world/main.js"
        )),
    ),
    (
        "hello-world/style.css",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/hello-world/style.css"
        )),
    ),
    (
        "js-advanced/index.html",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/js-advanced/index.html"
        )),
    ),
    (
        "js-advanced/main.js",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/js-advanced/main.js"
        )),
    ),
    (
        "js-advanced/style.css",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/js-advanced/style.css"
        )),
    ),
    (
        "python-hello-world/main.py",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-hello-world/main.py"
        )),
    ),
    (
        "python-viz/main.py",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-viz/main.py"
        )),
    ),
    (
        "python-dash/README.md",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-dash/README.md"
        )),
    ),
    (
        "python-dash/app.py",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-dash/app.py"
        )),
    ),
    (
        "python-dash/pyproject.toml",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-dash/pyproject.toml"
        )),
    ),
    (
        "python-dash/uv.lock",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-dash/uv.lock"
        )),
    ),
    (
        "python-fastapi/README.md",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-fastapi/README.md"
        )),
    ),
    (
        "python-fastapi/main.py",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-fastapi/main.py"
        )),
    ),
    (
        "python-fastapi/pyproject.toml",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-fastapi/pyproject.toml"
        )),
    ),
    (
        "python-fastapi/uv.lock",
        include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../workspace/python-fastapi/uv.lock"
        )),
    ),
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub name: String,
    pub path: String,
    pub modified_at: u64,
}

#[tauri::command]
pub fn list_projects(workspace_path: String) -> Result<Vec<ProjectInfo>, String> {
    let workspace = Path::new(&workspace_path);

    if !workspace.exists() {
        println!(
            "Workspace '{}' not found. Seeding bundled examples.",
            workspace.display()
        );
        fs::create_dir_all(workspace)
            .map_err(|e| format!("Failed to create workspace directory: {}", e))?;
        seed_default_examples(workspace)?;
        println!(
            "Seeded {} example files into '{}'.",
            DEFAULT_EXAMPLE_FILES.len(),
            workspace.display()
        );
    }

    let entries = fs::read_dir(workspace)
        .map_err(|e| format!("Failed to read workspace '{}': {}", workspace_path, e))?;

    let mut projects: Vec<ProjectInfo> = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry
            .metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;

        if !metadata.is_dir() {
            continue;
        }

        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden directories
        if name.starts_with('.') {
            continue;
        }

        let modified_at = metadata
            .modified()
            .map_err(|e| format!("Failed to read modified time: {}", e))?
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("Failed to compute timestamp: {}", e))?
            .as_secs();

        projects.push(ProjectInfo {
            name,
            path: entry.path().to_string_lossy().to_string(),
            modified_at,
        });
    }

    // Sort by most recently modified first
    projects.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(projects)
}

fn seed_default_examples(workspace_root: &Path) -> Result<(), String> {
    for (relative_path, contents) in DEFAULT_EXAMPLE_FILES {
        let destination = workspace_root.join(relative_path);
        let parent = destination.parent().ok_or_else(|| {
            format!(
                "Failed to derive parent directory for seeded file '{}'",
                destination.display()
            )
        })?;

        fs::create_dir_all(parent).map_err(|e| {
            format!(
                "Failed to create directory '{}' while seeding examples: {}",
                parent.display(),
                e
            )
        })?;

        fs::write(&destination, contents).map_err(|e| {
            format!(
                "Failed to write seeded file '{}': {}",
                destination.display(),
                e
            )
        })?;
    }

    Ok(())
}

#[tauri::command]
pub fn create_project(
    workspace_path: String,
    name: String,
    template: String,
) -> Result<String, String> {
    let project_path = Path::new(&workspace_path).join(&name);

    if project_path.exists() {
        return Err(format!("Project '{}' already exists", name));
    }

    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    match template.as_str() {
        "blank" => {
            // Empty project, nothing to create
        }
        "html" => create_html_template(&project_path)?,
        "python" => create_python_template(&project_path)?,
        "markdown" => create_markdown_template(&project_path)?,
        _ => return Err(format!("Unknown template: '{}'", template)),
    }

    Ok(project_path.to_string_lossy().to_string())
}

fn create_html_template(project_path: &Path) -> Result<(), String> {
    let index_html = r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Edit this file to get started.</p>
    <script src="main.js"></script>
</body>
</html>"#;

    let style_css = r#"* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f5f5f5;
    color: #333;
}

h1 {
    margin-bottom: 0.5rem;
}
"#;

    let main_js = r#"document.addEventListener('DOMContentLoaded', () => {
    console.log('Project loaded successfully!');
});
"#;

    fs::write(project_path.join("index.html"), index_html)
        .map_err(|e| format!("Failed to write index.html: {}", e))?;
    fs::write(project_path.join("style.css"), style_css)
        .map_err(|e| format!("Failed to write style.css: {}", e))?;
    fs::write(project_path.join("main.js"), main_js)
        .map_err(|e| format!("Failed to write main.js: {}", e))?;

    Ok(())
}

fn create_python_template(project_path: &Path) -> Result<(), String> {
    let main_py = r#"def main():
    print("Hello, World!")


if __name__ == "__main__":
    main()
"#;

    fs::write(project_path.join("main.py"), main_py)
        .map_err(|e| format!("Failed to write main.py: {}", e))?;

    Ok(())
}

fn create_markdown_template(project_path: &Path) -> Result<(), String> {
    let readme = r#"# My Project

## Overview

This is a new project. Edit this file to add your content.

## Getting Started

Start writing your documentation here.

## Notes

- Item one
- Item two
- Item three
"#;

    fs::write(project_path.join("README.md"), readme)
        .map_err(|e| format!("Failed to write README.md: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn get_project_tree(project_path: String) -> Result<Vec<FileEntry>, String> {
    let root = Path::new(&project_path);

    if !root.exists() {
        return Err(format!("Project path '{}' does not exist", project_path));
    }

    build_tree(root)
}

fn build_tree(dir: &Path) -> Result<Vec<FileEntry>, String> {
    let mut entries: Vec<FileEntry> = Vec::new();

    let dir_entries = fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory '{}': {}", dir.display(), e))?;

    for entry in dir_entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry
            .metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;

        let name = entry.file_name().to_string_lossy().to_string();
        let entry_path = entry.path();

        // Skip hidden files/dirs and common noise directories
        if name.starts_with('.')
            || name == "node_modules"
            || name == "__pycache__"
            || name == ".venv"
            || name == "target"
        {
            continue;
        }

        let is_dir = metadata.is_dir();
        let extension = if is_dir {
            None
        } else {
            entry_path
                .extension()
                .map(|ext| ext.to_string_lossy().to_string())
        };

        let children = if is_dir {
            Some(build_tree(&entry_path)?)
        } else {
            None
        };

        entries.push(FileEntry {
            name,
            path: entry_path.to_string_lossy().to_string(),
            is_dir,
            extension,
            children,
        });
    }

    // Sort: directories first, then alphabetically
    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_path(label: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock before UNIX_EPOCH")
            .as_nanos();
        std::env::temp_dir().join(format!("interactive-studio-{label}-{nonce}"))
    }

    fn cleanup_path(path: &Path) {
        if path.is_dir() {
            let _ = fs::remove_dir_all(path);
        } else {
            let _ = fs::remove_file(path);
        }
    }

    #[test]
    fn list_projects_seeds_examples_for_missing_workspace() {
        let workspace = unique_temp_path("seed-missing-workspace");

        let projects = list_projects(workspace.to_string_lossy().to_string())
            .expect("list_projects should seed examples when workspace is missing");

        let project_names: HashSet<String> =
            projects.into_iter().map(|project| project.name).collect();

        for expected in [
            "hello-world",
            "js-advanced",
            "python-hello-world",
            "python-viz",
            "python-dash",
            "python-fastapi",
        ] {
            assert!(
                project_names.contains(expected),
                "missing seeded project: {expected}"
            );
        }

        assert!(workspace.join("hello-world/index.html").exists());
        assert!(workspace.join("python-fastapi/main.py").exists());
        cleanup_path(&workspace);
    }

    #[test]
    fn list_projects_does_not_seed_when_workspace_already_exists() {
        let workspace = unique_temp_path("existing-workspace");
        fs::create_dir_all(workspace.join("my-custom"))
            .expect("should create custom project directory for test");
        fs::write(
            workspace.join("my-custom/notes.txt"),
            "hello from custom project",
        )
        .expect("should write custom project file");

        let projects = list_projects(workspace.to_string_lossy().to_string())
            .expect("list_projects should read existing workspace");
        let project_names: HashSet<String> =
            projects.into_iter().map(|project| project.name).collect();

        assert_eq!(project_names.len(), 1, "workspace should remain unchanged");
        assert!(project_names.contains("my-custom"));
        assert!(!workspace.join("hello-world").exists());
        cleanup_path(&workspace);
    }

    #[test]
    fn seed_default_examples_writes_expected_content() {
        let workspace = unique_temp_path("seed-content-check");
        fs::create_dir_all(&workspace).expect("should create temp workspace");

        seed_default_examples(&workspace).expect("should seed bundled examples");

        let dash_app = fs::read_to_string(workspace.join("python-dash/app.py"))
            .expect("should read seeded Dash app");
        let fastapi_main = fs::read_to_string(workspace.join("python-fastapi/main.py"))
            .expect("should read seeded FastAPI app");

        assert!(dash_app.contains("app = Dash(__name__)"));
        assert!(fastapi_main.contains("app = FastAPI"));
        cleanup_path(&workspace);
    }

    #[test]
    fn seed_default_examples_returns_error_for_invalid_workspace_root() {
        let workspace_file = unique_temp_path("seed-invalid-root");
        if let Some(parent) = workspace_file.parent() {
            fs::create_dir_all(parent).expect("should create parent temp directory");
        }
        fs::write(&workspace_file, "this is a file, not a directory")
            .expect("should create invalid workspace file");

        let error = seed_default_examples(&workspace_file)
            .expect_err("seeding should fail when workspace root is not a directory");

        assert!(
            error.contains("Failed to create directory"),
            "unexpected error message: {error}"
        );
        cleanup_path(&workspace_file);
    }
}
