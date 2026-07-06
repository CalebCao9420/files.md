use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::UNIX_EPOCH;

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde::Serialize;
use tauri::State;

mod tray;
mod updater;

struct AppState {
    workspace_path: Mutex<Option<PathBuf>>,
}

#[derive(Serialize)]
struct ListedFile {
    relative_path: String,
    last_modified_ms: u64,
}

fn normalize_relative(relative_path: &str) -> PathBuf {
    PathBuf::from(
        relative_path
            .trim()
            .trim_start_matches('/')
            .replace('/', std::path::MAIN_SEPARATOR_STR),
    )
}

fn resolve_in_workspace(root: &Path, relative_path: &str) -> Result<PathBuf, String> {
    let rel = normalize_relative(relative_path);
    let joined = root.join(&rel);
    let canonical_root = root
        .canonicalize()
        .map_err(|e| format!("workspace root invalid: {e}"))?;
    let canonical_joined = joined
        .canonicalize()
        .or_else(|_| {
            if let Some(parent) = joined.parent() {
                parent.canonicalize().map(|p| {
                    p.join(
                        joined
                            .file_name()
                            .unwrap_or_else(|| std::ffi::OsStr::new("")),
                    )
                })
            } else {
                Err(std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "missing parent",
                ))
            }
        })
        .map_err(|e| e.to_string())?;

    if !canonical_joined.starts_with(&canonical_root) {
        return Err("path escapes workspace".into());
    }
    Ok(canonical_joined)
}

fn workspace_root(state: &State<AppState>) -> Result<PathBuf, String> {
    state
        .workspace_path
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "No workspace bound (set MDTK_WORKSPACE or -Folder)".to_string())
}

fn resolve_write_path(root: &Path, relative_path: &str) -> Result<PathBuf, String> {
    let rel = normalize_relative(relative_path);
    for component in rel.components() {
        if matches!(
            component,
            std::path::Component::ParentDir | std::path::Component::RootDir
        ) {
            return Err("path escapes workspace".into());
        }
    }
    Ok(root.join(&rel))
}

fn file_modified_ms(path: &Path) -> u64 {
    path.metadata()
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn is_supported_file(name: &str) -> bool {
    if name == "config.json" {
        return true;
    }
    let ext = name.rsplit('.').next().unwrap_or("").to_lowercase();
    matches!(
        ext.as_str(),
        "md" | "png"
            | "jpg"
            | "jpeg"
            | "webp"
            | "gif"
            | "mp4"
            | "webm"
            | "mov"
            | "mp3"
            | "ogg"
            | "oga"
            | "wav"
    )
}

fn walk_workspace_files(
    dir: &Path,
    rel_prefix: &Path,
    depth: usize,
    out: &mut Vec<ListedFile>,
) -> Result<(), String> {
    if depth > 10 {
        return Ok(());
    }

    let read_dir = match std::fs::read_dir(dir) {
        Ok(rd) => rd,
        Err(e) => return Err(e.to_string()),
    };

    for entry in read_dir {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().into_owned();
        let path = entry.path();

        if path.is_dir() {
            if name.starts_with('.') {
                continue;
            }
            let mut next_prefix = rel_prefix.to_path_buf();
            next_prefix.push(&name);
            walk_workspace_files(&path, &next_prefix, depth + 1, out)?;
        } else if path.is_file() && is_supported_file(&name) {
            let mut rel = rel_prefix.to_path_buf();
            rel.push(&name);
            out.push(ListedFile {
                relative_path: rel.to_string_lossy().replace('\\', "/"),
                last_modified_ms: file_modified_ms(&path),
            });
        }
    }

    Ok(())
}

#[tauri::command]
fn mdtk_get_workspace_path(state: State<AppState>) -> Option<String> {
    state
        .workspace_path
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().map(|p| p.to_string_lossy().into_owned()))
}

#[tauri::command]
fn mdtk_list_files(state: State<AppState>) -> Result<Vec<ListedFile>, String> {
    let root = workspace_root(&state)?;
    let mut files = Vec::new();
    walk_workspace_files(&root, Path::new(""), 0, &mut files)?;
    files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    Ok(files)
}

#[tauri::command]
fn mdtk_exists(state: State<AppState>, relative_path: String) -> Result<bool, String> {
    let root = workspace_root(&state)?;
    let path = root.join(normalize_relative(&relative_path));
    Ok(path.exists())
}

#[tauri::command]
fn mdtk_is_dir(state: State<AppState>, relative_path: String) -> Result<bool, String> {
    let root = workspace_root(&state)?;
    let path = root.join(normalize_relative(&relative_path));
    Ok(path.is_dir())
}

#[tauri::command]
fn mdtk_read_file(state: State<AppState>, relative_path: String) -> Result<String, String> {
    let root = workspace_root(&state)?;
    let path = resolve_in_workspace(&root, &relative_path)?;
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn mdtk_read_file_base64(state: State<AppState>, relative_path: String) -> Result<String, String> {
    let root = workspace_root(&state)?;
    let path = resolve_in_workspace(&root, &relative_path)?;
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(BASE64.encode(bytes))
}

#[tauri::command]
fn mdtk_write_file(
    state: State<AppState>,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    let root = workspace_root(&state)?;
    let path = resolve_write_path(&root, &relative_path)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn mdtk_write_file_base64(
    state: State<AppState>,
    relative_path: String,
    content_base64: String,
) -> Result<(), String> {
    let root = workspace_root(&state)?;
    let path = resolve_write_path(&root, &relative_path)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let bytes = BASE64
        .decode(content_base64.trim())
        .map_err(|e| format!("invalid base64: {e}"))?;
    std::fs::write(&path, bytes).map_err(|e| e.to_string())
}

#[tauri::command]
fn mdtk_file_mtime(state: State<AppState>, relative_path: String) -> Result<u64, String> {
    let root = workspace_root(&state)?;
    let path = resolve_in_workspace(&root, &relative_path)?;
    Ok(file_modified_ms(&path))
}

#[tauri::command]
fn mdtk_ensure_parent_dirs(state: State<AppState>, relative_path: String) -> Result<(), String> {
    let root = workspace_root(&state)?;
    let path = resolve_write_path(&root, &relative_path)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn mdtk_create_dir(state: State<AppState>, relative_path: String) -> Result<(), String> {
    let root = workspace_root(&state)?;
    let rel = normalize_relative(&relative_path);
    let path = root.join(&rel);
    let canonical_root = root
        .canonicalize()
        .map_err(|e| format!("workspace root invalid: {e}"))?;
    if let Ok(canonical) = path.canonicalize() {
        if !canonical.starts_with(&canonical_root) {
            return Err("path escapes workspace".into());
        }
    } else if let Some(parent) = path.parent() {
        let parent_canonical = parent.canonicalize().map_err(|e| e.to_string())?;
        if !parent_canonical.starts_with(&canonical_root) {
            return Err("path escapes workspace".into());
        }
    }
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn mdtk_delete_file(state: State<AppState>, relative_path: String) -> Result<(), String> {
    let root = workspace_root(&state)?;
    let path = resolve_in_workspace(&root, &relative_path)?;
    if path.is_dir() {
        return Err("not a file".into());
    }
    std::fs::remove_file(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn mdtk_remove_dir(state: State<AppState>, relative_path: String) -> Result<(), String> {
    let root = workspace_root(&state)?;
    let rel = normalize_relative(&relative_path);
    let path = root.join(&rel);
    let canonical_root = root
        .canonicalize()
        .map_err(|e| format!("workspace root invalid: {e}"))?;
    let canonical = path.canonicalize().map_err(|e| e.to_string())?;
    if !canonical.starts_with(&canonical_root) {
        return Err("path escapes workspace".into());
    }
    std::fs::remove_dir_all(&canonical).map_err(|e| e.to_string())
}

/// `--folder "D:\notes"` or `-Folder "D:\notes"` (matches launch.ps1 / start-tauri.bat).
fn workspace_from_cli() -> Option<PathBuf> {
    let args: Vec<String> = std::env::args().collect();
    let mut i = 0;
    while i < args.len() {
        let arg = args[i].as_str();
        if arg == "--folder" || arg == "-Folder" || arg == "--Folder" {
            if let Some(path_str) = args.get(i + 1) {
                let path = PathBuf::from(path_str);
                if path.is_dir() {
                    return Some(path);
                }
            }
            return None;
        }
        i += 1;
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let workspace_path = workspace_from_cli()
        .or_else(|| std::env::var("MDTK_WORKSPACE").ok().map(PathBuf::from))
        .filter(|p| p.is_dir());

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            workspace_path: Mutex::new(workspace_path),
        })
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle().plugin(tauri_plugin_dialog::init())?;
                app.handle().plugin(tauri_plugin_process::init())?;
                updater::schedule_startup_check(app.handle());
            }
            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| tray::on_window_event(window, event))
        .invoke_handler(tauri::generate_handler![
            mdtk_get_workspace_path,
            mdtk_list_files,
            mdtk_exists,
            mdtk_is_dir,
            mdtk_read_file,
            mdtk_read_file_base64,
            mdtk_write_file,
            mdtk_write_file_base64,
            mdtk_file_mtime,
            mdtk_ensure_parent_dirs,
            mdtk_create_dir,
            mdtk_delete_file,
            mdtk_remove_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
