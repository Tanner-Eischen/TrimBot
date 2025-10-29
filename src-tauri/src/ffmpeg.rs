use std::path::PathBuf;
use std::process::Command;
use std::sync::OnceLock;
use std::time::Duration;
use tauri::AppHandle;
use tauri::Manager;
use serde_json::Value;

// Global FFmpeg path storage
static FFMPEG_PATH: OnceLock<PathBuf> = OnceLock::new();

// FFmpeg timeout constants
pub const FFMPEG_TIMEOUT_SECS: u64 = 5 * 60; // 5 minutes default timeout
pub const FFMPEG_TIMEOUT_SHORT: u64 = 30; // 30 seconds for quick operations
pub const FFMPEG_TIMEOUT_LONG: u64 = 30 * 60; // 30 minutes for large files

/// Initialize FFmpeg path based on platform and bundled resources
pub fn init_ffmpeg_path(app_handle: &AppHandle) -> Result<(), String> {
    // In development mode, we need to look in the actual resources folder
    // In production, Tauri will bundle the resources properly
    let _app_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config directory: {}", e))?;
    
    // Get the project root by going up from the app config directory
    let project_root = if cfg!(debug_assertions) {
        // In development, find the project root
        let mut current = std::env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?;
        
        // Look for src-tauri directory to confirm we're in the right place
        while !current.join("src-tauri").exists() && current.parent().is_some() {
            current = current.parent().unwrap().to_path_buf();
        }
        
        if !current.join("src-tauri").exists() {
            return Err("Could not find project root with src-tauri directory".to_string());
        }
        
        current
    } else {
        // In production, use the resource directory
        app_handle
            .path()
            .resource_dir()
            .map_err(|e| format!("Failed to get resource directory: {}", e))?
    };
    
    println!("Project root: {:?}", project_root);
    
    // Platform-specific FFmpeg binary path - use consistent path separators
    let ffmpeg_binary = if cfg!(target_os = "windows") {
        PathBuf::from("ffmpeg").join("ffmpeg.exe")
    } else if cfg!(target_os = "macos") {
        PathBuf::from("ffmpeg").join("mac").join("ffmpeg")
    } else {
        PathBuf::from("ffmpeg").join("linux").join("ffmpeg")
    };
    
    let ffmpeg_path = if cfg!(debug_assertions) {
        // In development, look in src-tauri/resources
        project_root.join("src-tauri").join("resources").join(&ffmpeg_binary)
    } else {
        // In production, look in the resource directory
        project_root.join(&ffmpeg_binary)
    };
    
    println!("Looking for FFmpeg at: {:?}", ffmpeg_path);
    println!("FFmpeg exists: {}", ffmpeg_path.exists());
    
    // For now, we'll use system FFmpeg if bundled doesn't exist
    let final_path = if ffmpeg_path.exists() {
        println!("Using bundled FFmpeg: {:?}", ffmpeg_path);
        ffmpeg_path
    } else {
        println!("Bundled FFmpeg not found, falling back to system FFmpeg");
        // Fallback to system FFmpeg
        if cfg!(target_os = "windows") {
            PathBuf::from("ffmpeg.exe")
        } else {
            PathBuf::from("ffmpeg")
        }
    };
    
    println!("Final FFmpeg path: {:?}", final_path);
    FFMPEG_PATH.set(final_path).map_err(|_| "Failed to set FFmpeg path".to_string())?;
    Ok(())
}

/// Get the FFmpeg executable path
pub fn get_ffmpeg_path() -> Result<&'static PathBuf, String> {
    FFMPEG_PATH.get().ok_or_else(|| "FFmpeg path not initialized".to_string())
}

/// Run FFmpeg with given arguments
#[tauri::command]
pub async fn run_ffmpeg(args: Vec<String>) -> Result<i32, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    
    let output = Command::new(ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute FFmpeg: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg failed: {}", stderr));
    }
    
    Ok(output.status.code().unwrap_or(0))
}

/// Run FFmpeg with given arguments and timeout
#[tauri::command]
pub async fn run_ffmpeg_with_timeout(
    args: Vec<String>,
    timeout_secs: Option<u64>,
) -> Result<i32, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    let timeout_duration = timeout_secs.unwrap_or(FFMPEG_TIMEOUT_SECS);
    
    let mut child = Command::new(ffmpeg_path)
        .args(&args)
        .spawn()
        .map_err(|e| format!("Failed to spawn FFmpeg: {}", e))?;
    
    // Simple timeout handling - wait for child process with timeout
    let timeout = Duration::from_secs(timeout_duration);
    let start = std::time::Instant::now();
    
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                return if status.success() {
                    Ok(status.code().unwrap_or(0))
                } else {
                    Err(format!("FFmpeg failed with code: {:?}", status.code()))
                };
            }
            Ok(None) => {
                if start.elapsed() > timeout {
                    // Kill the process on timeout
                    let _ = child.kill();
                    return Err(format!(
                        "FFmpeg operation timed out after {} seconds",
                        timeout_duration
                    ));
                }
                // Sleep briefly before checking again
                std::thread::sleep(Duration::from_millis(100));
            }
            Err(e) => return Err(format!("Failed to wait for FFmpeg: {}", e)),
        }
    }
}

/// Helper: probe media duration (in seconds) using FFprobe
fn probe_duration_seconds(path: &str) -> Result<f64, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    let ffprobe_path = ffmpeg_path.with_file_name(
        if cfg!(target_os = "windows") { "ffprobe.exe" } else { "ffprobe" }
    );

    let output = Command::new(&ffprobe_path)
        .args(&[
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            path,
        ])
        .output()
        .map_err(|e| format!("Failed to execute FFprobe: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFprobe failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let v: Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Failed to parse FFprobe JSON: {}", e))?;

    // Try format.duration first
    if let Some(dur_str) = v.get("format").and_then(|f| f.get("duration")).and_then(|d| d.as_str()) {
        if let Ok(d) = dur_str.parse::<f64>() {
            return Ok(d);
        }
    }
    // Try numeric
    if let Some(d) = v.get("format").and_then(|f| f.get("duration")).and_then(|d| d.as_f64()) {
        return Ok(d);
    }

    Err("Could not determine media duration".to_string())
}

/// Probe video file for metadata using FFprobe
#[tauri::command]
pub async fn ffprobe_json(path: String) -> Result<String, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    let ffprobe_path = ffmpeg_path.with_file_name(
        if cfg!(target_os = "windows") { "ffprobe.exe" } else { "ffprobe" }
    );
    
    let output = Command::new(&ffprobe_path)
        .args(&[
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            &path
        ])
        .output()
        .map_err(|e| format!("Failed to execute FFprobe: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFprobe failed: {}", stderr));
    }
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.to_string())
}

/// Apply fade effects to a video clip
#[tauri::command]
pub async fn apply_fade_effects(
    input: String,
    output: String,
    fade_in_duration: Option<f64>,
    fade_out_duration: Option<f64>,
    total_duration: f64,
) -> Result<i32, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    
    let mut video_filters = Vec::new();
    let mut audio_filters = Vec::new();
    
    // Add fade-in effects
    if let Some(fade_in) = fade_in_duration {
        if fade_in > 0.0 {
            video_filters.push(format!("fade=t=in:st=0:d={}", fade_in));
            audio_filters.push(format!("afade=t=in:st=0:d={}", fade_in));
        }
    }
    
    // Add fade-out effects
    if let Some(fade_out) = fade_out_duration {
        if fade_out > 0.0 {
            let fade_start = total_duration - fade_out;
            video_filters.push(format!("fade=t=out:st={}:d={}", fade_start, fade_out));
            audio_filters.push(format!("afade=t=out:st={}:d={}", fade_start, fade_out));
        }
    }
    
    let mut args = vec![
        "-i".to_string(),
        input,
    ];
    
    // Apply video filters if any
    if !video_filters.is_empty() {
        args.push("-vf".to_string());
        args.push(video_filters.join(","));
    }
    
    // Apply audio filters if any
    if !audio_filters.is_empty() {
        args.push("-af".to_string());
        args.push(audio_filters.join(","));
    }
    
    args.extend(vec![
        "-c:v".to_string(),
        "libx264".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-movflags".to_string(),
        "+faststart".to_string(),
        "-y".to_string(),
        output,
    ]);
    
    let output = Command::new(ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute FFmpeg fade: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg fade failed: {}", stderr));
    }
    
    Ok(output.status.code().unwrap_or(0))
}

/// Trim a video clip destructively (creates new file)
#[tauri::command]
pub async fn trim_clip(input: String, start: f64, end: f64, output: String) -> Result<i32, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    let duration = end - start;
    
    if duration <= 0.0 {
        return Err("Invalid trim duration".to_string());
    }
    
    let args = vec![
        "-ss".to_string(),
        start.to_string(),
        "-i".to_string(),
        input,
        "-t".to_string(),
        duration.to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-movflags".to_string(),
        "+faststart".to_string(),
        "-y".to_string(),
        output,
    ];
    
    let output = Command::new(ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute FFmpeg trim: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg trim failed: {}", stderr));
    }
    
    Ok(output.status.code().unwrap_or(0))
}

/// Split a video clip at a specific time point (creates two new files)
#[tauri::command]
pub async fn split_clip(input: String, split_time: f64, left_output: String, right_output: String, total_duration: f64) -> Result<i32, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    
    if split_time <= 0.0 || split_time >= total_duration {
        return Err("Invalid split time".to_string());
    }
    
    if split_time < 0.2 || (total_duration - split_time) < 0.2 {
        return Err("Split would create segments too short (< 0.2s)".to_string());
    }
    
    // Create left part (from start to split_time)
    let left_args = vec![
        "-ss".to_string(),
        "0".to_string(),
        "-i".to_string(),
        input.clone(),
        "-t".to_string(),
        split_time.to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-movflags".to_string(),
        "+faststart".to_string(),
        "-y".to_string(),
        left_output.clone(),
    ];
    
    let left_output_cmd = Command::new(ffmpeg_path)
        .args(&left_args)
        .output()
        .map_err(|e| format!("Failed to execute FFmpeg split (left part): {}", e))?;
    
    if !left_output_cmd.status.success() {
        let stderr = String::from_utf8_lossy(&left_output_cmd.stderr);
        return Err(format!("FFmpeg split (left part) failed: {}", stderr));
    }
    
    // Create right part (from split_time to end)
    let right_duration = total_duration - split_time;
    let right_args = vec![
        "-ss".to_string(),
        split_time.to_string(),
        "-i".to_string(),
        input,
        "-t".to_string(),
        right_duration.to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-movflags".to_string(),
        "+faststart".to_string(),
        "-y".to_string(),
        right_output.clone(),
    ];
    
    let right_output_cmd = Command::new(ffmpeg_path)
        .args(&right_args)
        .output()
        .map_err(|e| format!("Failed to execute FFmpeg split (right part): {}", e))?;
    
    if !right_output_cmd.status.success() {
        let stderr = String::from_utf8_lossy(&right_output_cmd.stderr);
        return Err(format!("FFmpeg split (right part) failed: {}", stderr));
    }
    
    Ok(0)
}

/// Transcode video to MP4 format
#[tauri::command]
pub async fn transcode_to_mp4(input: String, output: String) -> Result<i32, String> {
    let _ffmpeg_path = get_ffmpeg_path()?;
    
    let args = vec![
        "-i".to_string(),
        input,
        "-c:v".to_string(),
        "libx264".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-movflags".to_string(),
        "+faststart".to_string(),
        "-y".to_string(),
        output,
    ];
    
    let output = Command::new(_ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute FFmpeg transcode: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg transcode failed: {}", stderr));
    }
    
    Ok(output.status.code().unwrap_or(0))
}

/// Export concatenated video with fade effects support
#[tauri::command]
pub async fn export_concat_with_fades(
    list_path: String,
    output: String,
    resolution: Option<String>,
    fade_effects: Option<Vec<(f64, f64)>>, // Vec of (fade_in_duration, fade_out_duration) for each clip
) -> Result<i32, String> {
    let _ffmpeg_path = get_ffmpeg_path()?;
    
    // If no fade effects, use regular concat
    if fade_effects.is_none() {
        return export_concat(list_path, output, resolution).await;
    }
    
    // Apply fade effects to individual clips first, then concatenate
    let fade_data = fade_effects.unwrap();
    
    // Read the file list to get input files
    let list_path_buf = PathBuf::from(&list_path);
    let list_content = std::fs::read_to_string(&list_path_buf)
        .map_err(|e| format!("Failed to read concat list: {}", e))?;
    
    let input_files: Vec<&str> = list_content
        .lines()
        .filter_map(|line| {
            if line.starts_with("file '") && line.ends_with("'") {
                Some(&line[6..line.len()-1]) // Remove "file '" and "'"
            } else {
                None
            }
        })
        .collect();
    
    if input_files.is_empty() {
        return Err("No valid input files found in concat list".to_string());
    }
    
    // Create temporary directory for processed clips
    let temp_dir = std::env::temp_dir().join("trimbot_fade_export");
    std::fs::create_dir_all(&temp_dir)
        .map_err(|e| format!("Failed to create temp directory: {}", e))?;
    
    let mut processed_files = Vec::new();
    
    // Process each clip with fade effects
    for (i, input_file) in input_files.iter().enumerate() {
        let temp_output = temp_dir.join(format!("clip_{}.mp4", i));
        
        // Get fade settings for this clip
        let (fade_in, fade_out) = fade_data.get(i).copied().unwrap_or((0.0, 0.0));
        
        // Get clip duration
        let duration = probe_duration_seconds(input_file)?;
        
        if fade_in > 0.0 || fade_out > 0.0 {
            // Apply fade effects
            apply_fade_effects(
                input_file.to_string(),
                temp_output.to_string_lossy().to_string(),
                if fade_in > 0.0 { Some(fade_in) } else { None },
                if fade_out > 0.0 { Some(fade_out) } else { None },
                duration,
            ).await?;
        } else {
            // No fade effects, just copy the file
            std::fs::copy(input_file, &temp_output)
                .map_err(|e| format!("Failed to copy file: {}", e))?;
        }
        
        processed_files.push(temp_output);
    }
    
    // Create new concat list with processed files
    let temp_list = temp_dir.join("processed_list.txt");
    let mut list_content = String::new();
    for file in &processed_files {
        list_content.push_str(&format!("file '{}'\n", file.to_string_lossy()));
    }
    
    std::fs::write(&temp_list, list_content)
        .map_err(|e| format!("Failed to write temp concat list: {}", e))?;
    
    // Export concatenated video
    let result = export_concat_demuxer(
        &temp_list.to_string_lossy(),
        &output,
        resolution.as_deref()
    ).await;
    
    // Clean up temporary files
    let _ = std::fs::remove_dir_all(&temp_dir);
    
    result
}

/// Export concatenated video using concat demuxer with resolution presets
#[tauri::command]
pub async fn export_concat(list_path: String, output: String, resolution: Option<String>) -> Result<i32, String> {
    let _ffmpeg_path = get_ffmpeg_path()?;
    
    // Try concat demuxer first
    let result = export_concat_demuxer(&list_path, &output, resolution.as_deref()).await;
    
    // If concat demuxer fails, try filter-concat as fallback
    if result.is_err() {
        println!("Concat demuxer failed, trying filter-concat fallback");
        return export_concat_filter_internal(&list_path, &output, resolution.as_deref()).await;
    }
    
    result
}

/// Export using concat demuxer (preferred method)
async fn export_concat_demuxer(list_path: &str, output: &str, resolution: Option<&str>) -> Result<i32, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    
    let mut args = vec![
        "-f".to_string(),
        "concat".to_string(),
        "-safe".to_string(),
        "0".to_string(),
        "-i".to_string(),
        list_path.to_string(),
    ];
    
    // Add resolution scaling if specified
    match resolution {
        Some("720p") => {
            args.extend(vec![
                "-vf".to_string(),
                "scale=-2:720".to_string(),
            ]);
        },
        Some("1080p") => {
            args.extend(vec![
                "-vf".to_string(),
                "scale=-2:1080".to_string(),
            ]);
        },
        _ => {
            // Source resolution - no scaling
        }
    }
    
    args.extend(vec![
        "-c:v".to_string(),
        "libx264".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-movflags".to_string(),
        "+faststart".to_string(),
        "-y".to_string(),
        output.to_string(),
    ]);
    
    let output = Command::new(ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute FFmpeg concat demuxer: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg concat demuxer failed: {}", stderr));
    }
    
    Ok(output.status.code().unwrap_or(0))
}

/// Export using filter-concat (fallback method)
#[tauri::command]
pub async fn export_concat_filter(list_path: String, output: String, resolution: Option<String>) -> Result<i32, String> {
    export_concat_filter_internal(&list_path, &output, resolution.as_deref()).await
}

/// Internal implementation of filter-concat export
async fn export_concat_filter_internal(list_path: &str, output: &str, resolution: Option<&str>) -> Result<i32, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    
    // Read the file list to get input files - use PathBuf for cross-platform compatibility
    let list_path_buf = PathBuf::from(list_path);
    let list_content = std::fs::read_to_string(&list_path_buf)
        .map_err(|e| format!("Failed to read concat list: {}", e))?;
    
    let input_files: Vec<&str> = list_content
        .lines()
        .filter_map(|line| {
            if line.starts_with("file '") && line.ends_with("'") {
                Some(&line[6..line.len()-1]) // Remove "file '" and "'"
            } else {
                None
            }
        })
        .collect();
    
    if input_files.is_empty() {
        return Err("No valid input files found in concat list".to_string());
    }
    
    let mut args = vec![];
    
    // Add input files
    for file in &input_files {
        args.extend(vec!["-i".to_string(), file.to_string()]);
    }
    
    // Build filter complex for concatenation
    let mut filter_inputs = Vec::new();
    for i in 0..input_files.len() {
        filter_inputs.push(format!("[{}:v][{}:a]", i, i));
    }
    
    let filter_complex = format!(
        "{}concat=n={}:v=1:a=1[v][a]",
        filter_inputs.join(""),
        input_files.len()
    );
    
    args.extend(vec![
        "-filter_complex".to_string(),
        filter_complex,
    ]);
    
    // Add resolution scaling if specified
    match resolution {
        Some("720p") => {
            args.extend(vec![
                "-vf".to_string(),
                "scale=-2:720".to_string(),
            ]);
        },
        Some("1080p") => {
            args.extend(vec![
                "-vf".to_string(),
                "scale=-2:1080".to_string(),
            ]);
        },
        _ => {
            // Source resolution - no scaling
        }
    }
    
    args.extend(vec![
        "-map".to_string(),
        "[v]".to_string(),
        "-map".to_string(),
        "[a]".to_string(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-movflags".to_string(),
        "+faststart".to_string(),
        "-y".to_string(),
        output.to_string(),
    ]);
    
    let output = Command::new(ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute FFmpeg filter-concat: {}", e))?;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg filter-concat failed: {}", stderr));
    }
    
    Ok(output.status.code().unwrap_or(0))
}

/// Export with crossfades between all adjacent inputs using iterative merges.
/// This approach avoids building a complex single filter graph across N inputs.
#[tauri::command]
pub async fn export_with_crossfades(
    inputs: Vec<String>,
    output: String,
    duration: f32,
    resolution: Option<String>,
    temp_dir: Option<String>,
) -> Result<i32, String> {
    if inputs.is_empty() {
        return Err("No input files provided".to_string());
    }

    let ffmpeg_path = get_ffmpeg_path()?;
    let crossfade_d = if duration > 0.0 { duration as f64 } else { 1.0_f64 };

    // If only one input, optionally scale and write out directly
    if inputs.len() == 1 {
        let mut args = vec!["-i".to_string(), inputs[0].clone()];

        match resolution.as_deref() {
            Some("720p") => { args.extend(vec!["-vf".to_string(), "scale=-2:720".to_string()]); },
            Some("1080p") => { args.extend(vec!["-vf".to_string(), "scale=-2:1080".to_string()]); },
            _ => {}
        }

        args.extend(vec![
            "-c:v".to_string(), "libx264".to_string(),
            "-c:a".to_string(), "aac".to_string(),
            "-movflags".to_string(), "+faststart".to_string(),
            "-y".to_string(), output.clone(),
        ]);

        let out = Command::new(ffmpeg_path)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to execute FFmpeg: {}", e))?;

        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("FFmpeg failed: {}", stderr));
        }
        return Ok(out.status.code().unwrap_or(0));
    }

    // Temp directory for intermediates
    let temp_dir_path = temp_dir.unwrap_or_else(|| std::env::temp_dir().to_string_lossy().to_string());
    let mut current_left = inputs[0].clone();

    // Iteratively merge with crossfades
    for (idx, right) in inputs.iter().enumerate().skip(1) {
        let left_duration = probe_duration_seconds(&current_left)?;
        let offset = (left_duration - crossfade_d).max(0.0);

        let intermediate = format!("{}/xfade_step_{}.mp4", temp_dir_path.trim_end_matches('/'), idx);

        // Build filter_complex: video xfade and audio acrossfade
        // Example:
        // [0:v][1:v] xfade=transition=fade:duration=t:offset=off [v]; [0:a][1:a] acrossfade=d=t [a]
        let filter = format!(
            "[0:v][1:v]xfade=transition=fade:duration={}:offset={}[v];[0:a][1:a]acrossfade=d={}[a]",
            crossfade_d, offset, crossfade_d
        );

        let args = vec![
            "-i".to_string(), current_left.clone(),
            "-i".to_string(), right.clone(),
            "-filter_complex".to_string(), filter,
            "-map".to_string(), "[v]".to_string(),
            "-map".to_string(), "[a]".to_string(),
            "-c:v".to_string(), "libx264".to_string(),
            "-c:a".to_string(), "aac".to_string(),
            "-movflags".to_string(), "+faststart".to_string(),
            "-y".to_string(), intermediate.clone(),
        ];

        let out = Command::new(ffmpeg_path)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to execute FFmpeg xfade step: {}", e))?;

        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("FFmpeg xfade step failed: {}", stderr));
        }

        current_left = intermediate;
    }

    // Handle optional scaling of final output
    if matches!(resolution.as_deref(), Some("720p" | "1080p")) {
        let mut args = vec!["-i".to_string(), current_left.clone()];
        match resolution.as_deref() {
            Some("720p") => { args.extend(vec!["-vf".to_string(), "scale=-2:720".to_string()]); },
            Some("1080p") => { args.extend(vec!["-vf".to_string(), "scale=-2:1080".to_string()]); },
            _ => {}
        }
        args.extend(vec![
            "-c:v".to_string(), "libx264".to_string(),
            "-c:a".to_string(), "aac".to_string(),
            "-movflags".to_string(), "+faststart".to_string(),
            "-y".to_string(), output.clone(),
        ]);

        let out = Command::new(ffmpeg_path)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to execute FFmpeg scaling: {}", e))?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("FFmpeg scaling failed: {}", stderr));
        }
        return Ok(out.status.code().unwrap_or(0));
    } else {
        // No scaling requested; move/copy the last intermediate to final output by remuxing
        let args = vec![
            "-i".to_string(), current_left.clone(),
            "-c".to_string(), "copy".to_string(),
            "-y".to_string(), output.clone(),
        ];
        let out = Command::new(ffmpeg_path)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to finalize output: {}", e))?;
        if !out.status.success() {
            let stderr = String::from_utf8_lossy(&out.stderr);
            return Err(format!("Finalization failed: {}", stderr));
        }
        return Ok(out.status.code().unwrap_or(0));
    }
}
