import React from 'react';
import { DICE_SHAPES } from '../utils/diceShapes';

interface PolyhedralWireframeProps {
  faces: number;
  textColor?: string;
}

/**
 * Facet overlay drawn across a die in RPG mode.
 *
 * Geometry comes from {@link DICE_SHAPES}, shared with the add-menu icons so
 * the two can never drift. Two paths per die: a heavy `outline` tracing the
 * silhouette and a light `inner` carrying the facets.
 *
 * OUTER_STROKE looks far too thick for what renders. It is: this SVG sits
 * inside `.diceShapeBg`, which carries the clip-path, so about half of an edge
 * stroke is clipped away and only the inner half paints.
 */

const OUTER_STROKE = 5;
const INNER_STROKE = 1;
/** Applied to the group, not the strokes — see the note in the component. */
const LINE_OPACITY = 0.36;

export const PolyhedralWireframe: React.FC<PolyhedralWireframeProps> = React.memo(({ faces, textColor = '#FFFFFF' }) => {
  const shape = DICE_SHAPES[faces];
  if (!shape) return null;

  const isLightText = textColor.toUpperCase() === '#FFFFFF' || textColor.toUpperCase() === '#FFF';
  const lineColor = isLightText ? '#FFFFFF' : '#000000';

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      {/* Opacity lives on the group, and both strokes are fully opaque. Drawing
          them semi-transparent instead would darken every point where a facet
          meets the outline, since the two strokes composite against each other.
          A group renders flat first, so junctions stay one even colour.

          Joins are mitered, not rounded: the clip-path corners are sharp, so a
          round join pulls the stroke away from each corner and blunts it. The
          miter spike runs past the silhouette and the clip trims it flush,
          which fills the corner exactly. Butt caps keep facet ends from
          bulging past the edges they land on. */}
      <g opacity={LINE_OPACITY}>
        <path
          d={shape.outline}
          fill="none"
          stroke={lineColor}
          strokeWidth={OUTER_STROKE}
          strokeLinejoin="miter"
          strokeLinecap="butt"
        />
        <path
          d={shape.inner}
          fill="none"
          stroke={lineColor}
          strokeWidth={INNER_STROKE}
          strokeLinejoin="miter"
          strokeLinecap="butt"
        />
      </g>
    </svg>
  );
});

PolyhedralWireframe.displayName = 'PolyhedralWireframe';
