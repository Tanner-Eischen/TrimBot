// Core timeline types
export interface ClipKeyframe {
  id: string;
  timeSec: number;
  property: string;
  value: number;
  interpolation: string;
}

export interface KeyframeSet {
  opacity?: ClipKeyframe[];
  volume?: ClipKeyframe[];
}

export interface FadePreset {
  type: 'fade-in' | 'fade-out';
  duration: number;
  enabled: boolean;
}

export interface OverlayProperties {
  position?: { x: number; y: number };
  scale?: number;
  opacity?: number;
  includeAudio?: boolean;
  zIndex?: number;
}

export interface TimelineItem {
  id: string;
  name: string;
  durationSec: number;
  startTime: number;
  xPx: number;
  wPx: number;
  type: 'video' | 'audio';
  path: string;
  selected: boolean;
  filename?: string;
  width?: number;
  height?: number;
  // Non-destructive trim window within source media
  inSec?: number;   // default 0
  outSec?: number;  // default == source duration
  keyframes?: KeyframeSet;
  fadePresets?: {
    fadeIn?: FadePreset;
    fadeOut?: FadePreset;
  };
  trackType?: 'main' | 'overlay';
  overlayProperties?: OverlayProperties;
}

// Project types
export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: ProjectSettings;
  trackSettings?: TrackSettings;
}

export interface ProjectSettings {
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  outputFormat: string;
}

export interface TrackSettings {
  showOverlayTrack?: boolean;
  overlayTrackHeight?: number;
  trackSpacing?: number;
}

// Clip types
export interface Clip {
  id: string;
  filename: string;
  filePath: string;
  durationSec?: number;
  width?: number;
  height?: number;
}
