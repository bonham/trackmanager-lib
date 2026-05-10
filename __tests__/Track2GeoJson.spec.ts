import { Track2GeoJson } from '@/lib/Track2GeoJson'
import { TrackData } from '@/lib/TrackData'

let trackFixture: TrackData;

describe("Create geojson from track", () => {

  beforeEach(() => {
    const data = [
      {
        lon: 8.018429,
        lat: 49.140191,
        elevation: 168
      },
      {
        lon: 8.018417,
        lat: 49.140196,
        elevation: 169
      },
    ]

    trackFixture = new TrackData();

    // Add a segment
    trackFixture.addSegment(data);
  })
  test("Simple", () => {
    const converter = new Track2GeoJson(trackFixture.getSegment(0))
    const lineString = converter.toGeoJsonLineStringFeature()
    expect(lineString).toHaveProperty("type", "Feature")
    expect(lineString.geometry).toHaveProperty("type", "LineString")
    expect(lineString.geometry.coordinates).toHaveLength(2)
    expect(lineString.geometry.coordinates[0]).toEqual([8.018429, 49.140191, 168])
    expect(lineString.geometry.coordinates[1]).toEqual([8.018417, 49.140196, 169])
  })
})