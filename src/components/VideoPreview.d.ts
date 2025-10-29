import * as React from 'react';

export interface VideoPreviewProps {
  selectedClip: any;
  currentTime: number;
  onTimeChange: (time: number) => void;
  timelineItems: any[];
  isTimelinePlaying: boolean;
  onTimelinePlayToggle: () => void;
  onTimelineSeek: (time: number) => void;
  showTimelineControls: boolean;
}

declare const VideoPreview: React.ComponentType<VideoPreviewProps>;
export default VideoPreview;