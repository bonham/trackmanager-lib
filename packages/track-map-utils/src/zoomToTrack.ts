import { isEmpty } from 'ol/extent';
import VectorSource from 'ol/source/Vector';
import type { Geometry as OlGeometry } from 'ol/geom';
import OlFeature from 'ol/Feature';
import Map from 'ol/Map';

/**
 * Fits the map view to the full extent of a track, with animated transitions.
 *
 * Runs two successive `fit` calls so that the map first animates to the correct
 * region and then makes a small corrective adjustment to account for any padding
 * reflow.  Both calls are no-ops if the source extent is empty (no features).
 *
 * @param map     The OpenLayers Map instance.
 * @param source  VectorSource whose extent will be used to compute the fit bounds.
 */
export function zoomToTrack(map: Map, source: VectorSource<OlFeature<OlGeometry>>) {
  const extent = source.getExtent();
  if (!isEmpty(extent)) {
    // First pass: animate to the correct bounding box
    map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 17, duration: 1000 });
    // Second pass: minor corrective fit after layout settles
    map.getView().fit(extent, { padding: [40, 40, 40, 40], duration: 800 });
  }
}
