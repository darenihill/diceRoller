import React from 'react';

interface PolyhedralWireframeProps {
  faces: number;
}

export const PolyhedralWireframe: React.FC<PolyhedralWireframeProps> = React.memo(({ faces }) => {
  const strokeColor = 'rgba(255, 255, 255, 0.14)';
  const strokeWidth = 1;

  if (faces === 4) {
    // d4 Tetrahedron / Pyramid - single path to eliminate alpha overlapping
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <path 
          d="M 50 6 L 94 90 L 6 90 Z M 50 6 L 50 90 M 50 6 L 28 90 M 50 6 L 72 90" 
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
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <path 
          d="M 50 6 L 90 28 L 90 72 L 50 94 L 10 72 L 10 28 Z M 50 6 L 50 50 M 90 28 L 50 50 M 10 28 L 50 50 M 50 50 L 50 94" 
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
    // d8 Octahedron / Diamond - single path
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <path 
          d="M 50 4 L 96 50 L 50 96 L 4 50 Z M 50 4 L 50 96 M 4 50 L 96 50 M 50 25 L 75 50 L 50 75 L 25 50 Z" 
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
    // d10 Kite Shield - single path
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <path 
          d="M 50 4 L 96 36 L 76 96 L 24 96 L 4 36 Z M 50 4 L 50 96 M 50 4 L 76 96 M 50 4 L 24 96 M 4 36 L 96 36" 
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
    // d12 Dodecahedron - single path
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <path 
          d="M 50 4 L 96 36 L 78 96 L 22 96 L 4 36 Z M 50 24 L 74 42 L 65 74 L 35 74 L 26 42 Z M 50 4 L 50 24 M 96 36 L 74 42 M 78 96 L 65 74 M 22 96 L 35 74 M 4 36 L 26 42" 
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
    // d20 Icosahedron Hexagon - single path
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <path 
          d="M 50 4 L 95 26 L 95 74 L 50 96 L 5 74 L 5 26 Z M 50 24 L 76 68 L 24 68 Z M 50 4 L 50 24 M 50 4 L 95 26 M 50 4 L 5 26 M 95 26 L 76 68 M 95 74 L 76 68 M 50 96 L 76 68 M 50 96 L 24 68 M 5 74 L 24 68 M 5 26 L 24 68" 
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
