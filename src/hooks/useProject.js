import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateTrimmedClipName, generateImportedFileName } from '../utils/fileNaming';
import { projectToasts, importToasts, editingToasts } from '../utils/toastMessages';

// Use global Tauri API with browser fallback for development
const invoke = window.__TAURI__?.core?.invoke || (async (command, args) => {
  console.warn(`Tauri API not available. Mock implementation for command: ${command}`);
  
  // Provide mock implementations for browser development
  switch (command) {
    case 'open_dir_dialog':
      // Return a mock project directory for browser testing
      return 'C:\\Users\\tanne\\Gauntlet\\TrimBot\\mock-project';
    
    case 'create_project_dirs':
      // Mock successful directory creation
      console.log('Mock: Created project directories at', args?.projectDir);
      return true;
    
    case 'copy_file_to_media':
      // Mock file copy operation
      console.log('Mock: Copied file from', args?.sourcePath, 'to media directory');
      return `${args?.projectDir}/media/${args?.sourcePath.split(/[\\/]/).pop()}`;
    
    case 'get_file_info':
      // Mock file info
      return {
        size: 1024000,
        modified: Date.now()
      };
    
    case 'trim_clip':
      // Mock trim operation
      console.log('Mock: Trimming clip', args);
      const mockTrimmedPath = `${args?.output}`;
      return 0; // Success exit code
    
    case 'ensure_dir':
      // Mock directory creation
      console.log('Mock: Ensuring directory exists at', args?.path);
      return true;
    
    default:
      console.warn(`No mock implementation for Tauri command: ${command}`);
      return null;
  }
});

export const useProject = () => {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Open directory dialog
      const projectDir = await invoke('open_dir_dialog');
      
      // Create project directory structure
      await invoke('create_project_dirs', { projectDir });
      
      // Ensure all directories exist
      await invoke('ensure_dir', { path: `${projectDir}/media` });
      await invoke('ensure_dir', { path: `${projectDir}/exports` });
      await invoke('ensure_dir', { path: `${projectDir}/.temp` });
      
      // Initialize project state
      const newProject = {
        projectDir,
        mediaDir: `${projectDir}/media`,
        exportDir: `${projectDir}/exports`,
        library: {},
        timeline: [],
        pxPerSec: 50,
      };
      
      setProject(newProject);
      return newProject;
    } catch (err) {
      const errorMsg = err;
      setError(errorMsg);
      projectToasts.createFailed(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importFiles = useCallback(async (filePaths) => {
    if (!project) {
      throw new Error('No project loaded');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure project directories exist before importing
      await invoke('ensure_dir', { path: `${project.projectDir}/media` });
      await invoke('ensure_dir', { path: `${project.projectDir}/exports` });
      await invoke('ensure_dir', { path: `${project.projectDir}/.temp` });

      const newClips = [];

      for (const filePath of filePaths) {
        const filename = filePath.split(/[\\/]/).pop() || 'unknown';
        const clipId = uuidv4();
        
        // Copy file to media directory with improved naming
        const improvedFilename = generateImportedFileName(filename, clipId);
        const copiedPath = await invoke('copy_file_to_media', {
          sourcePath: filePath,
          projectDir: project.projectDir,
          filename: improvedFilename,
        });

        let finalPath = copiedPath;
        let finalFilename = improvedFilename;

        // Check if file needs to be converted to MP4 for normalization
        const fileExtension = filename.toLowerCase().split('.').pop();
        const needsConversion = fileExtension !== 'mp4';

        if (needsConversion) {
          // Show conversion toast
          importToasts.converting(filename);
          
          try {
            // Generate MP4 filename
            const mp4Filename = improvedFilename.replace(/\.[^.]+$/, '.mp4');
            const mp4Path = copiedPath.replace(/\.[^.]+$/, '.mp4');
            
            // Transcode to MP4 for normalization
            await invoke('transcode_to_mp4', {
              input: copiedPath,
              output: mp4Path
            });
            
            finalPath = mp4Path;
            finalFilename = mp4Filename;
            
            importToasts.conversionComplete(filename);
          } catch (conversionError) {
            console.error('Failed to convert file to MP4:', conversionError);
            importToasts.conversionFailed(filename, conversionError);
            // Continue with original file if conversion fails
          }
        }

        // Create clip file object (duration will be probed later)
        const clipFile = {
          id: clipId,
          path: finalPath,
          type: 'video',
          durationSec: 0, // Will be updated after probing
          createdAt: new Date().toISOString(),
          sourceKind: 'import',
          filename: finalFilename,
          originalFilename: filename, // Keep track of original filename
        };

        newClips.push(clipFile);
      }

      // Update project library
      setProject(prev => {
        if (!prev) return prev;
        
        const updatedLibrary = { ...prev.library };
        newClips.forEach(clip => {
          updatedLibrary[clip.id] = clip;
        });

        return {
          ...prev,
          library: updatedLibrary,
        };
      });

      return newClips;
    } catch (err) {
      const errorMsg = err;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  const updateClipDuration = useCallback((clipId, durationSec, width, height) => {
    setProject(prev => {
      if (!prev || !prev.library[clipId]) return prev;

      return {
        ...prev,
        library: {
          ...prev.library,
          [clipId]: {
            ...prev.library[clipId],
            durationSec,
            width,
            height,
          },
        },
      };
    });
  }, []);

  const trimClip = useCallback(async (clipId, startTime, endTime) => {
    if (!project) {
      throw new Error('No project loaded');
    }

    const clip = project.library[clipId];
    if (!clip) {
      throw new Error('Clip not found');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate new filename for trimmed clip
      const trimmedFilename = generateTrimmedClipName(clip.filename, startTime, endTime);
      const outputPath = `${project.mediaDir}/${trimmedFilename}`;

      // Call Tauri trim command
      await invoke('trim_clip', {
        input: clip.path,
        start: startTime,
        end: endTime,
        output: outputPath
      });

      // Create new clip entry for trimmed version
      const trimmedClipId = uuidv4();
      const trimmedClip = {
        id: trimmedClipId,
        path: outputPath,
        type: 'video',
        durationSec: endTime - startTime,
        createdAt: new Date().toISOString(),
        sourceKind: 'trim',
        sourceClipId: clipId,
        filename: trimmedFilename,
        width: clip.width,
        height: clip.height,
      };

      // Update project library with new trimmed clip
      setProject(prev => {
        if (!prev) return prev;

        return {
          ...prev,
          library: {
            ...prev.library,
            [trimmedClipId]: trimmedClip,
          },
          timeline: prev.timeline.map(timelineClip => 
            timelineClip.id === clipId ? trimmedClip : timelineClip
          ),
        };
      });

      return trimmedClip;
    } catch (err) {
      const errorMsg = err.toString();
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  const addToTimeline = useCallback((clip) => {
    setProject(prev => {
      if (!prev) return prev;

      // Check if clip is already in timeline
      const isInTimeline = prev.timeline.some(timelineClip => timelineClip.id === clip.id);
      if (isInTimeline) return prev;

      return {
        ...prev,
        timeline: [...prev.timeline, clip],
      };
    });
  }, []);

  const reorderTimeline = useCallback((newTimeline) => {
    setProject(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        timeline: newTimeline,
      };
    });
  }, []);

  const addToLibrary = useCallback((updatedLibrary) => {
    setProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        library: updatedLibrary,
      };
    });
  }, []);

  return {
    project,
    isLoading,
    error,
    createProject,
    importFiles,
    updateClipDuration,
    trimClip,
    addToTimeline,
    reorderTimeline,
    addToLibrary,
  };
};