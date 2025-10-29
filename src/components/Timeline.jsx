import React, { useState, useRef } from 'react';
import { Play, Pause, Scissors, Clock, GripVertical, Download } from 'lucide-react';
import { ExportDialog } from './ExportDialog';

export function Timeline({ clips = [], onReorderClips, onSelectClip, selectedClipId, onTrimClip }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [playingClipId, setPlayingClipId] = useState(null);
  const [trimMode, setTrimMode] = useState({});
  const [trimValues, setTrimValues] = useState({});
  const [showExportDialog, setShowExportDialog] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newClips = [...clips];
    const draggedClip = newClips[draggedIndex];
    
    // Remove the dragged clip
    newClips.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newClips.splice(insertIndex, 0, draggedClip);
    
    onReorderClips(newClips);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const toggleTrimMode = (clipId) => {
    setTrimMode(prev => ({
      ...prev,
      [clipId]: !prev[clipId]
    }));
    
    // Initialize trim values if not set
    if (!trimValues[clipId]) {
      const clip = clips.find(c => c.id === clipId);
      setTrimValues(prev => ({
        ...prev,
        [clipId]: {
          startTime: 0,
          endTime: clip?.duration || 0
        }
      }));
    }
  };

  const handleTrimValueChange = (clipId, field, value) => {
    const numValue = parseFloat(value) || 0;
    setTrimValues(prev => ({
      ...prev,
      [clipId]: {
        ...prev[clipId],
        [field]: numValue
      }
    }));
  };

  const handleApplyTrim = async (clipId) => {
    const trimData = trimValues[clipId];
    if (!trimData || trimData.startTime >= trimData.endTime) {
      alert('Invalid trim values. Start time must be less than end time.');
      return;
    }

    try {
      await onTrimClip(clipId, trimData.startTime, trimData.endTime);
      setTrimMode(prev => ({ ...prev, [clipId]: false }));
    } catch (error) {
      console.error('Failed to trim clip:', error);
      alert('Failed to trim clip. Please try again.');
    }
  };

  const handlePlayPause = (clipId) => {
    if (playingClipId === clipId) {
      setPlayingClipId(null);
    } else {
      setPlayingClipId(clipId);
      onSelectClip(clips.find(c => c.id === clipId));
    }
  };

  if (clips.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline Empty</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your timeline is empty. Add clips from your media library to start editing.
          </p>
          <div className="space-y-2 text-xs text-gray-500">
            <div>• Drag clips from the Media Library to reorder them</div>
            <div>• Use the trim tool to cut clips to the perfect length</div>
            <div>• Click Export when you're ready to create your final video</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Timeline</h2>
          <p className="text-sm text-gray-600">Drag clips to reorder • Click trim to edit</p>
        </div>
        <button
          onClick={() => setShowExportDialog(true)}
          disabled={clips.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        {clips.map((clip, index) => (
          <div
            key={clip.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              relative bg-gray-50 rounded-lg border-2 transition-all duration-200 cursor-move
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              ${dragOverIndex === index ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
              ${selectedClipId === clip.id ? 'ring-2 ring-blue-500' : ''}
              hover:border-gray-300
            `}
          >
            <div className="p-4">
              <div className="flex items-center space-x-4">
                {/* Drag Handle */}
                <div className="flex-shrink-0">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>

                {/* Thumbnail Placeholder */}
                <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded border flex items-center justify-center">
                  <Play className="h-4 w-4 text-gray-500" />
                </div>

                {/* Clip Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {clip.filename}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Duration: {formatTime(clip.duration)}
                    {clip.width && clip.height && (
                      <span className="ml-2">{clip.width}×{clip.height}</span>
                    )}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex-shrink-0 flex items-center space-x-2">
                  <button
                    onClick={() => handlePlayPause(clip.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Play/Preview"
                  >
                    {playingClipId === clip.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleTrimMode(clip.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      trimMode[clip.id] 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title="Trim Clip"
                  >
                    <Scissors className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Trim Controls */}
              {trimMode[clip.id] && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Start Time (seconds)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={clip.duration || 0}
                        step="0.1"
                        value={trimValues[clip.id]?.startTime || 0}
                        onChange={(e) => handleTrimValueChange(clip.id, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        End Time (seconds)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={clip.duration || 0}
                        step="0.1"
                        value={trimValues[clip.id]?.endTime || clip.duration || 0}
                        onChange={(e) => handleTrimValueChange(clip.id, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => toggleTrimMode(clip.id)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleApplyTrim(clip.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Apply Trim
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          clips={clips}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}