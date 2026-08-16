import React from 'react';

interface PolyhedralWireframeProps {
  faces: number;
  textColor?: string;
}

/**
 * Facet overlays for RPG mode, drawn to match the conventional dice-icon set.
 *
 * Each die is two paths: a heavy `outline` tracing the silhouette and a light
 * `inner` carrying the facets. The outline is deliberately much thicker than it
 * looks — this SVG sits inside `.diceShapeBg`, which carries the clip-path, so
 * roughly half of an edge stroke is clipped away and only the inner half paints.
 *
 * Note the d6 and d20 share a hexagonal outline. That is correct and matches
 * every standard depiction: a cube and an icosahedron are told apart by their
 * interior linework, not their silhouette.
 */

const OUTER_STROKE = 5;
const INNER_STROKE = 1;

type Facets = { outline: string; inner: string };

const SHAPES: Record<number, Facets> = {
  // Tetrahedron: triangle with edges converging on the near apex
  4: {
    outline: 'M 50 2 L 96 92 L 4 92 Z',
    inner: 'M 50 2 L 50 62 M 4 92 L 50 62 M 96 92 L 50 62',
  },

  // Cube seen corner-on: hexagon with three faces meeting at the near corner
  6: {
    outline: 'M 50 2 L 95 26 L 95 74 L 50 98 L 5 74 L 5 26 Z',
    inner: 'M 50 50 L 50 2 M 50 50 L 95 74 M 50 50 L 5 74',
  },

  // Octahedron face-on: hexagon around a central triangular face
  8: {
    outline: 'M 50 3 L 94 28 L 94 72 L 50 97 L 6 72 L 6 28 Z',
    inner:
      'M 50 26 L 77 71 L 23 71 Z M 50 26 L 50 3 M 50 26 L 6 28 M 50 26 L 94 28 ' +
      'M 23 71 L 6 72 M 77 71 L 94 72 M 23 71 L 50 97 M 77 71 L 50 97',
  },

  // Pentagonal trapezohedron: kite with a shouldered waist
  10: {
    outline: 'M 50 1 L 95 35 L 78 76 L 50 99 L 22 76 L 5 35 Z',
    inner:
      'M 5 35 L 50 56 L 95 35 M 50 1 L 50 56 ' +
      'M 50 56 L 22 76 M 50 56 L 78 76 M 50 56 L 50 99',
  },

  // Dodecahedron: decagon outline around a central pentagonal face
  12: {
    outline:
      'M 50 1 L 79 10 L 97 35 L 97 65 L 79 90 L 50 99 L 21 90 L 3 65 L 3 35 L 21 10 Z',
    inner:
      'M 50 30 L 71 45 L 63 70 L 37 70 L 29 45 Z ' +
      'M 50 30 L 50 1 M 71 45 L 97 35 M 63 70 L 79 90 M 37 70 L 21 90 M 29 45 L 3 35',
  },

  // Icosahedron face-on: hexagon, inscribed triangle, inverted central face
  20: {
    outline: 'M 50 2 L 94 26 L 94 74 L 50 98 L 6 74 L 6 26 Z',
    inner:
      'M 50 2 L 94 74 L 6 74 Z M 72 38 L 50 74 L 28 38 Z ' +
      'M 94 26 L 72 38 M 6 26 L 28 38 M 50 98 L 50 74',
  },
};

export const PolyhedralWireframe: React.FC<PolyhedralWireframeProps> = React.memo(({ faces, textColor = '#FFFFFF' }) => {
  const shape = SHAPES[faces];
  if (!shape) return null;

  const isLightText = textColor.toUpperCase() === '#FFFFFF' || textColor.toUpperCase() === '#FFF';
  const base = isLightText ? '255, 255, 255' : '0, 0, 0';
  const outlineColor = `rgba(${base}, 0.45)`;
  const innerColor = `rgba(${base}, 0.20)`;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <path
        d={shape.outline}
        fill="none"
        stroke={outlineColor}
        strokeWidth={OUTER_STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={shape.inner}
        fill="none"
        stroke={innerColor}
        strokeWidth={INNER_STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
});

PolyhedralWireframe.displayName = 'PolyhedralWireframe';
