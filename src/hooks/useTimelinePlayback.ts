import { useState, useEffect, useCallback, useRef } from 'react';

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

interface UseTimelinePlaybackProps {
  timelineItems: TimelineItem[];
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const useTimelinePlayback = ({
  timelineItems,
  onTimeUpdate,
  onPlayStateChange
}: UseTimelinePlaybackProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [totalDuration, setTotalDuration] = useState(0);
  
  const animationFrameRef = useRef<number | null>(null);
  const playStartTimeRef = useRef<number>(0);
  const playStartPositionRef = useRef<number>(0);

  // Calculate total timeline duration
  useEffect(() => {
    if (timelineItems.length > 0) {
      const total = timelineItems.reduce((max, item) => {
        return Math.max(max, item.startTime + item.durationSec);
      }, 0);
      setTotalDuration(total);
    } else {
      setTotalDuration(0);
    }
  }, [timelineItems]);

  // Find current clip at given time
  const findClipAtTime = useCallback((time: number) => {
    for (const item of timelineItems) {
      const clipStart = item.startTime;
      const clipEnd = item.startTime + item.durationSec;
      
      if (time >= clipStart && time < clipEnd) {
        return {
          clip: item,
          localTime: time - clipStart,
          clipIndex: timelineItems.indexOf(item)
        };
      }
    }
    return null;
  }, [timelineItems]);

  // Animation loop for smooth playback
  const updatePlayback = useCallback(() => {
    if (!isPlaying) return;

    const now = performance.now();
    const elapsed = (now - playStartTimeRef.current) / 1000; // Convert to seconds
    const newTime = playStartPositionRef.current + (elapsed * playbackRate);

    if (newTime >= totalDuration) {
      // End of timeline reached
      setCurrentTime(totalDuration);
      setIsPlaying(false);
      onPlayStateChange?.(false);
      onTimeUpdate?.(totalDuration);
      return;
    }

    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(updatePlayback);
  }, [isPlaying, playbackRate, totalDuration, onTimeUpdate, onPlayStateChange]);

  // Start/stop animation loop
  useEffect(() => {
    if (isPlaying) {
      playStartTimeRef.current = performance.now();
      playStartPositionRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(updatePlayback);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updatePlayback]);

  // Notify parent of play state changes
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  const play = useCallback(() => {
    if (currentTime >= totalDuration) {
      // If at end, restart from beginning
      setCurrentTime(0);
    }
    setIsPlaying(true);
  }, [currentTime, totalDuration]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(totalDuration, time));
    setCurrentTime(clampedTime);
    
    // Update play start position for smooth continuation
    playStartPositionRef.current = clampedTime;
    playStartTimeRef.current = performance.now();
    
    onTimeUpdate?.(clampedTime);
  }, [totalDuration, onTimeUpdate]);

  const skipBy = useCallback((seconds: number) => {
    seekTo(currentTime + seconds);
  }, [currentTime, seekTo]);

  const goToStart = useCallback(() => {
    seekTo(0);
  }, [seekTo]);

  const goToEnd = useCallback(() => {
    seekTo(totalDuration);
  }, [seekTo, totalDuration]);

  const setRate = useCallback((rate: number) => {
    const validRate = Math.max(0.25, Math.min(4, rate)); // Clamp between 0.25x and 4x
    setPlaybackRate(validRate);
    
    // Update play start position to maintain smooth playback
    if (isPlaying) {
      playStartPositionRef.current = currentTime;
      playStartTimeRef.current = performance.now();
    }
  }, [currentTime, isPlaying]);

  // Get current clip info
  const currentClipInfo = findClipAtTime(currentTime);

  // Calculate progress percentage
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Format time for display
  const formatTime = useCallback((time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    isPlaying,
    currentTime,
    totalDuration,
    playbackRate,
    progress,
    currentClipInfo,
    
    // Actions
    play,
    pause,
    togglePlayPause,
    seekTo,
    skipBy,
    goToStart,
    goToEnd,
    setPlaybackRate: setRate,
    
    // Utilities
    formatTime,
    findClipAtTime
  };
};