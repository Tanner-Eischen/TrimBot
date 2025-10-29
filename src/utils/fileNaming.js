/**
 * Utility functions for consistent file naming across the application
 */

/**
 * Generate a timestamp string for file naming
 * Format: YYYY-MM-DD_HH-MM-SS
 */
export function generateTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .slice(0, 19); // Remove milliseconds and timezone
}

/**
 * Generate a short timestamp for inline naming
 * Format: HHMMSS
 */
export function generateShortTimestamp() {
  const now = new Date();
  return now.toTimeString().slice(0, 8).replace(/:/g, '');
}

/**
 * Sanitize filename to remove invalid characters
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Generate filename for screen recordings
 */
export function generateScreenRecordingName() {
  const timestamp = generateTimestamp();
  return `screen-recording_${timestamp}.webm`;
}

/**
 * Generate filename for webcam recordings
 */
export function generateWebcamRecordingName() {
  const timestamp = generateTimestamp();
  return `webcam-recording_${timestamp}.webm`;
}

/**
 * Generate filename for trimmed clips
 */
export function generateTrimmedClipName(originalFilename, startTime, endTime) {
  const extension = originalFilename.split('.').pop();
  const baseName = originalFilename.replace(`.${extension}`, '');
  const sanitizedBaseName = sanitizeFilename(baseName);
  const shortTimestamp = generateShortTimestamp();
  
  // Format times as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}`;
  };
  
  const startFormatted = formatTime(startTime);
  const endFormatted = formatTime(endTime);
  
  return `${sanitizedBaseName}_trim_${startFormatted}-${endFormatted}_${shortTimestamp}.${extension}`;
}

/**
 * Generate filename for exported videos
 */
export function generateExportName(baseName) {
  const sanitizedBaseName = sanitizeFilename(baseName || 'export');
  const timestamp = generateTimestamp();
  return `${sanitizedBaseName}_${timestamp}.mp4`;
}

/**
 * Generate filename for imported files with collision prevention
 */
export function generateImportedFileName(originalFilename, clipId) {
  const extension = originalFilename.split('.').pop();
  const baseName = originalFilename.replace(`.${extension}`, '');
  const sanitizedBaseName = sanitizeFilename(baseName);
  const shortId = clipId.slice(0, 8); // Use first 8 chars of UUID
  
  return `${sanitizedBaseName}_${shortId}.${extension}`;
}

/**
 * Extract base name from filename (without extension)
 */
export function getBaseName(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
}

/**
 * Get file extension from filename
 */
export function getExtension(filename) {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.slice(lastDotIndex + 1) : '';
}

/**
 * Generate a user-friendly display name for clips
 */
export function generateDisplayName(clip) {
  if (clip.sourceKind === 'import') {
    return clip.filename;
  } else if (clip.sourceKind === 'trim') {
    return `${getBaseName(clip.filename)} (Trimmed)`;
  } else if (clip.sourceKind === 'record') {
    const timestamp = new Date(clip.createdAt).toLocaleString();
    return `Recording ${timestamp}`;
  }
  return clip.filename;
}