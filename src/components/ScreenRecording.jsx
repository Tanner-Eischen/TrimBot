import { useState, useRef, useCallback } from 'react';
import { Monitor, Square, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { generateScreenRecordingName } from '../utils/fileNaming';
import { recordingToasts } from '../utils/toastMessages';

// Use global Tauri API with browser fallback for development
const invoke = window.__TAURI__?.core?.invoke || (async (command, args) => {
  console.warn(`Tauri API not available. Mock implementation for command: ${command}`);
  return null;
});

export function ScreenRecording({ onRecordingComplete, onError, onStatusChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const requestScreenPermission = async () => {
    try {
      // First try with audio
      let stream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        toast.success('Screen recording permission granted with audio');
        onStatusChange?.('Screen recording permission granted with audio');
      } catch (audioError) {
        // Fallback to video only if audio fails
        console.warn('Audio capture failed, falling back to video only:', audioError);
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        toast.warning('Audio capture failed, recording video only');
        onStatusChange?.('Screen recording permission granted (video only - audio failed)');
      }
      
      setHasPermission(true);
      return stream;
    } catch (error) {
      console.error('Screen capture permission denied:', error);
      setHasPermission(false);
      toast.error('Screen recording permission denied. Please allow screen sharing to continue.');
      onError?.('Screen recording permission denied. Please allow screen sharing to continue.');
      throw error;
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await requestScreenPermission();
      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

       mediaRecorder.onstop = async () => {
         try {
           const blob = new Blob(chunksRef.current, { type: 'video/webm' });
           const filename = generateScreenRecordingName();
           
           // Convert blob to array buffer for Tauri
           const arrayBuffer = await blob.arrayBuffer();
           const uint8Array = new Uint8Array(arrayBuffer);
           
           recordingToasts.screenSaving();
           onStatusChange?.('Saving recording...');
           
           // Save the webm file
           const savedPath = await invoke('save_blob', {
             filename,
             data: Array.from(uint8Array)
           });
           
           // Check if we're in a browser environment (savedPath is null)
           if (!savedPath) {
             // Browser environment - create a download link for the user
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = filename;
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
             URL.revokeObjectURL(url);
             
             recordingToasts.screenSaved();
             onStatusChange?.('Recording downloaded successfully!');
             onRecordingComplete?.(filename, null);
             return;
           }
           
           recordingToasts.screenTranscoding();
           onStatusChange?.('Transcoding to MP4...');
           
           // Transcode to MP4 (only in desktop environment)
           const mp4Filename = filename.replace('.webm', '.mp4');
           const mp4OutputPath = savedPath.replace('.webm', '.mp4');
           
           await invoke('transcode_to_mp4', {
             input: savedPath,
             output: mp4OutputPath
           });
           
           recordingToasts.screenCompleted();
           onStatusChange?.('Recording completed successfully!');
           onRecordingComplete?.(mp4Filename, mp4OutputPath);
           
         } catch (error) {
           console.error('Error processing recording:', error);
           recordingToasts.screenSaveFailed(error.message);
           onError?.(`Failed to save recording: ${error}`);
         }
       };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        onError?.(`Recording error: ${event.error.message}`);
      };

      // Handle stream ending (user stops sharing)
      stream.getVideoTracks()[0].onended = () => {
        if (isRecording) {
          stopRecording();
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();
      onStatusChange?.('Screen recording started');
      
    } catch (error) {
      console.error('Failed to start screen recording:', error);
      onError?.(`Failed to start screen recording: ${error.message}`);
    }
  }, [isRecording, onRecordingComplete, onError, onStatusChange]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
      onStatusChange?.('Screen recording paused');
    }
  }, [onStatusChange]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
      onStatusChange?.('Screen recording resumed');
    }
  }, [onStatusChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    setIsPaused(false);
    stopTimer();
    setRecordingTime(0);
    onStatusChange?.('Screen recording stopped');
  }, [onStatusChange]);

  // Check if screen recording is supported
  const isSupported = navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia;

  if (!isSupported) {
    return (
      <div className="p-6 text-center">
        <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Screen recording is not supported in this environment.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Screen Recording</h3>
      </div>

      <div className="space-y-4">
        {/* Recording Status */}
        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-red-800">
                  {isPaused ? 'Recording Paused' : 'Recording Screen'}
                </span>
              </div>
              <div className="text-red-800 font-mono text-lg">
                {formatTime(recordingTime)}
              </div>
            </div>
          </div>
        )}

        {/* Permission Status */}
        {hasPermission === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Screen recording permission is required. Please allow screen sharing when prompted.
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Monitor className="w-4 h-4" />
              Start Screen Recording
            </button>
          ) : (
            <div className="flex gap-2">
              {!isPaused ? (
                <button
                  onClick={pauseRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
              
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isRecording && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">How to record your screen:</h4>
            <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
              <li>Click "Start Screen Recording" button</li>
              <li>Choose which screen or window to share</li>
              <li>Allow audio capture if prompted (optional)</li>
              <li>Your recording will automatically be saved and added to the media library</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}