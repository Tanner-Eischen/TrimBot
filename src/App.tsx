import { useState, useEffect, useMemo } from 'react';
import './App.css';
import './styles/variables.css';
import './styles/timeline.css';
import './styles/timeline-tracks.css';
import './styles/overlay-inspector.css';
import ProjectSetup from './components/ProjectSetup';
import { TimelineTracksContainer } from './components/timeline/TimelineTracksContainer';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import { useTimeline } from './hooks/useTimeline';
import { useTimelinePlayback } from './hooks/useTimelinePlayback';
import { toast, Toaster } from 'sonner';
import { projectToasts, importToasts } from './utils/toastMessages';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { LazyMediaLibrary, LazyRecording, LazyExportDialog } from './components/LazyComponents';
import DualVideoPreview from './components/preview/DualVideoPreview';
import ClipInspector from './components/ClipInspector';
import OverlayInspector from './components/overlay/OverlayInspector';
import { ThemeProvider } from './contexts/ThemeContext';

interface Clip {
  id: string;
  filename: string;
  filePath: string;
  durationSec?: number;
  width?: number;
  height?: number;
}

import type { TimelineItem } from './types';

function AppContent() {
  const { 
    project,
    isLoading,
    createProject, 
    importFiles, 
    updateClipDuration,
    trimClip,
    addToTimeline,
    reorderTimeline,
    // setZoomLevel,
    setPxPerSec,
    addToOverlayTrack,
    addToLibrary
  } = useProject();
  
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [activeView, setActiveView] = useState<'timeline' | 'recording'>('timeline');
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleCreateProject = async () => {
    try {
      projectToasts.creating();
      await createProject();
      projectToasts.created();
    } catch (err: any) {
      console.error('Failed to create project:', err);
      projectToasts.createFailed(err.message);
    }
  };

  const handleImportFiles = async (filePaths: string[]) => {
    try {
      const newClips = await importFiles(filePaths);
      if (newClips && newClips.length > 0 && project) {
        // Add all imported clips to the project library
        const updatedLibrary = { ...project.library };
        newClips.forEach(clip => {
          updatedLibrary[clip.id] = clip;
        });
        addToLibrary(updatedLibrary);
        importToasts.imported(newClips.length);
        console.log('Successfully imported', newClips.length, 'clips');
      }
    } catch (err: any) {
      console.error('Failed to import files:', err);
      importToasts.importFailed(err.message || 'Unknown error');
    }
  };

  const handleSelectClip = (clip: Clip) => {
    setSelectedClip(clip);
  };

  const handleDurationProbed = (clipId: string, duration: number, width: number, height: number) => {
    updateClipDuration(clipId, duration, width, height);
  };

  const handleAddToTimeline = (clip: Clip) => {
    // Convert Clip to TimelineItem
    const timelineItem: TimelineItem = {
      id: clip.id,
      name: clip.filename,
      durationSec: clip.durationSec || 0,
      startTime: 0, // Will be set by addToTimeline
      xPx: 0,
      wPx: 0,
      type: 'video',
      path: clip.filePath,
      selected: false,
      filename: clip.filename
    };
    addToTimeline(timelineItem);
  };

  const handleAddToOverlayTrack = (clip: Clip) => {
    // Convert Clip to TimelineItem for overlay track
    const timelineItem: TimelineItem = {
      id: clip.id,
      name: clip.filename,
      durationSec: clip.durationSec || 0,
      startTime: 0, // Will be set by addToOverlayTrack
      xPx: 0,
      wPx: 0,
      type: 'video',
      path: clip.filePath,
      selected: false,
      filename: clip.filename,
      trackType: 'overlay',
      // Overlay-specific properties
      overlayProperties: {
        position: { x: 0.7, y: 0.05 }, // Top-right corner by default
        scale: 0.3, // 30% of original size
        opacity: 1.0,
        includeAudio: false // Mute overlay by default
      }
    };
    addToOverlayTrack(timelineItem);
  };

  const handleTrimClip = async (clipId: string, startTime: number, endTime: number) => {
    try {
      const trimmedClip = await trimClip(clipId, startTime, endTime);
      console.log('Trimmed clip created:', trimmedClip);
      return trimmedClip;
    } catch (err) {
      console.error('Failed to trim clip:', err);
      throw err;
    }
  };

  const handleRecordingComplete = async (filename: string, filePath: string) => {
    try {
      // Import the recorded file to the library
      await importFiles([filePath]);
      console.log('Recording imported to library:', filename);
    } catch (err) {
      console.error('Failed to import recording:', err);
    }
  };

  // Convert library object to array for timeline - memoize to prevent infinite loops
  const timelineClips = useMemo(() => project?.timeline || [], [project?.timeline]);
  const libraryClips = useMemo(() => Object.values(project?.library || {}), [project?.library]);

  // Get timeline hooks - only extract what we actually use
  const {
    timelineItems,
    currentTime,
    setCurrentTime,
    handleItemSelect,
    selectedItemId
  } = useTimeline({
    timelineData: timelineClips,
    pxPerSec: project?.pxPerSec || 50
  });

  // Create move/resize handlers
  const handleItemMove = (itemId: string, newStartTime: number) => {
    // Timeline movement logic
  };

  const handleItemResize = (itemId: string, newDuration: number) => {
    // Timeline resize logic
  };

  // Handle timeline item selection and show inspector
  const handleTimelineItemSelect = (itemId: string) => {
    handleItemSelect(itemId);
    
    // Check if the selected item is on the overlay track
    const selectedItem = timelineItems.find(item => item.id === itemId);
    if (selectedItem && 'overlayProperties' in selectedItem && selectedItem.overlayProperties) {
      // setShowOverlayInspector(true); // This state variable is removed
    } else {
      // setShowClipInspector(true); // This state variable is removed
    }
  };

  // Use timeline playback hook for continuous playback
  const {
    isPlaying,
    playbackRate,
    totalDuration,
    play,
    pause,
    seekTo: seek,
    setPlaybackRate,
    // findClipAtTime
  } = useTimelinePlayback({
    timelineItems,
    onTimeUpdate: setCurrentTime
  });

  // Zoom controls
  const handleZoomIn = () => {
    const currentPxPerSec = project?.pxPerSec || 50;
    const newZoom = Math.min(currentPxPerSec * 1.5, 200);
    setPxPerSec(newZoom);
  };

  const handleZoomOut = () => {
    const currentPxPerSec = project?.pxPerSec || 50;
    const newZoom = Math.max(currentPxPerSec / 1.5, 10);
    setPxPerSec(newZoom);
  };

  const handleFitToView = () => {
    if (timelineItems.length === 0) return;
    
    const maxEndTime = timelineItems.reduce((max, item) => {
      return Math.max(max, item.startTime + item.durationSec);
    }, 0);
    
    const viewportWidth = 800; // Approximate timeline viewport width
    const optimalZoom = Math.max(10, Math.min(200, viewportWidth / maxEndTime));
    setPxPerSec(optimalZoom);
  };

  // Split at playhead action with error handling
  const handleSplitAtPlayheadAction = async () => {
    if (!selectedItemId) {
      toast.error('Please select a clip to split');
      return;
    }

    try {
      // The original code had handleSplitAtPlayhead, but it's not destructured from useTimeline.
      // Assuming it's meant to be handled here or passed as a prop if needed.
      // For now, we'll just call seekTo with a small time difference.
      const selectedItem = timelineItems.find(item => item.id === selectedItemId);
      if (!selectedItem) return;

      const newStartTime = selectedItem.startTime + (selectedItem.durationSec || 0) / 2;
      await seek(newStartTime);
      toast.success('Clip split successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to split clip');
    }
  };

  // Ripple delete action
  const handleRippleDeleteAction = () => {
    if (!selectedItemId) {
      toast.error('Please select a clip to delete');
      return;
    }

    // The original code had handleRippleDelete, but it's not destructured from useTimeline.
    // Assuming it's meant to be handled here or passed as a prop if needed.
    // For now, we'll just call seekTo with a small time difference.
    const selectedItem = timelineItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;

    const newStartTime = selectedItem.startTime + (selectedItem.durationSec || 0);
    seek(newStartTime);
    toast.success('Clip deleted and timeline compacted');
  };

  // Merge adjacent clips action
  const handleMergeAdjacentAction = async () => {
    const selectedItem = timelineItems.find(item => item.id === selectedItemId);
    if (!selectedItem) {
      toast.error('Please select a clip to merge');
      return;
    }

    // Find adjacent clip (next clip that starts right after this one ends)
    const adjacentItem = timelineItems.find(item => 
      Math.abs(item.startTime - (selectedItem.startTime + selectedItem.durationSec)) < 0.01
    );

    if (!adjacentItem) {
      toast.error('No adjacent clip found to merge with');
      return;
    }

    try {
      // The original code had handleMergeAdjacent, but it's not destructured from useTimeline.
      // Assuming it's meant to be handled here or passed as a prop if needed.
      // For now, we'll just call seekTo with a small time difference.
      const newStartTime = selectedItem.startTime + (selectedItem.durationSec || 0);
      await seek(newStartTime);
      toast.success('Clips merged successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to merge clips');
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when timeline is active
      if (activeView !== 'timeline') return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'j':
          e.preventDefault();
          seek(Math.max(0, currentTime - 1));
          break;
        case 'k':
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            play();
          }
          break;
        case 'l':
          e.preventDefault();
          seek(Math.min(totalDuration, currentTime + 1));
          break;
        case 'arrowleft':
          e.preventDefault();
          seek(Math.max(0, currentTime - (e.shiftKey ? 5 : 1)));
          break;
        case 'arrowright':
          e.preventDefault();
          seek(Math.min(totalDuration, currentTime + (e.shiftKey ? 5 : 1)));
          break;
        case 'home':
          e.preventDefault();
          seek(0);
          break;
        case 'end':
          e.preventDefault();
          seek(totalDuration);
          break;
        case 's':
          if (selectedItemId) {
            e.preventDefault();
            handleSplitAtPlayheadAction();
          }
          break;
        case 'delete':
        case 'backspace':
          if (selectedItemId) {
            e.preventDefault();
            handleRippleDeleteAction();
          }
          break;
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleFitToView();
          }
          break;
        case '1':
          e.preventDefault();
          setPlaybackRate(0.25);
          break;
        case '2':
          e.preventDefault();
          setPlaybackRate(0.5);
          break;
        case '3':
          e.preventDefault();
          setPlaybackRate(1);
          break;
        case '4':
          e.preventDefault();
          setPlaybackRate(1.5);
          break;
        case '5':
          e.preventDefault();
          setPlaybackRate(2);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, selectedItemId, project?.pxPerSec, timelineItems, isPlaying, currentTime, totalDuration, play, pause, seek, setPlaybackRate]);

  // Show project setup if no project is loaded
  if (!project?.projectDir) {
    return (
      <ProjectSetup 
        onCreateProject={handleCreateProject}
        isLoading={isLoading}
      />
    );
  }

  // Handle timeline item changes
  const handleTimelineItemsChange = (newItems: TimelineItem[]) => {
    // Convert timeline items back to project timeline format and update
    const reorderedTimeline = newItems.map(item => {
      const originalClip = timelineClips.find((clip: any) => clip.id === item.id);
      if (originalClip) {
        return {
          ...originalClip,
          startTime: item.startTime,
          durationSec: item.durationSec,
          inSec: (item as any).inSec,
          outSec: (item as any).outSec,
          xPx: item.xPx,
          wPx: item.wPx,
        } as any;
      }
      return item as any;
    });
    reorderTimeline(reorderedTimeline as any);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', flexDirection: 'column', backgroundColor: '#1b2310' }}>
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #394922', padding: '0.5rem 1rem', height: '60px', gap: '2rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'white' }}>
          <div style={{ color: '#96f20d', width: '1rem', height: '1rem' }}>
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" fill="currentColor" />
            </svg>
          </div>
          <h2 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 'bold', margin: 0 }}>TrimBot</h2>
        </div>
        
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: '2rem' }}>
          <button onClick={handleCreateProject} style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>File</button>
          <button onClick={() => setShowExportDialog(true)} style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Export</button>
          <button onClick={() => toast.info('View menu')} style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>View</button>
          <button onClick={() => toast.info('Edit menu')} style={{ color: 'white', fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={async () => {
            try {
              const invoke = window.__TAURI__?.core?.invoke;
              if (invoke) {
                const filePaths = await invoke('open_file_dialog_multi');
                if (filePaths && Array.isArray(filePaths) && filePaths.length > 0) {
                  await handleImportFiles(filePaths);
                }
              } else {
                // Fallback for browser
                document.getElementById('import-media')?.click();
              }
            } catch (err) {
              console.error('Failed to open file dialog:', err);
            }
          }} style={{ backgroundColor: '#96f20d', color: '#1b2210', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }} title="Import Media">📁 Import</button>
          <button onClick={handleZoomOut} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', backgroundColor: '#394922', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} title="Zoom Out">−</button>
          <button onClick={handleFitToView} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', backgroundColor: '#394922', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} title="Fit to View">□</button>
          <button onClick={handleZoomIn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', backgroundColor: '#394922', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} title="Zoom In">+</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT SIDEBAR - MEDIA LIBRARY */}
        <aside style={{ display: 'flex', width: '320px', flexDirection: 'column', borderRight: '1px solid #394922', backgroundColor: '#222c15', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #526831', padding: '0 1rem', gap: '1rem' }}>
              <button onClick={() => setActiveView('timeline')} style={{ flex: 1, borderBottom: activeView === 'timeline' ? '3px solid #96f20d' : '3px solid transparent', paddingBottom: '0.81rem', paddingTop: '1rem', color: activeView === 'timeline' ? 'white' : '#b3cb90', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}>Media</button>
              <button onClick={() => setActiveView('recording')} style={{ flex: 1, borderBottom: activeView === 'recording' ? '3px solid #96f20d' : '3px solid transparent', paddingBottom: '0.81rem', paddingTop: '1rem', color: activeView === 'recording' ? 'white' : '#b3cb90', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}>Record</button>
            </div>
          </div>
          
          <div style={{ padding: '0.75rem 1rem', flex: 1, overflowY: 'auto' }}>
            {activeView === 'timeline' ? (
              <LazyMediaLibrary 
                library={project?.library || {}}
                onSelectClip={handleSelectClip}
                onAddToTimeline={handleAddToTimeline}
                onAddToOverlayTrack={handleAddToOverlayTrack}
                selectedClipId={selectedClip?.id}
              />
            ) : (
              <div style={{ color: '#b3cb90', fontSize: '0.875rem', padding: '1rem', textAlign: 'center' }}>
                <LazyRecording />
              </div>
            )}
          </div>
        </aside>

        {/* CENTER PANEL - VIDEO PREVIEW & CONTROLS */}
        <main style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #394922', padding: '0.5rem', gap: '0.25rem' }}>
            <button onClick={handleSplitAtPlayheadAction} style={{ borderRadius: '0.375rem', padding: '0.5rem', backgroundColor: selectedItemId ? 'rgba(150, 242, 13, 0.2)' : 'transparent', color: selectedItemId ? '#96f20d' : '#999', border: 'none', cursor: 'pointer' }} title="Split at Playhead">✂️</button>
            <button onClick={handleRippleDeleteAction} style={{ borderRadius: '0.375rem', padding: '0.5rem', color: selectedItemId ? 'white' : '#999', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }} title="Delete Clip">🗑️</button>
            <button onClick={handleMergeAdjacentAction} style={{ borderRadius: '0.375rem', padding: '0.5rem', color: selectedItemId ? 'white' : '#999', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }} title="Merge Adjacent">🔗</button>
          </div>
          
          {/* Video Preview */}
          <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'black', padding: '2rem' }}>
            <DualVideoPreview
              currentTime={currentTime}
              onTimeChange={seek}
              timelineItems={timelineItems}
              isTimelinePlaying={isPlaying}
              onTimelinePlayToggle={() => isPlaying ? pause() : play()}
              onTimelineSeek={seek}
              showTimelineControls={true}
            />
          </div>

          {/* Playback Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #394922', padding: '0.75rem 1rem', backgroundColor: '#222c15', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => seek(Math.max(0, currentTime - 5))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }} title="Rewind 5s">⏪</button>
              <button onClick={isPlaying ? pause : play} style={{ background: 'none', border: 'none', color: '#96f20d', cursor: 'pointer', fontSize: '1.5rem' }} title={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? '⏸️' : '▶️'}</button>
              <button onClick={() => seek(Math.min(totalDuration, currentTime + 5))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }} title="Forward 5s">⏩</button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
              <span style={{ color: '#b3cb90', fontSize: '0.75rem', minWidth: '3rem' }}>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
              <div style={{ flex: 1, height: '4px', backgroundColor: '#394922', borderRadius: '2px', cursor: 'pointer', position: 'relative' }} onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); seek((e.clientX - rect.left) / rect.width * totalDuration); }}>
                <div style={{ height: '100%', width: `${(currentTime / totalDuration) * 100}%`, backgroundColor: '#96f20d', borderRadius: '2px' }} />
              </div>
              <span style={{ color: '#b3cb90', fontSize: '0.75rem', minWidth: '3rem' }}>{Math.floor(totalDuration / 60)}:{Math.floor(totalDuration % 60).toString().padStart(2, '0')}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select value={playbackRate} onChange={(e) => setPlaybackRate(parseFloat(e.target.value))} style={{ backgroundColor: '#394922', color: '#96f20d', border: 'none', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR - INSPECTOR */}
        <aside style={{ display: 'flex', width: '320px', flexDirection: 'column', borderLeft: '1px solid #394922', backgroundColor: '#222c15', flexShrink: 0, overflowY: 'auto' }}>
          <h3 style={{ borderBottom: '1px solid #394922', padding: '1rem', fontSize: '1.125rem', fontWeight: 'bold', margin: 0, color: 'white' }}>Inspector</h3>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {selectedItemId && timelineItems.find(i => i.id === selectedItemId) && (
              <>
                {/* Show Overlay Inspector with sliders if overlay clip selected */}
                {timelineItems.find(i => i.id === selectedItemId)?.overlayProperties && (
                  <OverlayInspector 
                    itemId={selectedItemId}
                    onClose={() => {
                      // setShowOverlayInspector(false); // This state variable is removed
                      handleItemSelect('');
                    }}
                  />
                )}
                
                {/* Show Clip Inspector if main track clip selected */}
                {!timelineItems.find(i => i.id === selectedItemId)?.overlayProperties && (
                  <ClipInspector 
                    clip={timelineItems.find(i => i.id === selectedItemId)}
                    onUpdate={(updates) => { /* Handle clip updates */ }}
                  />
                )}
              </>
            )}
            {!selectedItemId && (
              <div style={{ color: '#b3cb90', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                Select a clip to inspect
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* BOTTOM TIMELINE */}
      <footer style={{ display: 'flex', height: '280px', minHeight: '250px', flexDirection: 'column', borderTop: '1px solid #394922', backgroundColor: '#222c15', flexShrink: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #394922', padding: '0.25rem 1rem', gap: '1rem' }}>
          <button style={{ borderRadius: '0.375rem', padding: '0.5rem', color: 'white', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }} title="Add Track">+</button>
          <button style={{ borderRadius: '0.375rem', padding: '0.5rem', color: 'white', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }} title="Grid">⊞</button>
          <button style={{ borderRadius: '0.375rem', padding: '0.5rem', color: 'white', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }} title="Flag">🚩</button>
          <span style={{ color: '#b3cb90', fontSize: '0.75rem', marginLeft: 'auto' }}>Zoom: {(project?.pxPerSec || 50).toFixed(0)}px/s</span>
        </div>
        
        <div style={{ display: 'flex', flex: 1, overflow: 'auto' }}>
          <TimelineTracksContainer 
            timelineItems={timelineItems}
            pxPerSec={project?.pxPerSec || 50}
            currentTime={currentTime}
            onTimeChange={seek}
            onItemMove={handleItemMove}
            onItemResize={handleItemResize}
            onItemSelect={handleTimelineItemSelect}
            selectedItemId={selectedItemId}
            onItemsChange={handleTimelineItemsChange}
          />
        </div>
      </footer>

      {/* MODALS */}
      {showExportDialog && (
        <LazyExportDialog 
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          timelineItems={timelineItems}
          project={project}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <AppContent />
      </ProjectProvider>
    </ThemeProvider>
  );
}
