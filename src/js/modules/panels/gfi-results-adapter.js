// gfi-results-adapter.js
// Normalize hybrid identify results (wms/wfs) to a unified structure for the right panel.

function hasFeaturesGeoJsonLike(obj) {
    return Array.isArray(obj?.features) && obj.features.length > 0;
}

export function hasAnyPanelContent(normalizedResults) {
    return (normalizedResults || []).some((r) => {
        if (!r?.ok) return false;

        if (r.format === "json") return hasFeaturesGeoJsonLike(r.data);
        if (r.format === "text") return typeof r.data === "string" && r.data.trim().length > 0;

        return false;
    });
}

/**
 * @param {"wms"|"wfs"} mode
 * @param {Array} results
 * @returns {Array<{ok:boolean, layerName:string, layerTitle?:string, format:"json"|"text", data:any, error?:string}>}
 */
export function adaptHybridResultsToPanel(mode, results) {
    if (mode === "wfs") {
        return (results || []).map((r) => ({
            ok: !!r.ok,
            layerName: r.layerName,
            layerTitle: r.layerName,
            format: "json",
            data: r.geojson || { type: "FeatureCollection", features: [] },
            error: r.error,
        }));
    }

    // mode === "wms"
    return (results || []).map((r) => ({
        ok: !!r.ok,
        layerName: r.layerName,
        layerTitle: r.layerName, // if you want a friendly title, map it here
        format: r.format || "text",
        data: r.data,
        error: r.error,
    }));
}
