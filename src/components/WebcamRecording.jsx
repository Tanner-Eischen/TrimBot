import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Square, Play, Pause, Video, VideoOff } from 'lucide-react';
import { toast } from 'sonner';
import { generateWebcamRecordingName } from '../utils/fileNaming';
import { recordingToasts } from '../utils/toastMessages';

// Use global Tauri API with browser fallback for development
const invoke = window.__TAURI__?.core?.invoke || (async (command, args) => {
  console.warn(`Tauri API not available. Mock implementation for command: ${command}`);
  return null;
});

export function WebcamRecording({ onRecordingComplete, onError, onStatusChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasPermission, setHasPermission] = useState(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const previewRef = useRef(null);
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

  // Get available video devices
  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting video devices:', error);
    }
  };

  useEffect(() => {
    getVideoDevices();
  }, []);

  const requestWebcamPermission = async () => {
    try {
      // First try with audio
      let stream;
      const constraints = {
        video: selectedDeviceId ? { deviceId: selectedDeviceId } : true,
        audio: true
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        toast.success('Webcam permission granted with audio');
        onStatusChange?.('Webcam permission granted with audio');
      } catch (audioError) {
        // Fallback to video only if audio fails
        console.warn('Audio capture failed, falling back to video only:', audioError);
        stream = await navigator.mediaDevices.getUserMedia({
          video: selectedDeviceId ? { deviceId: selectedDeviceId } : true,
          audio: false
        });
        toast.warning('Webcam permission granted (video only - audio failed)');
        onStatusChange?.('Webcam permission granted (video only - audio failed)');
      }
      
      setHasPermission(true);
      return stream;
    } catch (error) {
      console.error('Webcam permission denied:', error);
      setHasPermission(false);
      toast.error('Webcam permission denied. Please allow camera access to continue.');
      onError?.('Webcam permission denied. Please allow camera access to continue.');
      throw error;
    }
  };

  const startPreview = useCallback(async () => {
    try {
      const stream = await requestWebcamPermission();
      streamRef.current = stream;
      
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
      }
      
      setIsPreviewActive(true);
      onStatusChange?.('Webcam preview started');
    } catch (error) {
      console.error('Failed to start webcam preview:', error);
      onError?.(`Failed to start webcam preview: ${error.message}`);
    }
  }, [selectedDeviceId, onError, onStatusChange]);

  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }
    
    setIsPreviewActive(false);
    onStatusChange?.('Webcam preview stopped');
  }, [onStatusChange]);

  const startRecording = useCallback(async () => {
    try {
      let stream = streamRef.current;
      
      // If no preview is active, start one
      if (!stream) {
        stream = await requestWebcamPermission();
        streamRef.current = stream;
        
        if (previewRef.current) {
          previewRef.current.srcObject = stream;
        }
        setIsPreviewActive(true);
      }

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
           const filename = generateWebcamRecordingName();
          
          // Convert blob to array buffer for Tauri
          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          recordingToasts.webcamSaving();
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
            
            recordingToasts.webcamSaved();
            onStatusChange?.('Recording downloaded successfully!');
            onRecordingComplete?.(filename, null);
            return;
          }
          
          recordingToasts.webcamTranscoding();
          onStatusChange?.('Transcoding to MP4...');
          
          // Transcode to MP4 (only in desktop environment)
          const mp4Filename = filename.replace('.webm', '.mp4');
          const mp4OutputPath = savedPath.replace('.webm', '.mp4');
          
          await invoke('transcode_to_mp4', {
            input: savedPath,
            output: mp4OutputPath
          });
          
          recordingToasts.webcamCompleted();
          onStatusChange?.('Webcam recording completed successfully!');
          onRecordingComplete?.(mp4Filename, mp4OutputPath);
          
        } catch (error) {
          console.error('Error processing recording:', error);
          recordingToasts.webcamSaveFailed(error.message);
          onError?.(`Failed to save recording: ${error}`);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        onError?.(`Recording error: ${event.error.message}`);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();
      onStatusChange?.('Webcam recording started');
      
    } catch (error) {
      console.error('Failed to start webcam recording:', error);
      onError?.(`Failed to start webcam recording: ${error.message}`);
    }
  }, [onRecordingComplete, onError, onStatusChange]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
      onStatusChange?.('Webcam recording paused');
    }
  }, [onStatusChange]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
      onStatusChange?.('Webcam recording resumed');
    }
  }, [onStatusChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsPaused(false);
    stopTimer();
    setRecordingTime(0);
    onStatusChange?.('Webcam recording stopped');
  }, [onStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
      stopTimer();
    };
  }, [stopPreview]);

  // Check if webcam recording is supported
  const isSupported = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

  if (!isSupported) {
    return (
      <div className="p-6 text-center">
        <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Webcam recording is not supported in this environment.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Camera className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold">Webcam Recording</h3>
      </div>

      <div className="space-y-4">
        {/* Camera Selection */}
        {availableDevices.length > 1 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Camera:
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={isRecording || isPreviewActive}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
            >
              {availableDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Preview */}
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <video
            ref={previewRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isPreviewActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">Camera preview will appear here</p>
              </div>
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">
                {isPaused ? 'PAUSED' : 'REC'}
              </span>
              <span className="text-sm font-mono">
                {formatTime(recordingTime)}
              </span>
            </div>
          )}
        </div>

        {/* Permission Status */}
        {hasPermission === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Webcam permission is required. Please allow camera access when prompted.
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 flex-wrap">
          {/* Preview Controls */}
          {!isRecording && (
            <div className="flex gap-2">
              {!isPreviewActive ? (
                <button
                  onClick={startPreview}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Video className="w-4 h-4" />
                  Start Preview
                </button>
              ) : (
                <button
                  onClick={stopPreview}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <VideoOff className="w-4 h-4" />
                  Stop Preview
                </button>
              )}
            </div>
          )}

          {/* Recording Controls */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
              Start Recording
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-2">How to record with your webcam:</h4>
            <ol className="text-green-700 text-sm space-y-1 list-decimal list-inside">
              <li>Select your preferred camera if you have multiple devices</li>
              <li>Click "Start Preview" to see your camera feed</li>
              <li>Click "Start Recording" when you're ready</li>
              <li>Your recording will automatically be saved and added to the media library</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}