import { OverlayProperties, TrackSettings } from '../types';

// Default values for overlay properties
export const DEFAULT_OVERLAY_PROPERTIES: OverlayProperties = {
  position: { x: 70, y: 10 }, // top-right corner
  scale: 0.3,
  opacity: 1.0,
  includeAudio: false,
  zIndex: 1
};

// Default track settings
export const DEFAULT_TRACK_SETTINGS: TrackSettings = {
  showOverlayTrack: true,
  overlayTrackHeight: 80,
  trackSpacing: 8
};

// Track configuration constants
export const TRACK_CONFIG = {
  main: {
    height: 100,
    backgroundColor: '#f8fafc',
    label: 'Main Track',
    borderColor: '#cbd5e1'
  },
  overlay: {
    height: 80,
    backgroundColor: '#fef3c7',
    label: 'Overlay Track',
    borderColor: '#f59e0b'
  }
};