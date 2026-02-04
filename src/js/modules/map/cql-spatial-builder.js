import WKT from "ol/format/WKT";

/**
 * Build a spatial CQL using INTERSECTS and an SRID-tagged WKT.
 * Assumes geometries are already in the target CRS (EPSG:25830).
 */
export function buildIntersectsCql({geomProp, geometry, srid = 25830}) {
  const wkt = new WKT().writeGeometry(geometry);
  return `INTERSECTS(${geomProp}, SRID=${srid};${wkt})`;
}

/**
 * Combine attribute CQL + spatial CQL.
 * - If both exist => (attr) AND (spatial)
 * - If only one exists => that one
 */
export function combineCql(attrCql, spatialCql) {
  const a = (attrCql ?? "").toString().trim();
  const s = (spatialCql ?? "").toString().trim();

  if (a && s) return `(${a}) AND (${s})`;
  return a || s;
}
