import React from 'react';

interface PolyhedralWireframeProps {
  faces: number;
  textColor?: string;
}

export const PolyhedralWireframe: React.FC<PolyhedralWireframeProps> = React.memo(({ faces, textColor = '#FFFFFF' }) => {
  const isLightText = textColor.toUpperCase() === '#FFFFFF' || textColor.toUpperCase() === '#FFF';
  const strokeColor = isLightText ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.22)';
  const strokeWidth = 1.2;

  if (faces === 4) {
    // d4 Pyramid: outer triangle + inner apex node at (50, 60)
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 2 L 96 92 L 4 92 Z M 50 2 L 50 60 M 4 92 L 50 60 M 96 92 L 50 60 M 50 60 L 50 92" 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
      </svg>
    );
  }

  if (faces === 6) {
    // d6 Isometric 3D Cube
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 2 L 95 25 L 95 75 L 50 98 L 5 75 L 5 25 Z M 50 2 L 50 50 M 95 25 L 50 50 M 5 25 L 50 50 M 50 50 L 50 98" 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
      </svg>
    );
  }

  if (faces === 8) {
    // d8 Octahedron / Diamond
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 2 L 96 50 L 50 98 L 4 50 Z M 50 25 L 75 50 L 50 75 L 25 50 Z M 50 2 L 50 25 M 96 50 L 75 50 M 50 98 L 50 75 M 4 50 L 25 50" 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
      </svg>
    );
  }

  if (faces === 10) {
    // d10 Kite Shield
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 2 L 96 36 L 76 98 L 24 98 L 4 36 Z M 50 2 L 50 55 M 4 36 L 50 55 M 96 36 L 50 55 M 24 98 L 50 55 M 76 98 L 50 55 M 50 55 L 50 98" 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
      </svg>
    );
  }

  if (faces === 12) {
    // d12 Dodecahedron
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 2 L 96 35 L 78 97 L 22 97 L 4 35 Z M 50 20 L 78 40 L 68 72 L 32 72 L 22 40 Z M 50 2 L 50 20 M 96 35 L 78 40 M 78 97 L 68 72 M 22 97 L 32 72 M 4 35 L 22 40" 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
      </svg>
    );
  }

  if (faces === 20) {
    // Classic 3D D20 Icosahedron: Outer hexagon + central face triangle + 9 radial facet lines
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 2 L 95 25 L 95 75 L 50 98 L 5 75 L 5 25 Z M 25 25 L 75 25 L 50 75 Z M 25 25 L 50 2 M 75 25 L 50 2 M 25 25 L 5 25 M 75 25 L 95 25 M 25 25 L 5 75 M 75 25 L 95 75 M 50 75 L 50 98 M 50 75 L 5 75 M 50 75 L 95 75" 
          fill="none" 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
      </svg>
    );
  }

  return null;
});

PolyhedralWireframe.displayName = 'PolyhedralWireframe';
