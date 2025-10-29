use std::path::PathBuf;
use tokio::fs;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// Write concat list file for FFmpeg
#[tauri::command]
pub async fn write_concat_list(lines: Vec<String>, list_path: String) -> Result<(), String> {
    let content = lines.join("\n");
    let path = PathBuf::from(&list_path);
    fs::write(&path, content).await
        .map_err(|e| format!("Failed to write concat list: {}", e))?;
    Ok(())
}

/// Save blob data to file
#[tauri::command]
pub async fn save_blob(
    app: tauri::AppHandle,
    filename: String,
    data: Vec<u8>,
) -> Result<String, String> {
    let app_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let media_dir = app_dir.join("media");
    tokio::fs::create_dir_all(&media_dir).await
        .map_err(|e| format!("Failed to create media directory: {}", e))?;
    
    let file_path = media_dir.join(&filename);
    tokio::fs::write(&file_path, data).await
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    // Use display() for consistent cross-platform path representation
    Ok(file_path.display().to_string())
}

/// Open file dialog for multiple file selection
#[tauri::command]
pub async fn open_file_dialog_multi(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let file_paths = app.dialog()
        .file()
        .add_filter("Video Files", &["mp4", "mov", "webm", "avi", "mkv"])
        .set_title("Select Video Files")
        .blocking_pick_files();
    
    match file_paths {
        Some(paths) => Ok(paths.iter().map(|p| p.to_string()).collect()),
        None => Ok(vec![]), // User cancelled
    }
}

/// Open directory dialog
#[tauri::command]
pub async fn open_dir_dialog(app: tauri::AppHandle) -> Result<String, String> {
    let dir_path = app.dialog()
        .file()
        .set_title("Select Project Directory")
        .blocking_pick_folder();
    
    match dir_path {
        Some(path) => Ok(path.to_string()),
        None => Err("No directory selected".to_string()),
    }
}

/// Create project directory structure
#[tauri::command]
pub async fn create_project_dirs(project_dir: String) -> Result<(), String> {
    let project_path = PathBuf::from(&project_dir);
    
    // Create main directories
    let dirs = ["media", "exports", ".temp"];
    for dir in &dirs {
        let dir_path = project_path.join(dir);
        fs::create_dir_all(&dir_path).await
            .map_err(|e| format!("Failed to create directory {}: {}", dir, e))?;
    }
    
    Ok(())
}

/// Ensure a directory exists, creating it if necessary
#[tauri::command]
pub async fn ensure_dir(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    fs::create_dir_all(&path_buf).await
        .map_err(|e| format!("Failed to create directory {}: {}", path, e))?;
    Ok(())
}

/// Copy file to project media directory
#[tauri::command]
pub async fn copy_file_to_media(
    source_path: String,
    project_dir: String,
    filename: String,
) -> Result<String, String> {
    let source = PathBuf::from(&source_path);
    let project_path = PathBuf::from(&project_dir);
    let media_dir = project_path.join("media");
    let destination = media_dir.join(&filename);
    
    // Ensure media directory exists
    fs::create_dir_all(&media_dir).await
        .map_err(|e| format!("Failed to create media directory: {}", e))?;
    
    // Copy the file
    fs::copy(&source, &destination).await
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    
    // Use display() for consistent cross-platform path representation
    Ok(destination.display().to_string())
}

/// Get app directories info
#[tauri::command]
pub fn resolve_app_dirs(app_handle: tauri::AppHandle) -> Result<AppDirs, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    
    Ok(AppDirs {
        app_data: app_dir.display().to_string(),
    })
}

#[derive(serde::Serialize)]
pub struct AppDirs {
    pub app_data: String,
}