import GeoJSON from "ol/format/GeoJSON";

/**
 * Convert an OpenLayers Geometry into a plain GeoJSON-like Feature (no OL Feature).
 * @param {import("ol/geom/Geometry").default} geom
 * @param {Object} opts
 * @param {string} opts.featureProjection Projection of the geometry (usually map view projection)
 * @param {string} opts.dataProjection Output projection (usually EPSG:4326 for GeoJSON)
 * @returns {Object|null} Plain GeoJSON-like Feature: {type, properties, geometry}
 */
export function olGeomToGeoJsonLikeFeature(geom, { featureProjection, dataProjection }) {
    if (!geom) return null;

    const fmt = new GeoJSON();

    // Convert geometry to a plain GeoJSON geometry object
    const geojsonGeom = fmt.writeGeometryObject(geom, {
        featureProjection,
        dataProjection
    });

    return {
        type: "Feature",
        properties: {},
        geometry: geojsonGeom
    };
}