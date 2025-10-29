import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, SkipBack, SkipForward, AlertCircle, Settings, Layers } from 'lucide-react';

// Import Tauri's convertFileSrc for proper asset URL handling
const convertFileSrc = window.__TAURI__?.core?.convertFileSrc || ((filePath: string) => {
  // Browser fallback - return the path as-is for development
  return filePath;
});

import type { TimelineItem } from '../../types';

// Helper to resolve start time across legacy and new timeline item shapes
const getStartTime = (item: TimelineItem): number => {
  return item.startTime;
};

interface DualVideoPreviewProps {
  selectedClip?: any;
  currentTime: number;
  onTimeChange: (time: number) => void;
  timelineItems: TimelineItem[];
  isTimelinePlaying: boolean;
  onTimelinePlayToggle: () => void;
  onTimelineSeek: (time: number) => void;
  showTimelineControls: boolean;
}

const DualVideoPreview: React.FC<DualVideoPreviewProps> = ({
  selectedClip,
  currentTime = 0,
  onTimeChange,
  timelineItems = [],
  isTimelinePlaying = false,
  onTimelinePlayToggle,
  onTimelineSeek,
  showTimelineControls = false
}) => {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [totalTimelineDuration, setTotalTimelineDuration] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const [overlayFadeOpacity, setOverlayFadeOpacity] = useState(1);
  const [showOverlayControls, setShowOverlayControls] = useState(false);

  // Calculate total timeline duration
  useEffect(() => {
    if (timelineItems.length > 0) {
      const total = timelineItems.reduce((max, item) => {
        return Math.max(max, getStartTime(item) + item.durationSec);
      }, 0);
      setTotalTimelineDuration(total);
    }
  }, [timelineItems]);

  // Separate main track and overlay track items
  const mainTrackItems = timelineItems.filter(item => !item.overlayProperties);
  const overlayTrackItems = timelineItems.filter(item => item.overlayProperties);

  // Find current clip based on timeline time for a specific track
  const findCurrentClip = useCallback((time: number, trackItems: TimelineItem[]) => {
    for (const item of trackItems) {
      const clipStart = getStartTime(item);
      const clipEnd = clipStart + item.durationSec;
      
      if (time >= clipStart && time < clipEnd) {
        return {
          clip: item,
          localTime: time - clipStart
        };
      }
    }
    return null;
  }, []);

  // Calculate fade opacity based on current time and clip fade settings
  const calculateFadeOpacity = useCallback((currentClipInfo: any, localTime: number) => {
    if (!currentClipInfo) return 1;
    
    const { clip } = currentClipInfo;
    let opacity = 1;
    
    // Apply fade-in effect
    if (clip.fadePresets?.fadeIn?.enabled) {
      const fadeInDuration = clip.fadePresets.fadeIn.duration;
      if (localTime <= fadeInDuration) {
        opacity = Math.min(opacity, localTime / fadeInDuration);
      }
    }
    
    // Apply fade-out effect
    if (clip.fadePresets?.fadeOut?.enabled) {
      const fadeOutDuration = clip.fadePresets.fadeOut.duration;
      const fadeOutStart = clip.durationSec - fadeOutDuration;
      if (localTime >= fadeOutStart) {
        const fadeProgress = (localTime - fadeOutStart) / fadeOutDuration;
        opacity = Math.min(opacity, 1 - fadeProgress);
      }
    }
    
    return Math.max(0, Math.min(1, opacity));
  }, []);

  // Handle main video synchronization
  useEffect(() => {
    if (!showTimelineControls) return;

    const mainVideo = mainVideoRef.current;
    if (!mainVideo) return;

    const currentMainClip = findCurrentClip(currentTime, mainTrackItems);
    
    if (currentMainClip) {
      const { clip: currentClip, localTime } = currentMainClip;
      
      // Calculate and apply fade opacity
      const opacity = calculateFadeOpacity(currentMainClip, localTime);
      setFadeOpacity(opacity);
      
      // Load clip if different from current
      if (mainVideo.src !== convertFileSrc(currentClip.path)) {
        mainVideo.src = convertFileSrc(currentClip.path);
        mainVideo.load();
        
        mainVideo.addEventListener('loadeddata', () => {
          mainVideo.currentTime = localTime;
          if (isTimelinePlaying) {
            mainVideo.play().catch(console.error);
          }
        }, { once: true });
      } else {
        // Same clip, just seek
        const timeDiff = Math.abs(mainVideo.currentTime - localTime);
        if (timeDiff > 0.1) {
          mainVideo.currentTime = localTime;
        }
      }
    } else {
      // No main clip at current time, pause main video
      if (!mainVideo.paused) {
        mainVideo.pause();
      }
      setFadeOpacity(0);
    }
  }, [currentTime, isTimelinePlaying, showTimelineControls, findCurrentClip, calculateFadeOpacity, mainTrackItems]);

  // Handle overlay video synchronization
  useEffect(() => {
    if (!showTimelineControls) return;

    const overlayVideo = overlayVideoRef.current;
    if (!overlayVideo) return;

    const currentOverlayClip = findCurrentClip(currentTime, overlayTrackItems);
    
    if (currentOverlayClip) {
      const { clip: currentClip, localTime } = currentOverlayClip;
      
      // Calculate and apply fade opacity
      const opacity = calculateFadeOpacity(currentOverlayClip, localTime);
      setOverlayFadeOpacity(opacity);
      
      // Load clip if different from current
      if (overlayVideo.src !== convertFileSrc(currentClip.path)) {
        overlayVideo.src = convertFileSrc(currentClip.path);
        overlayVideo.load();
        
        overlayVideo.addEventListener('loadeddata', () => {
          overlayVideo.currentTime = localTime;
          if (isTimelinePlaying) {
            overlayVideo.play().catch(console.error);
          }
        }, { once: true });
      } else {
        // Same clip, just seek
        const timeDiff = Math.abs(overlayVideo.currentTime - localTime);
        if (timeDiff > 0.1) {
          overlayVideo.currentTime = localTime;
        }
      }
    } else {
      // No overlay clip at current time, pause overlay video
      if (!overlayVideo.paused) {
        overlayVideo.pause();
      }
      setOverlayFadeOpacity(0);
    }
  }, [currentTime, isTimelinePlaying, showTimelineControls, findCurrentClip, calculateFadeOpacity, overlayTrackItems]);

  // Sync playing state with timeline for both videos
  useEffect(() => {
    const mainVideo = mainVideoRef.current;
    const overlayVideo = overlayVideoRef.current;
    
    if (!showTimelineControls) return;

    // Sync main video
    if (mainVideo) {
      if (isTimelinePlaying && mainVideo.paused && fadeOpacity > 0) {
        mainVideo.play().catch(console.error);
      } else if (!isTimelinePlaying && !mainVideo.paused) {
        mainVideo.pause();
      }
    }

    // Sync overlay video
    if (overlayVideo) {
      if (isTimelinePlaying && overlayVideo.paused && overlayFadeOpacity > 0) {
        overlayVideo.play().catch(console.error);
      } else if (!isTimelinePlaying && !overlayVideo.paused) {
        overlayVideo.pause();
      }
    }
  }, [isTimelinePlaying, showTimelineControls, fadeOpacity, overlayFadeOpacity]);

  // Handle single clip preview (non-timeline mode)
  useEffect(() => {
    if (showTimelineControls || !selectedClip) return;

    const mainVideo = mainVideoRef.current;
    if (!mainVideo) return;

    // Reset error state when clip changes
    setHasError(false);
    setErrorMessage('');

    const handleLoadedMetadata = () => {
      const videoDuration = mainVideo.duration;
      setDuration(videoDuration);
      setHasError(false);
    };

    const handleTimeUpdate = () => {
      const currentVideoTime = mainVideo.currentTime;
      setLocalCurrentTime(currentVideoTime);
      onTimeChange?.(currentVideoTime);
      
      // Calculate fade opacity for single clip
      if (selectedClip) {
        const clipInfo = { clip: selectedClip, localTime: currentVideoTime };
        const opacity = calculateFadeOpacity(clipInfo, currentVideoTime);
        setFadeOpacity(opacity);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      setErrorMessage('Failed to load video');
    };

    // Set video source
    if (mainVideo.src !== convertFileSrc(selectedClip.path)) {
      mainVideo.src = convertFileSrc(selectedClip.path);
      mainVideo.load();
    }

    // Add event listeners
    mainVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
    mainVideo.addEventListener('timeupdate', handleTimeUpdate);
    mainVideo.addEventListener('play', handlePlay);
    mainVideo.addEventListener('pause', handlePause);
    mainVideo.addEventListener('error', handleError);

    return () => {
      mainVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mainVideo.removeEventListener('timeupdate', handleTimeUpdate);
      mainVideo.removeEventListener('play', handlePlay);
      mainVideo.removeEventListener('pause', handlePause);
      mainVideo.removeEventListener('error', handleError);
    };
  }, [selectedClip, showTimelineControls, onTimeChange, calculateFadeOpacity]);

  // Control functions
  const togglePlayPause = () => {
    if (showTimelineControls && onTimelinePlayToggle) {
      onTimelinePlayToggle();
    } else {
      const mainVideo = mainVideoRef.current;
      if (!mainVideo || hasError) return;

      if (mainVideo.paused) {
        mainVideo.play().catch(console.error);
      } else {
        mainVideo.pause();
      }
    }
  };

  const skip = (seconds: number) => {
    if (showTimelineControls && onTimelineSeek) {
      const newTime = Math.max(0, Math.min(totalTimelineDuration, currentTime + seconds));
      onTimelineSeek(newTime);
    } else {
      const mainVideo = mainVideoRef.current;
      if (!mainVideo || hasError) return;
      
      const newTime = Math.max(0, Math.min(duration, mainVideo.currentTime + seconds));
      mainVideo.currentTime = newTime;
      setLocalCurrentTime(newTime);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    if (showTimelineControls && onTimelineSeek) {
      const newTimelineTime = (clickX / rect.width) * totalTimelineDuration;
      onTimelineSeek(newTimelineTime);
    } else {
      const mainVideo = mainVideoRef.current;
      if (!mainVideo || hasError) return;
      
      const newTime = (clickX / rect.width) * duration;
      mainVideo.currentTime = newTime;
      setLocalCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    const mainVideo = mainVideoRef.current;
    const overlayVideo = overlayVideoRef.current;
    
    if (mainVideo && !hasError) {
      mainVideo.volume = newVolume;
    }
    
    // Handle overlay audio based on overlay properties
    if (overlayVideo) {
      const currentOverlayClip = findCurrentClip(currentTime, overlayTrackItems);
      if (currentOverlayClip?.clip.overlayProperties?.includeAudio) {
        overlayVideo.volume = newVolume;
      } else {
        overlayVideo.volume = 0;
      }
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current overlay clip for positioning
  const currentOverlayClip = findCurrentClip(currentTime, overlayTrackItems);
  const overlayStyle = currentOverlayClip?.clip.overlayProperties ? {
    transform: `translate(${currentOverlayClip.clip.overlayProperties.position?.x || 0.7}%, ${currentOverlayClip.clip.overlayProperties.position?.y || 0.05}%) scale(${currentOverlayClip.clip.overlayProperties.scale || 0.3})`,
    opacity: (currentOverlayClip.clip.overlayProperties.opacity || 1) * overlayFadeOpacity,
  } : {};

  // Get display values
  const displayTime = showTimelineControls ? currentTime : localCurrentTime;
  const displayDuration = showTimelineControls ? totalTimelineDuration : duration;
  const displayProgress = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  if (!selectedClip && !showTimelineControls) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Video Preview</h2>
        <div className="text-center text-gray-500">
          <p>Select a clip from the media library to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {showTimelineControls ? 'Timeline Preview' : 'Video Preview'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverlayControls(!showOverlayControls)}
            className={`p-2 rounded ${showOverlayControls ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100'}`}
            title="Toggle overlay controls"
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            className="p-2 rounded hover:bg-gray-100"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div 
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden mb-4"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Main Video */}
        <video
          ref={mainVideoRef}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ 
            opacity: fadeOpacity,
            transition: 'opacity 0.1s ease'
          }}
          playsInline
          preload="metadata"
        />

        {/* Overlay Video */}
        {overlayTrackItems.length > 0 && (
          <video
            ref={overlayVideoRef}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            style={{
              ...overlayStyle,
              transition: 'opacity 0.1s ease, transform 0.1s ease',
              zIndex: 10
            }}
            playsInline
            preload="metadata"
            muted={!currentOverlayClip?.clip.overlayProperties?.includeAudio}
          />
        )}

        {/* Overlay Controls Indicator */}
        {showOverlayControls && currentOverlayClip && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded text-xs font-medium z-20">
            Overlay Active
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-30 cursor-pointer z-20"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Video Info */}
        <div className="text-sm text-gray-600">
          <p className="font-medium">
            {showTimelineControls 
              ? `Timeline (${mainTrackItems.length} main, ${overlayTrackItems.length} overlay)` 
              : selectedClip?.filename || 'No clip selected'
            }
          </p>
          <p>{formatTime(displayTime)} / {formatTime(displayDuration)}</p>
          {hasError && (
            <p className="text-red-500 text-xs mt-1">⚠ {errorMessage}</p>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => skip(-10)}
            className={`p-2 rounded ${hasError ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            title="Skip back 10s"
            disabled={hasError}
          >
            <SkipBack className="h-4 w-4" />
          </button>
          
          <button
            onClick={togglePlayPause}
            className={`p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 ${hasError ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={hasError}
          >
            {(showTimelineControls ? isTimelinePlaying : isPlaying) ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
          
          <button
            onClick={() => skip(10)}
            className={`p-2 rounded ${hasError ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
            title="Skip forward 10s"
            disabled={hasError}
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-gray-500" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-500 w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Overlay Info */}
        {showOverlayControls && overlayTrackItems.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-amber-600 mb-2">Overlay Track</h4>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Clips: {overlayTrackItems.length}</p>
              {currentOverlayClip && (
                <div>
                  <p>Current: {currentOverlayClip.clip.filename}</p>
                  <p>Position: {currentOverlayClip.clip.overlayProperties?.position?.x || 0.7}%, {currentOverlayClip.clip.overlayProperties?.position?.y || 0.05}%</p>
                  <p>Scale: {Math.round((currentOverlayClip.clip.overlayProperties?.scale || 1) * 100)}%</p>
                  <p>Audio: {currentOverlayClip.clip.overlayProperties?.includeAudio ? 'Included' : 'Muted'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DualVideoPreview;
