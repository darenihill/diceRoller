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
    // d10 pentagonal trapezohedron: sharp apex, narrow waist, pointed base.
    // Geometry mirrors .shapeD10's clip-path so facets stay inside the silhouette.
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path
          d="M 50 0 L 90 32 L 72 78 L 50 100 L 28 78 L 10 32 Z M 50 0 L 50 52 M 10 32 L 50 52 M 90 32 L 50 52 M 28 78 L 50 52 M 72 78 L 50 52 M 50 52 L 50 100"
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
    // d12 dodecahedron: flat-topped pentagon with a concentric inner face.
    // Matches .shapeD12's clip-path.
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path
          d="M 50 2 L 98 38 L 79 96 L 21 96 L 2 38 Z M 50 24 L 76 43 L 66 74 L 34 74 L 24 43 Z M 50 2 L 50 24 M 98 38 L 76 43 M 79 96 L 66 74 M 21 96 L 34 74 M 2 38 L 24 43"
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
    // d20 icosahedron viewed face-on: corner-clipped triangle with the central
    // face ringed by its three neighbours. Matches .shapeD20's clip-path.
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path
          d="M 50 0 L 68 12 L 96 62 L 90 84 L 10 84 L 4 62 L 32 12 Z M 50 30 L 74 72 L 26 72 Z M 50 30 L 32 12 M 50 30 L 68 12 M 26 72 L 4 62 M 26 72 L 10 84 M 74 72 L 96 62 M 74 72 L 90 84 M 26 72 L 74 72"
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
