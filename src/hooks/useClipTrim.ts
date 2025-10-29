import { useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';

interface TrimState {
  isActive: boolean;
  clipId: string | null;
  side: 'left' | 'right' | null;
  startX: number;
  startWidth: number;
  originalDuration: number;
  currentOffset: number;
  minWidth: number;
  maxWidth: number;
}

interface UseClipTrimProps {
  pxPerSec: number;
  onTrimComplete: (clipId: string, newDuration: number, side: 'left' | 'right') => void;
}

export const useClipTrim = ({ pxPerSec, onTrimComplete }: UseClipTrimProps) => {
  const [trimState, setTrimState] = useState<TrimState>({
    isActive: false,
    clipId: null,
    side: null,
    startX: 0,
    startWidth: 0,
    originalDuration: 0,
    currentOffset: 0,
    minWidth: pxPerSec * 0.1, // Minimum 0.1 seconds
    maxWidth: 0
  });

  const [isProcessing, setIsProcessing] = useState<Set<string>>(new Set());
  const mouseListenersRef = useRef<boolean>(false);

  const startTrim = useCallback((
    clipId: string,
    side: 'left' | 'right',
    startX: number,
    clipWidth: number,
    clipDuration: number
  ) => {
    if (isProcessing.has(clipId)) {
      toast.warning('Clip is currently being processed');
      return;
    }

    setTrimState({
      isActive: true,
      clipId,
      side,
      startX,
      startWidth: clipWidth,
      originalDuration: clipDuration,
      currentOffset: 0,
      minWidth: pxPerSec * 0.1,
      maxWidth: clipWidth
    });

    // Add global mouse listeners
    if (!mouseListenersRef.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      mouseListenersRef.current = true;
    }
  }, [pxPerSec, isProcessing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!trimState.isActive) return;

    const currentX = e.clientX;
    const deltaX = currentX - trimState.startX;
    
    let newOffset = deltaX;
    let newWidth = trimState.startWidth;

    if (trimState.side === 'right') {
      // Trimming from the right (reducing duration)
      newWidth = trimState.startWidth + deltaX;
      newWidth = Math.max(trimState.minWidth, Math.min(newWidth, trimState.maxWidth));
      newOffset = newWidth - trimState.startWidth;
    } else if (trimState.side === 'left') {
      // Trimming from the left (reducing duration from start)
      newWidth = trimState.startWidth - deltaX;
      newWidth = Math.max(trimState.minWidth, Math.min(newWidth, trimState.maxWidth));
      newOffset = trimState.startWidth - newWidth;
    }

    setTrimState(prev => ({
      ...prev,
      currentOffset: newOffset
    }));
  }, [trimState]);

  const handleMouseUp = useCallback(async () => {
    if (!trimState.isActive || !trimState.clipId) return;

    // Remove global mouse listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    mouseListenersRef.current = false;

    const { clipId, side, currentOffset, originalDuration } = trimState;
    
    if (!clipId || !side) return;
    
    // Calculate new duration based on offset
    const offsetInSeconds = Math.abs(currentOffset) / pxPerSec;
    let newDuration = originalDuration;

    if (side === 'right') {
      newDuration = originalDuration - offsetInSeconds;
    } else if (side === 'left') {
      newDuration = originalDuration - offsetInSeconds;
    }

    // Only proceed if there's a meaningful change (more than 0.1 seconds)
    if (offsetInSeconds < 0.1) {
      setTrimState({
        isActive: false,
        clipId: null,
        side: null,
        startX: 0,
        startWidth: 0,
        originalDuration: 0,
        currentOffset: 0,
        minWidth: 0,
        maxWidth: 0
      });
      return;
    }

    // Set processing state
    setIsProcessing(prev => new Set(prev).add(clipId));

    try {
      // Perform the actual trim operation
      await performTrim(clipId, newDuration, side);
      
      // Notify parent component
      onTrimComplete(clipId, newDuration, side);
      
      toast.success(`Clip trimmed to ${newDuration.toFixed(1)}s`);
    } catch (error) {
      console.error('Trim operation failed:', error);
      toast.error('Failed to trim clip');
    } finally {
      // Clear processing state
      setIsProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(clipId);
        return newSet;
      });
    }

    // Reset trim state
    setTrimState({
      isActive: false,
      clipId: null,
      side: null,
      startX: 0,
      startWidth: 0,
      originalDuration: 0,
      currentOffset: 0,
      minWidth: 0,
      maxWidth: 0
    });
  }, [trimState, pxPerSec, onTrimComplete]);

  const performTrim = async (clipId: string, newDuration: number, side: 'left' | 'right') => {
    const startTime = side === 'left' ? (trimState.originalDuration - newDuration) : 0;
    const endTime = side === 'left' ? trimState.originalDuration : newDuration;

    // Generate output filename
    const timestamp = Date.now();
    const outputPath = `trimmed_${clipId}_${timestamp}.mp4`;

    try {
      // Call the backend trim_clip command with correct parameters
      await invoke('trim_clip', {
        input: clipId, // Assuming clipId is the file path or will be resolved by backend
        start: startTime,
        end: endTime,
        output: outputPath
      });
      
      return {
        outputPath,
        startTime,
        endTime,
        duration: newDuration
      };
    } catch (error) {
      throw new Error(`Backend trim operation failed: ${error}`);
    }
  };

  const cancelTrim = useCallback(() => {
    if (trimState.isActive) {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      mouseListenersRef.current = false;
      
      setTrimState({
        isActive: false,
        clipId: null,
        side: null,
        startX: 0,
        startWidth: 0,
        originalDuration: 0,
        currentOffset: 0,
        minWidth: 0,
        maxWidth: 0
      });
    }
  }, [trimState.isActive, handleMouseMove, handleMouseUp]);

  const getPreviewWidth = useCallback((clipId: string, originalWidth: number) => {
    if (!trimState.isActive || trimState.clipId !== clipId) {
      return originalWidth;
    }

    if (trimState.side === 'right') {
      return Math.max(trimState.minWidth, originalWidth + trimState.currentOffset);
    } else if (trimState.side === 'left') {
      return Math.max(trimState.minWidth, originalWidth - Math.abs(trimState.currentOffset));
    }

    return originalWidth;
  }, [trimState]);

  const getTrimmedDuration = useCallback((clipId: string, originalDuration: number) => {
    if (!trimState.isActive || trimState.clipId !== clipId) {
      return originalDuration;
    }

    const offsetInSeconds = Math.abs(trimState.currentOffset) / pxPerSec;
    return Math.max(0.1, originalDuration - offsetInSeconds);
  }, [trimState, pxPerSec]);

  return {
    trimState,
    isProcessing: (clipId: string) => isProcessing.has(clipId),
    startTrim,
    cancelTrim,
    getPreviewWidth,
    getTrimmedDuration
  };
};