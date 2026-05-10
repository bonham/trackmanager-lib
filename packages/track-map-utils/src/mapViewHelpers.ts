import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import Point from 'ol/geom/Point';
import type { Coordinate } from 'ol/coordinate';

/**
 * Manages a single position marker on an OpenLayers vector layer.
 *
 * The caller is responsible for building and providing the EPSG:3857 coordinate
 * array (usually derived from the track geometry after projection).
 *
 * @example
 * ```ts
 * const { markerSource } = getMapElements()
 * const marker = new MarkerOnTrack(markerSource)
 * marker.setCoordinates(mapCoordinates)  // EPSG:3857
 * marker.setByIndex(42)                  // show marker at index 42
 * marker.clear()                         // hide marker
 * ```
 */
class MarkerOnTrack {
  markerSource: VectorSource<Feature<Geometry>>;
  /** EPSG:3857 coordinates of all track points. Set once per track load. */
  coordinates: Coordinate[] | null = null

  constructor(vSource: VectorSource<Feature<Geometry>>) {
    this.markerSource = vSource
  }

  /**
   * Store the EPSG:3857 coordinate array.
   * @param coordinates  Array of [x, y] pairs in Web Mercator projection.
   */
  setCoordinates(coordinates: Coordinate[]) {
    this.coordinates = coordinates
  }

  /** Remove the marker from the layer. */
  clear() {
    this.markerSource.clear()
  }

  /**
   * Move the marker to the track point at `newXposIndex`.
   * Silent no-op when coordinates are not yet set or the index is out of bounds.
   *
   * @param newXposIndex  Zero-based index into the coordinates array.
   */
  setByIndex(newXposIndex: number) {
    if (this.coordinates === null) {
      console.warn("Coordinates not yet set")
      return
    }

    const coord = this.coordinates[newXposIndex];
    if (coord === undefined) return // index out of bounds — silent ignore

    this.markerSource.clear();
    const marker = new Feature({ geometry: new Point(coord) });
    this.markerSource.addFeature(marker);
  }
}

export { MarkerOnTrack }
