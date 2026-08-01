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
    // d4 Tetrahedron / Pyramid - exact match to clip-path: polygon(50% 0%, 100% 90%, 0% 90%)
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 0 L 100 90 L 0 90 Z M 50 0 L 50 90 M 50 0 L 25 90 M 50 0 L 75 90" 
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
    // d6 Cube - 3D Wireframe
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 0 L 100 25 L 100 75 L 50 100 L 0 75 L 0 25 Z M 50 0 L 50 50 M 100 25 L 50 50 M 0 25 L 50 50 M 50 50 L 50 100" 
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
    // d8 Octahedron / Diamond - exact match to clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 0 L 100 50 L 50 100 L 0 50 Z M 50 0 L 50 100 M 0 50 L 100 50 M 50 25 L 75 50 L 50 75 L 25 50 Z" 
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
    // d10 Kite Shield - exact match to clip-path: polygon(50% 0%, 100% 35%, 78% 100%, 22% 100%, 0% 35%)
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 0 L 100 35 L 78 100 L 22 100 L 0 35 Z M 50 0 L 50 100 M 50 0 L 78 100 M 50 0 L 22 100 M 0 35 L 100 35" 
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
    // d12 Dodecahedron - exact match to clip-path: polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%)
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 0 L 100 35 L 80 100 L 20 100 L 0 35 Z M 50 22 L 75 42 L 65 75 L 35 75 L 25 42 Z M 50 0 L 50 22 M 100 35 L 75 42 M 80 100 L 65 75 M 20 100 L 35 75 M 0 35 L 25 42" 
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
    // d20 Icosahedron Hexagon - exact match to clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path 
          d="M 50 0 L 100 25 L 100 75 L 50 100 L 0 75 L 0 25 Z M 50 25 L 75 68 L 25 68 Z M 50 0 L 50 25 M 50 0 L 100 25 M 50 0 L 0 25 M 100 25 L 75 68 M 100 75 L 75 68 M 50 100 L 75 68 M 50 100 L 25 68 M 0 75 L 25 68 M 0 25 L 25 68" 
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
