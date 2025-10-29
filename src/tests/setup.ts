/**
 * Vitest Setup File
 * Configure test environment, mocks, and global utilities
 */

import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Tauri API globally for testing
beforeEach(() => {
  Object.defineProperty(window, '__TAURI__', {
    value: {
      core: {
        invoke: vi.fn(async (command: string) => {
          // Mock implementations for common Tauri commands
          switch (command) {
            case 'open_dir_dialog':
              return '/mock/project';
            case 'create_project_dirs':
              return true;
            case 'ensure_dir':
              return true;
            case 'copy_file_to_media':
              return '/mock/media/file.mp4';
            case 'get_file_info':
              return { size: 1024000, modified: Date.now() };
            case 'trim_clip':
              return 0;
            default:
              return null;
          }
        }),
      },
    },
    writable: true,
    configurable: true,
  });
});

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Suppress console errors during tests (optional - remove if needed for debugging)
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn((message: string) => {
    // Only suppress specific React/testing errors
    if (
      message.includes('Not implemented: HTMLFormElement.prototype.submit') ||
      message.includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError(message);
  });
});

afterEach(() => {
  console.error = originalError;
});
