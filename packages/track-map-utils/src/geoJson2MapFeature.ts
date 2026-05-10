import GeoJSON from 'ol/format/GeoJSON';
import type { Feature as GeoJsonFeature, LineString as GeoJsonLineString, MultiLineString as GeoJsonMultiLineString } from 'geojson'
import type { LineString as OlLineString, MultiLineString as OlMultiLineString } from 'ol/geom';
import OlFeature from 'ol/Feature';

/**
 * Converts a GeoJSON LineString feature (EPSG:4326) to an OpenLayers Feature
 * in Web Mercator (EPSG:3857) ready to be added to a VectorSource.
 *
 * @param feature  GeoJSON LineString in WGS-84 (longitude/latitude).
 * @returns        OpenLayers Feature with a LineString geometry in EPSG:3857.
 */
export function geojsonLineString2OpenLayersLineString(
  feature: GeoJsonFeature<GeoJsonLineString>,
): OlFeature<OlLineString> {
  const mapFeature = new GeoJSON().readFeature(
    feature,
    {
      dataProjection: 'EPSG:4326', // incoming: WGS-84 lon/lat
      featureProjection: 'EPSG:3857', // outgoing: Web Mercator (map projection)
    }
  )
  return mapFeature as OlFeature<OlLineString>
}

/**
 * Converts a GeoJSON MultiLineString feature (EPSG:4326) to an OpenLayers Feature
 * in Web Mercator (EPSG:3857).
 *
 * Used for multi-segment overlays such as combined climb or slope-colour layers.
 *
 * @param feature  GeoJSON MultiLineString in WGS-84.
 * @returns        OpenLayers Feature with a MultiLineString geometry in EPSG:3857.
 */
export function geojsonMultiLineString2OpenLayersMultiLineString(
  feature: GeoJsonFeature<GeoJsonMultiLineString>,
): OlFeature<OlMultiLineString> {
  const mapFeature = new GeoJSON().readFeature(
    feature,
    {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    }
  )
  return mapFeature as OlFeature<OlMultiLineString>
}
