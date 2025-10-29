import * as React from 'react';

export interface RecordingProps {
  onRecordingComplete: (recordingData: any) => void;
}

declare const Recording: React.ComponentType<RecordingProps>;
export default Recording;