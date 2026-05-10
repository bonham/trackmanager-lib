import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import { Vector as VectorLayer } from 'ol/layer';

/**
 * Creates and returns the three pre-configured OpenLayers vector layers used
 * for track visualisation: base track, overlay (e.g. climbs), and position marker.
 *
 * Call this once per component instance — each call returns independent sources
 * and layers so multiple map components can coexist without sharing state.
 *
 * **Default colours:**
 * - Base track: `#37a3eb` (blue, 4 px)
 * - Overlay:    `#dc3912` (red, 3 px)
 * - Marker:     red filled circle, radius 6
 *
 * @returns An object containing all six OpenLayers objects (three sources + three layers).
 *
 * @example
 * ```ts
 * const { baseTrackVectorSource, baseTrackVectorLayer,
 *         overlayVectorSource,   overlayVectorLayer,
 *         markerSource,          markerLayer } = getMapElements()
 *
 * const map = new Map({ layers: [tileLayer, baseTrackVectorLayer, overlayVectorLayer, markerLayer] })
 * ```
 */
function getMapElements() {
  /* ── Base track ─────────────────────────────────────────────────── */
  const trackStyle = new Style({
    stroke: new Stroke({ color: '#37a3eb', width: 4 }),
  });
  const baseTrackVectorSource = new VectorSource()
  const baseTrackVectorLayer = new VectorLayer({ source: baseTrackVectorSource, style: trackStyle })

  /* ── Overlay (climb segments, slope colours, …) ─────────────────── */
  const overlayStyle = new Style({
    stroke: new Stroke({ color: '#dc3912', width: 3 }),
  });
  const overlayVectorSource = new VectorSource()
  const overlayVectorLayer = new VectorLayer({ source: overlayVectorSource, style: overlayStyle })

  /* ── Position marker ─────────────────────────────────────────────── */
  const markerSource = new VectorSource();
  const markerLayer = new VectorLayer({
    source: markerSource,
    style: new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: 'red' }),
      }),
    }),
  });

  return {
    baseTrackVectorSource,
    baseTrackVectorLayer,
    overlayVectorSource,
    overlayVectorLayer,
    markerSource,
    markerLayer,
  }
}

export { getMapElements }
