// Type declarations for JSX components

declare module '../components/MediaImport.jsx' {
  interface MediaImportProps {
    onImport: (files: string[]) => void;
    isLoading?: boolean;
  }
  const MediaImport: React.FC<MediaImportProps>;
  export default MediaImport;
}

declare module '../components/ProjectSetup.jsx' {
  interface ProjectSetupProps {
    onProjectCreated: (projectData: any) => void;
  }
  const ProjectSetup: React.FC<ProjectSetupProps>;
  export default ProjectSetup;
}

declare module './components/Timeline' {
  interface TimelineProps {
    items: any[];
    pxPerSec: number;
    currentTime: number;
    onTimeChange: (time: number) => void;
    onItemMove: (itemId: string, newStartTime: number) => void;
    onItemResize: (itemId: string, newDuration: number) => void;
    onItemSelect: (itemId: string) => void;
    selectedItemId: string | null;
    onItemsChange: (items: any[]) => void;
  }
  const Timeline: React.FC<TimelineProps>;
  export default Timeline;
}

declare module './components/MediaLibrary.jsx' {
  interface MediaLibraryProps {
    library: Record<string, any>;
    onClipSelect: (clip: any) => void;
    selectedClipId: string | null;
  }
  const MediaLibrary: React.FC<MediaLibraryProps>;
  export default MediaLibrary;
}

declare module '../components/VideoPreview.jsx' {
  interface VideoPreviewProps {
    selectedClip: any;
    currentTime: number;
    onTimeChange: (time: number) => void;
    timelineItems: any[];
    isTimelinePlaying: boolean;
    onTimelinePlayToggle: () => void;
    onTimelineSeek: (time: number) => void;
    showTimelineControls: boolean;
  }
  const VideoPreview: React.FC<VideoPreviewProps>;
  export default VideoPreview;
}

declare module '../components/Recording.jsx' {
  interface RecordingProps {
    onRecordingComplete: (recordingData: any) => void;
  }
  const Recording: React.FC<RecordingProps>;
  export default Recording;
}

declare module '../components/PerformanceMonitor.jsx' {
  const PerformanceMonitor: React.FC<{}>;
  export default PerformanceMonitor;
}

declare module '../components/ErrorBoundary.jsx' {
  interface ErrorBoundaryProps {
    children: React.ReactNode;
  }
  const ErrorBoundary: React.FC<ErrorBoundaryProps>;
  export default ErrorBoundary;
}

declare module '../components/LazyComponentErrorBoundary.jsx' {
  interface LazyComponentErrorBoundaryProps {
    children: React.ReactNode;
  }
  const LazyComponentErrorBoundary: React.FC<LazyComponentErrorBoundaryProps>;
  export default LazyComponentErrorBoundary;
}

declare module '../components/MediaImport.jsx' {
  interface MediaImportProps {
    onImport: (files: string[]) => void;
    isLoading?: boolean;
  }
  const MediaImport: React.FC<MediaImportProps>;
  export default MediaImport;
}

declare module '../components/ProjectSetup.jsx' {
  interface ProjectSetupProps {
    onProjectCreated: (projectData: any) => void;
  }
  const ProjectSetup: React.FC<ProjectSetupProps>;
  export default ProjectSetup;
}