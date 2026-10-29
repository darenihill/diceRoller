/**
 * Canonical polyhedral geometry, in a 0-100 coordinate space.
 *
 * Single source of truth for every place a die silhouette is drawn: the facet
 * overlay on a rolled die (PolyhedralWireframe), the shape icons in the add
 * menu (DndShapeIcon), and the clip-paths in Dice.module.css. The icons used to
 * carry their own copies of these paths and had drifted badly — the d10 and d12
 * shared one outline, the d6 was a stale hexagon, and the d10 and d00 branches
 * were byte-identical.
 *
 * `outline` traces the silhouette and must stay in step with the matching
 * `.shapeDn` clip-path in Dice.module.css. `inner` carries the facets.
 *
 * Drawing conventions that matter:
 * - The d6 and d20 share a hexagonal outline on purpose. A cube and an
 *   icosahedron are told apart by their interior lines, not their silhouette.
 * - The d10's kite corners sit above the halfway line so its side lines rise
 *   as they run inward; tilted the other way it reads as facing downward.
 */
export interface DiceFacets {
  outline: string;
  inner: string;
  /** Each face as its own area, with its shade: above 0 lighter, below 0
   *  darker. Light falls from the upper left, so upward faces are lighter. */
  faces: { points: string; shade: number }[];
}

export const DICE_SHAPES: Record<number, DiceFacets> = {
  // Tetrahedron: triangle with edges converging on the near apex
  4: {
    outline: 'M 50 2 L 96 92 L 4 92 Z',
    inner: 'M 50 2 L 50 62 M 4 92 L 50 62 M 96 92 L 50 62',
    faces: [
      { points: '50,2 4,92 50,62', shade: 0.16 },
      { points: '50,2 96,92 50,62', shade: -0.04 },
      { points: '4,92 96,92 50,62', shade: -0.24 },
    ],
  },

  // Cube seen from slightly above: edges rise to the upper vertices, so the top
  // face reads as the rhombus across the top with two side faces below
  6: {
    outline: 'M 50 2 L 95 26 L 95 74 L 50 98 L 5 74 L 5 26 Z',
    inner: 'M 50 50 L 5 26 M 50 50 L 95 26 M 50 50 L 50 98',
    faces: [
      { points: '50,2 95,26 50,50 5,26', shade: 0.2 },
      { points: '5,26 50,50 50,98 5,74', shade: 0 },
      { points: '95,26 50,50 50,98 95,74', shade: -0.2 },
    ],
  },

  // Octahedron face-on: hexagon with the front face inscribed on alternating
  // vertices. The triangle alone — extra spokes made it read as a small d20.
  8: {
    outline: 'M 50 3 L 94 28 L 94 72 L 50 97 L 6 72 L 6 28 Z',
    inner: 'M 50 3 L 94 72 L 6 72 Z',
    faces: [
      { points: '50,3 94,72 6,72', shade: 0.06 },
      { points: '50,3 6,28 6,72', shade: 0.16 },
      { points: '50,3 94,28 94,72', shade: -0.06 },
      { points: '6,72 94,72 50,97', shade: -0.24 },
    ],
  },

  // Pentagonal trapezohedron: rhombus with a kite front face tilted up
  10: {
    outline: 'M 50 2 L 96 50 L 50 98 L 4 50 Z',
    inner: 'M 50 2 L 72 44 L 50 70 L 28 44 Z M 28 44 L 4 50 M 72 44 L 96 50 M 50 70 L 50 98',
    faces: [
      { points: '50,2 72,44 50,70 28,44', shade: 0.1 },
      { points: '50,2 28,44 4,50', shade: 0.2 },
      { points: '50,2 96,50 72,44', shade: 0 },
      { points: '4,50 28,44 50,70 50,98', shade: -0.14 },
      { points: '96,50 72,44 50,70 50,98', shade: -0.26 },
    ],
  },

  // Dodecahedron: decagon outline around a central pentagonal face
  12: {
    outline:
      'M 50 1 L 79 10 L 97 35 L 97 65 L 79 90 L 50 99 L 21 90 L 3 65 L 3 35 L 21 10 Z',
    inner:
      'M 50 30 L 71 45 L 63 70 L 37 70 L 29 45 Z ' +
      'M 50 30 L 50 1 M 71 45 L 97 35 M 63 70 L 79 90 M 37 70 L 21 90 M 29 45 L 3 35',
    faces: [
      { points: '50,30 71,45 63,70 37,70 29,45', shade: 0.06 },
      { points: '50,30 50,1 79,10 97,35 71,45', shade: 0.14 },
      { points: '71,45 97,35 97,65 79,90 63,70', shade: -0.1 },
      { points: '63,70 79,90 50,99 21,90 37,70', shade: -0.24 },
      { points: '37,70 21,90 3,65 3,35 29,45', shade: -0.04 },
      { points: '29,45 3,35 21,10 50,1 50,30', shade: 0.22 },
    ],
  },

  // Icosahedron face-on: hexagon, inscribed triangle, inverted central face
  20: {
    outline: 'M 50 2 L 94 26 L 94 74 L 50 98 L 6 74 L 6 26 Z',
    inner:
      'M 50 2 L 94 74 L 6 74 Z M 72 38 L 50 74 L 28 38 Z ' +
      'M 94 26 L 72 38 M 6 26 L 28 38 M 50 98 L 50 74',
    faces: [
      { points: '72,38 50,74 28,38', shade: 0.06 },
      { points: '50,2 72,38 28,38', shade: 0.22 },
      { points: '28,38 50,74 6,74', shade: -0.04 },
      { points: '72,38 94,74 50,74', shade: -0.14 },
      { points: '50,2 6,26 28,38', shade: 0.18 },
      { points: '6,26 6,74 28,38', shade: -0.04 },
      { points: '50,2 94,26 72,38', shade: 0.04 },
      { points: '94,26 94,74 72,38', shade: -0.2 },
      { points: '6,74 50,74 50,98', shade: -0.2 },
      { points: '50,74 94,74 50,98', shade: -0.3 },
    ],
  },
};
