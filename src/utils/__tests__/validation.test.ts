/**
 * Validation Utilities Tests
 * Comprehensive test suite for all validation functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateFilePath,
  validateVideoFormat,
  validateDuration,
  validateTrimRange,
  validateFileSize,
  validateVideoImport,
  validateScale,
  validateOpacity,
  SUPPORTED_FORMATS,
  MAX_VIDEO_DURATION_HOURS,
  MAX_FILE_SIZE_MB,
  MIN_CLIP_DURATION_SECONDS,
} from '../validation';
import { AppError, ErrorCodes } from '../errors';

describe('Validation Utilities', () => {
  describe('validateFilePath', () => {
    it('should pass valid file paths', () => {
      expect(() => validateFilePath('/home/user/video.mp4')).not.toThrow();
      expect(() => validateFilePath('C:\\Users\\video.mp4')).not.toThrow();
      expect(() => validateFilePath('/path/to/file.mov')).not.toThrow();
    });

    it('should reject empty paths', () => {
      expect(() => validateFilePath('')).toThrow(AppError);
      expect(() => validateFilePath('  ')).toThrow(AppError);
    });

    it('should reject non-string paths', () => {
      expect(() => validateFilePath(null as any)).toThrow();
      expect(() => validateFilePath(undefined as any)).toThrow();
      expect(() => validateFilePath(123 as any)).toThrow();
    });

    it('should reject paths with null bytes', () => {
      expect(() => validateFilePath('/path/to/file\0.mp4')).toThrow(AppError);
    });

    it('should reject paths that are too long', () => {
      const longPath = '/'.repeat(300);
      expect(() => validateFilePath(longPath)).toThrow(AppError);
    });

    it('should throw AppError with INVALID_PATH code', () => {
      try {
        validateFilePath('');
      } catch (err) {
        expect((err as AppError).code).toBe(ErrorCodes.INVALID_PATH);
      }
    });
  });

  describe('validateVideoFormat', () => {
    it('should accept supported formats', () => {
      SUPPORTED_FORMATS.forEach((fmt) => {
        expect(() => validateVideoFormat(`video.${fmt}`)).not.toThrow();
        expect(() => validateVideoFormat(`VIDEO.${fmt.toUpperCase()}`)).not.toThrow();
      });
    });

    it('should reject unsupported formats', () => {
      expect(() => validateVideoFormat('video.mpeg')).toThrow(AppError);
      expect(() => validateVideoFormat('video.exe')).toThrow(AppError);
      expect(() => validateVideoFormat('video.txt')).toThrow(AppError);
    });

    it('should reject files without extension', () => {
      expect(() => validateVideoFormat('video')).toThrow(AppError);
    });

    it('should reject empty filenames', () => {
      expect(() => validateVideoFormat('')).toThrow(AppError);
      expect(() => validateVideoFormat(null as any)).toThrow();
    });

    it('should throw AppError with INVALID_VIDEO code', () => {
      try {
        validateVideoFormat('video.mpeg');
      } catch (err) {
        expect((err as AppError).code).toBe(ErrorCodes.INVALID_VIDEO);
      }
    });
  });

  describe('validateDuration', () => {
    it('should accept valid durations', () => {
      expect(() => validateDuration(1)).not.toThrow();
      expect(() => validateDuration(30)).not.toThrow();
      expect(() => validateDuration(3600)).not.toThrow();
      expect(() => validateDuration(0.5)).not.toThrow();
    });

    it('should reject zero duration', () => {
      expect(() => validateDuration(0)).toThrow(AppError);
    });

    it('should reject negative durations', () => {
      expect(() => validateDuration(-1)).toThrow(AppError);
      expect(() => validateDuration(-100)).toThrow(AppError);
    });

    it('should reject durations exceeding max (12 hours)', () => {
      const maxSeconds = MAX_VIDEO_DURATION_HOURS * 3600;
      expect(() => validateDuration(maxSeconds + 1)).toThrow(AppError);
      expect(() => validateDuration(maxSeconds * 2)).toThrow(AppError);
    });

    it('should accept duration at max limit', () => {
      const maxSeconds = MAX_VIDEO_DURATION_HOURS * 3600;
      expect(() => validateDuration(maxSeconds)).not.toThrow();
    });

    it('should reject non-finite numbers', () => {
      expect(() => validateDuration(Infinity)).toThrow(AppError);
      expect(() => validateDuration(NaN)).toThrow(AppError);
    });

    it('should reject non-numeric values', () => {
      expect(() => validateDuration('30' as any)).toThrow();
      expect(() => validateDuration(null as any)).toThrow();
    });

    it('should throw AppError with INVALID_DURATION code', () => {
      try {
        validateDuration(-1);
      } catch (err) {
        expect((err as AppError).code).toBe(ErrorCodes.INVALID_DURATION);
      }
    });
  });

  describe('validateTrimRange', () => {
    it('should accept valid ranges', () => {
      expect(() => validateTrimRange(0, 30, 60)).not.toThrow();
      expect(() => validateTrimRange(0, 0.2, 60)).not.toThrow(); // Min duration
      expect(() => validateTrimRange(30, 60, 60)).not.toThrow();
    });

    it('should reject ranges < 0.2s', () => {
      expect(() => validateTrimRange(0, 0.1, 60)).toThrow(AppError);
      expect(() => validateTrimRange(29.9, 30, 60)).toThrow(AppError);
    });

    it('should reject ranges where start >= end', () => {
      expect(() => validateTrimRange(30, 30, 60)).toThrow(AppError);
      expect(() => validateTrimRange(40, 30, 60)).toThrow(AppError);
    });

    it('should reject ranges exceeding total duration', () => {
      expect(() => validateTrimRange(0, 70, 60)).toThrow(AppError);
      expect(() => validateTrimRange(50, 80, 60)).toThrow(AppError);
    });

    it('should reject negative start time', () => {
      expect(() => validateTrimRange(-1, 30, 60)).toThrow(AppError);
    });

    it('should reject non-numeric values', () => {
      expect(() => validateTrimRange('0' as any, 30, 60)).toThrow(AppError);
      expect(() => validateTrimRange(0, '30' as any, 60)).toThrow(AppError);
      expect(() => validateTrimRange(0, 30, '60' as any)).toThrow(AppError);
    });

    it('should throw AppError with INVALID_TRIM_RANGE code', () => {
      try {
        validateTrimRange(0, 0.1, 60);
      } catch (err) {
        expect((err as AppError).code).toBe(ErrorCodes.INVALID_TRIM_RANGE);
      }
    });
  });

  describe('validateFileSize', () => {
    it('should accept valid file sizes', () => {
      expect(() => validateFileSize(1000000)).not.toThrow(); // 1MB
      expect(() => validateFileSize(MAX_FILE_SIZE_MB * 1024 * 1024 - 1000)).not.toThrow();
    });

    it('should reject files exceeding max size', () => {
      const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
      expect(() => validateFileSize(maxBytes + 1)).toThrow(AppError);
      expect(() => validateFileSize(maxBytes * 2)).toThrow(AppError);
    });

    it('should accept files at max limit', () => {
      const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
      expect(() => validateFileSize(maxBytes)).not.toThrow();
    });

    it('should reject negative sizes', () => {
      expect(() => validateFileSize(-1000)).toThrow(AppError);
    });

    it('should reject non-numeric values', () => {
      expect(() => validateFileSize('1000' as any)).toThrow();
      expect(() => validateFileSize(null as any)).toThrow();
    });
  });

  describe('validateVideoImport', () => {
    it('should accept valid video imports', () => {
      expect(() => 
        validateVideoImport('/path/to/video.mp4', 'video.mp4', 1000000)
      ).not.toThrow();
    });

    it('should reject invalid paths', () => {
      expect(() => 
        validateVideoImport('', 'video.mp4', 1000000)
      ).toThrow(AppError);
    });

    it('should reject invalid formats', () => {
      expect(() => 
        validateVideoImport('/path/to/video.exe', 'video.exe', 1000000)
      ).toThrow(AppError);
    });

    it('should reject oversized files', () => {
      const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
      expect(() => 
        validateVideoImport('/path/to/video.mp4', 'video.mp4', maxBytes + 1)
      ).toThrow(AppError);
    });

    it('should work without file size', () => {
      expect(() => 
        validateVideoImport('/path/to/video.mp4', 'video.mp4')
      ).not.toThrow();
    });
  });

  describe('validateScale', () => {
    it('should accept valid scales (0.1 - 10)', () => {
      expect(() => validateScale(0.1)).not.toThrow();
      expect(() => validateScale(1.0)).not.toThrow();
      expect(() => validateScale(5.0)).not.toThrow();
      expect(() => validateScale(10)).not.toThrow();
    });

    it('should reject scales < 0.1', () => {
      expect(() => validateScale(0.09)).toThrow(AppError);
      expect(() => validateScale(0.001)).toThrow(AppError);
    });

    it('should reject scales > 10', () => {
      expect(() => validateScale(10.01)).toThrow(AppError);
      expect(() => validateScale(100)).toThrow(AppError);
    });

    it('should reject non-finite numbers', () => {
      expect(() => validateScale(Infinity)).toThrow(AppError);
      expect(() => validateScale(NaN)).toThrow(AppError);
    });

    it('should reject non-numeric values', () => {
      expect(() => validateScale('1.0' as any)).toThrow();
    });
  });

  describe('validateOpacity', () => {
    it('should accept valid opacity (0-1)', () => {
      expect(() => validateOpacity(0)).not.toThrow();
      expect(() => validateOpacity(0.5)).not.toThrow();
      expect(() => validateOpacity(1)).not.toThrow();
    });

    it('should reject opacity < 0', () => {
      expect(() => validateOpacity(-0.1)).toThrow(AppError);
      expect(() => validateOpacity(-1)).toThrow(AppError);
    });

    it('should reject opacity > 1', () => {
      expect(() => validateOpacity(1.01)).toThrow(AppError);
      expect(() => validateOpacity(2)).toThrow(AppError);
    });

    it('should reject non-finite numbers', () => {
      expect(() => validateOpacity(Infinity)).toThrow(AppError);
      expect(() => validateOpacity(NaN)).toThrow(AppError);
    });

    it('should reject non-numeric values', () => {
      expect(() => validateOpacity('0.5' as any)).toThrow();
    });
  });
});
