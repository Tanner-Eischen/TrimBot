import React, { useCallback, memo } from 'react';
import { Play } from 'lucide-react';

interface ClipKeyframe {
  id: string;
  timeSec: number;
  property: string;
  value: number;
  interpolation: string;
}

interface KeyframeSet {
  opacity?: ClipKeyframe[];
  volume?: ClipKeyframe[];
}

interface FadePreset {
  type: 'fade-in' | 'fade-out';
  duration: number;
  enabled: boolean;
}

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
  keyframes?: KeyframeSet;
  fadePresets?: {
    fadeIn?: FadePreset;
    fadeOut?: FadePreset;
  };
}

interface TimelineClipProps {
  item: TimelineItem;
  xPosition?: number;
  width?: number;
  isDragging?: boolean;
  pxPerSec?: number;
  onDragStart?: (startX: number) => void;
  onDragEnd?: () => void;
  onSelect: () => void;
  onTrimStart?: (clipId: string, side: 'left' | 'right', startX: number, clipWidth: number, clipDuration: number) => void;
  isProcessing?: boolean;
  previewWidth?: number;
  style?: React.CSSProperties;
  trackType?: 'main' | 'overlay';
}

export const TimelineClip = memo<TimelineClipProps>(({ 
  item, 
  xPosition,
  width,
  isDragging = false, 
  onDragStart,
  onSelect,
  onTrimStart,
  isProcessing = false,
  previewWidth,
  style,
  trackType = 'main'
}) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const _rect = e.currentTarget.getBoundingClientRect();
    const parentElement = e.currentTarget.parentElement;
    const scrollLeft = parentElement?.scrollLeft || 0;
    const startX = e.clientX - _rect.left + scrollLeft;
    onDragStart?.(startX);
  }, [onDragStart]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onSelect();
    }
  }, [onSelect, isDragging]);

  const handleTrimMouseDown = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!onTrimStart || isProcessing) return;
    
    // const _rect2 = e.currentTarget.getBoundingClientRect();
    const parentElement = e.currentTarget.parentElement?.parentElement;
    const scrollLeft = parentElement?.scrollLeft || 0;
    const startX = e.clientX + scrollLeft;
    
    onTrimStart(item.id, side, startX, width || 100, item.durationSec);
  }, [onTrimStart, isProcessing, item.id, width, item.durationSec]);

  const displayWidth = previewWidth !== undefined ? previewWidth : (width || 100);

  // Render keyframe markers
  const renderKeyframeMarkers = () => {
    if (!item.keyframes?.opacity) return null;
    
    return item.keyframes.opacity.map(keyframe => (
      <div
        key={keyframe.id}
        className="keyframe-marker"
        style={{
          left: `${(keyframe.timeSec / item.durationSec) * 100}%`,
          opacity: keyframe.value
        }}
        title={`Opacity ${Math.round(keyframe.value * 100)}% at ${keyframe.timeSec.toFixed(1)}s`}
      />
    ));
  };

  // Render fade overlays
  const renderFadeOverlays = () => {
    const overlays = [];
    
    if (item.fadePresets?.fadeIn?.enabled) {
      overlays.push(
        <div 
          key="fade-in"
          className="fade-overlay fade-in"
          style={{ width: `${(item.fadePresets.fadeIn.duration / item.durationSec) * 100}%` }}
        />
      );
    }
    
    if (item.fadePresets?.fadeOut?.enabled) {
      overlays.push(
        <div 
          key="fade-out"
          className="fade-overlay fade-out"
          style={{ 
            width: `${(item.fadePresets.fadeOut.duration / item.durationSec) * 100}%`,
            right: 0
          }}
        />
      );
    }
    
    return overlays;
  };

  return (
    <div
      className={`clip ${trackType}-clip ${isDragging ? 'dragging' : ''} ${item.selected ? 'selected' : ''} ${isProcessing ? 'processing' : ''}`}
      style={{
        transform: `translate3d(${xPosition || 0}px, 0, 0)`,
        width: `${displayWidth}px`,
        top: '20px',
        height: '80px',
        ...style
      }}
      draggable={false}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-track-type={trackType}
    >
      {/* Fade overlays */}
      {renderFadeOverlays()}
      
      {/* Keyframe markers */}
      {renderKeyframeMarkers()}
      
      <div className="clip-content">
        <Play className="clip-icon" size={16} />
        <span className="clip-name">{item.filename || item.name}</span>
        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner" />
          </div>
        )}
      </div>
      
      {/* Resize handles */}
      <div 
        className="resize left" 
        onMouseDown={(e) => handleTrimMouseDown(e, 'left')}
        style={{ cursor: isProcessing ? 'not-allowed' : 'ew-resize' }}
      />
      <div 
        className="resize right" 
        onMouseDown={(e) => handleTrimMouseDown(e, 'right')}
        style={{ cursor: isProcessing ? 'not-allowed' : 'ew-resize' }}
      />
    </div>
  );
});

TimelineClip.displayName = 'TimelineClip';
