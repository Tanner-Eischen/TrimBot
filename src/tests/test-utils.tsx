/**
 * Test Utilities
 * Custom render function and testing helpers for React components
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ProjectProvider } from '../contexts/ProjectContext';
import { ThemeProvider } from '../contexts/ThemeContext';

/**
 * Custom render function that includes all required providers
 * Use this instead of RTL's render() for components that need context
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ProjectProvider>
      {children}
    </ProjectProvider>
  </ThemeProvider>
);

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

/**
 * Utility to wait for async operations
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Create mock file for testing
 */
export function createMockFile(
  name: string = 'test.mp4',
  size: number = 1024000,
  type: string = 'video/mp4',
): File {
  const blob = new Blob(['a'.repeat(size)], { type });
  return new File([blob], name, { type });
}

/**
 * Mock AppError for testing
 */
export function createMockAppError(
  code: string = 'TEST_ERROR',
  message: string = 'Test error message',
) {
  return {
    code,
    message,
    name: 'AppError',
    details: {},
    recoveryAction: undefined,
  };
}

/**
 * Utility to create mock timeline items
 */
export function createMockTimelineItem(overrides = {}) {
  return {
    id: 'test-item-1',
    name: 'Test Clip',
    durationSec: 30,
    startTime: 0,
    xPx: 0,
    wPx: 300,
    type: 'video' as const,
    path: '/path/to/video.mp4',
    selected: false,
    filename: 'test.mp4',
    ...overrides,
  };
}

/**
 * Utility to create mock project state
 */
export function createMockProjectState(overrides = {}) {
  return {
    projectDir: '/mock/project',
    mediaDir: '/mock/project/media',
    exportDir: '/mock/project/exports',
    library: {},
    timeline: [],
    pxPerSec: 50,
    zoomLevel: 1.0,
    overlayTrack: [],
    trackSettings: {
      showOverlayTrack: true,
      overlayTrackHeight: 60,
      trackSpacing: 8,
    },
    ...overrides,
  };
}
