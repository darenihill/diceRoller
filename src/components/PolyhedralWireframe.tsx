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
    // d6 isometric cube: hexagonal outline with the three visible faces meeting
    // at the near corner — the Y is what separates it from the d20 at a glance,
    // so it is drawn a little stronger than the other wireframes.
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path
          d="M 50 2 L 95 26 L 95 74 L 50 98 L 5 74 L 5 26 Z M 50 50 L 50 2 M 50 50 L 95 74 M 50 50 L 5 74"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth * 1.4}
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
          d="M 50 0 L 95 35 L 78 76 L 50 100 L 22 76 L 5 35 Z M 5 35 L 50 55 L 95 35 M 50 0 L 50 55 M 50 55 L 22 76 M 50 55 L 78 76 M 50 55 L 50 100"
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
          d="M 50 0 L 99 37 L 80 99 L 20 99 L 1 37 Z M 50 22 L 77 42 L 67 74 L 33 74 L 23 42 Z M 50 0 L 50 22 M 99 37 L 77 42 M 80 99 L 67 74 M 20 99 L 33 74 M 1 37 L 23 42"
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
    // d20 icosahedron face-on: hexagon with the central triangular face ringed
    // by its neighbours. Matches .shapeD20's clip-path.
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path
          d="M 50 0 L 94 25 L 94 75 L 50 100 L 6 75 L 6 25 Z M 27 27 L 73 27 L 50 72 Z M 27 27 L 50 0 M 73 27 L 50 0 M 27 27 L 6 25 M 73 27 L 94 25 M 27 27 L 6 75 M 73 27 L 94 75 M 50 72 L 50 100 M 50 72 L 6 75 M 50 72 L 94 75"
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
