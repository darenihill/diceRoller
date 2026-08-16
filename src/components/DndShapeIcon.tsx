import React from 'react';
import { DICE_SHAPES } from '../utils/diceShapes';

interface DndShapeIconProps {
  faces: number;
  size?: number;
  color?: string;
}

// Heavier than the on-die wireframe: this renders unclipped at ~18px, so the
// whole stroke paints rather than half of it, and sub-pixel lines would vanish.
const OUTER_STROKE = 7;
const INNER_STROKE = 3;

/**
 * Shape icons for the add-a-die menu, drawn from the same geometry as the dice
 * themselves ({@link DICE_SHAPES}) so the two can never disagree.
 *
 * The viewBox is padded because the outline stroke is centred on the path and
 * would otherwise be clipped in half by the edge of the canvas.
 */
export const DndShapeIcon: React.FC<DndShapeIconProps> = React.memo(({ faces, size = 18, color = 'currentColor' }) => {
  const shape = DICE_SHAPES[faces];
  if (!shape) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="-5 -5 110 110"
      fill="none"
      stroke={color}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d={shape.outline} strokeWidth={OUTER_STROKE} />
      <path d={shape.inner} strokeWidth={INNER_STROKE} opacity={0.65} />
    </svg>
  );
});

DndShapeIcon.displayName = 'DndShapeIcon';
