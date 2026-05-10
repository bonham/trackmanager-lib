/**
 * Stretches (or shrinks) an interval [i_start, i_end] around a midpoint by a given factor.
 *
 * The result is clamped to [I_min, I_max] and guaranteed to be at least `minLength` wide
 * when zooming in.  Ties (factor === 1) are returned immediately without allocation.
 *
 * Used by {@link ZoomPanState} to implement wheel-based zooming on the elevation chart.
 *
 * @param i_start    Current interval start (inclusive).
 * @param i_end      Current interval end (inclusive).
 * @param mid        The value around which zooming is centred.
 * @param factor     Stretch factor: > 1 zooms out, < 1 zooms in, === 1 is identity.
 * @param I_min      Hard lower bound (default 0).
 * @param I_max      Hard upper bound (default Infinity).
 * @param minLength  Minimum allowed interval length when zooming in (default 20).
 * @returns          `{ start, end }` of the resulting interval.
 */
export function stretchInterval(
  i_start: number,
  i_end: number,
  mid: number,
  factor: number,
  I_min = 0,
  I_max = Infinity,
  minLength = 20,
): { start: number; end: number } {
  // Identity — nothing to do
  if (factor === 1) {
    return { start: i_start, end: i_end }
  }

  const startLength = i_end - i_start

  // Already at (or below) min length and zooming in — refuse
  if (startLength <= minLength && factor < 1) {
    return { start: i_start, end: i_end }
  }

  let actualFactor = factor

  // Cap zoom-in factor so result never falls below minLength
  if (factor < 1) {
    const minFactorLimit = minLength / startLength
    actualFactor = Math.max(minFactorLimit, factor)
  }

  const new_start = Math.max(mid - actualFactor * (mid - i_start), I_min)
  const new_end = Math.min(mid + actualFactor * (i_end - mid), I_max)

  return { start: new_start, end: new_end }
}
