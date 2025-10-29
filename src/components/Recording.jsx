import { useState } from 'react';
import { Monitor, Camera, Video } from 'lucide-react';
import { ScreenRecording } from './ScreenRecording';
import { WebcamRecording } from './WebcamRecording';

function Recording({ onRecordingComplete }) {
  const [activeTab, setActiveTab] = useState('screen');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleRecordingComplete = (filename, filePath) => {
    setStatus(`Recording saved: ${filename}`);
    setError('');
    onRecordingComplete?.(filename, filePath);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setStatus('');
  };

  const handleStatusChange = (statusMessage) => {
    setStatus(statusMessage);
    setError('');
  };

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Video style={{ width: '1.5rem', height: '1.5rem', color: '#9333ea' }} />
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Recording</h2>
        </div>
        <p style={{ color: '#4b5563' }}>
          Record your screen or webcam to create new video content for your project.
        </p>
      </div>

      {/* Status Messages */}
      {status && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '0.5rem' }}>
          <p style={{ color: '#1e40af' }}>{status}</p>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
          <p style={{ color: '#991b1b' }}>{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('screen')}
            style={{
              padding: '0.5rem 0.25rem',
              borderBottom: activeTab === 'screen' ? '2px solid #3b82f6' : '2px solid transparent',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: activeTab === 'screen' ? '#2563eb' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'screen') e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'screen') e.currentTarget.style.color = '#6b7280';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Monitor style={{ width: '1rem', height: '1rem' }} />
              Screen Recording
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('webcam')}
            style={{
              padding: '0.5rem 0.25rem',
              borderBottom: activeTab === 'webcam' ? '2px solid #16a34a' : '2px solid transparent',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: activeTab === 'webcam' ? '#15803d' : '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'webcam') e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'webcam') e.currentTarget.style.color = '#6b7280';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera style={{ width: '1rem', height: '1rem' }} />
              Webcam Recording
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        {activeTab === 'screen' && (
          <ScreenRecording
            onRecordingComplete={handleRecordingComplete}
            onError={handleError}
            onStatusChange={handleStatusChange}
          />
        )}
        
        {activeTab === 'webcam' && (
          <WebcamRecording
            onRecordingComplete={handleRecordingComplete}
            onError={handleError}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* Recording Tips */}
      <div style={{ marginTop: '1.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', padding: '1rem' }}>
        <h3 style={{ fontWeight: 500, color: '#111827', marginBottom: '0.5rem' }}>Recording Tips:</h3>
        <ul style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0, paddingLeft: '1.5rem' }}>
          <li>Ensure good lighting for webcam recordings</li>
          <li>Close unnecessary applications to improve performance</li>
          <li>Test your audio levels before starting important recordings</li>
          <li>Recordings are automatically transcoded to MP4 for compatibility</li>
          <li>All recordings are saved to your project's media library</li>
        </ul>
      </div>
    </div>
  );
}

export default Recording;