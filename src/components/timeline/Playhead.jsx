import React from 'react';

export function Playhead({ x, height = 140 }) {
  return (
    <div 
      className="playhead" 
      style={{ 
        left: x, 
        height,
        transform: 'translateX(-1px)' // Center the 2px line
      }} 
    />
  );
}
