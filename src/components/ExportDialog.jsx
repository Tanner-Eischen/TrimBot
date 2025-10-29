import React, { useState } from 'react';
import { X, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { generateExportName } from '../utils/fileNaming';
import { exportToasts } from '../utils/toastMessages';

// Use global Tauri API with browser fallback for development
const invoke = window.__TAURI__?.core?.invoke || (async (command, args) => {
  console.warn(`Tauri API not available. Mock implementation for command: ${command}`);
  
  // Provide mock implementations for browser development
  switch (command) {
    case 'ensure_dir':
      console.log('Mock: Ensuring directory exists at', args?.path);
      return true;
    case 'export_timeline':
    case 'export_with_crossfades':
    case 'export_concat':
    case 'export_concat_filter':
    case 'export_concat_with_fades':
    case 'write_concat_list':
      console.log('Mock: Exporting timeline', args);
      return 0; // Success exit code
    default:
      console.warn(`No mock implementation for Tauri command: ${command}`);
      return null;
  }
});

function ExportDialog({ isOpen, onClose, timelineClips, projectDir }) {
  const [filename, setFilename] = useState('final-export');
  const [resolution, setResolution] = useState('source');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null); // 'success' | 'error'
  const [exportMessage, setExportMessage] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [applyCrossfade, setApplyCrossfade] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(1.0);
  const [applyFadeEffects, setApplyFadeEffects] = useState(false);

  const handleExport = async () => {
    if (!timelineClips || timelineClips.length === 0) {
      setExportStatus('error');
      setExportMessage('No clips in timeline to export');
      return;
    }

    setIsExporting(true);
    setExportStatus(null);
    setExportMessage('');

    try {
      // Check if Tauri API is available
      const isDesktop = window.__TAURI__ && window.__TAURI__.core;
      
      if (isDesktop) {
        await handleDesktopExport();
      } else {
        await handleBrowserExport();
      }
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setExportMessage(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDesktopExport = async () => {
    
    // Ensure export and temp directories exist
    await invoke('ensure_dir', { path: `${projectDir}/exports` });
    await invoke('ensure_dir', { path: `${projectDir}/.temp` });
    
    // Generate filename with improved naming
    const outputFilename = generateExportName(filename);
    const outputPath = `${projectDir}/exports/${outputFilename}`;
    
    // Export with or without transitions
    const resolutionParam = resolution === 'source' ? null : resolution;
    const inputs = timelineClips.map(clip => clip.path.replace(/\\/g, '/'));

    try {
      if (applyCrossfade) {
        // New crossfade export path
        await invoke('export_with_crossfades', {
          inputs,
          output: outputPath,
          duration: parseFloat(String(crossfadeDuration)) || 1.0,
          resolution: resolutionParam,
          temp_dir: `${projectDir}/.temp`
        });
      } else {
        // Original concat path with optional fade effects
        const fileListContent = timelineClips
          .map(clip => `file '${clip.path.replace(/\\/g, '/')}'`)
          .join('\n');
        const listPath = `${projectDir}/.temp/files.txt`;
        await invoke('write_concat_list', {
          lines: fileListContent.split('\n'),
          list_path: listPath
        });

        // Prepare fade effects data if enabled
        let fadeEffects = null;
        if (applyFadeEffects) {
          fadeEffects = timelineClips.map(clip => {
            // Extract fade settings from clip's fadePresets
            const fadeIn = clip.fadePresets?.fadeIn?.enabled ? clip.fadePresets.fadeIn.duration : 0;
            const fadeOut = clip.fadePresets?.fadeOut?.enabled ? clip.fadePresets.fadeOut.duration : 0;
            return [fadeIn, fadeOut];
          });
        }

        try {
          if (applyFadeEffects && fadeEffects) {
            // Use new fade-aware export
            await invoke('export_concat_with_fades', {
              list_path: listPath,
              output: outputPath,
              resolution: resolutionParam,
              fade_effects: fadeEffects
            });
          } else {
            // Regular export without fades
            await invoke('export_concat', {
              list_path: listPath,
              output: outputPath,
              resolution: resolutionParam
            });
          }
        } catch (error) {
          console.log('Primary export method failed, trying fallback:', error);
          exportToasts.retryingWithFallback();
          await invoke('export_concat_filter', {
            list_path: listPath,
            output: outputPath,
            resolution: resolutionParam
          });
          exportToasts.fallbackSuccess(outputFilename);
        }
      }

      setExportStatus('success');
      setExportMessage(`Export completed successfully!`);
      setOutputPath(outputPath);
    } catch (error) {
      throw error;
    }
  };

  const handleBrowserExport = async () => {
    // Mock export for browser development
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    const outputFilename = generateExportName(filename);
    const mockPath = `exports/${outputFilename}`;
    
    setExportStatus('success');
    setExportMessage('Export completed successfully! (Mock mode - no actual file created)');
    setOutputPath(mockPath);
  };

  const handleClose = () => {
    if (!isExporting) {
      setExportStatus(null);
      setExportMessage('');
      setOutputPath('');
      onClose();
    }
  };

  const handleReset = () => {
    setExportStatus(null);
    setExportMessage('');
    setOutputPath('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Export Video</h2>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Export Status */}
          {exportStatus && (
            <div className={`p-4 rounded-lg flex items-start space-x-3 ${
              exportStatus === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {exportStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  exportStatus === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {exportMessage}
                </p>
                {outputPath && (
                  <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                    {outputPath}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{timelineClips?.length || 0}</span> clips in timeline
            </p>
            {timelineClips && timelineClips.length > 0 && (
              <div className="mt-2 space-y-1">
                {timelineClips.slice(0, 3).map((clip, index) => (
                  <p key={index} className="text-xs text-gray-500 truncate">
                    {index + 1}. {clip.filename}
                  </p>
                ))}
                {timelineClips.length > 3 && (
                  <p className="text-xs text-gray-500">
                    ... and {timelineClips.length - 3} more
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Filename Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filename
            </label>
            <div className="flex">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                disabled={isExporting}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                placeholder="Enter filename"
              />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                .mp4
              </span>
            </div>
          </div>

          {/* Resolution Preset */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution
            </label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              disabled={isExporting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="source">Source (Original)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="720p">720p (HD)</option>
            </select>
          </div>

          {/* Transitions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transitions
            </label>
            <div className="flex items-center space-x-3">
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={applyCrossfade}
                  onChange={(e) => setApplyCrossfade(e.target.checked)}
                  disabled={isExporting}
                />
                <span className="text-sm text-gray-700">Apply crossfade between clips</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={crossfadeDuration}
                onChange={(e) => setCrossfadeDuration(parseFloat(e.target.value) || 1.0)}
                disabled={isExporting || !applyCrossfade}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-600">sec</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Uses FFmpeg xfade/acrossfade during export.</p>
          </div>

          {/* Fade Effects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fade Effects
            </label>
            <div className="flex items-center space-x-3">
              <label className="inline-flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={applyFadeEffects}
                  onChange={(e) => setApplyFadeEffects(e.target.checked)}
                  disabled={isExporting}
                />
                <span className="text-sm text-gray-700">Apply fade-in/fade-out effects</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Uses fade settings configured in the ClipInspector.</p>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Exporting video...</p>
                  <p className="text-xs text-blue-600">This may take a few moments</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
          {exportStatus ? (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Export Another
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || !timelineClips || timelineClips.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;

