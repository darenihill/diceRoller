import React from 'react';

interface DndShapeIconProps {
  faces: number;
  isD00?: boolean;
  size?: number;
  color?: string;
}

export const DndShapeIcon: React.FC<DndShapeIconProps> = React.memo(({ faces, isD00 = false, size = 18, color = 'currentColor' }) => {
  const strokeWidth = 1.6;

  if (faces === 4) {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 2 L 18 17 L 2 17 Z M 10 2 L 10 17 M 10 2 L 6 17 M 10 2 L 14 17" />
      </svg>
    );
  }

  if (faces === 6) {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 2 L 17 6 L 17 14 L 10 18 L 3 14 L 3 6 Z M 10 2 L 10 10 M 17 6 L 10 10 M 3 6 L 10 10 M 10 10 L 10 18" />
      </svg>
    );
  }

  if (faces === 8) {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 2 L 18 10 L 10 18 L 2 10 Z M 10 2 L 10 18 M 2 10 L 18 10 M 10 6 L 14 10 L 10 14 L 6 10 Z" />
      </svg>
    );
  }

  if (faces === 10) {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {isD00 ? (
          <path d="M 10 2 L 18 7 L 15 18 L 5 18 L 2 7 Z M 10 2 L 10 18 M 10 2 L 15 18 M 10 2 L 5 18 M 2 7 L 18 7" />
        ) : (
          <path d="M 10 2 L 18 7 L 15 18 L 5 18 L 2 7 Z M 10 2 L 10 18 M 10 2 L 15 18 M 10 2 L 5 18 M 2 7 L 18 7" />
        )}
      </svg>
    );
  }

  if (faces === 12) {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 2 L 18 7 L 15 18 L 5 18 L 2 7 Z M 10 6 L 14 9 L 13 14 L 7 14 L 6 9 Z M 10 2 L 10 6 M 18 7 L 14 9 M 15 18 L 13 14 M 5 18 L 7 14 M 2 7 L 6 9" />
      </svg>
    );
  }

  if (faces === 20) {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 2 L 18 6 L 18 14 L 10 18 L 2 14 L 2 6 Z M 10 5 L 15 13 L 5 13 Z M 10 2 L 10 5 M 10 2 L 18 6 M 10 2 L 2 6 M 18 6 L 15 13 M 18 14 L 15 13 M 10 18 L 15 13 M 10 18 L 5 13 M 2 14 L 5 13 M 2 6 L 5 13" />
      </svg>
    );
  }

  return null;
});

DndShapeIcon.displayName = 'DndShapeIcon';
