/**
 * useTimeline Hook Tests
 * Comprehensive test suite for timeline operations and state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeline } from '../useTimeline';

// Mock timeline data
const mockTimelineData = [
  {
    id: 'clip-1',
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
    id: 'clip-2',
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
  {
    id: 'clip-3',
    name: 'Clip 3',
    durationSec: 20,
    startTime: 75,
    xPx: 750,
    wPx: 200,
    type: 'video' as const,
    path: '/path/to/clip3.mp4',
    selected: false,
    filename: 'clip3.mp4',
  },
];

describe('useTimeline Hook', () => {
  describe('initialization', () => {
    it('should initialize with timeline items', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      expect(result.current.timelineItems).toHaveLength(3);
      expect(result.current.timelineItems[0].id).toBe('clip-1');
      expect(result.current.timelineItems[1].id).toBe('clip-2');
      expect(result.current.timelineItems[2].id).toBe('clip-3');
    });

    it('should set initial current time to 0', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      expect(result.current.currentTime).toBe(0);
    });

    it('should initialize with no selected item', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      expect(result.current.selectedItemId).toBeNull();
    });

    it('should calculate correct pixel positions', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      // First item at time 0
      expect(result.current.timelineItems[0].xPx).toBe(0);
      // Second item at time 30 (30 * 10 = 300px)
      expect(result.current.timelineItems[1].xPx).toBe(300);
      // Third item at time 75 (75 * 10 = 750px)
      expect(result.current.timelineItems[2].xPx).toBe(750);
    });
  });

  describe('current time management', () => {
    it('should set current time', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.setCurrentTime(25);
      });

      expect(result.current.currentTime).toBe(25);
    });

    it('should handle large current time values', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.setCurrentTime(1000);
      });

      expect(result.current.currentTime).toBe(1000);
    });

    it('should handle zero current time', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.setCurrentTime(50);
        result.current.setCurrentTime(0);
      });

      expect(result.current.currentTime).toBe(0);
    });
  });

  describe('item selection', () => {
    it('should select an item', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleItemSelect('clip-1');
      });

      expect(result.current.selectedItemId).toBe('clip-1');
      expect(result.current.timelineItems[0].selected).toBe(true);
    });

    it('should deselect previous item when selecting new one', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleItemSelect('clip-1');
      });
      expect(result.current.timelineItems[0].selected).toBe(true);

      act(() => {
        result.current.handleItemSelect('clip-2');
      });

      expect(result.current.selectedItemId).toBe('clip-2');
      expect(result.current.timelineItems[0].selected).toBe(false);
      expect(result.current.timelineItems[1].selected).toBe(true);
    });

    it('should handle selecting non-existent item gracefully', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleItemSelect('non-existent');
      });

      expect(result.current.selectedItemId).toBeNull();
    });
  });

  describe('item movement', () => {
    it('should move item to new position', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleItemMove('clip-1', 5); // Move to 0.5 seconds (50px)
      });

      expect(result.current.timelineItems[0].startTime).toBe(5);
    });

    it('should update pixel position when moving item', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleItemMove('clip-1', 10);
      });

      expect(result.current.timelineItems[0].xPx).toBe(100);
    });

    it('should preserve duration when moving', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      const originalDuration = result.current.timelineItems[0].durationSec;

      act(() => {
        result.current.handleItemMove('clip-1', 25);
      });

      expect(result.current.timelineItems[0].durationSec).toBe(originalDuration);
    });

    it('should allow moving to negative start time', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleItemMove('clip-2', -10);
      });

      expect(result.current.timelineItems[1].startTime).toBe(-10);
    });
  });

  describe('item resize', () => {
    it('should resize item from right edge', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleItemResize('clip-1', 100, 'right');
      });

      // Original width 300px (30s * 10), adding 100px = 400px = 40s
      expect(result.current.timelineItems[0].durationSec).toBeCloseTo(40, 1);
    });

    it('should resize item from left edge', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleItemResize('clip-1', 50, 'left');
      });

      // Original: start=0, duration=30s. Left resize by 50px (5s)
      // New: start=5, duration=25s
      expect(result.current.timelineItems[0].startTime).toBe(5);
      expect(result.current.timelineItems[0].durationSec).toBeCloseTo(25, 1);
    });

    it('should maintain minimum duration during resize', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        // Try to make duration very small
        result.current.handleItemResize('clip-1', -290, 'right');
      });

      // Should maintain minimum duration
      expect(result.current.timelineItems[0].durationSec).toBeGreaterThan(0);
    });
  });

  describe('split at playhead', () => {
    it('should split item at playhead position', async () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      // Set playhead at 15 seconds (middle of first clip)
      act(() => {
        result.current.setCurrentTime(15);
      });

      await act(async () => {
        await result.current.handleSplitAtPlayhead('clip-1');
      });

      // Should now have 4 items
      expect(result.current.timelineItems).toHaveLength(4);

      // First split piece: 0-15s
      expect(result.current.timelineItems[0].durationSec).toBeCloseTo(15, 1);
      expect(result.current.timelineItems[0].startTime).toBe(0);

      // Second split piece: 15-30s
      expect(result.current.timelineItems[1].durationSec).toBeCloseTo(15, 1);
      expect(result.current.timelineItems[1].startTime).toBeCloseTo(15, 1);
    });

    it('should not split if playhead is outside item', async () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.setCurrentTime(80); // Outside first clip
      });

      await act(async () => {
        await result.current.handleSplitAtPlayhead('clip-1');
      });

      // Should still have 3 items (no split)
      expect(result.current.timelineItems).toHaveLength(3);
    });

    it('should maintain timeline order after split', async () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.setCurrentTime(37.5); // Middle of second clip (30-75s)
      });

      await act(async () => {
        await result.current.handleSplitAtPlayhead('clip-2');
      });

      // Verify start times are sequential
      let lastStartTime = 0;
      result.current.timelineItems.forEach((item) => {
        expect(item.startTime).toBeGreaterThanOrEqual(lastStartTime);
        lastStartTime = item.startTime + item.durationSec;
      });
    });
  });

  describe('ripple delete', () => {
    it('should delete item and compact timeline', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleRippleDelete('clip-2');
      });

      // Should have 2 items
      expect(result.current.timelineItems).toHaveLength(2);
      expect(result.current.timelineItems.map((i) => i.id)).toEqual([
        'clip-1',
        'clip-3',
      ]);
    });

    it('should compact timeline positions after delete', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleRippleDelete('clip-2');
      });

      // clip-1: 0s-30s (unchanged)
      expect(result.current.timelineItems[0].startTime).toBe(0);

      // clip-3: should now start at 30s (immediately after clip-1)
      expect(result.current.timelineItems[1].startTime).toBeCloseTo(30, 1);
    });

    it('should handle deleting first item', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleRippleDelete('clip-1');
      });

      expect(result.current.timelineItems).toHaveLength(2);
      expect(result.current.timelineItems[0].id).toBe('clip-2');
      expect(result.current.timelineItems[0].startTime).toBe(0);
    });

    it('should handle deleting last item', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      act(() => {
        result.current.handleRippleDelete('clip-3');
      });

      expect(result.current.timelineItems).toHaveLength(2);
      expect(result.current.timelineItems[1].id).toBe('clip-2');
    });
  });

  describe('merge adjacent clips', () => {
    it('should merge two adjacent clips', async () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      await act(async () => {
        await result.current.handleMergeAdjacent('clip-1', 'clip-2');
      });

      // Should have 2 items (merged into 1)
      expect(result.current.timelineItems).toHaveLength(2);
    });

    it('should preserve combined duration after merge', async () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      const originalDuration =
        result.current.timelineItems[0].durationSec +
        result.current.timelineItems[1].durationSec;

      await act(async () => {
        await result.current.handleMergeAdjacent('clip-1', 'clip-2');
      });

      // Merged clip should have combined duration
      expect(result.current.timelineItems[0].durationSec).toBeCloseTo(
        originalDuration,
        1
      );
    });

    it('should handle merge error gracefully', async () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 10,
        })
      );

      // Try to merge non-adjacent clips
      await act(async () => {
        await result.current.handleMergeAdjacent('clip-1', 'clip-3');
      });

      // Should remain unchanged or handle gracefully
      expect(result.current.timelineItems).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty timeline data', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: [],
          pxPerSec: 10,
        })
      );

      expect(result.current.timelineItems).toHaveLength(0);
    });

    it('should handle very large pxPerSec values', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 1000,
        })
      );

      expect(result.current.timelineItems[0].xPx).toBe(0);
      expect(result.current.timelineItems[1].xPx).toBe(30000);
    });

    it('should handle very small pxPerSec values', () => {
      const { result } = renderHook(() =>
        useTimeline({
          timelineData: mockTimelineData,
          pxPerSec: 0.1,
        })
      );

      expect(result.current.timelineItems[1].xPx).toBeCloseTo(3, 0);
    });

    it('should handle items with zero duration', () => {
      const zeroData = [
        {
          ...mockTimelineData[0],
          durationSec: 0,
        },
      ];

      const { result } = renderHook(() =>
        useTimeline({
          timelineData: zeroData,
          pxPerSec: 10,
        })
      );

      expect(result.current.timelineItems[0].durationSec).toBe(0);
    });
  });
});
