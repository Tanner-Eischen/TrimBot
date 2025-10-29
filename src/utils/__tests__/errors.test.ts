/**
 * Error Utilities Tests
 * Comprehensive test suite for error handling framework
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  ErrorCodes,
  createErrorMessage,
  isAppError,
  toAppError,
} from '../errors';

describe('Error Handling', () => {
  describe('AppError class', () => {
    it('should create error with code and message', () => {
      const error = new AppError(
        ErrorCodes.FILE_NOT_FOUND,
        'File missing'
      );
      expect(error.code).toBe(ErrorCodes.FILE_NOT_FOUND);
      expect(error.message).toBe('File missing');
      expect(error.name).toBe('AppError');
    });

    it('should include optional details', () => {
      const details = { filename: 'video.mp4', size: 1024 };
      const error = new AppError(
        ErrorCodes.INVALID_VIDEO,
        'Processing failed',
        details
      );
      expect(error.details).toEqual(details);
    });

    it('should include optional recovery action', () => {
      const recovery = () => console.log('Retrying...');
      const error = new AppError(
        ErrorCodes.TIMEOUT,
        'Operation timed out',
        {},
        recovery
      );
      expect(error.recoveryAction).toBe(recovery);
      expect(typeof error.recoveryAction).toBe('function');
    });

    it('should extend Error class properly', () => {
      const error = new AppError(ErrorCodes.FFMPEG_FAILED, 'FFmpeg crashed');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });

    it('should maintain stack trace', () => {
      const error = new AppError(ErrorCodes.INVALID_PATH, 'Bad path');
      expect(error.stack).toBeDefined();
      expect(error.stack!.includes('AppError')).toBe(true);
    });
  });

  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
      expect(ErrorCodes.INVALID_VIDEO).toBe('INVALID_VIDEO');
      expect(ErrorCodes.FFMPEG_FAILED).toBe('FFMPEG_FAILED');
      expect(ErrorCodes.IMPORT_FAILED).toBe('IMPORT_FAILED');
      expect(ErrorCodes.EXPORT_FAILED).toBe('EXPORT_FAILED');
      expect(ErrorCodes.PROJECT_CREATE_FAILED).toBe('PROJECT_CREATE_FAILED');
      expect(ErrorCodes.INVALID_PATH).toBe('INVALID_PATH');
      expect(ErrorCodes.TIMEOUT).toBe('TIMEOUT');
      expect(ErrorCodes.INVALID_DURATION).toBe('INVALID_DURATION');
      expect(ErrorCodes.INVALID_TRIM_RANGE).toBe('INVALID_TRIM_RANGE');
      expect(ErrorCodes.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
    });

    it('should be readonly', () => {
      // TypeScript ensures this, but we can test runtime behavior
      expect(() => {
        (ErrorCodes as any).NEW_CODE = 'new_code';
      }).toThrow();
    });
  });

  describe('createErrorMessage', () => {
    it('should map FILE_NOT_FOUND', () => {
      const error = new AppError(ErrorCodes.FILE_NOT_FOUND, '');
      const message = createErrorMessage(error);
      expect(message).toContain('File not found');
    });

    it('should map INVALID_VIDEO', () => {
      const error = new AppError(ErrorCodes.INVALID_VIDEO, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Invalid video format');
      expect(message).toContain('MP4');
      expect(message).toContain('MOV');
    });

    it('should map FFMPEG_FAILED', () => {
      const error = new AppError(ErrorCodes.FFMPEG_FAILED, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Video processing failed');
    });

    it('should map IMPORT_FAILED', () => {
      const error = new AppError(ErrorCodes.IMPORT_FAILED, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Failed to import');
    });

    it('should map EXPORT_FAILED', () => {
      const error = new AppError(ErrorCodes.EXPORT_FAILED, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Failed to export');
    });

    it('should map PROJECT_CREATE_FAILED', () => {
      const error = new AppError(ErrorCodes.PROJECT_CREATE_FAILED, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Failed to create project');
    });

    it('should map INVALID_PATH', () => {
      const error = new AppError(ErrorCodes.INVALID_PATH, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Invalid file path');
    });

    it('should map TIMEOUT', () => {
      const error = new AppError(ErrorCodes.TIMEOUT, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Operation timed out');
    });

    it('should map INVALID_DURATION', () => {
      const error = new AppError(ErrorCodes.INVALID_DURATION, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Invalid video duration');
    });

    it('should map INVALID_TRIM_RANGE', () => {
      const error = new AppError(ErrorCodes.INVALID_TRIM_RANGE, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Invalid trim range');
    });

    it('should map PERMISSION_DENIED', () => {
      const error = new AppError(ErrorCodes.PERMISSION_DENIED, '');
      const message = createErrorMessage(error);
      expect(message).toContain('Permission denied');
    });

    it('should fallback to error message for unmapped codes', () => {
      const error = new AppError(
        'UNKNOWN_ERROR' as any,
        'Custom error message'
      );
      const message = createErrorMessage(error);
      expect(message).toBe('Custom error message');
    });

    it('should return empty string for empty message fallback', () => {
      const error = new AppError('UNKNOWN_ERROR' as any, '');
      const message = createErrorMessage(error);
      expect(message).toBe('');
    });

    it('should include helpful action guidance in messages', () => {
      const error = new AppError(ErrorCodes.FILE_NOT_FOUND, '');
      const message = createErrorMessage(error);
      expect(message.toLowerCase()).toContain('check');
    });
  });

  describe('isAppError type guard', () => {
    it('should return true for AppError instances', () => {
      const error = new AppError(ErrorCodes.FILE_NOT_FOUND, 'Not found');
      expect(isAppError(error)).toBe(true);
    });

    it('should return false for regular Error instances', () => {
      const error = new Error('Regular error');
      expect(isAppError(error)).toBe(false);
    });

    it('should return false for plain objects', () => {
      const obj = { code: 'ERROR', message: 'Test' };
      expect(isAppError(obj)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isAppError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAppError(undefined)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isAppError('error')).toBe(false);
    });
  });

  describe('toAppError converter', () => {
    it('should return AppError unchanged', () => {
      const original = new AppError(ErrorCodes.TIMEOUT, 'Timed out');
      const result = toAppError(original);
      expect(result).toBe(original);
    });

    it('should convert Error to AppError', () => {
      const error = new Error('Something went wrong');
      const result = toAppError(error, ErrorCodes.IMPORT_FAILED);
      expect(isAppError(result)).toBe(true);
      expect(result.code).toBe(ErrorCodes.IMPORT_FAILED);
      expect(result.message).toBe('Something went wrong');
    });

    it('should use default code for conversion', () => {
      const error = new Error('Test error');
      const result = toAppError(error);
      expect(result.code).toBe('IMPORT_FAILED'); // default
    });

    it('should infer permission error code from message', () => {
      const error = new Error('permission denied');
      const result = toAppError(error);
      expect(result.code).toBe(ErrorCodes.PERMISSION_DENIED);
    });

    it('should infer not found error code from message', () => {
      const error = new Error('file not found');
      const result = toAppError(error);
      expect(result.code).toBe(ErrorCodes.FILE_NOT_FOUND);
    });

    it('should infer timeout error code from message', () => {
      const error = new Error('operation timeout');
      const result = toAppError(error);
      expect(result.code).toBe(ErrorCodes.TIMEOUT);
    });

    it('should convert string errors to AppError', () => {
      const result = toAppError('String error message');
      expect(isAppError(result)).toBe(true);
      expect(result.message).toBe('String error message');
    });

    it('should convert unknown objects to AppError', () => {
      const result = toAppError({ some: 'object' });
      expect(isAppError(result)).toBe(true);
    });

    it('should handle null gracefully', () => {
      const result = toAppError(null);
      expect(isAppError(result)).toBe(true);
      expect(result.message).toBe('null');
    });
  });

  describe('Error recovery', () => {
    it('should support calling recovery action', () => {
      let called = false;
      const recovery = () => {
        called = true;
      };
      const error = new AppError(
        ErrorCodes.TIMEOUT,
        'Timed out',
        {},
        recovery
      );

      error.recoveryAction?.();
      expect(called).toBe(true);
    });

    it('should handle errors without recovery action', () => {
      const error = new AppError(ErrorCodes.INVALID_PATH, 'Bad path');
      expect(() => error.recoveryAction?.()).not.toThrow();
    });

    it('should allow recovery action with context', () => {
      const context = { retryCount: 0 };
      const recovery = function() {
        context.retryCount++;
      };
      const error = new AppError(
        ErrorCodes.TIMEOUT,
        'Timed out',
        {},
        recovery
      );

      error.recoveryAction?.();
      expect(context.retryCount).toBe(1);
    });
  });
});
