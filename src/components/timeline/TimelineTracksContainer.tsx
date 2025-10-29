import React, { useCallback, useMemo } from 'react';
import { TimelineTrack } from './TimelineTrack';
import { useProject } from '../../contexts/ProjectContext';
import { Eye, EyeOff, Volume2 } from 'lucide-react';

interface TimelineTracksContainerProps {
  timelineItems: any[];
  pxPerSec: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
  onItemMove: (itemId: string, newStartTime: number) => void;
  onItemResize: (itemId: string, newDuration: number) => void;
  onItemSelect: (itemId: string) => void;
  selectedItemId: string | null;
  onItemsChange: (items: any[]) => void;
}

export const TimelineTracksContainer: React.FC<TimelineTracksContainerProps> = ({
  timelineItems,
  pxPerSec,
  currentTime,
  onTimeChange,
  onItemMove,
  onItemResize,
  onItemSelect,
  selectedItemId,
  onItemsChange
}) => {
  const { 
    project, 
    toggleOverlayTrack, 
 
  } = useProject();

  // Separate items by track
  const mainTrackItems = useMemo(() => 
    timelineItems.filter(item => !item.trackType || item.trackType === 'main'),
    [timelineItems]
  );

  const overlayTrackItems = useMemo(() => 
    timelineItems.filter(item => item.trackType === 'overlay'),
    [timelineItems]
  );

  // Calculate total timeline duration for ruler
  const totalDuration = useMemo(() => {
    const allItems = [...mainTrackItems, ...overlayTrackItems];
    if (allItems.length === 0) return 60;
    
    const maxEndTime = allItems.reduce((max, item) => {
      return Math.max(max, item.startTime + item.durationSec);
    }, 0);
    
    return Math.max(maxEndTime, 60);
  }, [mainTrackItems, overlayTrackItems]);

  const totalWidth = totalDuration * pxPerSec;

  // Handle cross-track item movement
  const handleCrossTrackMove = useCallback((itemId: string, targetTrack: 'main' | 'overlay', newStartTime: number) => {
    // Find the item in either track
    const item = [...mainTrackItems, ...overlayTrackItems].find(i => i.id === itemId);
    if (!item) return;

    if (targetTrack === 'main') {
      // Move to main track - check if item already exists
      const existsInMain = mainTrackItems.some(i => i.id === itemId);
      if (!existsInMain) {
        const updatedMainTrack = [...mainTrackItems, { ...item, overlayProperties: undefined, startTime: newStartTime }];
        const updatedOverlayTrack = overlayTrackItems.filter(i => i.id !== itemId);
        
        onItemsChange([...updatedMainTrack, ...updatedOverlayTrack]);
      }
    } else {
      // Move to overlay track - check if item already exists
      const existsInOverlay = overlayTrackItems.some(i => i.id === itemId);
      if (!existsInOverlay) {
        const updatedOverlayTrack = [...overlayTrackItems, { 
          ...item, 
          startTime: newStartTime,
          overlayProperties: item.overlayProperties || {
            position: { x: 0.7, y: 0.05 },
            scale: 0.3,
            opacity: 1.0,
            includeAudio: false
          }
        }];
        const updatedMainTrack = mainTrackItems.filter(i => i.id !== itemId);
        
        onItemsChange([...updatedMainTrack, ...updatedOverlayTrack]);
      }
    }
  }, [mainTrackItems, overlayTrackItems, onItemsChange]);

  // Handle main track item changes
  const handleMainTrackItemsChange = useCallback((newItems: any[]) => {
    const updatedItems = [
      ...newItems.map(item => ({ ...item, trackType: 'main' })),
      ...overlayTrackItems
    ];
    onItemsChange(updatedItems);
  }, [overlayTrackItems, onItemsChange]);

  // Handle overlay track item changes
  const handleOverlayTrackItemsChange = useCallback((newItems: any[]) => {
    const updatedItems = [
      ...mainTrackItems,
      ...newItems.map(item => ({ ...item, trackType: 'overlay' }))
    ];
    onItemsChange(updatedItems);
  }, [mainTrackItems, onItemsChange]);

  // Toggle overlay track visibility
  const handleToggleOverlayTrack = useCallback(() => {
    toggleOverlayTrack(true);
  }, [toggleOverlayTrack]);

  // Generate time ruler marks
  const generateTimeMarks = useCallback(() => {
    const marks = [];
    const interval = pxPerSec >= 100 ? 1 : pxPerSec >= 50 ? 5 : 10; // seconds
    
    for (let time = 0; time <= totalDuration; time += interval) {
      const x = time * pxPerSec;
      const isMinute = time % 60 === 0;
      const isMajor = time % (interval * 2) === 0;
      
      marks.push(
        <div
          key={time}
          className={`timeline-mark ${isMinute ? 'minute' : isMajor ? 'major' : 'minor'}`}
          style={{ left: `${x}px` }}
        >
          {isMinute && (
            <span className="timeline-mark-label">
              {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
      );
    }
    
    return marks;
  }, [totalDuration, pxPerSec]);

  const trackSettings = project?.trackSettings || {
    showOverlayTrack: true,
    overlayTrackHeight: 60,
    trackSpacing: 8
  };

  return (
    <div className="timeline-tracks-container">
      {/* Time Ruler */}
      <div className="timeline-ruler" style={{ width: `${totalWidth}px` }}>
        <div className="timeline-marks">
          {generateTimeMarks()}
        </div>
        
        {/* Playhead */}
        <div 
          className="timeline-playhead"
          style={{ left: `${currentTime * pxPerSec}px` }}
        >
          <div className="playhead-line" />
          <div className="playhead-handle" />
        </div>
      </div>

      {/* Track Container */}
      <div className="tracks-container">
        {/* Main Track */}
        <div className="track-wrapper main-track-wrapper">
          <div className="track-header">
            <div className="track-label">
              <span className="track-name">Main Track</span>
              <div className="track-controls">
                <button 
                  className="track-control-btn"
                  title="Toggle Visibility"
                >
                  <Eye size={14} />
                </button>
                <button 
                  className="track-control-btn"
                  title="Toggle Audio"
                >
                  <Volume2 size={14} />
                </button>
              </div>
            </div>
          </div>
          
          <div 
            className="track-content main-track"
            style={{ height: `80px` }}
          >
            <TimelineTrack
              items={mainTrackItems}
              pxPerSec={pxPerSec}
              currentTime={currentTime}
              onTimeChange={onTimeChange}
              onItemMove={onItemMove}
              onItemResize={onItemResize}
              onItemSelect={onItemSelect}
              selectedItemId={selectedItemId}
              onItemsChange={handleMainTrackItemsChange}
              trackType="main"
              allowOverlap={false}
              onCrossTrackMove={handleCrossTrackMove}
            />
          </div>
        </div>

        {/* Overlay Track */}
        {trackSettings.showOverlayTrack && (
          <div 
            className="track-wrapper overlay-track-wrapper"
            style={{ marginTop: `${trackSettings.trackSpacing || 8}px` }}
          >
            <div className="track-header">
              <div className="track-label">
                <span className="track-name">Overlay Track</span>
                <div className="track-controls">
                  <button 
                    className="track-control-btn"
                    onClick={handleToggleOverlayTrack}
                    title="Toggle Track"
                  >
                    {trackSettings.showOverlayTrack ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button 
                    className="track-control-btn"
                    title="Toggle Audio"
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            
            <div 
              className="track-content overlay-track"
              style={{ height: `${trackSettings.overlayTrackHeight || 60}px` }}
            >
              <TimelineTrack
                items={overlayTrackItems}
                pxPerSec={pxPerSec}
                currentTime={currentTime}
                onTimeChange={onTimeChange}
                onItemMove={onItemMove}
                onItemResize={onItemResize}
                onItemSelect={onItemSelect}
                selectedItemId={selectedItemId}
                onItemsChange={handleOverlayTrackItemsChange}
                trackType="overlay"
                allowOverlap={true}
                onCrossTrackMove={handleCrossTrackMove}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};