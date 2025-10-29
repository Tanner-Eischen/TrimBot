import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, SkipBack, SkipForward, AlertCircle, Settings } from 'lucide-react';

// Import Tauri's convertFileSrc for proper asset URL handling
const convertFileSrc = window.__TAURI__?.core?.convertFileSrc || ((filePath) => {
  // Browser fallback - return the path as-is for development
  return filePath;
});

const VideoPreview = forwardRef(({ 
  clip, 
  onDurationUpdate, 
  timelineItems = [], 
  currentTime = 0, 
  isTimelinePlaying = false,
  onTimelinePlayToggle,
  onTimelineSeek,
  showTimelineControls = false 
}, ref) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewQuality, setPreviewQuality] = useState('high'); // 'high' or 'low'
  const [totalTimelineDuration, setTotalTimelineDuration] = useState(0);
  const [smoothPlayback, setSmoothPlayback] = useState(true);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [fadeOpacity, setFadeOpacity] = useState(1);

  // Expose video element and methods to parent
  useImperativeHandle(ref, () => ({
    videoElement: videoRef.current,
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seekTo: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0
  }), []);

  // Calculate total timeline duration
  useEffect(() => {
    if (timelineItems.length > 0) {
      const total = timelineItems.reduce((max, item) => {
        return Math.max(max, item.startTime + item.durationSec);
      }, 0);
      setTotalTimelineDuration(total);
    }
  }, [timelineItems]);

  // Find current clip based on timeline time
  const findCurrentClip = useCallback((time) => {
    for (const item of timelineItems) {
      const clipStart = item.startTime;
      const clipEnd = item.startTime + item.durationSec;
      
      if (time >= clipStart && time < clipEnd) {
        return {
          clip: item,
          localTime: time - clipStart
        };
      }
    }
    return null;
  }, [timelineItems]);

  // Calculate fade opacity based on current time and clip fade settings
  const calculateFadeOpacity = useCallback((currentClipInfo, localTime) => {
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

  // Handle timeline playback synchronization
  useEffect(() => {
    if (!showTimelineControls || !isTimelinePlaying) return;

    const video = videoRef.current;
    if (!video) return;

    const currentClipInfo = findCurrentClip(currentTime);
    
    if (currentClipInfo) {
      const { clip: currentClip, localTime } = currentClipInfo;
      
      // Calculate and apply fade opacity
      const opacity = calculateFadeOpacity(currentClipInfo, localTime);
      setFadeOpacity(opacity);
      
      // Load clip if different from current
      if (video.src !== convertFileSrc(currentClip.path)) {
        video.src = convertFileSrc(currentClip.path);
        video.load();
        
        video.addEventListener('loadeddata', () => {
          video.currentTime = localTime;
          if (isTimelinePlaying) {
            video.play().catch(console.error);
          }
        }, { once: true });
      } else {
        // Same clip, just seek
        const timeDiff = Math.abs(video.currentTime - localTime);
        if (timeDiff > 0.1) { // Only seek if significant difference
          video.currentTime = localTime;
        }
      }
    }
  }, [currentTime, isTimelinePlaying, showTimelineControls, findCurrentClip, calculateFadeOpacity]);

  // Sync playing state with timeline
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showTimelineControls) return;

    if (isTimelinePlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!isTimelinePlaying && !video.paused) {
      video.pause();
    }
  }, [isTimelinePlaying, showTimelineControls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip) return;

    // Reset error state when clip changes
    setHasError(false);
    setErrorMessage('');

    const handleLoadedMetadata = () => {
      const videoDuration = video.duration;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      setDuration(videoDuration);
      setHasError(false);
      
      // Report duration and dimensions to parent
      if (onDurationUpdate) {
        onDurationUpdate(clip.id, videoDuration, videoWidth, videoHeight);
      }
    };

    const handleTimeUpdate = () => {
      const currentVideoTime = video.currentTime;
      setLocalCurrentTime(currentVideoTime);
      
      // If in timeline mode, update timeline time and fade opacity
      if (showTimelineControls && onTimelineSeek) {
        const currentClipInfo = findCurrentClip(currentTime);
        if (currentClipInfo) {
          const timelineTime = currentClipInfo.clip.startTime + currentVideoTime;
          onTimelineSeek(timelineTime);
          
          // Update fade opacity for current clip
          const opacity = calculateFadeOpacity(currentClipInfo, currentVideoTime);
          setFadeOpacity(opacity);
        }
      } else if (clip) {
        // For single clip preview, calculate fade opacity
        const clipInfo = { clip, localTime: currentVideoTime };
        const opacity = calculateFadeOpacity(clipInfo, currentVideoTime);
        setFadeOpacity(opacity);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      if (showTimelineControls && onTimelineSeek) {
        // In timeline mode, handle clip transitions
        const currentClipInfo = findCurrentClip(currentTime);
        if (currentClipInfo) {
          const nextTime = currentClipInfo.clip.startTime + currentClipInfo.clip.durationSec;
          if (nextTime < totalTimelineDuration) {
            onTimelineSeek(nextTime);
          } else {
            // End of timeline
            onTimelinePlayToggle?.(false);
          }
        }
      } else {
        setIsPlaying(false);
      }
    };

    const handleError = (e) => {
      console.error('Video load error for:', clip.path, e);
      setHasError(true);
      setIsPlaying(false);
      
      // Determine error message based on the error type
      const error = e.target?.error;
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            setErrorMessage('Video loading was aborted');
            break;
          case error.MEDIA_ERR_NETWORK:
            setErrorMessage('Network error occurred while loading video');
            break;
          case error.MEDIA_ERR_DECODE:
            setErrorMessage('Video format not supported or corrupted');
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setErrorMessage('Video file not found or format not supported');
            break;
          default:
            setErrorMessage('Unknown error occurred while loading video');
        }
      } else {
        setErrorMessage('Video file not found or cannot be loaded');
      }
    };

    const handleLoadStart = () => {
      console.log('Video loading started:', clip.path);
      setHasError(false);
    };

    const handleLoadedData = () => {
      console.log('Video data loaded successfully');
      setHasError(false);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          setBufferHealth((bufferedEnd / duration) * 100);
        }
      }
    };

    const handleWaiting = () => {
      if (smoothPlayback) {
        console.log('Video buffering...');
      }
    };

    const handleCanPlay = () => {
      if (smoothPlayback) {
        console.log('Video ready to play');
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [clip, onDurationUpdate, showTimelineControls, onTimelineSeek, onTimelinePlayToggle, findCurrentClip, currentTime, totalTimelineDuration]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (showTimelineControls && onTimelinePlayToggle) {
      // In timeline mode, use timeline controls
      onTimelinePlayToggle(!isTimelinePlaying);
    } else {
      // Single clip mode
      if (isPlaying) {
        video.pause();
      } else {
        video.play().catch(err => {
          console.error('Error playing video:', err);
          setHasError(true);
          setErrorMessage('Failed to play video');
        });
      }
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || hasError) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    if (showTimelineControls && onTimelineSeek) {
      // Timeline mode - seek within timeline
      const newTimelineTime = (clickX / rect.width) * totalTimelineDuration;
      onTimelineSeek(newTimelineTime);
    } else {
      // Single clip mode
      const newTime = (clickX / rect.width) * duration;
      video.currentTime = newTime;
      setLocalCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    const video = videoRef.current;
    if (video && !hasError) {
      video.volume = newVolume;
    }
  };

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (showTimelineControls && onTimelineSeek) {
      // Timeline mode
      const newTime = Math.max(0, Math.min(totalTimelineDuration, currentTime + seconds));
      onTimelineSeek(newTime);
    } else {
      // Single clip mode
      video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePreviewQuality = () => {
    setPreviewQuality(prev => prev === 'high' ? 'low' : 'high');
  };

  // Handle robust playback - start from middle, handle clip changes
  const handleRobustPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    // If starting from middle of timeline, find appropriate clip
    if (showTimelineControls && currentTime > 0) {
      const currentClipInfo = findCurrentClip(currentTime);
      if (currentClipInfo && currentClipInfo.clip.path !== video.src) {
        // Need to switch to different clip
        video.src = convertFileSrc(currentClipInfo.clip.path);
        video.load();
        
        video.addEventListener('loadeddata', () => {
          video.currentTime = currentClipInfo.localTime;
          if (isTimelinePlaying) {
            video.play().catch(console.error);
          }
        }, { once: true });
      }
    }
  }, [showTimelineControls, currentTime, findCurrentClip, isTimelinePlaying, hasError]);

  // Error recovery mechanism
  const handleErrorRecovery = useCallback(() => {
    const video = videoRef.current;
    if (!video || !hasError) return;

    console.log('Attempting error recovery...');
    
    // Try reloading the video
    setTimeout(() => {
      if (clip) {
        video.src = convertFileSrc(clip.path);
        video.load();
        setHasError(false);
        setErrorMessage('');
      }
    }, 1000);
  }, [clip, hasError]);

  // Use robust playback when timeline changes
  useEffect(() => {
    if (showTimelineControls) {
      handleRobustPlayback();
    }
  }, [showTimelineControls, handleRobustPlayback]);

  // Get display time and duration
  const displayTime = showTimelineControls ? currentTime : localCurrentTime;
  const displayDuration = showTimelineControls ? totalTimelineDuration : duration;
  const displayProgress = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  if (!clip && !showTimelineControls) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Video Preview</h2>
        <div className="text-center text-gray-500">
          <p>Select a video from the library to preview</p>
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
        
        {/* Performance Options */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePreviewQuality}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={`Preview Quality: ${previewQuality === 'high' ? 'High' : 'Low'}`}
            >
              <Settings className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-500 capitalize">{previewQuality}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={smoothPlayback}
                onChange={(e) => setSmoothPlayback(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Smooth</span>
            </label>
          </div>
          
          {bufferHealth > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(100, bufferHealth)}%` }}
                />
              </div>
              <span>{Math.round(bufferHealth)}%</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {hasError ? (
            <div className="w-full h-48 flex items-center justify-center bg-gray-800 text-white">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400" />
                <p className="text-sm font-medium">Video Load Error</p>
                <p className="text-xs text-gray-300 mt-1">{errorMessage}</p>
                <p className="text-xs text-gray-400 mt-2">
                  File: {clip?.filename || 'Timeline'}
                </p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={clip ? convertFileSrc(clip.path) : ''}
              className="w-full h-auto max-h-96"
              preload={smoothPlayback ? "auto" : "metadata"}
              style={{
                filter: previewQuality === 'low' ? 'blur(0.5px)' : 'none',
                opacity: fadeOpacity,
                transition: 'opacity 0.1s ease-in-out'
              }}
            />
          )}
          
          {/* Timeline Preview Overlay */}
          {showTimelineControls && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
              Timeline Mode
            </div>
          )}
          
          {/* Fade Preview Indicator */}
          {fadeOpacity < 1 && (
            <div className="absolute top-2 right-2 bg-blue-600 bg-opacity-90 text-white px-2 py-1 rounded text-xs">
              Fade: {Math.round(fadeOpacity * 100)}%
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="text-sm text-gray-600">
          <p className="font-medium">
            {showTimelineControls 
              ? `Timeline (${timelineItems.length} clips)` 
              : clip?.filename || 'No clip selected'
            }
          </p>
          <p>{formatTime(displayTime)} / {formatTime(displayDuration)}</p>
          {hasError && (
            <div className="flex items-center justify-between">
              <p className="text-red-500 text-xs mt-1">⚠ {errorMessage}</p>
              <button
                onClick={handleErrorRecovery}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
            </div>
          )}
          {showTimelineControls && (
            <p className="text-xs text-blue-600 mt-1">
              ℹ Transitions will appear in final export
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div 
          className={`w-full h-2 bg-gray-200 rounded-full ${hasError ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          onClick={hasError ? undefined : handleSeek}
        >
          <div 
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
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
              className={`p-2 text-white rounded ${hasError ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
              disabled={hasError}
            >
              {(showTimelineControls ? isTimelinePlaying : isPlaying) ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
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

          <div className="flex items-center space-x-2">
            <Volume2 className={`h-4 w-4 ${hasError ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className={`w-20 ${hasError ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={hasError}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default VideoPreview;