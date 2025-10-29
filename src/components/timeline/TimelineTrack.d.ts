import * as React from 'react';

export interface TimelineItem {
  id: string;
  name: string;
  durationSec: number;
  startTime: number;
  xPx: number;
  wPx: number;
  type: 'video' | 'audio';
  path: string;
  selected: boolean;
  filename?: string;
}

export interface TimelineTrackProps {
  // Preferred props (App.tsx usage)
  items?: TimelineItem[];
  onItemsChange?: (items: TimelineItem[]) => void;
  onTimeChange?: (time: number) => void;
  onItemMove?: (itemId: string, newStartTime: number) => void;
  onItemResize?: (itemId: string, newDuration: number) => void;
  onItemSelect?: (itemId: string) => void;
  selectedItemId?: string | null;
  // Back-compat props
  timelineItems?: TimelineItem[];
  onTimelineItemsChange?: (items: TimelineItem[]) => void;
  onCurrentTimeChange?: (time: number) => void;
  onSelectClip?: (clipId: string) => void;
  // Shared
  pxPerSec: number;
  currentTime: number;
}

export function TimelineTrack(props: TimelineTrackProps): JSX.Element;
