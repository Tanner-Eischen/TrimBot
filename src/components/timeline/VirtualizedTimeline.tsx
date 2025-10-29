import React, { useMemo, useCallback, useRef, useEffect, useState, memo } from 'react';
import { TimelineClip } from './TimelineClip';

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
}

interface VirtualizedTimelineProps {
  timelineItems: TimelineItem[];
  currentTime: number;
  pxPerSec: number;
  containerWidth: number;
  containerHeight?: number;
  onTimelineItemsChange: (items: TimelineItem[]) => void;
  onCurrentTimeChange: (time: number) => void;
  onSelectClip?: (clipId: string) => void;
  isPlaying?: boolean;
  onPlayheadDrag?: (isDragging: boolean) => void;
}

interface ViewportInfo {
  startTime: number;
  endTime: number;
  visibleItems: TimelineItem[];
  totalWidth: number;
}

const CLIP_HEIGHT = 60;
const BUFFER_MULTIPLIER = 0.5; // Show 50% more content outside viewport for smooth scrolling

export const VirtualizedTimeline = memo<VirtualizedTimelineProps>(({
  timelineItems,
  currentTime,
  pxPerSec,
  containerWidth,
  containerHeight = 200,
  onTimelineItemsChange,
  onCurrentTimeChange,
  onSelectClip,
  isPlaying = false,
  onPlayheadDrag
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  // Calculate viewport information
  const viewportInfo = useMemo((): ViewportInfo => {
    const viewportStartTime = scrollLeft / pxPerSec;
    const viewportEndTime = (scrollLeft + containerWidth) / pxPerSec;
    
    // Add buffer for smooth scrolling
    const bufferTime = (containerWidth * BUFFER_MULTIPLIER) / pxPerSec;
    const bufferedStartTime = Math.max(0, viewportStartTime - bufferTime);
    const bufferedEndTime = viewportEndTime + bufferTime;
    
    // Filter items that are visible in the buffered viewport
    const visibleItems = timelineItems.filter(item => {
      const itemStart = item.startTime;
      const itemEnd = item.startTime + item.durationSec;
      
      // Item is visible if it overlaps with the buffered viewport
      return !(itemEnd < bufferedStartTime || itemStart > bufferedEndTime);
    });
    
    // Calculate total timeline width
    const maxEndTime = timelineItems.reduce((max, item) => {
      return Math.max(max, item.startTime + item.durationSec);
    }, 0);
    const totalDuration = Math.max(maxEndTime, 60); // Minimum 60 seconds
    const totalWidth = totalDuration * pxPerSec;
    
    return {
      startTime: bufferedStartTime,
      endTime: bufferedEndTime,
      visibleItems,
      totalWidth
    };
  }, [timelineItems, scrollLeft, containerWidth, pxPerSec]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollLeft = e.currentTarget.scrollLeft;
    setScrollLeft(newScrollLeft);
  }, []);

  // Handle timeline click (set playhead)
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingPlayhead) return; // Don't handle clicks while dragging playhead
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left + scrollLeft;
    const clickTime = clickX / pxPerSec;
    
    onCurrentTimeChange(Math.max(0, clickTime));
  }, [scrollLeft, pxPerSec, onCurrentTimeChange, isDraggingPlayhead]);

  // Playhead drag handlers
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX - rect.left + scrollLeft;
    
    setIsDraggingPlayhead(true);
    setDragStartX(startX);
    setDragStartTime(currentTime);
    onPlayheadDrag?.(true);
  }, [scrollLeft, currentTime, onPlayheadDrag]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingPlayhead) return;
    
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const currentX = e.clientX - rect.left + scrollLeft;
    const deltaX = currentX - dragStartX;
    const deltaTime = deltaX / pxPerSec;
    const newTime = Math.max(0, dragStartTime + deltaTime);
    
    onCurrentTimeChange(newTime);
  }, [isDraggingPlayhead, scrollLeft, dragStartX, dragStartTime, pxPerSec, onCurrentTimeChange]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingPlayhead) {
      setIsDraggingPlayhead(false);
      onPlayheadDrag?.(false);
    }
  }, [isDraggingPlayhead, onPlayheadDrag]);

  // Add global mouse event listeners for playhead dragging
  useEffect(() => {
    if (isDraggingPlayhead) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingPlayhead, handleMouseMove, handleMouseUp]);

  // Handle clip drag operations
  const handleClipDragStart = useCallback((itemId: string, startX: number) => {
    // Implementation for drag start - similar to TimelineTrack but optimized for virtualization
    console.log('Drag start:', itemId, startX);
  }, []);

  const handleClipDragEnd = useCallback((itemId: string, newStartTime: number) => {
    const updatedItems = timelineItems.map(item => {
      if (item.id === itemId) {
        return { ...item, startTime: Math.max(0, newStartTime) };
      }
      return item;
    });
    
    onTimelineItemsChange(updatedItems);
  }, [timelineItems, onTimelineItemsChange]);

  // Auto-scroll to follow playhead during playback
  useEffect(() => {
    if (!isPlaying || isDraggingPlayhead) return;
    
    const container = containerRef.current;
    if (!container) return;

    const playheadX = currentTime * pxPerSec;
    const viewportStart = scrollLeft;
    const viewportEnd = scrollLeft + containerWidth;
    const margin = containerWidth * 0.1; // 10% margin

    // Auto-scroll if playhead is near viewport edges
    if (playheadX < viewportStart + margin) {
      container.scrollLeft = Math.max(0, playheadX - margin);
    } else if (playheadX > viewportEnd - margin) {
      container.scrollLeft = playheadX - containerWidth + margin;
    }
  }, [currentTime, pxPerSec, scrollLeft, containerWidth, isPlaying, isDraggingPlayhead]);

  // Render time markers
  const renderTimeMarkers = useCallback(() => {
    const markers = [];
    const markerInterval = pxPerSec >= 50 ? 1 : pxPerSec >= 20 ? 5 : 10; // Adaptive marker density
    
    const startMarker = Math.floor(viewportInfo.startTime / markerInterval) * markerInterval;
    const endMarker = Math.ceil(viewportInfo.endTime / markerInterval) * markerInterval;
    
    for (let time = startMarker; time <= endMarker; time += markerInterval) {
      const x = time * pxPerSec;
      const isMainMarker = time % (markerInterval * 5) === 0;
      
      markers.push(
        <div
          key={time}
          className={`absolute top-0 ${isMainMarker ? 'h-6 bg-gray-400' : 'h-3 bg-gray-300'} w-px`}
          style={{ left: x }}
        >
          {isMainMarker && (
            <span className="absolute top-6 left-1 text-xs text-gray-600 whitespace-nowrap">
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
      );
    }
    
    return markers;
  }, [viewportInfo, pxPerSec]);

  // Render playhead with drag functionality
  const renderPlayhead = useCallback(() => {
    const playheadX = currentTime * pxPerSec;
    
    return (
      <div
        ref={playheadRef}
        className={`absolute top-0 bottom-0 w-0.5 z-20 cursor-col-resize group ${
          isDraggingPlayhead ? 'bg-blue-500' : 'bg-red-500'
        } ${isPlaying ? 'shadow-lg' : ''}`}
        style={{ left: playheadX }}
        onMouseDown={handlePlayheadMouseDown}
      >
        {/* Playhead Handle */}
        <div 
          className={`absolute -top-2 -left-2 w-4 h-4 rounded-full transition-all duration-150 ${
            isDraggingPlayhead ? 'bg-blue-500 scale-125' : 'bg-red-500 group-hover:scale-110'
          } ${isPlaying ? 'animate-pulse' : ''}`}
        />
        
        {/* Drag Area (invisible but larger for easier interaction) */}
        <div className="absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize" />
        
        {/* Time Display on Drag */}
        {isDraggingPlayhead && (
          <div className="absolute -top-8 -left-8 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
          </div>
        )}
      </div>
    );
  }, [currentTime, pxPerSec, isDraggingPlayhead, isPlaying, handlePlayheadMouseDown]);

  return (
    <div className="relative bg-gray-100 border rounded-lg overflow-hidden">
      {/* Timeline Header */}
      <div className="h-8 bg-gray-200 border-b relative overflow-hidden">
        <div
          className="relative h-full"
          style={{ width: viewportInfo.totalWidth }}
        >
          {renderTimeMarkers()}
        </div>
      </div>

      {/* Timeline Content */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
        onClick={handleTimelineClick}
      >
        {/* Timeline Background */}
        <div
          className="relative bg-gray-50"
          style={{ 
            width: viewportInfo.totalWidth,
            height: containerHeight,
            minHeight: CLIP_HEIGHT + 20
          }}
        >
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: Math.ceil(viewportInfo.totalWidth / (pxPerSec * 5)) }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gray-200"
                style={{ left: i * pxPerSec * 5 }}
              />
            ))}
          </div>

          {/* Visible Timeline Items */}
          {viewportInfo.visibleItems.map((item) => (
            <TimelineClip
              key={item.id}
              item={item}
              pxPerSec={pxPerSec}
              onDragStart={(startX) => handleClipDragStart(item.id, startX)}
              onDragEnd={() => handleClipDragEnd(item.id, item.startTime)}
              onSelect={() => onSelectClip?.(item.id)}
              style={{
                position: 'absolute',
                left: item.startTime * pxPerSec,
                top: 10,
                width: item.durationSec * pxPerSec,
                height: CLIP_HEIGHT
              }}
            />
          ))}

          {/* Playhead */}
          {renderPlayhead()}
        </div>
      </div>

      {/* Timeline Info */}
      <div className="px-3 py-2 bg-gray-100 border-t text-xs text-gray-600 flex justify-between">
        <span>
          {viewportInfo.visibleItems.length} of {timelineItems.length} clips visible
        </span>
        <span>
          Zoom: {pxPerSec.toFixed(1)}px/sec | Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
        </span>
      </div>
    </div>
  );
});

VirtualizedTimeline.displayName = 'VirtualizedTimeline';