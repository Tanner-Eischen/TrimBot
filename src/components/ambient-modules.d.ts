import type * as React from 'react';

// Ambient module declarations for local JSX modules imported with relative paths



declare module './VideoPreview.jsx' {
  const VideoPreview: React.ComponentType<any>;
  export default VideoPreview;
}

declare module './Recording.jsx' {
  const Recording: React.ComponentType<any>;
  export default Recording;
}

declare module './components/ClipInspector' {
  const ClipInspector: React.ComponentType<any>;
  export default ClipInspector;
}

declare module './components/ClipInspector.jsx' {
  const ClipInspector: React.ComponentType<any>;
  export default ClipInspector;
}

// ExportDialog provides a named export in the .jsx module
declare module './ExportDialog.jsx' {
  const _default: React.ComponentType<any>;
  export default _default;
  export const ExportDialog: React.ComponentType<any>;
}
