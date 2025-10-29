import React from 'react';
import { Upload, FileVideo, HelpCircle } from 'lucide-react';
import './MediaImport.css';

// Use global Tauri API with browser fallback for development
const invoke = (window as any).__TAURI__?.core?.invoke || (async (command: string) => {
  console.warn(`Tauri API not available. Mock implementation for command: ${command}`);
  
  // Provide mock implementations for browser development
  switch (command) {
    case 'open_file_dialog_multi':
      // Return mock file paths for browser testing
      return [
        'C:\\Users\\tanne\\Gauntlet\\TrimBot\\mock-video1.mp4',
        'C:\\Users\\tanne\\Gauntlet\\TrimBot\\mock-video2.mp4'
      ];
    
    default:
      console.warn(`No mock implementation for Tauri command: ${command}`);
      return null;
  }
});

interface MediaImportProps {
  onImport: (filePaths: string[]) => Promise<void>;
  isLoading?: boolean;
}

export const MediaImport: React.FC<MediaImportProps> = ({ onImport, isLoading }) => {
  const handleImport = async () => {
    try {
      const filePaths = await invoke('open_file_dialog_multi');
      if (filePaths && filePaths.length > 0) {
        await onImport(filePaths);
      }
    } catch (error) {
      console.error('Failed to import files:', error);
    }
  };

  return (
    <div className="media-import">
      <div className="media-import__header">
        <div className="media-import__title">
          <FileVideo className="media-import__icon" />
          <h2 className="media-import__heading">Import Media</h2>
        </div>
        <p className="media-import__description">
          Add video files to your project library
        </p>
      </div>
      
      <div className="media-import__content">
        <button
          onClick={handleImport}
          disabled={isLoading}
          className="media-import__button"
        >
          <Upload className="media-import__button-icon" />
          {isLoading ? 'Importing...' : 'Select Video Files'}
        </button>
        
        <div className="media-import__help">
          <div className="media-import__help-item">
            <HelpCircle className="media-import__help-icon" />
            <span>Supported formats: MP4, MOV, AVI, MKV, WebM</span>
          </div>
          <div>• Files will be copied to your project folder</div>
          <div>• You can select multiple files at once</div>
        </div>
      </div>
    </div>
  );
};

export default MediaImport;