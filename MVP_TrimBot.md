`TASKS.md` — Execution Plan (PRs → Tasks → Subtasks)
====================================================

> **Strategy:** Ship in vertical slices. Each PR ends with a runnable app.  
> **Timeboxes:** annotate max hours per PR. If a PR overruns, apply fallback.

Epic 0 — Bootstrap (2h)
-----------------------

**PR-00: Scaffold & FFmpeg wiring (2h)**

* Init Tauri + React (Vite) template.

* Add `resources/ffmpeg/{win|mac|linux}/...` binaries.

* Resolve FFmpeg path at startup; store in managed state.

* Commands: `run_ffmpeg`, `transcode_to_mp4`, `trim_clip`, `write_concat_list`, `export_concat`, `save_blob`, `open_file_dialog_multi`, `open_dir_dialog`.

* Smoke test: `run_ffmpeg -version` → 0 exit.

**Acceptance:** Dev app runs; `ffmpeg -version` call succeeds.

* * *

Epic 1 — Import & Library & Preview (4h)
----------------------------------------

**PR-01: Media import & preview**

* “Create/Open Project” → choose `projectDir` and make `media/`, `exports/`, `.temp/`.

* Import dialog (multi-select). Copy files into `media/` or reference in place (choose copy for safety).

* On import: probe duration (via `<video>` metadata; fallback to `ffprobe_json` if needed).

* Library list (title, duration).

* Preview player with play/pause/scrub & current time.

**Acceptance:** Import two files, select in library, preview works.

* * *

Epic 2 — Timeline (horizontal) + Destructive Trim (8h)
------------------------------------------------------

**PR-02A: Horizontal track & drag**

* `pxPerSec=50` constant.

* Drop from library to timeline appends at end (xPx computed).

* Drag item horizontally; constrain to avoid overlap; reorder on drop.

* Ruler (ticks every 1s; bold every 5s).  
  **Acceptance:** Arrange two clips left→right without overlap; playhead scrubs.

**PR-02B: Resize → destructive trim**

* Resize handles (left/right). Visual preview only during drag (don’t trim yet).

* On mouseup: compute seconds delta; call `trim_clip` to create a new file `media/<id>-trim.mp4`:
  
  * Use re-encode path for safety:
    `ffmpeg -ss <start> -i <src> -t <dur> -c:v libx264 -c:a aac -movflags +faststart -y <out>`

* Replace timeline item’s `clipId` with new file; update library entry (link `sourceOf`).

* Recompute width and positions.  
  **Acceptance:** Resize right edge to shorten; new file is created and used.

**Fallback:** If trim glutting time, implement minimal “Split at playhead” first (produces two files A/B via -ss/-t), then add edge-resize later.

* * *

Epic 3 — Export (concat) (4h)
-----------------------------

**PR-03: Export MP4**

* Ensure all timeline files are MP4; auto-transcode any non-MP4 before export.

* Build `files.txt` in `.temp/`. Lines: `file '/abs/path.mp4'`.

* `export_concat` (concat demuxer) → `exports/final-<ts>.mp4`

* Resolution preset: “Source / 720p / 1080p” (optional `-vf scale=-2:720/1080`).

* UI: Export dialog (save name) + “Exporting…” state; success message with path.

**Acceptance:** Export timeline of 2–3 clips; resulting MP4 plays.

**Fallback:** If concat demuxer is finicky, use filter-concat:

`ffmpeg -i a.mp4 -i b.mp4 -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" out.mp4`

* * *

Epic 4 — Recording (Screen & Webcam) (8h)
-----------------------------------------

**PR-04A: Screen recording**

* `getDisplayMedia({video:true,audio:true})` + `MediaRecorder`.

* On stop: save webm via `save_blob` to `media/record-screen-<ts>.webm`.

* `transcode_to_mp4` → `media/record-screen-<ts>.mp4`.

* Import MP4 to library automatically.

* If audio fails: downgrade to `audio:false` and toast a note.

**Acceptance:** Record 10s, see mp4 in library, preview works.

**PR-04B: Webcam recording**

* `getUserMedia({video:true,audio:true})` GUI with small live preview.

* Same save/transcode/import pipeline.

**Acceptance:** Record 10s webcam, mp4 appears and plays.

**Fallback:** If audio causes crashes: enforce video-only and document.

* * *

Epic 5 — Polish & Packaging (6h)
--------------------------------

**PR-05: UX polish**

* Empty states, labels, help text (one-liners).

* File naming scheme; prevent overwrites.

* Error toasts with final stderr line (if available).

**PR-06: Packaging**

* `tauri build` (current OS).

* Ensure ffmpeg included and callable (test on clean machine if possible).

* README with Setup, Run, Build, Known Issues.

**Acceptance:** Packaged app launches; import→trim→export works; record→export works.

* * *

Acceptance Criteria Summary
---------------------------

* ✅ Can import multiple files and preview.

* ✅ Can place files on a horizontal timeline, reorder without overlap.

* ✅ Can resize a clip edge → produces **new trimmed file** and updates timeline.

* ✅ Can export concatenated MP4 with chosen resolution.

* ✅ Can screen record & webcam record → auto-transcoded to MP4 → usable in timeline.

* ✅ Packaged build available.
