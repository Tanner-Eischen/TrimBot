import React, { useCallback } from 'react';
import { X, Move, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import type { OverlayProperties } from '../../types';

interface OverlayInspectorProps {
  itemId: string;
  onClose: () => void;
}

export const OverlayInspector: React.FC<OverlayInspectorProps> = ({ itemId, onClose }) => {
  const { project, updateOverlayProperties } = useProject();
  
  // Find the overlay clip
  const overlayClip = project?.overlayTrack?.find(item => item.id === itemId);
  
  if (!overlayClip || !overlayClip.overlayProperties) {
    return null;
  }

  const { overlayProperties } = overlayClip;
  
  // Handle property updates
  const handlePropertyUpdate = useCallback((updates: Partial<OverlayProperties>) => {
    updateOverlayProperties(itemId, updates);
  }, [itemId, updateOverlayProperties]);

  // Position presets
  const positionPresets = [
    { name: 'Top Left', position: { x: 0.05, y: 0.05 } },
    { name: 'Top Right', position: { x: 0.7, y: 0.05 } },
    { name: 'Bottom Left', position: { x: 0.05, y: 0.7 } },
    { name: 'Bottom Right', position: { x: 0.7, y: 0.7 } },
    { name: 'Center', position: { x: 0.35, y: 0.35 } },
  ];

  // Scale presets
  const scalePresets = [
    { name: 'Small', scale: 0.2 },
    { name: 'Medium', scale: 0.3 },
    { name: 'Large', scale: 0.5 },
    { name: 'Full', scale: 1.0 },
  ];

  return (
    <div className="overlay-inspector">
      <div className="overlay-inspector-backdrop" onClick={onClose} />
      <div className="overlay-inspector-panel">
        {/* Header */}
        <div className="inspector-header">
          <div className="flex items-center space-x-2">
            <Move className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Overlay Properties</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clip Info */}
        <div className="inspector-section">
          <h4 className="section-title">Clip Information</h4>
          <div className="clip-info">
            <p className="text-sm text-gray-600">
              <strong>Name:</strong> {overlayClip.filename}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Duration:</strong> {overlayClip.durationSec.toFixed(1)}s
            </p>
            <p className="text-sm text-gray-600">
              <strong>Start Time:</strong> {overlayClip.startTime.toFixed(1)}s
            </p>
          </div>
        </div>

        {/* Position Controls */}
        <div className="inspector-section">
          <h4 className="section-title">Position</h4>
          
          {/* Position Presets */}
          <div className="preset-buttons">
            {positionPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePropertyUpdate({ position: preset.position })}
                className={`preset-button ${
                  overlayProperties.position?.x === preset.position.x && 
                  overlayProperties.position?.y === preset.position.y
                    ? 'active' : ''
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Manual Position Controls */}
          <div className="manual-controls">
            <div className="control-group">
              <label className="control-label">X Position</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={overlayProperties.position?.x ?? 0.7}
                onChange={(e) => handlePropertyUpdate({
                  position: { ...(overlayProperties.position || { x: 0.7, y: 0.05 }), x: parseFloat(e.target.value) }
                })}
                className="range-slider"
              />
              <span className="control-value">{Math.round((overlayProperties.position?.x ?? 0.7) * 100)}%</span>
            </div>
            
            <div className="control-group">
              <label className="control-label">Y Position</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={overlayProperties.position?.y ?? 0.05}
                onChange={(e) => handlePropertyUpdate({
                  position: { ...(overlayProperties.position || { x: 0.7, y: 0.05 }), y: parseFloat(e.target.value) }
                })}
                className="range-slider"
              />
              <span className="control-value">{Math.round((overlayProperties.position?.y ?? 0.05) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Scale Controls */}
        <div className="inspector-section">
          <h4 className="section-title">Scale</h4>
          
          {/* Scale Presets */}
          <div className="preset-buttons">
            {scalePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePropertyUpdate({ scale: preset.scale })}
                className={`preset-button ${
                  Math.abs((overlayProperties.scale ?? 0.3) - preset.scale) < 0.01 ? 'active' : ''
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Manual Scale Control */}
          <div className="manual-controls">
            <div className="control-group">
              <label className="control-label">Size</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={overlayProperties?.scale ?? 0.3}
                onChange={(e) => handlePropertyUpdate({ scale: parseFloat(e.target.value) })}
                className="range-slider"
              />
              <span className="control-value">{Math.round(((overlayProperties?.scale ?? 0.3) * 100))}%</span>
            </div>
          </div>
        </div>

        {/* Opacity Controls */}
        <div className="inspector-section">
          <h4 className="section-title">Opacity</h4>
          <div className="manual-controls">
            <div className="control-group">
              <label className="control-label">Transparency</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={overlayProperties?.opacity ?? 1}
                onChange={(e) => handlePropertyUpdate({ opacity: parseFloat(e.target.value) })}
                className="range-slider"
              />
              <span className="control-value">{Math.round(((overlayProperties?.opacity ?? 1) * 100))}%</span>
            </div>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="inspector-section">
          <h4 className="section-title">Audio</h4>
          <div className="audio-controls">
            <button
              onClick={() => handlePropertyUpdate({ includeAudio: !(overlayProperties?.includeAudio ?? false) })}
              className={`audio-toggle ${(overlayProperties?.includeAudio ?? false) ? 'enabled' : 'disabled'}`}
            >
              {(overlayProperties?.includeAudio ?? false) ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Audio Enabled</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span>Audio Muted</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {(overlayProperties?.includeAudio ?? false) 
                ? 'Overlay audio will be mixed with main track'
                : 'Overlay will be silent (video only)'
              }
            </p>
          </div>
        </div>

        {/* Reset Button */}
        <div className="inspector-section">
          <button
            onClick={() => handlePropertyUpdate({
              position: { x: 0.7, y: 0.05 },
              scale: 0.3,
              opacity: 1.0,
              includeAudio: false
            })}
            className="reset-button"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverlayInspector;