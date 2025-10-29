import React from 'react';

export interface MediaImportProps {
  onImportFiles: (filePaths: string[]) => Promise<void>;
}

declare const MediaImport: React.FC<MediaImportProps>;
export default MediaImport;