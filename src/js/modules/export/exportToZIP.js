// Comments in English as requested.

import JSZip from "jszip";
import { transform } from "ol/proj";

/**
 * Export a registry of normalized features to a ZIP with GeoJSON files.
 *
 * @param {Object|Map} registry  // { layerId: [features] } or Map(layerId => features)
 * @param {Object} opts
 * @param {string} [opts.zipName="identify_results.zip"]
 * @param {string} [opts.fromEpsg="EPSG:25830"]
 * @param {string} [opts.toEpsg="EPSG:4326"]
 */
export async function exportGfiRegistryToZipGeoJSON(registry, opts = {}) {

    const {
        zipName = "identify_results.zip",
        fromEpsg = "EPSG:25830",
        toEpsg = "EPSG:4326"
    } = opts;

    if (!registry) return;

    const entries =
        registry instanceof Map
        ? Array.from(registry.entries())
        : Object.entries(registry);

    const nonEmpty = entries.filter(
        ([, entry]) => entry && entry.features.length
    );

    if (!nonEmpty.length) return;

    const reprojectCoords = (coords) => {
        if (!Array.isArray(coords)) return coords;

        if (coords.length >= 2 && typeof coords[0] === "number") {
            return transform(coords, fromEpsg, toEpsg);
        }

        return coords.map(reprojectCoords);
    };

    const zip = new JSZip();

    for (const [, entry] of nonEmpty) {
        const fc = {
        type: "FeatureCollection",
        features: entry.features.map((f) => ({
                type: "Feature",
                id: f?.id ?? undefined,
                properties: f?.properties || {},
                geometry: f?.geometry
                ? {
                    type: f.geometry.type,
                    coordinates: reprojectCoords(f.geometry.coordinates)
                    }
                : null
            }))
        };

        zip.file(`${entry.fileName}.geojson`, JSON.stringify(fc));
    }

    const blob = await zip.generateAsync({ type: "blob" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}