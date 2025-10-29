/**
 * TrimBot Input Validation Utilities
 * Validates file paths, video formats, durations, and trim ranges
 */

import { AppError, ErrorCodes } from './errors';

// Constants for validation
export const SUPPORTED_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'mts', 'm2ts'];
export const MAX_VIDEO_DURATION_HOURS = 12;
export const MAX_FILE_SIZE_MB = 10000; // 10GB
export const MIN_CLIP_DURATION_SECONDS = 0.2;

/**
 * Validates a file path string
 * @throws AppError if path is invalid
 */
export function validateFilePath(path: string): void {
  if (!path || typeof path !== 'string') {
    throw new AppError(
      ErrorCodes.INVALID_PATH,
      'Invalid file path: path must be a non-empty string'
    );
  }

  // Check for basic path validity (no null bytes, reasonable length)
  if (path.includes('\0')) {
    throw new AppError(
      ErrorCodes.INVALID_PATH,
      'Invalid file path: contains null bytes'
    );
  }

  if (path.length > 260) {
    throw new AppError(
      ErrorCodes.INVALID_PATH,
      'Invalid file path: path too long (max 260 characters)'
    );
  }
}

/**
 * Validates a video file format by extension
 * @throws AppError if format not supported
 */
export function validateVideoFormat(filename: string): void {
  if (!filename || typeof filename !== 'string') {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      'Invalid filename'
    );
  }

  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext || !SUPPORTED_FORMATS.includes(ext)) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      `Format .${ext} not supported. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`
    );
  }
}

/**
 * Validates video duration is within acceptable range
 * @throws AppError if duration is invalid
 */
export function validateDuration(seconds: number): void {
  if (typeof seconds !== 'number' || !isFinite(seconds)) {
    throw new AppError(
      ErrorCodes.INVALID_DURATION,
      'Invalid duration: must be a finite number'
    );
  }

  if (seconds <= 0) {
    throw new AppError(
      ErrorCodes.INVALID_DURATION,
      'Invalid duration: must be greater than 0'
    );
  }

  const maxSeconds = MAX_VIDEO_DURATION_HOURS * 3600;
  if (seconds > maxSeconds) {
    throw new AppError(
      ErrorCodes.INVALID_DURATION,
      `Invalid duration: cannot exceed ${MAX_VIDEO_DURATION_HOURS} hours (${maxSeconds} seconds)`
    );
  }
}

/**
 * Validates a trim range is valid for a video
 * @throws AppError if trim range is invalid
 */
export function validateTrimRange(
  startSec: number,
  endSec: number,
  totalDuration: number
): void {
  // Validate input types
  if (
    typeof startSec !== 'number' ||
    typeof endSec !== 'number' ||
    typeof totalDuration !== 'number'
  ) {
    throw new AppError(
      ErrorCodes.INVALID_TRIM_RANGE,
      'Invalid trim range: all values must be numbers'
    );
  }

  // Validate bounds
  if (startSec < 0) {
    throw new AppError(
      ErrorCodes.INVALID_TRIM_RANGE,
      'Invalid trim range: start time cannot be negative'
    );
  }

  if (endSec > totalDuration) {
    throw new AppError(
      ErrorCodes.INVALID_TRIM_RANGE,
      `Invalid trim range: end time (${endSec}s) exceeds total duration (${totalDuration}s)`
    );
  }

  if (startSec >= endSec) {
    throw new AppError(
      ErrorCodes.INVALID_TRIM_RANGE,
      'Invalid trim range: start time must be before end time'
    );
  }

  const clipDuration = endSec - startSec;
  if (clipDuration < MIN_CLIP_DURATION_SECONDS) {
    throw new AppError(
      ErrorCodes.INVALID_TRIM_RANGE,
      `Invalid trim range: trimmed segment must be at least ${MIN_CLIP_DURATION_SECONDS} seconds (got ${clipDuration}s)`
    );
  }
}

/**
 * Validates file size is within acceptable range
 * @throws AppError if file is too large
 */
export function validateFileSize(sizeBytes: number): void {
  if (typeof sizeBytes !== 'number' || sizeBytes < 0) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      'Invalid file size'
    );
  }

  const sizeMB = sizeBytes / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      `File too large: ${sizeMB.toFixed(1)}MB exceeds max ${MAX_FILE_SIZE_MB}MB`
    );
  }
}

/**
 * Composite validation for importing a video file
 * @throws AppError if any validation fails
 */
export function validateVideoImport(
  filePath: string,
  filename: string,
  sizeBytes?: number
): void {
  validateFilePath(filePath);
  validateVideoFormat(filename);

  if (sizeBytes !== undefined) {
    validateFileSize(sizeBytes);
  }
}

/**
 * Validation for clip zoom/scale values
 */
export function validateScale(scale: number): void {
  if (typeof scale !== 'number' || !isFinite(scale)) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      'Invalid scale: must be a finite number'
    );
  }

  if (scale < 0.1 || scale > 10) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      'Invalid scale: must be between 0.1 and 10'
    );
  }
}

/**
 * Validation for opacity/alpha values (0-1)
 */
export function validateOpacity(opacity: number): void {
  if (typeof opacity !== 'number' || !isFinite(opacity)) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      'Invalid opacity: must be a finite number'
    );
  }

  if (opacity < 0 || opacity > 1) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      'Invalid opacity: must be between 0 and 1'
    );
  }
}
