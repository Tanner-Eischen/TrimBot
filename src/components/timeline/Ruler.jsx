import React from 'react';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function Ruler({ pxPerSec, totalSec }) {
  const ticks = [];
  
  // Generate ticks for every second up to totalSec
  for (let sec = 0; sec <= totalSec; sec++) {
    const x = sec * pxPerSec;
    const isLabelTick = sec % 5 === 0; // Major tick every 5 seconds
    
    ticks.push(
      <div
        key={sec}
        className={`tick ${isLabelTick ? 'major' : 'minor'}`}
        style={{ left: x }}
      >
        {isLabelTick && (
          <span className="time-label">{formatTime(sec)}</span>
        )}
      </div>
    );
  }
  
  return (
    <div className="ruler">
      {ticks}
    </div>
  );
}
