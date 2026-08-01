import React from 'react';

interface PolyhedralWireframeProps {
  faces: number;
}

export const PolyhedralWireframe: React.FC<PolyhedralWireframeProps> = React.memo(({ faces }) => {
  const strokeColor = 'rgba(255, 255, 255, 0.28)';
  const strokeWidth = 1.5;

  if (faces === 4) {
    // d4 Tetrahedron / Pyramid
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <polygon points="50,6 94,90 6,90" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="6" x2="50" y2="90" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="6" x2="28" y2="90" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="6" x2="72" y2="90" stroke={strokeColor} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (faces === 8) {
    // d8 Octahedron / Diamond
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <polygon points="50,4 96,50 50,96 4,50" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="4" x2="50" y2="96" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="4" y1="50" x2="96" y2="50" stroke={strokeColor} strokeWidth={strokeWidth} />
        <polygon points="50,25 75,50 50,75 25,50" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (faces === 10) {
    // d10 Kite Shield
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <polygon points="50,4 96,36 76,96 24,96 4,36" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="4" x2="50" y2="96" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="4" x2="76" y2="96" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="4" x2="24" y2="96" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="4" y1="36" x2="96" y2="36" stroke={strokeColor} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (faces === 12) {
    // d12 Pentagonal Dodecahedron
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <polygon points="50,4 96,36 78,96 22,96 4,36" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
        <polygon points="50,24 74,42 65,74 35,74 26,42" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="4" x2="50" y2="24" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="96" y1="36" x2="74" y2="42" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="78" y1="96" x2="65" y2="74" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="22" y1="96" x2="35" y2="74" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="4" y1="36" x2="26" y2="42" stroke={strokeColor} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  if (faces === 20) {
    // d20 Icosahedron Hexagon with central facet triangle
    return (
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <polygon points="50,4 95,26 95,74 50,96 5,74 5,26" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
        <polygon points="50,24 76,68 24,68" fill="none" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="4" x2="50" y2="24" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="4" x2="95" y2="26" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="4" x2="5" y2="26" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="95" y1="26" x2="76" y2="68" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="95" y1="74" x2="76" y2="68" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="96" x2="76" y2="68" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="50" y1="96" x2="24" y2="68" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="5" y1="74" x2="24" y2="68" stroke={strokeColor} strokeWidth={strokeWidth} />
        <line x1="5" y1="26" x2="24" y2="68" stroke={strokeColor} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  return null;
});

PolyhedralWireframe.displayName = 'PolyhedralWireframe';
