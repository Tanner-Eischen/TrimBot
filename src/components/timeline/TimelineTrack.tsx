import React, { useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { TimelineClip } from './TimelineClip';
import { useClipTrim } from '../../hooks/useClipTrim';

interface TimelineItem {
  id: string;
  name: string;
  durationSec: number;
  startTime: number;
  xPx: number;
  wPx: number;
  type: 'video' | 'audio';
  path: string;
  selected: boolean;
  filename?: string;
  inSec?: number;
  outSec?: number;
}

interface DragState {
  isDragging: boolean;
  dragItemId: string | null;
  startX: number;
  initialStartTime: number;
  ghostPosition?: number;
}

interface TimelineTrackProps {
  items: TimelineItem[];
  timelineItems?: TimelineItem[];
  currentTime: number;
  pxPerSec: number;
  onTimeChange?: (time: number) => void;
  onCurrentTimeChange?: (time: number) => void;
  onTimelineItemsChange?: (items: TimelineItem[]) => void;
  onItemMove?: (itemId: string, newStartTime: number) => void;
  onItemResize?: (itemId: string, newDuration: number) => void;
  onItemSelect?: (itemId: string) => void;
  onSelectClip?: (clipId: string) => void;
  selectedItemId?: string | null;
  onItemsChange?: (items: TimelineItem[]) => void;
  trackType?: 'main' | 'overlay';
  allowOverlap?: boolean;
  onCrossTrackMove?: (itemId: string, targetTrack: 'main' | 'overlay', newStartTime: number) => void;
}

export const TimelineTrack = memo<TimelineTrackProps>(({
  items,
  timelineItems = items,
  currentTime,
  pxPerSec,
  onTimeChange,
  onCurrentTimeChange = onTimeChange,
  onTimelineItemsChange,
  onItemMove,
  onItemResize,
  onItemSelect,
  onSelectClip,
  selectedItemId,
  onItemsChange,
  trackType = 'main',
  allowOverlap = false,
  onCrossTrackMove
}) => {
  // Handle trim completion
  const handleTrimComplete = useCallback((clipId: string, newDuration: number, side: 'left' | 'right') => {
    const updatedItems = timelineItems.map(item => {
      if (item.id === clipId) {
        const prevIn = item.inSec ?? 0;
        const oldDuration = item.durationSec;
        const delta = Math.max(0, oldDuration - newDuration);
        const inSec = side === 'left' ? prevIn + delta : prevIn;
        const outSec = inSec + newDuration;
        return { ...item, durationSec: newDuration, inSec, outSec, wPx: newDuration * pxPerSec };
      }
      return item;
    });
    onTimelineItemsChange?.(updatedItems);
    onItemsChange?.(updatedItems);
    onItemResize?.(clipId, newDuration);
  }, [timelineItems, onTimelineItemsChange, onItemsChange, onItemResize, pxPerSec]);

  // Initialize clip trim functionality
  const { 
    isProcessing, 
    startTrim, 
    getPreviewWidth 
  } = useClipTrim({
    pxPerSec,
    onTrimComplete: handleTrimComplete
  });
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    dragItemId: null,
    startX: 0,
    initialStartTime: 0
  });

  // Calculate total duration and width
  const { totalDuration, totalWidth } = useMemo(() => {
    const maxEndTime = timelineItems.reduce((max, item) => {
      return Math.max(max, item.startTime + item.durationSec);
    }, 0);
    const duration = Math.max(maxEndTime, 60); // Minimum 60 seconds
    return {
      totalDuration: duration,
      totalWidth: duration * pxPerSec
    };
  }, [timelineItems, pxPerSec]);

  // Snapping logic
  const getSnapPosition = useCallback((targetTime: number, excludeId: string) => {
    const snapThreshold = 10 / pxPerSec; // 10px threshold in seconds
    
    // Snap to playhead
    if (Math.abs(targetTime - currentTime) < snapThreshold) {
      return currentTime;
    }
    
    // Snap to other clips
    for (const item of timelineItems) {
      if (item.id === excludeId) continue;
      
      const itemStart = item.startTime;
      const itemEnd = item.startTime + item.durationSec;
      
      if (Math.abs(targetTime - itemStart) < snapThreshold) {
        return itemStart;
      }
      if (Math.abs(targetTime - itemEnd) < snapThreshold) {
        return itemEnd;
      }
    }
    
    return targetTime;
  }, [timelineItems, currentTime, pxPerSec]);

  // Check for overlaps (only if overlap is not allowed)
  const wouldOverlap = useCallback((newStartTime: number, duration: number, excludeId: string) => {
    if (allowOverlap) return false; // Allow overlaps for overlay track
    
    const newEndTime = newStartTime + duration;
    
    return timelineItems.some(item => {
      if (item.id === excludeId) return false;
      
      const itemStart = item.startTime;
      const itemEnd = item.startTime + item.durationSec;
      
      return !(newEndTime <= itemStart || newStartTime >= itemEnd);
    });
  }, [timelineItems, allowOverlap]);

  // Handle drag start
  const handleDragStart = useCallback((itemId: string, startX: number) => {
    const item = timelineItems.find(i => i.id === itemId);
    if (!item) return;

    dragStateRef.current = {
      isDragging: true,
      dragItemId: itemId,
      startX,
      initialStartTime: item.startTime
    };
  }, [timelineItems]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.dragItemId) return;

    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const currentX = e.clientX - rect.left + track.scrollLeft;
    const deltaX = currentX - dragState.startX;
    const deltaTime = deltaX / pxPerSec;
    
    let newStartTime = Math.max(0, dragState.initialStartTime + deltaTime);
    
    // Apply snapping
    newStartTime = getSnapPosition(newStartTime, dragState.dragItemId);
    
    // Check for overlaps
    const draggedItem = timelineItems.find(i => i.id === dragState.dragItemId);
    if (draggedItem && wouldOverlap(newStartTime, draggedItem.durationSec, dragState.dragItemId)) {
      return; // Don't update if it would cause overlap
    }
    
    // Update ghost position for visual feedback
    dragStateRef.current.ghostPosition = newStartTime * pxPerSec;
    
    // Force re-render by updating the component
    if (trackRef.current) {
      trackRef.current.style.transform = `translateZ(0)`; // Trigger repaint
    }
  }, [timelineItems, pxPerSec, getSnapPosition, wouldOverlap]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    const dragState = dragStateRef.current;
    if (!dragState.isDragging || !dragState.dragItemId) return;

    const ghostPosition = dragState.ghostPosition;
    if (ghostPosition !== undefined) {
      const newStartTime = ghostPosition / pxPerSec;
      
      const updatedItems = timelineItems.map(item => {
        if (item.id === dragState.dragItemId) {
          return { ...item, startTime: newStartTime };
        }
        return item;
      });
      
      onTimelineItemsChange?.(updatedItems);
      onItemsChange?.(updatedItems);
      onItemMove?.(dragState.dragItemId, newStartTime);
    }

    // Reset drag state
    dragStateRef.current = {
      isDragging: false,
      dragItemId: null,
      startX: 0,
      initialStartTime: 0,
      ghostPosition: undefined
    };
  }, [timelineItems, pxPerSec, onTimelineItemsChange]);

  // Handle timeline click (set playhead)
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (dragStateRef.current.isDragging) return;
    
    const track = trackRef.current;
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left + track.scrollLeft;
    const clickTime = clickX / pxPerSec;
    
    onCurrentTimeChange?.(Math.max(0, Math.min(clickTime, totalDuration)));
  }, [pxPerSec, totalDuration, onCurrentTimeChange]);

  // Global event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);



  return (
    <div 
      className={`timeline-track ${trackType}-track`} 
      ref={trackRef} 
      onClick={handleTimelineClick}
      data-track-type={trackType}
    >
      {/* Clips */}
      <div 
        className={`clips-container ${trackType}-clips`} 
        style={{ 
          width: `${totalWidth}px`, 
          height: '100%',
          position: 'relative'
        }}
      >
        {timelineItems.map((item) => {
          const xPosition = dragStateRef.current.dragItemId === item.id && dragStateRef.current.ghostPosition !== undefined
            ? dragStateRef.current.ghostPosition
            : item.startTime * pxPerSec;
          const baseWidth = item.durationSec * pxPerSec;
          const previewWidth = getPreviewWidth(item.id, baseWidth);
          
          const isSelected = selectedItemId === item.id;
          
          return (
            <TimelineClip
              key={item.id}
              item={{...item, selected: isSelected}}
              xPosition={xPosition}
              width={baseWidth}
              previewWidth={previewWidth}
              isDragging={dragStateRef.current.dragItemId === item.id}
              isProcessing={isProcessing(item.id)}
              onDragStart={(startX) => handleDragStart(item.id, startX)}
              onSelect={() => {
                onSelectClip?.(item.id);
                onItemSelect?.(item.id);
              }}
              onTrimStart={startTrim}
              trackType={trackType}
            />
          );
        })}
        
        {/* Drop zone for cross-track drops */}
        <div 
          className={`track-drop-zone ${trackType}-drop-zone`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'auto'
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const data = JSON.parse(e.dataTransfer.getData('application/json'));
              if (data.type === 'media-clip' && data.clip) {
                // Calculate drop position
                const rect = trackRef.current?.getBoundingClientRect();
                if (rect) {
                  const dropX = e.clientX - rect.left;
                  const dropTime = dropX / pxPerSec;
                  
                  // Create timeline item from dropped clip
                  const timelineItem = {
                    id: `${data.clip.id}-${Date.now()}`, // Unique ID for new instance
                    name: data.clip.filename,
                    durationSec: data.clip.durationSec || 0,
                    startTime: Math.max(0, dropTime),
                    xPx: 0,
                    wPx: 0,
                    type: 'video',
                    path: data.clip.filePath,
                    selected: false,
                    filename: data.clip.filename,
                    createdAt: new Date().toISOString(),
                    sourceKind: 'import',
                    ...(trackType === 'overlay' && {
                      overlayProperties: {
                        position: { x: 0.7, y: 0.05 },
                        scale: 0.3,
                        opacity: 1.0,
                        includeAudio: false
                      }
                    })
                  };
                  
                  // Use cross-track move handler if available
                  if (onCrossTrackMove) {
                    onCrossTrackMove(timelineItem.id, trackType, Math.max(0, dropTime));
                  }
                }
              }
            } catch (error) {
              console.error('Failed to handle drop:', error);
            }
          }}
        />
      </div>
    </div>
  );
});

TimelineTrack.displayName = 'TimelineTrack';
