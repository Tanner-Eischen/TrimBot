import React, { useState } from 'react';
import { X, Play, Pause } from 'lucide-react';

const ClipInspector = ({ 
  selectedClip, 
  onClose,
  onFadeToggle, 
  onFadeDurationChange,
  onKeyframeAdd,
  onKeyframeRemove 
}) => {
  const [previewFade, setPreviewFade] = useState(false);

  if (!selectedClip) return null;

  const handleFadeInToggle = (enabled) => {
    const duration = selectedClip.fadePresets?.fadeIn?.duration || 1.0;
    onFadeToggle(selectedClip.id, 'fadeIn', enabled, duration);
  };

  const handleFadeOutToggle = (enabled) => {
    const duration = selectedClip.fadePresets?.fadeOut?.duration || 1.0;
    onFadeToggle(selectedClip.id, 'fadeOut', enabled, duration);
  };

  const handleFadeInDurationChange = (duration) => {
    const enabled = selectedClip.fadePresets?.fadeIn?.enabled || false;
    onFadeDurationChange(selectedClip.id, 'fadeIn', enabled, duration);
  };

  const handleFadeOutDurationChange = (duration) => {
    const enabled = selectedClip.fadePresets?.fadeOut?.enabled || false;
    onFadeDurationChange(selectedClip.id, 'fadeOut', enabled, duration);
  };

  const renderKeyframeList = () => {
    if (!selectedClip.keyframes?.opacity) return null;

    return (
      <div className="keyframe-list">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Opacity Keyframes</h4>
        {selectedClip.keyframes.opacity.map(keyframe => (
          <div key={keyframe.id} className="keyframe-item">
            <div className="flex items-center gap-2">
              <div 
                className={`keyframe-marker ${keyframe.value === 0 ? 'opacity-0' : keyframe.value === 1 ? 'opacity-100' : ''}`}
              />
              <span className="text-xs">
                {keyframe.timeSec.toFixed(1)}s - {Math.round(keyframe.value * 100)}%
              </span>
            </div>
            <button
              onClick={() => onKeyframeRemove(selectedClip.id, keyframe.id)}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="clip-inspector">
      <div className="flex items-center justify-between mb-4">
        <h3>Clip Properties</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{selectedClip.filename}</h4>
        <p className="text-xs text-gray-500">Duration: {selectedClip.durationSec.toFixed(1)}s</p>
      </div>

      {/* Fade In Control */}
      <div className="fade-control">
        <label>
          <input
            type="checkbox"
            checked={selectedClip.fadePresets?.fadeIn?.enabled || false}
            onChange={(e) => handleFadeInToggle(e.target.checked)}
          />
          Fade In
        </label>
        {selectedClip.fadePresets?.fadeIn?.enabled && (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={selectedClip.fadePresets.fadeIn.duration}
              onChange={(e) => handleFadeInDurationChange(parseFloat(e.target.value))}
              className="fade-duration-slider"
            />
            <span className="text-xs text-gray-600">
              {selectedClip.fadePresets.fadeIn.duration.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* Fade Out Control */}
      <div className="fade-control">
        <label>
          <input
            type="checkbox"
            checked={selectedClip.fadePresets?.fadeOut?.enabled || false}
            onChange={(e) => handleFadeOutToggle(e.target.checked)}
          />
          Fade Out
        </label>
        {selectedClip.fadePresets?.fadeOut?.enabled && (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={selectedClip.fadePresets.fadeOut.duration}
              onChange={(e) => handleFadeOutDurationChange(parseFloat(e.target.value))}
              className="fade-duration-slider"
            />
            <span className="text-xs text-gray-600">
              {selectedClip.fadePresets.fadeOut.duration.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* Keyframe List */}
      {renderKeyframeList()}

      {/* Preview Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => setPreviewFade(!previewFade)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          {previewFade ? <Pause size={14} /> : <Play size={14} />}
          Preview Fade
        </button>
      </div>
    </div>
  );
};

export default ClipInspector;