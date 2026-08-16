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
}

export const DICE_SHAPES: Record<number, DiceFacets> = {
  // Tetrahedron: triangle with edges converging on the near apex
  4: {
    outline: 'M 50 2 L 96 92 L 4 92 Z',
    inner: 'M 50 2 L 50 62 M 4 92 L 50 62 M 96 92 L 50 62',
  },

  // Cube seen from slightly above: edges rise to the upper vertices, so the top
  // face reads as the rhombus across the top with two side faces below
  6: {
    outline: 'M 50 2 L 95 26 L 95 74 L 50 98 L 5 74 L 5 26 Z',
    inner: 'M 50 50 L 5 26 M 50 50 L 95 26 M 50 50 L 50 98',
  },

  // Octahedron face-on: hexagon with the front face inscribed on alternating
  // vertices. The triangle alone — extra spokes made it read as a small d20.
  8: {
    outline: 'M 50 3 L 94 28 L 94 72 L 50 97 L 6 72 L 6 28 Z',
    inner: 'M 50 3 L 94 72 L 6 72 Z',
  },

  // Pentagonal trapezohedron: rhombus with a kite front face tilted up
  10: {
    outline: 'M 50 2 L 96 50 L 50 98 L 4 50 Z',
    inner: 'M 50 2 L 72 44 L 50 70 L 28 44 Z M 28 44 L 4 50 M 72 44 L 96 50 M 50 70 L 50 98',
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
