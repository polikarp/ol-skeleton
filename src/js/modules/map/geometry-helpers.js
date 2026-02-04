import Polygon from "ol/geom/Polygon";

/**
 * Create a Polygon from an extent [minx, miny, maxx, maxy].
 */
export function polygonFromExtent(extent) {
  const [minx, miny, maxx, maxy] = extent;
  return new Polygon([
    [
      [minx, miny],
      [maxx, miny],
      [maxx, maxy],
      [minx, maxy],
      [minx, miny],
    ],
  ]);
}
