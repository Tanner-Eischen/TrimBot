/**
 * ProjectContext Integration Tests
 * Comprehensive integration tests for project creation and workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ProjectProvider, useProject } from '../ProjectContext';
import { createMockProjectState } from '../../tests/test-utils';

describe('ProjectContext Integration', () => {
  describe('project creation', () => {
    it('should create a new project', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      expect(result.current.project).toBeDefined();
      expect(result.current.project?.projectDir).toBe('/mock/project');
      expect(result.current.project?.library).toBeDefined();
      expect(result.current.project?.timeline).toHaveLength(0);
    });

    it('should initialize project with proper structure', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      expect(result.current.project?.mediaDir).toBe('/mock/project/media');
      expect(result.current.project?.exportDir).toBe('/mock/project/exports');
      expect(result.current.project?.pxPerSec).toBe(50);
    });

    it('should set loading state during creation', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      // Start creation
      const promise = act(async () => {
        await result.current.createProject();
      });

      // Project should eventually be created
      await promise;
      expect(result.current.project).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle creation errors', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      // Mock Tauri to throw error
      (window.__TAURI__.core.invoke as any) = vi.fn(async () => {
        throw new Error('Permission denied');
      });

      await act(async () => {
        try {
          await result.current.createProject();
        } catch (err) {
          // Error expected
        }
      });

      // Should be in error state
      expect(result.current.error).toBeDefined();
    });
  });

  describe('file import workflow', () => {
    it('should import files to library', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      // Create project first
      await act(async () => {
        await result.current.createProject();
      });

      // Import files
      await act(async () => {
        await result.current.importFiles([
          '/path/to/video1.mp4',
          '/path/to/video2.mov',
        ]);
      });

      expect(Object.keys(result.current.project?.library || {})).toHaveLength(2);
    });

    it('should handle import with single file', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      await act(async () => {
        await result.current.importFiles(['/path/to/video.mp4']);
      });

      expect(Object.keys(result.current.project?.library || {})).toHaveLength(1);
    });

    it('should create unique clip IDs for imported files', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      await act(async () => {
        await result.current.importFiles([
          '/path/to/video1.mp4',
          '/path/to/video2.mp4',
        ]);
      });

      const clipIds = Object.keys(result.current.project?.library || {});
      expect(new Set(clipIds).size).toBe(2); // All unique
    });

    it('should handle empty file list', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      await act(async () => {
        await result.current.importFiles([]);
      });

      expect(Object.keys(result.current.project?.library || {})).toHaveLength(0);
    });
  });

  describe('timeline management', () => {
    it('should add clip to timeline', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      const clip = {
        id: 'test-clip',
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
      expect(result.current.project?.timeline[0].id).toBe('test-clip');
    });

    it('should add multiple clips to timeline', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      const clip1 = {
        id: 'clip-1',
        name: 'video1.mp4',
        durationSec: 30,
        startTime: 0,
        xPx: 0,
        wPx: 300,
        type: 'video' as const,
        path: '/path/video1.mp4',
        selected: false,
        filename: 'video1.mp4',
      };

      const clip2 = {
        id: 'clip-2',
        name: 'video2.mp4',
        durationSec: 45,
        startTime: 30,
        xPx: 300,
        wPx: 450,
        type: 'video' as const,
        path: '/path/video2.mp4',
        selected: false,
        filename: 'video2.mp4',
      };

      act(() => {
        result.current.addToTimeline(clip1);
        result.current.addToTimeline(clip2);
      });

      expect(result.current.project?.timeline).toHaveLength(2);
    });

    it('should reorder timeline', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      const clips = [
        {
          id: 'clip-1',
          name: 'video1.mp4',
          durationSec: 30,
          startTime: 0,
          xPx: 0,
          wPx: 300,
          type: 'video' as const,
          path: '/path/video1.mp4',
          selected: false,
          filename: 'video1.mp4',
        },
        {
          id: 'clip-2',
          name: 'video2.mp4',
          durationSec: 45,
          startTime: 30,
          xPx: 300,
          wPx: 450,
          type: 'video' as const,
          path: '/path/video2.mp4',
          selected: false,
          filename: 'video2.mp4',
        },
      ];

      act(() => {
        clips.forEach((clip) => result.current.addToTimeline(clip));
      });

      // Reorder
      act(() => {
        result.current.reorderTimeline([clips[1], clips[0]]);
      });

      expect(result.current.project?.timeline[0].id).toBe('clip-2');
      expect(result.current.project?.timeline[1].id).toBe('clip-1');
    });
  });

  describe('zoom and scaling', () => {
    it('should set zoom level', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      act(() => {
        result.current.setZoomLevel(2.0);
      });

      expect(result.current.project?.zoomLevel).toBe(2.0);
    });

    it('should set pixels per second', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      act(() => {
        result.current.setPxPerSec(100);
      });

      expect(result.current.project?.pxPerSec).toBe(100);
    });

    it('should calculate pixel positions based on pxPerSec', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      act(() => {
        result.current.setPxPerSec(10);
      });

      const clip = {
        id: 'test-clip',
        name: 'test.mp4',
        durationSec: 30,
        startTime: 5,
        xPx: 0,
        wPx: 0,
        type: 'video' as const,
        path: '/path/video.mp4',
        selected: false,
        filename: 'test.mp4',
      };

      act(() => {
        result.current.addToTimeline(clip);
      });

      // With pxPerSec=10, startTime=5: xPx should be 50
      // Duration=30: wPx should be 300
      const addedClip = result.current.project?.timeline[0];
      expect(addedClip?.xPx).toBeCloseTo(50, 0);
      expect(addedClip?.wPx).toBeCloseTo(300, 0);
    });
  });

  describe('clip duration', () => {
    it('should update clip duration', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      // Add clip to library first
      await act(async () => {
        await result.current.importFiles(['/path/to/video.mp4']);
      });

      const clipId = Object.keys(result.current.project?.library || {})[0];

      act(() => {
        result.current.updateClipDuration(clipId, 120, 1920, 1080);
      });

      expect(result.current.project?.library[clipId]?.durationSec).toBe(120);
      expect(result.current.project?.library[clipId]?.width).toBe(1920);
      expect(result.current.project?.library[clipId]?.height).toBe(1080);
    });
  });

  describe('complete workflow', () => {
    it('should complete full project workflow', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      // 1. Create project
      await act(async () => {
        await result.current.createProject();
      });
      expect(result.current.project).toBeDefined();

      // 2. Import files
      await act(async () => {
        await result.current.importFiles([
          '/path/to/video1.mp4',
          '/path/to/video2.mp4',
        ]);
      });
      expect(
        Object.keys(result.current.project?.library || {})
      ).toHaveLength(2);

      // 3. Add clips to timeline
      const library = result.current.project?.library || {};
      const clipIds = Object.keys(library);

      const timelineClips = clipIds.map((id, index) => ({
        ...library[id],
        startTime: index * library[id].durationSec,
        xPx: index * (library[id].durationSec * 50),
        wPx: library[id].durationSec * 50,
      }));

      act(() => {
        timelineClips.forEach((clip) => result.current.addToTimeline(clip));
      });
      expect(result.current.project?.timeline).toHaveLength(2);

      // 4. Set zoom
      act(() => {
        result.current.setPxPerSec(75);
      });
      expect(result.current.project?.pxPerSec).toBe(75);

      // 5. Verify final state
      expect(result.current.project?.projectDir).toBe('/mock/project');
      expect(result.current.project?.timeline).toHaveLength(2);
      expect(result.current.error).toBeNull();
    });

    it('should handle multi-file import and timeline operations', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      await act(async () => {
        await result.current.createProject();
      });

      // Import 5 files
      const filePaths = Array.from({ length: 5 }, (_, i) =>
        `/path/to/video${i + 1}.mp4`
      );

      await act(async () => {
        await result.current.importFiles(filePaths);
      });

      expect(
        Object.keys(result.current.project?.library || {})
      ).toHaveLength(5);

      // Add all to timeline
      const library = result.current.project?.library || {};
      let currentStartTime = 0;

      Object.values(library).forEach((clip) => {
        const timelineClip = {
          ...clip,
          startTime: currentStartTime,
          xPx: currentStartTime * 50,
          wPx: clip.durationSec * 50,
        };
        act(() => {
          result.current.addToTimeline(timelineClip);
        });
        currentStartTime += clip.durationSec;
      });

      expect(result.current.project?.timeline).toHaveLength(5);

      // Verify sequential start times
      result.current.project?.timeline.forEach((clip, index) => {
        if (index > 0) {
          const prev = result.current.project?.timeline[index - 1];
          expect(clip.startTime).toBeGreaterThanOrEqual(
            (prev?.startTime || 0) + (prev?.durationSec || 0) - 0.1
          );
        }
      });
    });
  });

  describe('error handling', () => {
    it('should clear error when creating new project', async () => {
      const { result } = renderHook(() => useProject(), {
        wrapper: ProjectProvider,
      });

      // Force an error state first
      (window.__TAURI__.core.invoke as any) = vi.fn(async () => {
        throw new Error('Initial error');
      });

      try {
        await act(async () => {
          await result.current.createProject();
        });
      } catch {
        // Error expected
      }

      // Reset mock to success
      (window.__TAURI__.core.invoke as any) = vi.fn(async (command) => {
        switch (command) {
          case 'open_dir_dialog':
            return '/mock/project';
          case 'create_project_dirs':
            return true;
          case 'ensure_dir':
            return true;
          default:
            return null;
        }
      });

      // Try again
      await act(async () => {
        await result.current.createProject();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.project).toBeDefined();
    });
  });
});
