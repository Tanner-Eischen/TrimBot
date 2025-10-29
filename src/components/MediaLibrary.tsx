import { Play, Plus, FileVideo, Upload, Layers } from 'lucide-react';

interface Clip {
  id: string;
  filename: string;
  durationSec: number;
  width?: number;
  height?: number;
  sourceKind?: 'trim' | 'recording' | 'import';
}

interface MediaLibraryProps {
  library?: Record<string, Clip>;
  onSelectClip: (clip: Clip) => void;
  onAddToTimeline: (clip: Clip) => void;
  onAddToOverlayTrack?: (clip: Clip) => void;
  selectedClipId?: string;
}

function MediaLibrary({ 
  library = {}, 
  onSelectClip, 
  onAddToTimeline, 
  onAddToOverlayTrack, 
  selectedClipId 
}: MediaLibraryProps) {
  const clips = Object.values(library);

  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (clips.length === 0) {
    return (
      <div style={{ backgroundColor: '#222c15', borderRadius: '0.375rem', border: '1px solid #394922', padding: '1.5rem', textAlign: 'center' }}>
        <FileVideo style={{ margin: '0 auto 1rem', width: '3rem', height: '3rem', color: '#666' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', margin: '0 0 0.5rem 0' }}>No Media Files</h3>
        <p style={{ fontSize: '0.875rem', color: '#b3cb90', margin: '0 0 1rem 0' }}>
          Your media library is empty. Import video files to start editing.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <Upload style={{ width: '0.75rem', height: '0.75rem' }} />
            <span>Click "Import Media" to add videos</span>
          </div>
          <div>Supported formats: MP4, MOV, AVI, MKV, WebM</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#222c15', borderRadius: '0.375rem', border: '1px solid #394922', overflow: 'hidden' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #394922' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', margin: 0 }}>Media Library</h2>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
        {clips.map((clip) => (
          <div
            key={clip.id}
            onClick={() => onSelectClip(clip)}
            style={{
              padding: '0.75rem',
              borderBottom: '1px solid #394922',
              cursor: 'pointer',
              backgroundColor: selectedClipId === clip.id ? 'rgba(150, 242, 13, 0.1)' : 'transparent',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedClipId !== clip.id) {
                e.currentTarget.style.backgroundColor = 'rgba(150, 242, 13, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedClipId !== clip.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {clip.filename}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>
                  {formatDuration(clip.durationSec)} • {clip.width}x{clip.height}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem', flexShrink: 0 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToTimeline(clip);
                  }}
                  style={{
                    padding: '0.4rem',
                    backgroundColor: '#96f20d',
                    color: '#1b2210',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Add to main track"
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                </button>
                {onAddToOverlayTrack && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToOverlayTrack(clip);
                    }}
                    style={{
                      padding: '0.4rem',
                      backgroundColor: '#394922',
                      color: '#96f20d',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Add to overlay track"
                  >
                    <Layers style={{ width: '1rem', height: '1rem' }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MediaLibrary;