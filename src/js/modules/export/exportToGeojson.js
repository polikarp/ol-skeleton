import GeoJSON from "ol/format/GeoJSON";
import { transform } from "ol/proj";



/**
 * Export OL features to a GeoJSON file.
 * @param {import("ol/Feature").default[]} olFeatures
 * @param {Object} opts
 * @param {string} opts.fileName
 * @param {string} opts.dataProjection
 * @param {string} opts.featureProjection
 */
export function exportOlFeaturesToGeoJSON(olFeatures, opts) {
    const format = new GeoJSON();

    const geojsonString = format.writeFeatures(olFeatures, {
        dataProjection: opts.dataProjection || "EPSG:4326",
        featureProjection: opts.featureProjection || "EPSG:3857"
    });

    const blob = new Blob([geojsonString], { type: "application/geo+json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = opts.fileName || "export.geojson";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}


/**
 * Export normalized GeoJSON-like features (EPSG:25830) to a GeoJSON file in EPSG:4326.
 *
 * Expected input items:
 * { id?: any, properties?: Object, geometry?: { type: string, coordinates: any } }
 *
 * @param {Array} features Normalized features (GeoJSON-like).
 * @param {Object} opts
 * @param {string} opts.fileName
 * @param {string} [opts.fromEpsg="EPSG:25830"]
 * @param {string} [opts.toEpsg="EPSG:4326"]
 */
export function exportNormalizedFeaturesToGeoJSON(features, opts = {}) {
    const {
        fileName = "export.geojson",
        fromEpsg = "EPSG:25830",
        toEpsg = "EPSG:4326"
    } = opts;

    if (!Array.isArray(features) || features.length === 0) return;

    const reprojectCoords = (coords) => {
        // coords can be nested: Point [x,y], LineString [[x,y],...], Polygon [[[x,y],...],...]
        if (!Array.isArray(coords)) return coords;

        // Coordinate pair
        if (coords.length >= 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
            return transform(coords, fromEpsg, toEpsg);
        }

        // Nested arrays
        return coords.map(reprojectCoords);
    };

    const fc = {
        type: "FeatureCollection",
        features: features.map((f) => {
            const geom = f?.geometry ?? null;

            return {
                type: "Feature",
                id: f?.id ?? undefined,
                properties: f?.properties || {},
                geometry: geom
                    ? {
                        type: geom.type,
                        coordinates: reprojectCoords(geom.coordinates)
                    }
                    : null
            };
        })
    };

    const blob = new Blob([JSON.stringify(fc)], { type: "application/geo+json;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}