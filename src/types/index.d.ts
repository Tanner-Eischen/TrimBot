// TrimBot TypeScript Type Definitions

export type MediaType = 'video' | 'audio';

export interface ClipFile {
  id: string;               // uuid
  path: string;             // absolute path on disk
  type: MediaType;          // 'video' (MVP), audio optional later
  durationSec: number;      // probed
  width?: number;           // optional metadata
  height?: number;
  codec?: string;
  container?: string;       // e.g., mp4
  createdAt: string;        // ISO
  sourceKind: 'import' | 'record-screen' | 'record-webcam' | 'trim';
  sourceOf?: string;        // parent id if derived (trimmed from)
  filename: string;         // display name
}

export interface ClipKeyframe {
  id: string;              // unique keyframe identifier
  timeSec: number;         // time position within clip (0 to clip duration)
  property: string;        // 'opacity' | 'volume' (extensible for future)
  value: number;           // property value (0.0-1.0 for opacity, 0.0-1.0 for volume)
  interpolation: string;   // 'linear' (only supported type initially)
}

export interface KeyframeSet {
  opacity?: ClipKeyframe[];    // array of opacity keyframes
  volume?: ClipKeyframe[];     // array of volume keyframes (future)
}

export interface FadePreset {
  type: 'fade-in' | 'fade-out';
  duration: number;        // fade duration in seconds (default: 1.0)
  enabled: boolean;        // whether fade is active
}

// NEW for PR-07: Overlay Properties
export interface OverlayProperties {
  position?: { x: number; y: number }; // percentage-based positioning
  scale?: number;           // 0.1 to 1.0, default 0.3
  opacity?: number;         // 0.0 to 1.0, default 1.0
  includeAudio?: boolean;   // default false
  zIndex?: number;          // for multiple overlays (future), default 1
}

export type TrackType = 'main' | 'overlay';

// NEW for PR-07: Track Information
export interface TrackInfo {
  type: TrackType;         // 'main' | 'overlay'
  items: TimelineItem[];   // items in this track
  height: number;          // track height in pixels
  backgroundColor: string; // track background color
  label: string;           // track display label
}

// Extended for PR-07: Timeline Item
export interface TimelineItem {
  id: string;               // uuid
  clipId: string;           // references a ClipFile
  durationSec: number;      // clip duration
  startSec: number;         // timeline position in seconds
  // Back-compat alias for code referencing startTime
  startTime?: number;
  endSec: number;           // end position in seconds (startSec + durationSec)
  xPx: number;              // left position (derived)
  wPx: number;              // width (derived)
  keyframes?: KeyframeSet;  // keyframe animations (from PR-06)
  fadePresets?: {           // simplified fade controls (from PR-06)
    fadeIn?: FadePreset;
    fadeOut?: FadePreset;
  };
  overlayProperties?: OverlayProperties; // NEW: overlay-specific properties
}

// NEW for PR-07: Track Settings
export interface TrackSettings {
  showOverlayTrack?: boolean;    // whether overlay track is visible
  overlayTrackHeight?: number;   // overlay track height (default: 80px)
  trackSpacing?: number;         // spacing between tracks (default: 8px)
}

// Extended for PR-07: Project State
export interface ProjectState {
  projectDir: string;
  mediaDir: string;         // projectDir/media
  exportDir: string;        // projectDir/exports
  library: Record<string, ClipFile>;
  timeline: TimelineItem[]; // main track, ordered by xPx (backward compatible)
  overlayTrack?: TimelineItem[]; // NEW: overlay track (optional for backward compatibility)
  pxPerSec: number;         // e.g., 50 px/s for MVP
  zoomLevel?: number;       // zoom level for timeline
  keyframeSettings?: {      // global keyframe settings (from PR-06)
    defaultFadeDuration: number;  // default fade duration (1.0s)
    showKeyframeMarkers: boolean; // UI preference
  };
  trackSettings?: TrackSettings; // NEW: multi-track settings
}

export interface AppDirs {
  app_data: string;
}

// Default values for overlay properties
export declare const DEFAULT_OVERLAY_PROPERTIES: OverlayProperties;

// Default track settings
export declare const DEFAULT_TRACK_SETTINGS: TrackSettings;

// Track configuration constants
export declare const TRACK_CONFIG: {
  main: {
    height: number;
    backgroundColor: string;
    label: string;
    borderColor: string;
  };
  overlay: {
    height: number;
    backgroundColor: string;
    label: string;
    borderColor: string;
  };
};
