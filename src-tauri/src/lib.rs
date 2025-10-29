mod ffmpeg;
mod fs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Initialize FFmpeg path on startup
            if let Err(e) = ffmpeg::init_ffmpeg_path(app.handle()) {
                eprintln!("Warning: Failed to initialize FFmpeg path: {}", e);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // FFmpeg commands
            ffmpeg::run_ffmpeg,
            ffmpeg::ffprobe_json,
            ffmpeg::trim_clip,
            ffmpeg::split_clip,
            ffmpeg::transcode_to_mp4,
            ffmpeg::export_concat,
            ffmpeg::export_concat_filter,
            ffmpeg::export_with_crossfades,
            ffmpeg::apply_fade_effects,
            ffmpeg::export_concat_with_fades,
            // File system commands
            fs::write_concat_list,
            fs::save_blob,
            fs::open_file_dialog_multi,
            fs::open_dir_dialog,
            fs::create_project_dirs,
            fs::ensure_dir,
            fs::copy_file_to_media,
            fs::resolve_app_dirs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
