import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri API
global.window = global.window || {};
global.window.__TAURI__ = {
  core: {
    convertFileSrc: vi.fn((path) => `file://${path}`)
  }
};

// Mock HTMLMediaElement methods
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
});

// Mock HTMLMediaElement properties
Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
  writable: true,
  value: 0,
});

Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
  writable: true,
  value: 100,
});

Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
  writable: true,
  value: true,
});

Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
  writable: true,
  value: 1,
});

Object.defineProperty(HTMLMediaElement.prototype, 'buffered', {
  writable: true,
  value: {
    length: 1,
    end: vi.fn(() => 50)
  },
});

Object.defineProperty(HTMLMediaElement.prototype, 'videoWidth', {
  writable: true,
  value: 1920,
});

Object.defineProperty(HTMLMediaElement.prototype, 'videoHeight', {
  writable: true,
  value: 1080,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock performance.now for timing tests
global.performance = global.performance || {};
global.performance.now = vi.fn(() => Date.now());