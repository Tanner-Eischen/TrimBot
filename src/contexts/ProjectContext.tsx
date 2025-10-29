import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateTrimmedClipName, generateImportedFileName } from '../utils/fileNaming';
import { projectToasts, importToasts, editingToasts } from '../utils/toastMessages';
// Import new types from types/index.js for PR-07
import type { OverlayProperties, TrackSettings, TimelineItem, ClipKeyframe, KeyframeSet } from '../types';

// Use global Tauri API with browser fallback for development
const invoke = window.__TAURI__?.core?.invoke || (async (command, args) => {
  console.warn(`Tauri API not available. Mock implementation for command: ${command}`);
  
  // Provide mock implementations for browser development
  switch (command) {
    case 'open_dir_dialog':
      return 'C:\\Users\\tanne\\Gauntlet\\TrimBot\\mock-project';
    case 'create_project_dirs':
      console.log('Mock: Created project directories at', args?.projectDir);
      return true;
    case 'copy_file_to_media':
      console.log('Mock: Copied file from', args?.sourcePath, 'to media directory');
      return `${args?.projectDir}/media/${args?.sourcePath.split(/[\\/]/).pop()}`;
    case 'get_file_info':
      return { size: 1024000, modified: Date.now() };
    case 'trim_clip':
      console.log('Mock: Trimming clip', args);
      return 0;
    case 'ensure_dir':
      console.log('Mock: Ensuring directory exists at', args?.path);
      return true;
    default:
      console.warn(`No mock implementation for Tauri command: ${command}`);
      return null;
  }
});

// Keyframe types
// Types are now imported from ../types/index.ts

// Types - TimelineItem is now imported from types/index

export interface ProjectState {
  projectDir: string;
  mediaDir: string;
  exportDir: string;
  library: Record<string, TimelineItem>;
  timeline: TimelineItem[];
  pxPerSec: number;
  zoomLevel?: number; // For PR-02 zoom functionality
  keyframeSettings?: {
    defaultFadeDuration: number;
    showKeyframeMarkers: boolean;
  };
  // NEW: Multi-track support (PR-07)
  overlayTrack?: TimelineItem[];
  trackSettings?: TrackSettings;
}

// Helper adapters to keep TimelineItem construction consistent across the app
const makeTimelineItem = (
  base: Partial<TimelineItem> & Pick<TimelineItem, 'id' | 'name' | 'path' | 'type' | 'durationSec'>,
  startTime: number,
  pxPerSec: number,
): TimelineItem => {
  const xPx = startTime * pxPerSec;
  const wPx = base.durationSec * pxPerSec;
  return {
    selected: false,
    filename: base.filename,
    overlayProperties: base.overlayProperties,
    keyframes: base.keyframes,
    fadePresets: base.fadePresets,
    ...base,
    startTime,
    xPx,
    wPx,
  } as TimelineItem;
};

interface ProjectContextState {
  project: ProjectState | null;
  isLoading: boolean;
  error: string | null;
}

// Action types
type ProjectAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECT'; payload: ProjectState }
  | { type: 'UPDATE_LIBRARY'; payload: Record<string, TimelineItem> }
  | { type: 'UPDATE_TIMELINE'; payload: TimelineItem[] }
  | { type: 'UPDATE_CLIP_DURATION'; payload: { clipId: string; durationSec: number; width?: number; height?: number } }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'SET_PX_PER_SEC'; payload: number }
  // NEW: Overlay track actions for PR-07
  | { type: 'ADD_OVERLAY_ITEM'; payload: TimelineItem }
  | { type: 'UPDATE_OVERLAY_TRACK'; payload: TimelineItem[] }
  | { type: 'MOVE_ITEM_BETWEEN_TRACKS'; payload: { itemId: string; fromTrack: 'main' | 'overlay'; toTrack: 'main' | 'overlay' } }
  | { type: 'UPDATE_OVERLAY_PROPERTIES'; payload: { itemId: string; properties: Partial<OverlayProperties> } }
  | { type: 'TOGGLE_OVERLAY_TRACK'; payload: boolean }
  | { type: 'UPDATE_TRACK_SETTINGS'; payload: Partial<TrackSettings> };
  
// Helper: compute updated in/out given a trim on one side
function computeInOutForTrim(item: TimelineItem, newDuration: number, side: 'left' | 'right') {
  const oldDuration = item.durationSec;
  const delta = Math.max(0, oldDuration - newDuration);
  const prevIn = item.inSec ?? 0;
  let inSec = prevIn;
  let outSec = (item.outSec ?? (prevIn + oldDuration));
  if (side === 'left') {
    inSec = prevIn + delta;
    outSec = inSec + newDuration;
  } else {
    // right
    inSec = prevIn;
    outSec = inSec + newDuration;
  }
  return { inSec, outSec };
}

// Reducer
const projectReducer = (state: ProjectContextState, action: ProjectAction): ProjectContextState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROJECT':
      return { ...state, project: action.payload, error: null };
    case 'UPDATE_LIBRARY':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          library: { ...state.project.library, ...action.payload }
        }
      };
    case 'UPDATE_TIMELINE':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          timeline: action.payload
        }
      };
    case 'UPDATE_CLIP_DURATION':
      if (!state.project || !state.project.library[action.payload.clipId]) return state;
      return {
        ...state,
        project: {
          ...state.project,
          library: {
            ...state.project.library,
            [action.payload.clipId]: {
              ...state.project.library[action.payload.clipId],
              durationSec: action.payload.durationSec,
              ...(action.payload.width && { width: action.payload.width }),
              ...(action.payload.height && { height: action.payload.height })
            }
          }
        }
      };
    case 'SET_ZOOM_LEVEL':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          zoomLevel: action.payload
        }
      };
    case 'SET_PX_PER_SEC':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          pxPerSec: action.payload
        }
      };
    // NEW: Overlay track reducer cases for PR-07
    case 'ADD_OVERLAY_ITEM':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          overlayTrack: [...(state.project.overlayTrack || []), action.payload]
        }
      };
    case 'UPDATE_OVERLAY_TRACK':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          overlayTrack: action.payload
        }
      };
    case 'MOVE_ITEM_BETWEEN_TRACKS':
      if (!state.project) return state;
      const { itemId, fromTrack, toTrack } = action.payload;
      
      // Find the item in the source track
      let itemToMove: TimelineItem | null = null;
      let updatedSourceTrack: TimelineItem[] = [];
      
      if (fromTrack === 'main') {
        itemToMove = state.project.timeline.find(item => item.id === itemId) || null;
        updatedSourceTrack = state.project.timeline.filter(item => item.id !== itemId);
      } else {
        itemToMove = (state.project.overlayTrack || []).find(item => item.id === itemId) || null;
        updatedSourceTrack = (state.project.overlayTrack || []).filter(item => item.id !== itemId);
      }
      
      if (!itemToMove) return state;
      
      // Add to destination track
      let updatedDestTrack: TimelineItem[] = [];
      if (toTrack === 'main') {
        updatedDestTrack = [...state.project.timeline];
        if (fromTrack === 'overlay') {
          updatedDestTrack.push(itemToMove);
        }
      } else {
        updatedDestTrack = [...(state.project.overlayTrack || [])];
        if (fromTrack === 'main') {
          updatedDestTrack.push(itemToMove);
        }
      }
      
      return {
        ...state,
        project: {
          ...state.project,
          timeline: fromTrack === 'main' ? updatedSourceTrack : (toTrack === 'main' ? updatedDestTrack : state.project.timeline),
          overlayTrack: fromTrack === 'overlay' ? updatedSourceTrack : (toTrack === 'overlay' ? updatedDestTrack : state.project.overlayTrack)
        }
      };
    case 'UPDATE_OVERLAY_PROPERTIES':
      if (!state.project) return state;
      const updatedOverlayTrack = (state.project.overlayTrack || []).map(item => {
        if (item.id === action.payload.itemId) {
          return {
            ...item,
            overlayProperties: {
              ...item.overlayProperties,
              ...action.payload.properties
            }
          };
        }
        return item;
      });
      return {
        ...state,
        project: {
          ...state.project,
          overlayTrack: updatedOverlayTrack
        }
      };
    case 'TOGGLE_OVERLAY_TRACK':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          trackSettings: {
            ...state.project.trackSettings,
            showOverlayTrack: action.payload
          }
        }
      };
    case 'UPDATE_TRACK_SETTINGS':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          trackSettings: {
            ...state.project.trackSettings,
            ...action.payload
          }
        }
      };
    default:
      return state;
  }
};

// Context
interface ProjectContextValue extends ProjectContextState {
  createProject: () => Promise<ProjectState>;
  importFiles: (filePaths: string[]) => Promise<TimelineItem[]>;
  updateClipDuration: (clipId: string, durationSec: number, width?: number, height?: number) => void;
  trimClip: (clipId: string, startTime: number, endTime: number) => Promise<TimelineItem>;
  addToTimeline: (clip: TimelineItem) => void;
  reorderTimeline: (newTimeline: TimelineItem[]) => void;
  addToLibrary: (library: Record<string, TimelineItem>) => void;
  setZoomLevel: (zoomLevel: number) => void;
  setPxPerSec: (pxPerSec: number) => void;
  // Keyframe operations
  addKeyframe: (clipId: string, property: string, timeSec: number, value: number) => void;
  removeKeyframe: (clipId: string, keyframeId: string) => void;
  setFadePreset: (clipId: string, fadeType: 'fadeIn' | 'fadeOut', enabled: boolean, duration?: number) => void;
  // Non-destructive trim
  setClipInOut: (itemId: string, inSec: number, outSec: number) => void;
  // NEW: Overlay track operations for PR-07
  addToOverlayTrack: (clip: TimelineItem) => void;
  reorderOverlayTrack: (newOverlayTrack: TimelineItem[]) => void;
  moveItemBetweenTracks: (itemId: string, fromTrack: 'main' | 'overlay', toTrack: 'main' | 'overlay') => void;
  updateOverlayProperties: (itemId: string, properties: Partial<OverlayProperties>) => void;
  toggleOverlayTrack: (enabled: boolean) => void;
  updateTrackSettings: (settings: Partial<TrackSettings>) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

// Provider
interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = React.memo(({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, {
    project: null,
    isLoading: false,
    error: null
  });

  const createProject = useCallback(async (): Promise<ProjectState> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const projectDir = await invoke('open_dir_dialog');
      await invoke('create_project_dirs', { projectDir });
      
      // Ensure all directories exist
      await invoke('ensure_dir', { path: `${projectDir}/media` });
      await invoke('ensure_dir', { path: `${projectDir}/exports` });
      await invoke('ensure_dir', { path: `${projectDir}/.temp` });
      
      const newProject: ProjectState = {
        projectDir,
        mediaDir: `${projectDir}/media`,
        exportDir: `${projectDir}/exports`,
        library: {},
        timeline: [],
        // NEW: Initialize overlay track and track settings for PR-07
        overlayTrack: [],
        trackSettings: {
          showOverlayTrack: true,
          overlayTrackHeight: 60,
          trackSpacing: 8
        },
        pxPerSec: 50,
        zoomLevel: 1.0,
        keyframeSettings: {
          defaultFadeDuration: 1.0,
          showKeyframeMarkers: true
        }
      };
      
      dispatch({ type: 'SET_PROJECT', payload: newProject });
      return newProject;
    } catch (err) {
      const errorMsg = String(err);
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      projectToasts.createFailed(errorMsg);
      throw new Error(errorMsg);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const importFiles = useCallback(async (filePaths: string[]): Promise<TimelineItem[]> => {
    if (!state.project) {
      throw new Error('No project loaded');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Ensure project directories exist before importing
      await invoke('ensure_dir', { path: `${state.project.projectDir}/media` });
      await invoke('ensure_dir', { path: `${state.project.projectDir}/exports` });
      await invoke('ensure_dir', { path: `${state.project.projectDir}/.temp` });

      const newClips: TimelineItem[] = [];

      for (const filePath of filePaths) {
        const filename = filePath.split(/[\\/]/).pop() || 'unknown';
        const clipId = uuidv4();
        
        const improvedFilename = generateImportedFileName(filename, clipId);
        const copiedPath = await invoke('copy_file_to_media', {
          sourcePath: filePath,
          projectDir: state.project.projectDir,
          filename: improvedFilename,
        });

        let finalPath = copiedPath;
        let finalFilename = improvedFilename;

        // Check if file needs to be converted to MP4 for normalization
        const fileExtension = filename.toLowerCase().split('.').pop();
        const needsConversion = fileExtension !== 'mp4';

        if (needsConversion) {
          importToasts.converting(filename);
          
          try {
            const mp4Filename = improvedFilename.replace(/\.[^.]+$/, '.mp4');
            const mp4Path = copiedPath.replace(/\.[^.]+$/, '.mp4');
            
            await invoke('transcode_to_mp4', {
              input: copiedPath,
              output: mp4Path
            });
            
            finalPath = mp4Path;
            finalFilename = mp4Filename;
            
            importToasts.conversionComplete(filename);
          } catch (conversionError) {
            console.error('Failed to convert file to MP4:', conversionError);
            importToasts.conversionFailed(filename, String(conversionError));
          }
        }

        const clipFile: TimelineItem = makeTimelineItem(
          {
            id: clipId,
            name: filename,
            type: 'video',
            path: finalPath,
            durationSec: 0,
            filename: finalFilename,
          },
          0,
          state.project.pxPerSec
        );

        newClips.push(clipFile);
      }

      // Update library
      const newLibraryItems = newClips.reduce((acc, clip) => {
        acc[clip.id] = clip;
        return acc;
      }, {} as Record<string, TimelineItem>);

      dispatch({ type: 'UPDATE_LIBRARY', payload: newLibraryItems });

      return newClips;
    } catch (err) {
      const errorMsg = String(err);
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      throw new Error(errorMsg);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.project]);

  const updateClipDuration = useCallback((clipId: string, durationSec: number, width?: number, height?: number) => {
    dispatch({
      type: 'UPDATE_CLIP_DURATION',
      payload: { clipId, durationSec, width, height }
    });
    // Recalculate pixel width in library entry if present
    if (state.project?.library[clipId]) {
      const base = state.project.library[clipId];
      const updatedClip: TimelineItem = {
        ...base,
        durationSec,
        wPx: durationSec * (state.project.pxPerSec || 50),
        ...(width ? { width } : {} as any),
        ...(height ? { height } : {} as any)
      } as TimelineItem;
      dispatch({ type: 'UPDATE_LIBRARY', payload: { [clipId]: updatedClip } });
    }
  }, [state.project]);

  // Non-destructive trim: set in/out on a timeline item and recompute duration/pixels
  const setClipInOut = useCallback((itemId: string, inSec: number, outSec: number) => {
    if (!state.project) return;
    const newDuration = Math.max(0.1, outSec - inSec);
    const updated = state.project.timeline.map(item => {
      if (item.id !== itemId) return item;
      const startTime = item.startTime;
      return makeTimelineItem(
        { ...item, durationSec: newDuration, inSec, outSec },
        startTime,
        state.project!.pxPerSec
      );
    });
    dispatch({ type: 'UPDATE_TIMELINE', payload: updated });
  }, [state.project]);

  const trimClip = useCallback(async (clipId: string, startTime: number, endTime: number): Promise<TimelineItem> => {
    if (!state.project) {
      throw new Error('No project loaded');
    }

    const originalClip = state.project.library[clipId];
    if (!originalClip) {
      throw new Error('Clip not found');
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const trimmedClipId = uuidv4();
      const trimmedFilename = generateTrimmedClipName(originalClip.filename || 'clip', startTime, endTime);
      const outputPath = `${state.project.mediaDir}/${trimmedFilename}`;

      editingToasts.trimming(originalClip.filename || 'clip');

      const exitCode = await invoke('trim_clip', {
        input: originalClip.path,
        output: outputPath,
        startTime,
        endTime,
      });

      if (exitCode !== 0) {
        throw new Error(`FFmpeg failed with exit code ${exitCode}`);
      }

      const trimmedClip: TimelineItem = makeTimelineItem(
        {
          id: trimmedClipId,
          name: trimmedFilename,
          type: 'video',
          path: outputPath,
          durationSec: endTime - startTime,
          filename: trimmedFilename,
        },
        0,
        state.project.pxPerSec
      );

      dispatch({ type: 'UPDATE_LIBRARY', payload: { [trimmedClipId]: trimmedClip } });

      editingToasts.trimComplete(originalClip.filename || 'clip');
      return trimmedClip;
    } catch (err) {
      const errorMsg = String(err);
      editingToasts.trimFailed(originalClip.filename || 'clip', errorMsg);
      throw new Error(errorMsg);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.project]);

  const addToTimeline = useCallback((clip: TimelineItem) => {
    if (!state.project) return;

    const startTime = state.project.timeline.reduce((maxEnd, item) =>
      Math.max(maxEnd, item.startTime + item.durationSec), 0
    );
    const timelineClip = makeTimelineItem(clip, startTime, state.project.pxPerSec);

    dispatch({ 
      type: 'UPDATE_TIMELINE', 
      payload: [...state.project.timeline, timelineClip] 
    });
  }, [state.project]);

  const reorderTimeline = useCallback((newTimeline: TimelineItem[]) => {
    dispatch({ type: 'UPDATE_TIMELINE', payload: newTimeline });
  }, []);

  const addToLibrary = useCallback((library: Record<string, TimelineItem>) => {
    if (!state.project) return;
    dispatch({ type: 'UPDATE_LIBRARY', payload: { ...state.project.library, ...library } });
  }, [state.project]);

  const setZoomLevel = useCallback((zoomLevel: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: zoomLevel });
  }, []);

  const setPxPerSec = useCallback((pxPerSec: number) => {
    dispatch({ type: 'SET_PX_PER_SEC', payload: pxPerSec });
  }, []);

  // Keyframe management functions
  const addKeyframe = useCallback((clipId: string, property: string, timeSec: number, value: number) => {
    if (!state.project) return;

    const updatedTimeline = state.project.timeline.map(item => {
      if (item.id === clipId) {
        const keyframes = item.keyframes || {};
        const propertyKeyframes = keyframes[property as keyof KeyframeSet] || [];
        
        const newKeyframe: ClipKeyframe = {
          id: uuidv4(),
          timeSec: Math.max(0, Math.min(timeSec, item.durationSec)),
          property,
          value: Math.max(0, Math.min(1, value)),
          interpolation: 'linear'
        };
        
        // Insert keyframe in chronological order
        const updatedKeyframes = [...propertyKeyframes, newKeyframe]
          .sort((a, b) => a.timeSec - b.timeSec);
        
        return {
          ...item,
          keyframes: {
            ...keyframes,
            [property]: updatedKeyframes
          }
        };
      }
      return item;
    });
    
    dispatch({ type: 'UPDATE_TIMELINE', payload: updatedTimeline });
  }, [state.project]);

  const removeKeyframe = useCallback((clipId: string, keyframeId: string) => {
    if (!state.project) return;

    const updatedTimeline = state.project.timeline.map(item => {
      if (item.id === clipId && item.keyframes) {
        const updatedKeyframes: KeyframeSet = {};
        
        Object.keys(item.keyframes).forEach(property => {
          const propertyKey = property as keyof KeyframeSet;
          if (item.keyframes?.[propertyKey]) {
            updatedKeyframes[propertyKey] = item.keyframes[propertyKey]!
              .filter(kf => kf.id !== keyframeId);
          }
        });
        
        return { ...item, keyframes: updatedKeyframes };
      }
      return item;
    });
    
    dispatch({ type: 'UPDATE_TIMELINE', payload: updatedTimeline });
  }, [state.project]);

  const setFadePreset = useCallback((clipId: string, fadeType: 'fadeIn' | 'fadeOut', enabled: boolean, duration = 1.0) => {
    if (!state.project) return;

    const updatedTimeline = state.project.timeline.map(item => {
      if (item.id === clipId) {
        const fadePresets = item.fadePresets || {};
        
        if (enabled) {
          // Add fade keyframes
          const keyframes = item.keyframes || {};
          const opacityKeyframes = keyframes.opacity || [];
          
          let newKeyframes = [...opacityKeyframes];
          
          if (fadeType === 'fadeIn') {
            // Remove existing fade-in keyframes
            newKeyframes = newKeyframes.filter(kf => kf.timeSec > duration);
            // Add new fade-in keyframes
            newKeyframes.unshift(
              { id: uuidv4(), timeSec: 0, property: 'opacity', value: 0, interpolation: 'linear' },
              { id: uuidv4(), timeSec: duration, property: 'opacity', value: 1, interpolation: 'linear' }
            );
          } else if (fadeType === 'fadeOut') {
            const clipDuration = item.durationSec;
            const fadeStart = clipDuration - duration;
            // Remove existing fade-out keyframes
            newKeyframes = newKeyframes.filter(kf => kf.timeSec < fadeStart);
            // Add new fade-out keyframes
            newKeyframes.push(
              { id: uuidv4(), timeSec: fadeStart, property: 'opacity', value: 1, interpolation: 'linear' },
              { id: uuidv4(), timeSec: clipDuration, property: 'opacity', value: 0, interpolation: 'linear' }
            );
          }
          
          return {
            ...item,
            keyframes: { ...keyframes, opacity: newKeyframes.sort((a, b) => a.timeSec - b.timeSec) },
            fadePresets: { ...fadePresets, [fadeType]: { type: fadeType, duration, enabled } }
          };
        } else {
          // Remove fade keyframes and preset
          const keyframes = item.keyframes || {};
          let opacityKeyframes = keyframes.opacity || [];
          
          if (fadeType === 'fadeIn') {
            opacityKeyframes = opacityKeyframes.filter(kf => kf.timeSec > duration);
          } else if (fadeType === 'fadeOut') {
            const clipDuration = item.durationSec;
            const fadeStart = clipDuration - duration;
            opacityKeyframes = opacityKeyframes.filter(kf => kf.timeSec < fadeStart);
          }
          
          const updatedFadePresets = { ...fadePresets };
          delete updatedFadePresets[fadeType];
          
          return {
            ...item,
            keyframes: { ...keyframes, opacity: opacityKeyframes },
            fadePresets: updatedFadePresets
          };
        }
      }
      return item;
    });
    
    dispatch({ type: 'UPDATE_TIMELINE', payload: updatedTimeline });
  }, [state.project]);

  // NEW: Overlay/multi-track operations (PR-07)
  const addToOverlayTrack = useCallback((clip: TimelineItem) => {
    dispatch({ type: 'ADD_OVERLAY_ITEM', payload: clip });
  }, []);

  const reorderOverlayTrack = useCallback((newOverlayTrack: TimelineItem[]) => {
    dispatch({ type: 'UPDATE_OVERLAY_TRACK', payload: newOverlayTrack });
  }, []);

  const moveItemBetweenTracks = useCallback((itemId: string, fromTrack: 'main' | 'overlay', toTrack: 'main' | 'overlay') => {
    dispatch({ type: 'MOVE_ITEM_BETWEEN_TRACKS', payload: { itemId, fromTrack, toTrack } });
  }, []);

  const updateOverlayProperties = useCallback((itemId: string, properties: Partial<OverlayProperties>) => {
    dispatch({ type: 'UPDATE_OVERLAY_PROPERTIES', payload: { itemId, properties } });
  }, []);

  const toggleOverlayTrack = useCallback((enabled: boolean) => {
    dispatch({ type: 'TOGGLE_OVERLAY_TRACK', payload: enabled });
  }, []);

  const updateTrackSettings = useCallback((settings: Partial<TrackSettings>) => {
    dispatch({ type: 'UPDATE_TRACK_SETTINGS', payload: settings });
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo((): ProjectContextValue => ({
    ...state,
    createProject,
    importFiles,
    updateClipDuration,
    trimClip,
    addToTimeline,
    reorderTimeline,
    addToLibrary,
    setZoomLevel,
    setPxPerSec,
    addKeyframe,
    removeKeyframe,
    setFadePreset,
    setClipInOut,
    // NEW: Overlay operations for PR-07
    addToOverlayTrack,
    reorderOverlayTrack,
    moveItemBetweenTracks,
    updateOverlayProperties,
    toggleOverlayTrack,
    updateTrackSettings
  }), [
    state,
    createProject,
    importFiles,
    updateClipDuration,
    trimClip,
    addToTimeline,
    reorderTimeline,
    addToLibrary,
    setZoomLevel,
    setPxPerSec,
    addKeyframe,
    removeKeyframe,
    setFadePreset,
    addToOverlayTrack,
    reorderOverlayTrack,
    moveItemBetweenTracks,
    updateOverlayProperties,
    toggleOverlayTrack,
    updateTrackSettings
  ]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
});

// Hook
export const useProject = (): ProjectContextValue => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
