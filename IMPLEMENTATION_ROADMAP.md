# TrimBot Implementation Roadmap

**Version:** 1.0  
**Last Updated:** Q4 2025  
**Target Release:** v1.0.0 (Production Ready)

---

## 🚀 Roadmap Overview

This roadmap breaks down improvements into **46 granular Pull Requests** organized across **5 phases**:

- **Phase 1 (CRITICAL):** Bug fixes & stability (Weeks 1-2)
- **Phase 2 (HIGH):** Testing & error handling (Weeks 3-4)
- **Phase 3 (MEDIUM):** Features & accessibility (Weeks 5-8)
- **Phase 4 (ENHANCEMENT):** Performance & polish (Weeks 9-12)
- **Phase 5 (FUTURE):** Advanced features (Weeks 13+)

Each PR includes:
- ✅ Specific files to modify
- ✅ Concrete tasks
- ✅ Dependencies (if any)
- ✅ Testing requirements
- ✅ Estimated effort (T-shirt size)

---

# 🔴 PHASE 1: CRITICAL BUG FIXES & STABILITY (Weeks 1-2)

## PR-001: Fix Performance Monitor Syntax Errors
**Priority:** 🔴 CRITICAL  
**Effort:** XS (0.5 days)  
**Dependencies:** None

### Description
Fix incomplete arrow function syntax in `usePerformanceMonitor.ts`

### Changes
**File:** `src/hooks/usePerformanceMonitor.ts`
- Line 76: Complete arrow function for `getMemoryUsage`
- Line 146: Complete `logRender` function body

### Acceptance Criteria
- [ ] Hook compiles without errors
- [ ] `getMemoryUsage()` returns proper object or null
- [ ] `logRender()` logs to console in development
- [ ] No TypeScript errors in strict mode

### Testing
```bash
npm run check  # Verify TypeScript compilation
```

---

## PR-002: Fix ProjectContext Incomplete Code Blocks
**Priority:** 🔴 CRITICAL  
**Effort:** XS (0.5 days)  
**Dependencies:** None

### Description
Complete incomplete reducer cases and function implementations in ProjectContext

### Changes
**File:** `src/contexts/ProjectContext.tsx`
- Line 317: Complete context value export
- Line 465: Complete `importFiles` callback
- Line 727-729: Complete `toggleOverlayTrack` function

### Code Example
```typescript
// Before (incomplete)
const updateTrackSettings = useCallback((settings: Partial<TrackSettings>) => {
    dispatch({ type: 'UPDATE_TRACK_SETTINGS', payload: settings });
  }, []);

// After (complete)
const toggleOverlayTrack = useCallback((enabled: boolean) => {
  dispatch({ type: 'TOGGLE_OVERLAY_TRACK', payload: enabled });
}, []);
```

### Acceptance Criteria
- [ ] All reducer cases are complete
- [ ] Context hook exports properly
- [ ] No TS errors in AppContent
- [ ] All callbacks properly memoized

### Testing
```bash
npm run check
npm run dev  # Verify no console errors
```

---

## PR-003: Remove Duplicate Hook Files
**Priority:** 🔴 CRITICAL  
**Effort:** XS (0.5 days)  
**Dependencies:** None

### Description
Remove `useTimeline.js` and consolidate to TypeScript version. Update all imports.

### Changes
**File:** `src/hooks/useTimeline.js` - DELETE
**File:** `src/App.tsx` - Update import
```typescript
// Before
import { useTimeline } from './hooks/useTimeline.js';

// After
import { useTimeline } from './hooks/useTimeline';
```

### Files to Update
- `src/App.tsx`
- Any other files importing useTimeline

### Acceptance Criteria
- [ ] `useTimeline.js` deleted
- [ ] All imports point to `.ts` version
- [ ] No TypeScript errors
- [ ] Timeline functionality works in dev mode

---

## PR-004: Unified Error Handling Framework
**Priority:** 🔴 CRITICAL  
**Effort:** S (1 day)  
**Dependencies:** None

### Description
Create standardized error handling with custom AppError class and error utilities

### New Files
**File:** `src/utils/errors.ts`
```typescript
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
} as const;

export function createErrorMessage(error: AppError): string {
  switch (error.code) {
    case ErrorCodes.FILE_NOT_FOUND:
      return `File not found. Check the file path and try again.`;
    case ErrorCodes.INVALID_VIDEO:
      return `Invalid video format. Supported: MP4, MOV, AVI, MKV, WebM`;
    case ErrorCodes.FFMPEG_FAILED:
      return `Video processing failed. Try a smaller file or check your system resources.`;
    default:
      return error.message;
  }
}
```

### Changes
**File:** `src/contexts/ProjectContext.tsx`
- Replace generic error strings with AppError instances
- Add error recovery callbacks

**File:** `src/utils/toastMessages.ts`
- Update to use AppError for better messages

### Acceptance Criteria
- [ ] AppError class works with try/catch
- [ ] Error messages are user-friendly
- [ ] Recovery actions callable from UI
- [ ] Rust backend errors mapped to error codes

---

## PR-005: Add Input Validation Utilities
**Priority:** 🔴 CRITICAL  
**Effort:** S (1 day)  
**Dependencies:** PR-004

### Description
Create validation utilities for file paths, video formats, and numeric inputs

### New Files
**File:** `src/utils/validation.ts`
```typescript
export const SUPPORTED_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
export const MAX_VIDEO_DURATION_HOURS = 12;
export const MAX_FILE_SIZE_MB = 10000;

export function validateFilePath(path: string): void {
  if (!path || typeof path !== 'string') {
    throw new AppError(ErrorCodes.INVALID_PATH, 'Invalid file path');
  }
  // Additional path checks
}

export function validateVideoFormat(filename: string): void {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext || !SUPPORTED_FORMATS.includes(ext)) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      `Format .${ext} not supported`
    );
  }
}

export function validateDuration(seconds: number): void {
  if (seconds <= 0 || seconds > MAX_VIDEO_DURATION_HOURS * 3600) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      `Duration must be between 0 and ${MAX_VIDEO_DURATION_HOURS} hours`
    );
  }
}

export function validateTrimRange(
  startSec: number, 
  endSec: number, 
  totalDuration: number
): void {
  if (startSec < 0 || endSec > totalDuration) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      'Trim range exceeds video duration'
    );
  }
  if (endSec - startSec < 0.2) {
    throw new AppError(
      ErrorCodes.INVALID_VIDEO,
      'Trimmed segment must be at least 0.2 seconds'
    );
  }
}
```

### Changes
**File:** `src/contexts/ProjectContext.tsx`
- Use validation in importFiles, trimClip, etc.

**File:** `src-tauri/src/ffmpeg.rs`
- Add Rust-side validation for split_clip, trim_clip

### Acceptance Criteria
- [ ] All public functions have validation
- [ ] Validation happens before Tauri calls
- [ ] Clear error messages on validation failure
- [ ] Edge cases covered (0-length clips, huge files)

---

## PR-006: Add FFmpeg Timeout & Cancellation Support
**Priority:** 🔴 CRITICAL  
**Effort:** M (2 days)  
**Dependencies:** PR-004, PR-005

### Description
Implement timeout handling for FFmpeg operations and request cancellation

### Changes
**File:** `src-tauri/src/ffmpeg.rs`
```rust
const FFMPEG_TIMEOUT_SECS: u64 = 5 * 60; // 5 minutes

pub async fn run_ffmpeg_with_timeout(
    args: Vec<String>,
    timeout_secs: Option<u64>
) -> Result<i32, String> {
    let timeout = timeout_secs.unwrap_or(FFMPEG_TIMEOUT_SECS);
    let ffmpeg_path = get_ffmpeg_path()?;
    
    match tokio::time::timeout(
        std::time::Duration::from_secs(timeout),
        tokio::process::Command::new(&ffmpeg_path)
            .args(&args)
            .output()
    ).await {
        Ok(Ok(output)) => {
            if output.status.success() {
                Ok(output.status.code().unwrap_or(0))
            } else {
                Err(format!("FFmpeg failed: {}", 
                    String::from_utf8_lossy(&output.stderr)))
            }
        }
        Ok(Err(e)) => Err(format!("Failed to execute: {}", e)),
        Err(_) => Err(format!(
            "FFmpeg operation timed out after {} seconds", 
            timeout
        )),
    }
}
```

**File:** `src/contexts/ProjectContext.tsx`
- Add abort signal support
- Implement operation cancellation UI

### New Component
**File:** `src/components/OperationProgress.tsx`
- Show progress for long operations
- Provide cancel button

### Acceptance Criteria
- [ ] Operations timeout after 5 minutes
- [ ] User can cancel long operations
- [ ] Progress shown during processing
- [ ] Proper cleanup on cancel/timeout

---

# 🟠 PHASE 2: TESTING & ERROR HANDLING (Weeks 3-4)

## PR-007: Unit Test Infrastructure Setup
**Priority:** 🟠 HIGH  
**Effort:** S (1 day)  
**Dependencies:** None

### Description
Configure Vitest, add test utilities, and set up coverage reporting

### Changes
**File:** `vitest.config.js`
```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/'],
      lines: 80,
      functions: 80,
      branches: 75,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

**New File:** `src/tests/setup.ts`
```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

**New File:** `src/tests/test-utils.tsx`
```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ProjectProvider } from '../contexts/ProjectContext';
import { ThemeProvider } from '../contexts/ThemeContext';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ProjectProvider>
      {children}
    </ProjectProvider>
  </ThemeProvider>
);

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

**File:** `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Acceptance Criteria
- [ ] `npm test` launches Vitest in watch mode
- [ ] `npm run test:run` executes all tests
- [ ] Coverage report generates
- [ ] Setup files load without errors

---

## PR-008: Unit Tests for Validation Utilities
**Priority:** 🟠 HIGH  
**Effort:** M (1.5 days)  
**Dependencies:** PR-005, PR-007

### Description
Write comprehensive tests for validation functions

### New File
**File:** `src/utils/__tests__/validation.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import {
  validateFilePath,
  validateVideoFormat,
  validateDuration,
  validateTrimRange,
  SUPPORTED_FORMATS,
} from '../validation';
import { AppError, ErrorCodes } from '../errors';

describe('Validation Utilities', () => {
  describe('validateFilePath', () => {
    it('should pass valid file paths', () => {
      expect(() => validateFilePath('/home/user/video.mp4')).not.toThrow();
      expect(() => validateFilePath('C:\\Users\\video.mp4')).not.toThrow();
    });

    it('should reject empty paths', () => {
      expect(() => validateFilePath('')).toThrow(AppError);
    });

    it('should reject non-string paths', () => {
      expect(() => validateFilePath(null as any)).toThrow();
    });
  });

  describe('validateVideoFormat', () => {
    it('should accept supported formats', () => {
      SUPPORTED_FORMATS.forEach(fmt => {
        expect(() => validateVideoFormat(`video.${fmt}`)).not.toThrow();
      });
    });

    it('should reject unsupported formats', () => {
      expect(() => validateVideoFormat('video.mpeg')).toThrow(AppError);
    });
  });

  describe('validateDuration', () => {
    it('should accept valid durations', () => {
      expect(() => validateDuration(30)).not.toThrow();
      expect(() => validateDuration(3600)).not.toThrow();
    });

    it('should reject zero/negative', () => {
      expect(() => validateDuration(0)).toThrow();
      expect(() => validateDuration(-10)).toThrow();
    });

    it('should reject durations > 12 hours', () => {
      expect(() => validateDuration(12 * 3600 + 1)).toThrow();
    });
  });

  describe('validateTrimRange', () => {
    it('should accept valid ranges', () => {
      expect(() => validateTrimRange(0, 30, 60)).not.toThrow();
    });

    it('should reject ranges < 0.2s', () => {
      expect(() => validateTrimRange(0, 0.1, 60)).toThrow();
    });

    it('should reject out-of-bounds ranges', () => {
      expect(() => validateTrimRange(0, 70, 60)).toThrow();
    });
  });
});
```

### Acceptance Criteria
- [ ] All validation functions have tests
- [ ] Edge cases covered
- [ ] 100% coverage for validation module
- [ ] All tests pass

---

## PR-009: Unit Tests for Error Utilities
**Priority:** 🟠 HIGH  
**Effort:** S (1 day)  
**Dependencies:** PR-004, PR-007

### Description
Test error handling and error message generation

### New File
**File:** `src/utils/__tests__/errors.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { AppError, ErrorCodes, createErrorMessage } from '../errors';

describe('Error Handling', () => {
  describe('AppError class', () => {
    it('should create error with code and message', () => {
      const err = new AppError(
        ErrorCodes.FILE_NOT_FOUND,
        'File missing'
      );
      expect(err.code).toBe(ErrorCodes.FILE_NOT_FOUND);
      expect(err.message).toBe('File missing');
    });

    it('should include details', () => {
      const err = new AppError(
        ErrorCodes.FFMPEG_FAILED,
        'Processing failed',
        { command: 'encode', file: 'video.mp4' }
      );
      expect(err.details?.file).toBe('video.mp4');
    });

    it('should include recovery action', () => {
      const recovery = () => console.log('Retrying...');
      const err = new AppError(
        ErrorCodes.TIMEOUT,
        'Timed out',
        {},
        recovery
      );
      expect(err.recoveryAction).toBe(recovery);
    });
  });

  describe('createErrorMessage', () => {
    it('should map error codes to messages', () => {
      const err = new AppError(ErrorCodes.FILE_NOT_FOUND, '');
      const msg = createErrorMessage(err);
      expect(msg).toContain('File not found');
    });

    it('should fallback to error message', () => {
      const err = new AppError(
        'UNKNOWN_ERROR' as any,
        'Custom error message'
      );
      const msg = createErrorMessage(err);
      expect(msg).toBe('Custom error message');
    });
  });
});
```

### Acceptance Criteria
- [ ] Error creation works properly
- [ ] Error messages are user-friendly
- [ ] Recovery actions are callable
- [ ] All error codes mapped correctly

---

## PR-010: Unit Tests for useTimeline Hook
**Priority:** 🟠 HIGH  
**Effort:** L (2 days)  
**Dependencies:** PR-007, PR-001, PR-002

### Description
Test timeline manipulation (split, merge, move items)

### New File
**File:** `src/hooks/__tests__/useTimeline.test.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeline } from '../useTimeline';

const mockTimelineData = [
  {
    id: '1',
    name: 'Clip 1',
    durationSec: 30,
    startTime: 0,
    xPx: 0,
    wPx: 300,
    type: 'video' as const,
    path: '/path/to/clip1.mp4',
    selected: false,
    filename: 'clip1.mp4',
  },
  {
    id: '2',
    name: 'Clip 2',
    durationSec: 45,
    startTime: 30,
    xPx: 300,
    wPx: 450,
    type: 'video' as const,
    path: '/path/to/clip2.mp4',
    selected: false,
    filename: 'clip2.mp4',
  },
];

describe('useTimeline', () => {
  it('should initialize with timeline items', () => {
    const { result } = renderHook(() => useTimeline({
      timelineData: mockTimelineData,
      pxPerSec: 10,
    }));

    expect(result.current.timelineItems).toHaveLength(2);
  });

  it('should move items', () => {
    const { result } = renderHook(() => useTimeline({
      timelineData: mockTimelineData,
      pxPerSec: 10,
    }));

    act(() => {
      result.current.handleItemMove('1', 50);
    });

    expect(result.current.timelineItems[0].startTime).toBe(5); // 50px / 10px per sec
  });

  it('should resize items', () => {
    const { result } = renderHook(() => useTimeline({
      timelineData: mockTimelineData,
      pxPerSec: 10,
    }));

    act(() => {
      result.current.handleItemResize('1', 150, 'right');
    });

    const resizedItem = result.current.timelineItems[0];
    expect(resizedItem.durationSec).toBeCloseTo(15, 1); // (300 + 150) / 10
  });

  it('should split items at playhead', async () => {
    const { result } = renderHook(() => useTimeline({
      timelineData: mockTimelineData,
      pxPerSec: 10,
    }));

    act(() => {
      result.current.setCurrentTime(15);
    });

    await act(async () => {
      await result.current.handleSplitAtPlayhead('1');
    });

    expect(result.current.timelineItems).toHaveLength(3);
  });

  it('should delete items and compact timeline', () => {
    const { result } = renderHook(() => useTimeline({
      timelineData: mockTimelineData,
      pxPerSec: 10,
    }));

    act(() => {
      result.current.handleRippleDelete('1');
    });

    expect(result.current.timelineItems).toHaveLength(1);
    expect(result.current.timelineItems[0].startTime).toBe(0);
  });
});
```

### Acceptance Criteria
- [ ] Timeline item creation works
- [ ] Move/resize operations correct
- [ ] Split creates proper segments
- [ ] Delete compacts timeline
- [ ] Current time tracking works

---

## PR-011: Integration Tests for Project Workflow
**Priority:** 🟠 HIGH  
**Effort:** L (2 days)  
**Dependencies:** PR-007, PR-008

### Description
Test complete project creation and file import workflow

### New File
**File:** `src/contexts/__tests__/ProjectContext.integration.test.ts`
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProject } from '../ProjectContext';

// Mock Tauri API
vi.stubGlobal('__TAURI__', {
  core: {
    invoke: vi.fn((cmd) => {
      switch (cmd) {
        case 'open_dir_dialog':
          return '/mock/project';
        case 'create_project_dirs':
          return true;
        case 'ensure_dir':
          return true;
        default:
          return null;
      }
    }),
  },
});

describe('ProjectContext Integration', () => {
  it('should create a project', async () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: ProjectProvider,
    });

    await act(async () => {
      await result.current.createProject();
    });

    expect(result.current.project?.projectDir).toBe('/mock/project');
    expect(result.current.project?.library).toBeDefined();
    expect(result.current.project?.timeline).toHaveLength(0);
  });

  it('should import files', async () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: ProjectProvider,
    });

    await act(async () => {
      await result.current.createProject();
      await result.current.importFiles(['/path/to/video.mp4']);
    });

    expect(Object.keys(result.current.project?.library || {})).toHaveLength(1);
  });

  it('should add clips to timeline', async () => {
    const { result } = renderHook(() => useProject(), {
      wrapper: ProjectProvider,
    });

    const clip = {
      id: 'test',
      name: 'test.mp4',
      durationSec: 30,
      startTime: 0,
      xPx: 0,
      wPx: 300,
      type: 'video' as const,
      path: '/path/video.mp4',
      selected: false,
      filename: 'test.mp4',
    };

    act(() => {
      result.current.addToTimeline(clip);
    });

    expect(result.current.project?.timeline).toHaveLength(1);
  });
});
```

### Acceptance Criteria
- [ ] Project creation flow tested
- [ ] File import tested
- [ ] Timeline operations tested
- [ ] All workflows integrated correctly

---

## PR-012: Playwright E2E Tests for Core UI
**Priority:** 🟠 HIGH  
**Effort:** L (2 days)  
**Dependencies:** None

### Description
Create proper end-to-end tests replacing placeholder tests

### File: `tests/trimbot.spec.js`
```javascript
import { test, expect } from '@playwright/test';

test.describe('TrimBot Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
  });

  test('should display project setup screen on first load', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create New Project")');
    await expect(createButton).toBeVisible();
  });

  test('should handle project creation', async ({ page }) => {
    // Mock file dialog
    await page.evaluate(() => {
      window.__TAURI__.core.invoke = async (cmd) => {
        if (cmd === 'open_dir_dialog') return '/test/project';
        if (cmd === 'create_project_dirs') return true;
        if (cmd === 'ensure_dir') return true;
        return null;
      };
    });

    const createButton = page.locator('button:has-text("Create New Project")');
    await createButton.click();

    // Wait for project to load
    await page.waitForSelector('.media-import-section', { timeout: 5000 });
    
    const mediaImport = page.locator('.media-import-section');
    await expect(mediaImport).toBeVisible();
  });

  test('should display timeline after project creation', async ({ page }) => {
    // Setup project
    await page.evaluate(() => {
      window.__TAURI__.core.invoke = async (cmd) => {
        if (cmd === 'open_dir_dialog') return '/test/project';
        return true;
      };
    });

    await page.locator('button:has-text("Create New Project")').click();
    await page.waitForSelector('.timeline-section');

    const timeline = page.locator('.timeline-section');
    await expect(timeline).toBeVisible();
  });

  test('should toggle between timeline and recording views', async ({ page }) => {
    await page.evaluate(() => {
      window.__TAURI__.core.invoke = async (cmd) => {
        if (cmd === 'open_dir_dialog') return '/test/project';
        return true;
      };
    });

    await page.locator('button:has-text("Create New Project")').click();
    await page.waitForSelector('button:has-text("Recording")');

    const recordingButton = page.locator('button:has-text("Recording")');
    await recordingButton.click();

    const recordingSection = page.locator('.recording-section');
    await expect(recordingSection).toBeVisible();
  });

  test('should display theme toggle', async ({ page }) => {
    const themeToggle = page.locator('[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible();
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    
    expect(errors).toHaveLength(0);
  });
});
```

### Acceptance Criteria
- [ ] All tests pass with real browser
- [ ] Project creation tested
- [ ] UI navigation tested
- [ ] No console errors
- [ ] Screenshots captured on failure

---

# 🟡 PHASE 3: FEATURES & ACCESSIBILITY (Weeks 5-8)

## PR-013: Add Accessibility to Button Components
**Priority:** 🟡 MEDIUM  
**Effort:** S (1 day)  
**Dependencies:** None

### Description
Add ARIA labels, keyboard focus styles, and semantic HTML to all buttons

### Changes
**File:** `src/components/ui/Button.tsx`
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  ariaLabel?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  ariaLabel,
  children,
  ...props
}) => {
  return (
    <button
      className={`btn btn--${variant} btn--${size}`}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      <span className="btn-label">{children}</span>
    </button>
  );
};
```

**File:** `src/components/ui/Button.css`
```css
/* Add focus styles */
.btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
```

### Updates in Components
- Update all `<button>` elements to have `aria-label` or descriptive text
- Add to: Timeline buttons, Media Library buttons, Export button, etc.

### Acceptance Criteria
- [ ] All buttons have aria-label or visible text
- [ ] Focus ring visible when using keyboard
- [ ] Tab navigation works
- [ ] Screen reader announces button purpose

---

## PR-014: Add Keyboard Navigation to Timeline
**Priority:** 🟡 MEDIUM  
**Effort:** M (1.5 days)  
**Dependencies:** None

### Description
Implement full keyboard navigation for timeline clips

### Changes
**File:** `src/components/timeline/TimelineClip.tsx`
```typescript
const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  const shift = e.shiftKey;
  const ctrl = e.ctrlKey || e.metaKey;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      // Move left with fine/coarse adjustment
      onDragStart?.(shift ? -100 : -10);
      break;
    case 'ArrowRight':
      e.preventDefault();
      onDragStart?.(shift ? 100 : 10);
      break;
    case 'Delete':
    case 'Backspace':
      e.preventDefault();
      // Handle delete
      break;
    case 'Enter':
      e.preventDefault();
      // Open properties panel
      break;
    case 'd':
      if (ctrl) {
        e.preventDefault();
        // Duplicate clip
      }
      break;
  }
}, [onDragStart]);
```

### Acceptance Criteria
- [ ] Arrow keys move selected clip
- [ ] Shift+arrow moves by larger amount
- [ ] Delete removes clip
- [ ] Enter opens properties
- [ ] Ctrl+D duplicates clip
- [ ] Focus visible on timeline clips

---

## PR-015: Add ARIA Labels to Timeline
**Priority:** 🟡 MEDIUM  
**Effort:** S (1 day)  
**Dependencies:** PR-014

### Description
Add semantic roles and ARIA attributes to timeline components

### Changes
**File:** `src/components/timeline/TimelineTrack.tsx`
```typescript
<div
  role="region"
  aria-label={`${trackType} track - contains ${items.length} clips`}
  className="timeline-track"
>
  <div
    role="list"
    className="timeline-clips"
  >
    {items.map((item) => (
      <div
        key={item.id}
        role="listitem"
        aria-label={`${item.name} - ${formatDuration(item.durationSec)}`}
        data-testid={`clip-${item.id}`}
      >
        {/* Clip content */}
      </div>
    ))}
  </div>
</div>
```

### Acceptance Criteria
- [ ] Timeline has proper ARIA roles
- [ ] Clips labeled with name and duration
- [ ] Screen reader can navigate
- [ ] Semantic HTML used throughout

---

## PR-016: Accessibility Color & Contrast Improvements
**Priority:** 🟡 MEDIUM  
**Effort:** S (1 day)  
**Dependencies:** None

### Description
Ensure WCAG AA compliance for color contrast

### Changes
**File:** `src/App.css` and component CSS files
```css
/* Improve contrast ratios */
.control-button {
  background-color: #2563eb; /* Increased from lighter blue */
  color: #ffffff;
  border: 1px solid #1e40af;
}

.control-button:hover {
  background-color: #1d4ed8;
}

.control-button:focus-visible {
  outline: 3px solid #1e3a8a;
}

/* Links must be distinguishable */
a {
  color: #1e40af;
  text-decoration: underline;
}

/* Text contrast */
.text-secondary {
  color: #4b5563; /* Up from #666 */
}
```

### Testing
- Use WAVE or Axe DevTools to verify WCAG AA compliance
- Test with color blindness simulator

### Acceptance Criteria
- [ ] All text meets WCAG AA contrast (4.5:1)
- [ ] Interactive elements meet 3:1 contrast
- [ ] Focus indicators visible
- [ ] No info conveyed by color alone

---

## PR-017: Undo/Redo System Implementation
**Priority:** 🟡 MEDIUM  
**Effort:** L (3 days)  
**Dependencies:** PR-002

### Description
Implement undo/redo stack for all timeline operations

### New Files
**File:** `src/utils/history.ts`
```typescript
export interface HistoryState {
  past: any[];
  present: any;
  future: any[];
}

export class HistoryManager<T> {
  private past: T[] = [];
  private present: T;
  private future: T[] = [];
  private maxSize = 50;

  constructor(initialState: T) {
    this.present = initialState;
  }

  push(state: T): void {
    this.past.push(JSON.parse(JSON.stringify(this.present)));
    this.present = JSON.parse(JSON.stringify(state));
    this.future = [];

    if (this.past.length > this.maxSize) {
      this.past.shift();
    }
  }

  undo(): T | null {
    if (this.past.length === 0) return null;

    this.future.push(JSON.parse(JSON.stringify(this.present)));
    this.present = this.past.pop()!;
    return this.present;
  }

  redo(): T | null {
    if (this.future.length === 0) return null;

    this.past.push(JSON.parse(JSON.stringify(this.present)));
    this.present = this.future.pop()!;
    return this.present;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  getState(): T {
    return this.present;
  }
}
```

**File:** `src/hooks/useHistory.ts`
```typescript
export function useHistory<T>(initialState: T) {
  const managerRef = useRef(new HistoryManager(initialState));
  const [state, setState] = useState(initialState);

  const updateState = useCallback((newState: T) => {
    managerRef.current.push(newState);
    setState(newState);
  }, []);

  const undo = useCallback(() => {
    const previousState = managerRef.current.undo();
    if (previousState) {
      setState(previousState);
    }
  }, []);

  const redo = useCallback(() => {
    const nextState = managerRef.current.redo();
    if (nextState) {
      setState(nextState);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state,
    updateState,
    undo,
    redo,
    canUndo: managerRef.current.canUndo(),
    canRedo: managerRef.current.canRedo(),
  };
}
```

### Changes
**File:** `src/contexts/ProjectContext.tsx`
- Integrate HistoryManager for timeline state
- Add undo/redo actions

**File:** `src/App.tsx`
- Add Undo/Redo buttons to toolbar
- Keyboard shortcuts Ctrl+Z / Ctrl+Shift+Z

### Acceptance Criteria
- [ ] All timeline operations can be undone
- [ ] Redo works after undo
- [ ] History limited to 50 actions
- [ ] Keyboard shortcuts work
- [ ] UI buttons show enabled/disabled state

---

## PR-018: Project Persistence (Save/Load)
**Priority:** 🟡 MEDIUM  
**Effort:** L (3 days)  
**Dependencies:** PR-002

### Description
Save project state to JSON and restore on reload

### New Files
**File:** `src-tauri/src/project.rs`
```rust
use serde::{Deserialize, Serialize};
use std::path::Path;
use tokio::fs;

#[derive(Serialize, Deserialize)]
pub struct ProjectData {
    pub name: String,
    pub directory: String,
    pub media: Vec<MediaFile>,
    pub timeline: Vec<TimelineClip>,
    pub settings: ProjectSettings,
}

#[tauri::command]
pub async fn save_project(
    project_dir: String,
    project_data: ProjectData,
) -> Result<(), String> {
    let project_file = Path::new(&project_dir).join("project.json");
    
    let json = serde_json::to_string_pretty(&project_data)
        .map_err(|e| format!("Serialization failed: {}", e))?;
    
    fs::write(&project_file, json)
        .await
        .map_err(|e| format!("Failed to save project: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn load_project(project_dir: String) -> Result<ProjectData, String> {
    let project_file = Path::new(&project_dir).join("project.json");
    
    let content = fs::read_to_string(&project_file)
        .await
        .map_err(|e| format!("Failed to read project: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Invalid project file: {}", e))
}

#[tauri::command]
pub async fn get_recent_projects() -> Result<Vec<ProjectData>, String> {
    // Implementation for recent projects list
    Ok(vec![])
}
```

**File:** `src/hooks/useProjectPersistence.ts`
```typescript
export function useProjectPersistence() {
  const { project, addToTimeline, reorderTimeline } = useProject();

  const saveProject = useCallback(async () => {
    if (!project) return;

    try {
      const projectData = {
        name: project.projectDir.split('/').pop(),
        directory: project.projectDir,
        media: Object.values(project.library),
        timeline: project.timeline,
        settings: {
          pxPerSec: project.pxPerSec,
          zoomLevel: project.zoomLevel,
        },
      };

      await invoke('save_project', {
        projectDir: project.projectDir,
        projectData,
      });

      toast.success('Project saved');
    } catch (err) {
      toast.error('Failed to save project');
      console.error(err);
    }
  }, [project]);

  const loadProject = useCallback(async (projectDir: string) => {
    try {
      const projectData = await invoke('load_project', { projectDir });
      // Restore state
      projectData.timeline.forEach((item: any) => addToTimeline(item));
      toast.success('Project loaded');
    } catch (err) {
      toast.error('Failed to load project');
    }
  }, [addToTimeline]);

  // Auto-save every 60 seconds
  useEffect(() => {
    const interval = setInterval(saveProject, 60000);
    return () => clearInterval(interval);
  }, [saveProject]);

  return { saveProject, loadProject };
}
```

### Acceptance Criteria
- [ ] Projects save to JSON on close
- [ ] Projects restore on reopen
- [ ] Auto-save every 60 seconds
- [ ] Recent projects list available
- [ ] Handles missing project files gracefully

---

## PR-019: Improve Error Messages & Recovery
**Priority:** 🟡 MEDIUM  
**Effort:** M (1.5 days)  
**Dependencies:** PR-004, PR-005

### Description
Replace generic error messages with specific, actionable guidance

### Changes
**File:** `src/utils/toastMessages.ts`
```typescript
export const projectToasts = {
  creating: () => toast.loading('Creating project..., {id: 'project-create'}),
  created: () => toast.success('Project created successfully', { id: 'project-create' }),
  createFailed: (error: string) => {
    let message = 'Failed to create project';
    let action = undefined;

    if (error.includes('permission')) {
      message = 'Permission denied. Check folder permissions and try again.';
      action = () => {
        // Suggest checking permissions
      };
    } else if (error.includes('exists')) {
      message = 'Project already exists. Choose a different location.';
    }

    toast.error(message, {
      action: action && { label: 'Help', onClick: action },
      id: 'project-create'
    });
  },
};

export const importToasts = {
  importing: (count: number) => 
    toast.loading(`Importing ${count} file(s)...`, { id: 'import' }),
  
  imported: (count: number) => 
    toast.success(`Successfully imported ${count} file(s)`, { id: 'import' }),
  
  importFailed: (filename: string, reason: string) => {
    let message = `Failed to import ${filename}`;
    
    if (reason.includes('format')) {
      message += ' - Unsupported format. Try MP4, MOV, or AVI.';
    } else if (reason.includes('corrupt')) {
      message += ' - File may be corrupted.';
    } else if (reason.includes('size')) {
      message += ' - File too large. Max 10GB.';
    }

    toast.error(message, {
      duration: 5000,
      id: `import-${filename}`
    });
  },
};
```

### Acceptance Criteria
- [ ] All errors have specific messages
- [ ] Users know what went wrong
- [ ] Users know how to fix it
- [ ] Recovery actions provided where possible

---

# 🟢 PHASE 4: PERFORMANCE & POLISH (Weeks 9-12)

## PR-020: Timeline Virtualization
**Priority:** 🟢 ENHANCEMENT  
**Effort:** L (3 days)  
**Dependencies:** None

### Description
Implement virtual scrolling for large timelines

### New Files
**File:** `src/components/timeline/VirtualizedTimelineTrack.tsx`
```typescript
import { FixedSizeList } from 'react-window';

interface VirtualizedTimelineTrackProps {
  items: TimelineItem[];
  itemWidth: number;
  height: number;
  onItemSelect: (itemId: string) => void;
}

export const VirtualizedTimelineTrack: React.FC<VirtualizedTimelineTrackProps> = ({
  items,
  itemWidth,
  height,
  onItemSelect,
}) => {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <TimelineClip
        item={items[index]}
        onSelect={() => onItemSelect(items[index].id)}
        width={itemWidth}
      />
    </div>
  );

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemWidth}
      layout="horizontal"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Changes
**File:** `src/components/timeline/TimelineTracksContainer.tsx`
- Use VirtualizedTimelineTrack for large timelines
- Implement virtual scrolling

### Acceptance Criteria
- [ ] Large timelines (1000+ clips) render smoothly
- [ ] Scroll performance improved
- [ ] Memory usage reduced
- [ ] No visual glitches

---

## PR-021: Video Metadata Caching
**Priority:** 🟢 ENHANCEMENT  
**Effort:** M (1.5 days)  
**Dependencies:** None

### Description
Cache video duration and metadata to avoid repeated FFprobe calls

### New Files
**File:** `src/utils/metadataCache.ts`
```typescript
interface CacheEntry {
  duration: number;
  width: number;
  height: number;
  timestamp: number;
  format: string;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export class MetadataCache {
  private static instance: MetadataCache;
  private cache = new Map<string, CacheEntry>();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): MetadataCache {
    if (!MetadataCache.instance) {
      MetadataCache.instance = new MetadataCache();
    }
    return MetadataCache.instance;
  }

  get(filePath: string): CacheEntry | null {
    const entry = this.cache.get(filePath);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL) {
      this.cache.delete(filePath);
      return null;
    }

    return entry;
  }

  set(filePath: string, entry: Omit<CacheEntry, 'timestamp'>): void {
    this.cache.set(filePath, {
      ...entry,
      timestamp: Date.now(),
    });
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('metadata-cache');
      if (stored) {
        const entries = JSON.parse(stored);
        Object.entries(entries).forEach(([key, value]: [string, any]) => {
          this.cache.set(key, value);
        });
      }
    } catch (err) {
      console.error('Failed to load metadata cache:', err);
    }
  }

  private saveToStorage(): void {
    try {
      const entries = Object.fromEntries(this.cache);
      localStorage.setItem('metadata-cache', JSON.stringify(entries));
    } catch (err) {
      console.error('Failed to save metadata cache:', err);
    }
  }
}
```

### Changes
**File:** `src/contexts/ProjectContext.tsx`
- Use cache in `importFiles` and `updateClipDuration`

### Acceptance Criteria
- [ ] Metadata cached in localStorage
- [ ] Cache expires after 24 hours
- [ ] Repeated imports faster
- [ ] Cache doesn't grow indefinitely

---

## PR-022: Debounce Timeline Updates
**Priority:** 🟢 ENHANCEMENT  
**Effort:** S (1 day)  
**Dependencies:** None

### Description
Debounce timeline item move/resize to avoid excessive re-renders

### New Files
**File:** `src/hooks/useDebounce.ts`
```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### Changes
**File:** `src/components/timeline/TimelineTrack.tsx`
```typescript
const debouncedStartTime = useDebounce(item.startTime, 100);

useEffect(() => {
  // Update parent only after debounce
  onItemMove?.(item.id, debouncedStartTime);
}, [debouncedStartTime]);
```

### Acceptance Criteria
- [ ] Timeline updates debounced to 100ms
- [ ] Dragging feels responsive
- [ ] CPU usage reduced
- [ ] No visual lag

---

## PR-023: Lazy Load Preview Thumbnails
**Priority:** 🟢 ENHANCEMENT  
**Effort:** M (1.5 days)  
**Dependencies:** None

### Description
Generate and cache preview thumbnails for timeline clips

### New Files
**File:** `src-tauri/src/thumbnails.rs`
```rust
#[tauri::command]
pub async fn generate_thumbnail(
    video_path: String,
    time_sec: f64,
    output_path: String,
) -> Result<String, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    
    let args = vec![
        "-i".to_string(),
        video_path,
        "-ss".to_string(),
        time_sec.to_string(),
        "-vf".to_string(),
        "scale=160:90".to_string(),
        "-vframes".to_string(),
        "1".to_string(),
        output_path.clone(),
    ];

    let output = Command::new(ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to generate thumbnail: {}", e))?;

    if !output.status.success() {
        return Err("Thumbnail generation failed".to_string());
    }

    Ok(output_path)
}
```

### Changes
**File:** `src/components/timeline/TimelineClip.tsx`
- Show cached thumbnail instead of solid color

### Acceptance Criteria
- [ ] Thumbnails generated on import
- [ ] Cached in project directory
- [ ] Timeline clips show preview
- [ ] Performance improved

---

## PR-024: Add Loading States & Spinners
**Priority:** 🟢 ENHANCEMENT  
**Effort:** M (1.5 days)  
**Dependencies:** None

### Description
Add visual feedback for long operations

### New Component
**File:** `src/components/ui/Spinner.tsx`
```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'currentColor',
}) => {
  return (
    <div className={`spinner spinner--${size}`} style={{ color }}>
      <div className="spinner-circle" />
    </div>
  );
};
```

**File:** `src/components/ui/Spinner.css`
```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  display: inline-block;
  position: relative;
}

.spinner-circle {
  animation: spin 1s linear infinite;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
}

.spinner--sm .spinner-circle {
  width: 16px;
  height: 16px;
}

.spinner--md .spinner-circle {
  width: 24px;
  height: 24px;
}

.spinner--lg .spinner-circle {
  width: 32px;
  height: 32px;
}
```

### New Component
**File:** `src/components/LoadingOverlay.tsx`
```typescript
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Processing...',
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner size="lg" />
        <p className="mt-4">{message}</p>
      </div>
    </div>
  );
};
```

### Changes
- Add spinners to: Export dialog, Import operations, Project creation
- Show progress during FFmpeg operations

### Acceptance Criteria
- [ ] Spinners visible during long operations
- [ ] Messages explain what's happening
- [ ] Users can't interact during processing
- [ ] Overlay dismissible if operation cancels

---

## PR-025: Add Keyboard Shortcuts Help Modal
**Priority:** 🟢 ENHANCEMENT  
**Effort:** S (1 day)  
**Dependencies:** None

### Description
Display available keyboard shortcuts and allow customization

### New Component
**File:** `src/components/ShortcutsModal.tsx`
```typescript
const SHORTCUTS = [
  { key: 'Space / K', action: 'Play / Pause' },
  { key: 'J', action: 'Skip Back 1s' },
  { key: 'L', action: 'Skip Forward 1s' },
  { key: 'Shift + Arrow', action: 'Skip 5 seconds' },
  { key: 'S', action: 'Split at Playhead' },
  { key: 'Delete', action: 'Delete Selected Clip' },
  { key: 'Ctrl+Z', action: 'Undo' },
  { key: 'Ctrl+Shift+Z', action: 'Redo' },
  { key: 'Ctrl+0', action: 'Fit to View' },
  { key: '1-5', action: 'Set Playback Speed' },
];

export const ShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Keyboard Shortcuts</h2>
        <table className="shortcuts-table">
          <thead>
            <tr>
              <th>Shortcut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((shortcut) => (
              <tr key={shortcut.key}>
                <td><kbd>{shortcut.key}</kbd></td>
                <td>{shortcut.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
```

### Changes
**File:** `src/App.tsx`
- Add "?" button to trigger shortcuts modal
- Keyboard shortcut: "?" to open

### Acceptance Criteria
- [ ] Modal displays all shortcuts
- [ ] Professional formatting
- [ ] Dismissible by clicking outside or close button
- [ ] "?" key opens modal

---

## PR-026: Export Quality Settings
**Priority:** 🟢 ENHANCEMENT  
**Effort:** M (1.5 days)  
**Dependencies:** None

### Description
Allow users to choose codec, bitrate, and resolution for export

### Changes
**File:** `src/components/ExportDialog.jsx`
```typescript
export interface ExportSettings {
  codec: 'h264' | 'h265' | 'vp9';
  bitrate: number; // kbps
  quality: 'low' | 'medium' | 'high';
  resolution: '720p' | '1080p' | '1440p' | '4k';
  presetOptions: 'fast' | 'medium' | 'slow';
}

const PRESETS: Record<ExportSettings['quality'], ExportSettings> = {
  low: {
    codec: 'h264',
    bitrate: 2000,
    resolution: '720p',
    quality: 'low',
    presetOptions: 'fast',
  },
  medium: {
    codec: 'h264',
    bitrate: 5000,
    resolution: '1080p',
    quality: 'medium',
    presetOptions: 'medium',
  },
  high: {
    codec: 'h265',
    bitrate: 10000,
    resolution: '4k',
    quality: 'high',
    presetOptions: 'slow',
  },
};
```

### New Rust Command
**File:** `src-tauri/src/ffmpeg.rs`
```rust
#[tauri::command]
pub async fn export_with_settings(
    input: String,
    output: String,
    settings: ExportSettings,
) -> Result<i32, String> {
    let ffmpeg_path = get_ffmpeg_path()?;
    
    let resolution = match settings.resolution {
        "720p" => "1280:720",
        "1080p" => "1920:1080",
        "1440p" => "2560:1440",
        "4k" => "3840:2160",
        _ => "1920:1080",
    };

    let args = vec![
        "-i", &input,
        "-vf", &format!("scale={}", resolution),
        "-c:v", match settings.codec {
            "h264" => "libx264",
            "h265" => "libx265",
            "vp9" => "libvpx-vp9",
            _ => "libx264",
        },
        "-b:v", &format!("{}k", settings.bitrate),
        "-preset", &settings.preset,
        "-c:a", "aac",
        output.as_str(),
    ];

    // Execute FFmpeg...
    Ok(0)
}
```

### Acceptance Criteria
- [ ] Quality presets available (low, medium, high)
- [ ] Custom bitrate configurable
- [ ] Resolution selectable
- [ ] Codec selection works
- [ ] File size estimates shown

---

## PR-027: Batch Export Multiple Projects
**Priority:** 🟢 ENHANCEMENT  
**Effort:** M (1.5 days)  
**Dependencies:** PR-026

### Description
Allow exporting multiple timelines without manual intervention

### Changes
**File:** `src/components/BatchExportDialog.tsx`
```typescript
interface BatchExportJob {
  projectId: string;
  projectName: string;
  timelineId: string;
  outputPath: string;
  settings: ExportSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

export const BatchExportDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [jobs, setJobs] = useState<BatchExportJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processBatch = async () => {
    setIsProcessing(true);
    
    for (const job of jobs) {
      try {
        await invoke('export_video', {
          input: job.projectId,
          output: job.outputPath,
          settings: job.settings,
        });
        
        setJobs(prev => prev.map(j =>
          j.projectId === job.projectId
            ? { ...j, status: 'completed', progress: 100 }
            : j
        ));
      } catch (err) {
        setJobs(prev => prev.map(j =>
          j.projectId === job.projectId
            ? { ...j, status: 'failed' }
            : j
        ));
      }
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="batch-export-dialog">
      {/* Job list with progress bars */}
      <button onClick={processBatch} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Export All'}
      </button>
    </div>
  );
};
```

### Acceptance Criteria
- [ ] Multiple exports queue
- [ ] Progress shown per export
- [ ] Can cancel individual jobs
- [ ] Logs exported files

---

# 🔮 PHASE 5: ADVANCED FEATURES (Weeks 13+)

## PR-028: Fade & Transition Effects
**Priority:** 🔮 FUTURE  
**Effort:** L (3 days)

### Description
Add crossfade, dissolve, and other transition effects

---

## PR-029: Text & Watermark Support
**Priority:** 🔮 FUTURE  
**Effort:** L (3 days)

### Description
Add text overlays, titles, and watermarks to videos

---

## PR-030: Color Correction Tools
**Priority:** 🔮 FUTURE  
**Effort:** L (3 days)

### Description
Brightness, contrast, saturation, and color grading controls

---

## PR-031: Multi-Camera Sync
**Priority:** 🔮 FUTURE  
**Effort:** XL (5 days)

### Description
Sync multiple camera angles with audio

---

## PR-032: Auto-Caption Generation
**Priority:** 🔮 FUTURE  
**Effort:** XL (5 days)

### Description
Generate captions using speech-to-text

---

## PR-033: Plugin System
**Priority:** 🔮 FUTURE  
**Effort:** XL (5 days)

### Description
Allow third-party plugins and extensions

---

## PR-034: Collaboration Features
**Priority:** 🔮 FUTURE  
**Effort:** XL (5 days)

### Description
Share projects, real-time sync, comments

---

## PR-035: Cloud Storage Integration
**Priority:** 🔮 FUTURE  
**Effort:** L (3 days)

### Description
Backup projects to cloud (AWS S3, Google Drive, etc.)

---

---

# 📊 Roadmap Summary

## By Phase

| Phase | Duration | PRs | Focus |
|-------|----------|-----|-------|
| **1: Critical Fixes** | Weeks 1-2 | 6 | Stability, errors, validation |
| **2: Testing** | Weeks 3-4 | 6 | Unit tests, E2E tests, quality |
| **3: Features & A11y** | Weeks 5-8 | 8 | Undo/redo, persistence, accessibility |
| **4: Performance** | Weeks 9-12 | 8 | Optimization, polish, UX |
| **5: Advanced** | Weeks 13+ | 7 | Advanced features, plugins |

## By Effort

| Effort | Count |
|--------|-------|
| **XS** | 3 |
| **S** | 5 |
| **M** | 11 |
| **L** | 9 |
| **XL** | 5 |

**Total Estimated Effort:** ~32 weeks (8 months) for all PRs

---

# 🎯 Implementation Strategy

## Weekly Cadence

- **Monday:** PR planning + code review
- **Tuesday-Thursday:** Development
- **Friday:** Testing + documentation

## PR Review Checklist

- ✅ All tests pass
- ✅ TypeScript strict mode passes
- ✅ No linter errors
- ✅ Code coverage ≥ 80%
- ✅ Documentation updated
- ✅ No breaking changes (if patch/minor version)
- ✅ Accessibility standards met (WCAG AA)

## Merge Strategy

- **Squash merge** for small PRs (XS, S)
- **Rebase merge** for medium PRs (M)
- **Standard merge** for large features (L, XL) to preserve history

---

# 📝 Success Metrics

**By end of Phase 2 (Week 4):**
- ✅ Zero critical bugs
- ✅ 70%+ test coverage
- ✅ All syntax errors fixed

**By end of Phase 3 (Week 8):**
- ✅ 80%+ test coverage
- ✅ WCAG AA accessibility compliance
- ✅ Undo/redo working
- ✅ Project persistence working

**By end of Phase 4 (Week 12):**
- ✅ 90%+ test coverage
- ✅ All performance optimizations done
- ✅ App passes Lighthouse audit
- ✅ Ready for beta release

**By end of Phase 5:**
- ✅ Advanced features shipped
- ✅ Plugin system working
- ✅ Production-grade application

---

# 🚀 Getting Started

1. **Start with Phase 1** (PRs 001-006) - Fix critical issues first
2. **Move to Phase 2** (PRs 007-012) - Establish test infrastructure
3. **Proceed to Phase 3** (PRs 013-019) - Add features & accessibility
4. **Polish in Phase 4** (PRs 020-027) - Performance & UX
5. **Future enhancements** (PRs 028-035) - Advanced features

Each PR is independent and can be prioritized based on business needs.
