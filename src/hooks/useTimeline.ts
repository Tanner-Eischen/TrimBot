import { useState, useEffect, useCallback } from 'react';
import { TimelineItem } from '../types/index';

interface UseTimelineProps {
  timelineData: any[];
  pxPerSec: number;
}

interface UseTimelineReturn {
  timelineItems: TimelineItem[];
  currentTime: number;
  setCurrentTime: (time: number) => void;
  handleItemMove: (itemId: string, newStartTime: number) => void;
  handleItemResize: (itemId: string, newDuration: number) => void;
  handleItemSelect: (itemId: string) => void;
  handleSplitAtPlayhead: (itemId: string) => void;
  handleRippleDelete: (itemId: string) => void;
  handleMergeAdjacent: (leftItemId: string, rightItemId: string) => void;
  selectedItemId: string | null;
}

// Calculate start time based on timeline order (sequential by default)
const calculateStartTime = (timelineData: any[], index: number): number => {
  let startTime = 0;
  for (let i = 0; i < index; i++) {
    startTime += timelineData[i]?.durationSec || 0;
  }
  return startTime;
};

export function useTimeline({ timelineData, pxPerSec }: UseTimelineProps): UseTimelineReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Initialize timeline items when timelineData changes (new clips added/removed)
  useEffect(() => {
    setTimelineItems(prevItems => {
      // If no previous items, create new ones
      if (prevItems.length === 0) {
        return timelineData.map((item, index) => {
          const startTime = item.startTime !== undefined ? item.startTime : calculateStartTime(timelineData, index);
          const durationSec = item.durationSec || 5;
          
          return {
            id: item.id,
            name: item.filename || item.name || `Clip ${index + 1}`,
            durationSec,
            startTime: startTime,
            xPx: startTime * pxPerSec,
            wPx: durationSec * pxPerSec,
            type: item.type || 'video',
            path: item.path || '',
            selected: false,
            filename: item.filename || `clip-${index + 1}.mp4`
          };
        });
      }

      // Check if timelineData has actually changed (different IDs or count)
      const prevIds = prevItems.map(item => item.id).sort();
      const newIds = timelineData.map(item => item.id).sort();
      const hasChanged = prevIds.length !== newIds.length || 
                        prevIds.some((id, index) => id !== newIds[index]);

      if (!hasChanged) {
        // No change in timeline data, preserve existing items but update pixel positions
        return prevItems.map(item => ({
          ...item,
          xPx: item.startTime * pxPerSec,
          wPx: item.durationSec * pxPerSec
        }));
      }

      // Timeline data has changed, merge with existing items to preserve positions
      const updatedItems = timelineData.map((item, index) => {
        const existingItem = prevItems.find(prev => prev.id === item.id);
        
        if (existingItem) {
          // Preserve existing item's position and duration if it was modified
          return {
            ...existingItem,
            xPx: existingItem.startTime * pxPerSec,
            wPx: existingItem.durationSec * pxPerSec
          };
        } else {
          // New item, calculate initial position
          const startTime = item.startTime !== undefined ? item.startTime : calculateStartTime(timelineData, index);
          const durationSec = item.durationSec || 5;
          
          return {
            id: item.id,
            name: item.filename || item.name || `Clip ${index + 1}`,
            durationSec,
            startTime: startTime,
            xPx: startTime * pxPerSec,
            wPx: durationSec * pxPerSec,
            type: item.type || 'video',
            path: item.path || '',
            selected: false,
            filename: item.filename || `clip-${index + 1}.mp4`
          };
        }
      });

      return updatedItems;
    });
  }, [timelineData, pxPerSec]);

  // Handle moving items to new positions
  const handleItemMove = useCallback((itemId: string, newStartTime: number) => {
    setTimelineItems(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const clampedStartTime = Math.max(0, newStartTime); // Ensure non-negative
          return {
            ...item,
            startTime: clampedStartTime,
            xPx: clampedStartTime * pxPerSec
          };
        }
        return item;
      });
      
      // Sort items by start time for proper ordering
      return updated.sort((a, b) => a.startTime - b.startTime);
    });
  }, [pxPerSec]);

  // Handle resizing items (placeholder for future implementation)
  const handleItemResize = useCallback((itemId: string, newDuration: number) => {
    setTimelineItems(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const clampedDuration = Math.max(0.1, newDuration); // Minimum 0.1 second
          return {
            ...item,
            durationSec: clampedDuration,
            wPx: clampedDuration * pxPerSec
          };
        }
        return item;
      });
    });
  }, [pxPerSec]);

  // Handle item selection
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItemId(prev => prev === itemId ? null : itemId);
  }, []);

  // Handle splitting clip at playhead position
  const handleSplitAtPlayhead = useCallback((itemId: string) => {
    setTimelineItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (!item) return prev;

      // Calculate split position
      const tSplitSec = currentTime;
      const tItemStartSec = item.startTime;
      const tInItem = tSplitSec - tItemStartSec;

      // Validate split position - return early instead of throwing
      if (tInItem <= 0 || tInItem >= item.durationSec - 0.01) {
        console.error("Split position is outside clip bounds");
        return prev;
      }

      if (tInItem < 0.2 || (item.durationSec - tInItem) < 0.2) {
        console.error("Split would create segments too short (< 0.2s)");
        return prev;
      }

      // Generate unique IDs for new clips
      const leftId = `${itemId}-part1`;
      const rightId = `${itemId}-part2`;
      
      // Note: Output paths would be generated based on actual implementation
      // const leftOutput = `media/${leftId}.mp4`;
      // const rightOutput = `media/${rightId}.mp4`;

      // Note: Split operation would be implemented here
      // This would involve calling the Rust backend with proper file paths

      // Update timeline items immediately - replace original with two new clips
      const updated = prev.filter(i => i.id !== itemId);
      
      const leftClip: TimelineItem = {
        id: leftId,
        name: `${item.name} (Part 1)`,
        durationSec: tInItem,
        startTime: item.startTime,
        xPx: item.startTime * pxPerSec,
        wPx: tInItem * pxPerSec,
        type: item.type,
        path: item.path,
        selected: false,
        filename: `${leftId}.mp4`
      };

      const rightClip: TimelineItem = {
        id: rightId,
        name: `${item.name} (Part 2)`,
        durationSec: item.durationSec - tInItem,
        startTime: item.startTime + tInItem,
        xPx: (item.startTime + tInItem) * pxPerSec,
        wPx: (item.durationSec - tInItem) * pxPerSec,
        type: item.type,
        path: item.path,
        selected: false,
        filename: `${rightId}.mp4`
      };

      return [...updated, leftClip, rightClip].sort((a, b) => a.startTime - b.startTime);
    });
  }, [currentTime, pxPerSec]);

  // Handle ripple delete - remove item and shift following items left
  const handleRippleDelete = useCallback((itemId: string) => {
    setTimelineItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (!item) return prev;

      const filtered = prev.filter(i => i.id !== itemId);
      
      // Shift all items that start after this item
      const updated = filtered.map(i => {
        if (i.startTime > item.startTime) {
          const newStartTime = i.startTime - item.durationSec;
          return {
            ...i,
            startTime: Math.max(0, newStartTime),
            xPx: Math.max(0, newStartTime) * pxPerSec
          };
        }
        return i;
      });

      return updated.sort((a: TimelineItem, b: TimelineItem) => a.startTime - b.startTime);
    });
  }, [pxPerSec]);

  // Handle merging two adjacent clips
  const handleMergeAdjacent = useCallback((leftItemId: string, rightItemId: string) => {
    setTimelineItems(prev => {
      const leftItem = prev.find(i => i.id === leftItemId);
      const rightItem = prev.find(i => i.id === rightItemId);
      
      if (!leftItem || !rightItem) return prev;

      // Verify items are adjacent (no gap) - return early instead of throwing
      const gap = rightItem.startTime - (leftItem.startTime + leftItem.durationSec);
      if (Math.abs(gap) > 0.01) {
        console.error("Items are not adjacent - cannot merge");
        return prev;
      }

      const mergedId = `${leftItemId}-${rightItemId}-merged`;
      // Note: Output path would be generated based on actual implementation
      // const mergedOutput = `media/${mergedId}.mp4`;

      // Note: Merge operation would be implemented here
      // This would involve calling the Rust backend with proper file paths

      // Update timeline immediately - replace both items with merged clip
      const filtered = prev.filter(i => i.id !== leftItemId && i.id !== rightItemId);
      
      const mergedClip: TimelineItem = {
        id: mergedId,
        name: `${leftItem.name} + ${rightItem.name}`,
        durationSec: leftItem.durationSec + rightItem.durationSec,
        startTime: leftItem.startTime,
        xPx: leftItem.startTime * pxPerSec,
        wPx: (leftItem.durationSec + rightItem.durationSec) * pxPerSec,
        type: leftItem.type,
        path: leftItem.path,
        selected: false,
        filename: `${mergedId}.mp4`
      };

      return [...filtered, mergedClip].sort((a, b) => a.startTime - b.startTime);
    });
  }, [pxPerSec]);

  return {
    timelineItems,
    currentTime,
    setCurrentTime,
    handleItemMove,
    handleItemResize,
    handleItemSelect,
    handleSplitAtPlayhead,
    handleRippleDelete,
    handleMergeAdjacent,
    selectedItemId
  };
}
