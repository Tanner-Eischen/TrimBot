import * as React from 'react';

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timelineItems: any[];
  projectDir: string;
}

declare const ExportDialog: React.ComponentType<ExportDialogProps>;
export default ExportDialog;