`PRD.md` — ClipForge (Detailed / Prescriptive)
==============================================

> **Stack:** Tauri (Rust) + React + Vite + FFmpeg (native CLI)  
> **Scope window:** 48 hours. Prioritize stability over flash.

1) Product Overview

-------------------

**Goal:** Ship a solid desktop editor that reliably covers the core loop: **Import → Trim → Arrange (timeline) → Export**, plus **screen + webcam recording**.  
**Audience:** Content creators, educators, professionals who need quick edits.  
**Platforms:** Windows, macOS (Linux best-effort).

**Must-haves (MVP):**

* Import MP4/MOV/WebM (common codecs).

* Preview playback, scrub.

* **Destructive trim:** user trims to produce a **new file** via FFmpeg (fast path via re-encode).

* Horizontal, single-track timeline (NLE style): draggable clips, resizing left/right edge (which triggers a **replace-with-new-trim**).

* Export timeline to MP4 (H.264/AAC). Progress text.

* Packaging: runnable distributable.

**Full submission adds:**

* Screen record (getDisplayMedia) + mic.

* Webcam record (getUserMedia) + mic.

* Immediate transcode recordings → MP4.

**Non-goals (48h):**

* Native Rust capture (AVFoundation/Windows.Graphics.Capture).

* Effects, transitions, multi-track mixing, waveform.

* Undo/redo.

* * *

2) Architecture (ASCII)

-----------------------

`┌──────────────────┐    IPC (tauri::command)    ┌─────────────────────────┐│  React UI (Vite) │ <────────────────────────> │  Tauri (Rust backend)   ││  - Player <video>│                             │  - FFmpeg path resolve  ││  - Timeline DOM  │                             │  - spawn ffmpeg/ffprobe ││  - Record via     │  Save blobs / open dialogs │  - file I/O (safe)      ││    MediaRecorder  │ <────────────────────────> │  - concat list writer    │└──────────────────┘                             └─────────────────────────┘             │                                                │             │                                   Native FFmpeg CLI (bundled)              │                                                │             └─────────────────────────────── Filesystem ─────┘`

* * *

3) Data Models

--------------

> **Destructive trim** simplifies UI logic: each trim creates a new media file (stored in project media dir) and the timeline references actual files.

`// Frontend TypeScript type MediaType = 'video' | 'audio';  interface ClipFile {  id: string;               // uuid   path: string;             // absolute path on disk   type: MediaType;          // 'video' (MVP), audio optional later   durationSec: number;      // probed   width?: number;           // optional metadata   height?: number;  codec?: string;  container?: string;       // e.g., mp4   createdAt: string;        // ISO   sourceKind: 'import' | 'record-screen' | 'record-webcam' | 'trim';  sourceOf?: string;        // parent id if derived (trimmed from) }  interface TimelineItem {  id: string;               // uuid   clipId: string;           // references a ClipFile   startSec: number;         // always 0 for destructive trims   endSec: number;           // == clip duration   xPx: number;              // left position (derived)   wPx: number;              // width (derived) }  interface ProjectState {  projectDir: string;  mediaDir: string;         // projectDir/media   exportDir: string;        // projectDir/exports   library: Record<string, ClipFile>;  timeline: TimelineItem[]; // single track, ordered by xPx   pxPerSec: number;         // e.g., 50 px/s for MVP }`

**Note:** For future **non-destructive** trims: keep `inSec/outSec` in TimelineItem and do trim at export. For now (B), destructive trims produce new files and set `startSec=0`, `endSec=duration`.

* * *

4) File Layout / Paths

----------------------

`repo/  src/                  # React   src-tauri/    src/      main.rs      ffmpeg.rs         # commands: run_ffmpeg, trim_clip, concat_list, transcode_to_mp4, save_blob       fs.rs             # helpers for file writing, list writing     resources/      ffmpeg/        win/ffmpeg.exe        mac/ffmpeg        linux/ffmpeg    tauri.conf.json     # ensure resources included`

**Runtime directories per project:**

* `projectDir/`
  
  * `media/` (all imported, recorded, and trimmed files)
  
  * `exports/` (final outputs)
  
  * `.temp/` (concat list, temp transcoding)

* * *

5) IPC Command Contracts (Rust)

-------------------------------

`// All return Result<i32, String> for exit code (0 = success) // where applicable. Some return info strings (paths).  #[tauri::command] fn resolve_app_dirs() -> AppDirs {  // returns base app dir; frontend builds projectDir per "Create Project" }  #[tauri::command] async fn run_ffmpeg(args: Vec<String>) -> Result<i32, String>;  #[tauri::command] async fn ffprobe_json(path: String) -> Result<String, String>; // optional, if using ffprobe  #[tauri::command] async fn trim_clip(input: String, start: f64, end: f64, out: String) -> Result<i32, String>;  #[tauri::command] async fn transcode_to_mp4(input: String, out: String) -> Result<i32, String>;  #[tauri::command] async fn write_concat_list(lines: Vec<String>, listPath: String) -> Result<(), String>;  #[tauri::command] async fn export_concat(listPath: String, out: String) -> Result<i32, String>;  #[tauri::command] async fn save_blob(path: String, bytes: Vec<u8>) -> Result<(), String>;  #[tauri::command] async fn open_file_dialog_multi() -> Result<Vec<String>, String>;  #[tauri::command] async fn open_dir_dialog() -> Result<String, String>;`

**FFmpeg path resolution:** at startup, detect platform and set a global `FfmpegPath`. All commands use it.

* * *

6) Timeline Rendering Spec (Horizontal / Track-Style)

-----------------------------------------------------

**MVP rules:**

* **Single track.** Items laid left→right with **no overlap**.

* **pxPerSec = 50** (constant for MVP).

* **xPx** of item _i_ = sum of widths of all prior items (or manually draggable; keep snap to non-overlap).

* **wPx** = `durationSec * pxPerSec`.

**Interactions:**

* **Drag entire item horizontally** (constrained so it can’t overlap neighbors). On drop, recompute ordering by `xPx`.

* **Resize left/right edge:**
  
  * Shows trim handles. On mouseup, **spawn destructive trim** via `trim_clip`: create a new file (with the trimmed range) replacing the item’s clip. Update library/timeline with new `durationSec`, recompute `wPx`.
  
  * Implementation detail: During resize, just show a visual delta; only on release run the FFmpeg trim.

**Scrolling/Zoom:**

* MVP: **horizontal scroll** only. No zoom in v1.

* Stretch: add zoom levels (25/50/100 px/s) and recalc widths.

**Playhead:**

* A vertical line at `currentTime * pxPerSec`. Scrubbing the time ruler sets `<video>.currentTime`.

**Ruler:**

* Top ruler ticks every 1s (minor) and 5s (major) for MVP.

* * *

7) Recording Pipeline (Immediate Normalization)

-----------------------------------------------

**Screen recording:**

1. `getDisplayMedia({video:true, audio:true})`

2. `MediaRecorder` → collect chunks → Blob (`video/webm`)

3. `save_blob` to `projectDir/media/recording-<ts>.webm`

4. `transcode_to_mp4` → `recording-<ts>.mp4`

5. Import the MP4: probe duration (via `<video>` metadata load or `ffprobe_json`) → add to library.

**Webcam recording:** same, but `getUserMedia({video:true,audio:true})`.

**Notes:**

* If audio capture is flaky on a platform, fallback to `{audio:false}` and document limitation.

* Keep UI: Record/Stop + mm:ss timer.

* * *

8) Export Pipeline

------------------

**Normalization precondition:** All timeline clips should be **MP4 (H.264/AAC)** by the time they’re placed on the track (imports can auto-transcode if needed; recordings are transcoded immediately).  
**Concat strategy:**

* Build `files.txt`:
  `file '/abs/path/clipA.mp4' file '/abs/path/clipB.mp4' ...`

* Run:
  `ffmpeg -f concat -safe 0 -i files.txt -c:v libx264 -c:a aac -movflags +faststart -y exports/final-<ts>.mp4`

* Resolution presets: optional `-vf scale=-2:720` (720p) or `-vf scale=-2:1080`. Default "Source".

**Progress UI:** Show “Exporting…” text + spinner; optional tail lines from stderr if you pipe logs.

* * *

9) Error Handling & Edge Cases

------------------------------

* **Import failure:** show toast “Unsupported format. Try MP4.” Optionally offer “Transcode to MP4 now?” (call `transcode_to_mp4`).

* **Trim failure:** revert UI change; show stderr tail.

* **Export failure:** suggest removing suspect clip; ensure all files exist and are MP4.

* **Recording blocked:** show instruction “Allow screen capture permission in OS settings.”

* **Path spaces:** always quote file paths in concat list and args.

* * *

10) Cross-Platform Notes

------------------------

* **Windows:** bundle `ffmpeg.exe`. Ensure WebView2 present (Tauri handles). File paths need quoting in concat.

* **macOS:** first-launch permissions for screen/mic. Consider notarization later (out of scope).

* **Linux:** packaging varies; treat as best-effort.

* * *

11) Stretch Goals (Post-MVP)

----------------------------

* Zoom control; magnetic snapping to playhead/edges.

* Secondary overlay track (PiP).

* Non-destructive trims (add `inSec/outSec`; trim at export).

* Keyboard shortcuts.

* Export presets per platform (YouTube, etc).

* * *

12) Explicit Non-Goals

----------------------

* Color effects, transitions, keyframes, complex audio mixing.

* Native Rust capture stacks.

* * *

13) Definition of Done (Gauntlet Review)

----------------------------------------

* Launch app → import two clips → trim each → place on track → export MP4 → plays correctly.

* Screen record 10s + mic → auto appears in library (as MP4) → use in timeline → export.

* No crashes; packaged build provided with README.

* * *

Developer Notes for Future Non-Destructive Trim (Commented)
===========================================================

* Replace destructive trim pipeline with per-item `inSec/outSec`.

* Modify export to build a filtergraph:
  `ffmpeg -i A.mp4 -i B.mp4 -filter_complex "  [0:v]trim=start=in0:end=out0,setpts=PTS-STARTPTS[v0];  [0:a]atrim=start=in0:end=out0,asetpts=PTS-STARTPTS[a0];  [1:v]trim=start=in1:end=out1,setpts=PTS-STARTPTS[v1];  [1:a]atrim=start=in1:end=out1,asetpts=PTS-STARTPTS[a1];  [v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -c:a aac out.mp4`

* UI remains identical; only backend changes.
