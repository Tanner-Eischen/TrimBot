/**
 * TrimBot Error Handling Framework
 * Provides consistent error handling across the application
 */

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>,
    public recoveryAction?: () => void
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_VIDEO: 'INVALID_VIDEO',
  FFMPEG_FAILED: 'FFMPEG_FAILED',
  IMPORT_FAILED: 'IMPORT_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  PROJECT_CREATE_FAILED: 'PROJECT_CREATE_FAILED',
  INVALID_PATH: 'INVALID_PATH',
  TIMEOUT: 'TIMEOUT',
  INVALID_DURATION: 'INVALID_DURATION',
  INVALID_TRIM_RANGE: 'INVALID_TRIM_RANGE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;

export function createErrorMessage(error: AppError): string {
  switch (error.code) {
    case ErrorCodes.FILE_NOT_FOUND:
      return `File not found. Check the file path and try again.`;
    case ErrorCodes.INVALID_VIDEO:
      return `Invalid video format. Supported: MP4, MOV, AVI, MKV, WebM`;
    case ErrorCodes.FFMPEG_FAILED:
      return `Video processing failed. Try a smaller file or check your system resources.`;
    case ErrorCodes.IMPORT_FAILED:
      return `Failed to import file. Ensure the file format is supported and file is not corrupted.`;
    case ErrorCodes.EXPORT_FAILED:
      return `Failed to export video. Check output path and available disk space.`;
    case ErrorCodes.PROJECT_CREATE_FAILED:
      return `Failed to create project. Check folder permissions and available disk space.`;
    case ErrorCodes.INVALID_PATH:
      return `Invalid file path provided.`;
    case ErrorCodes.TIMEOUT:
      return `Operation timed out. Please try again or check system resources.`;
    case ErrorCodes.INVALID_DURATION:
      return `Invalid video duration. Duration must be positive and less than 12 hours.`;
    case ErrorCodes.INVALID_TRIM_RANGE:
      return `Invalid trim range. Start must be before end and segment must be at least 0.2 seconds.`;
    case ErrorCodes.PERMISSION_DENIED:
      return `Permission denied. Check folder permissions and try again.`;
    default:
      return error.message;
  }
}

/**
 * Helper to check if an unknown error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert unknown error to AppError for consistent handling
 */
export function toAppError(error: unknown, defaultCode: string = 'IMPORT_FAILED'): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  if (error instanceof Error) {
    // Try to infer error code from message
    if (error.message.includes('permission')) {
      return new AppError(ErrorCodes.PERMISSION_DENIED, error.message);
    }
    if (error.message.includes('not found')) {
      return new AppError(ErrorCodes.FILE_NOT_FOUND, error.message);
    }
    if (error.message.includes('timeout')) {
      return new AppError(ErrorCodes.TIMEOUT, error.message);
    }
    
    return new AppError(defaultCode, error.message);
  }
  
  return new AppError(defaultCode, String(error));
}
