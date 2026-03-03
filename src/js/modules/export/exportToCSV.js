
import GeoJSON from "ol/format/GeoJSON";
import WKT from "ol/format/WKT";

/**
 * Export normalized GeoJSON-like features to CSV (WKT geometry).
 */
export function exportNormalizedFeaturesToCSV(features, opts = {}) {
    const {
        fileName = "export.csv",
        fromEpsg = "EPSG:25830",
        toEpsg = "EPSG:4326",
        columns,
        wktColumn = "geom_wkt",
        includeId = true
    } = opts;

    if (!Array.isArray(features) || features.length === 0) return;

    const sep = ";";
    const BOM = "\uFEFF";

    const csvEscape = (v) => {
        if (v === null || v === undefined) return "";
        const s = String(v);
        if (/[;"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };

    const geojsonFormat = new GeoJSON();
    const wktFormat = new WKT();

    // Auto-detect property columns
    let cols = columns;
    if (!cols) {
        const set = new Set();
        features.forEach(f => {
            Object.keys(f?.properties || {}).forEach(k => set.add(k));
        });
        cols = Array.from(set).sort();
    }

    const header = [];
    if (includeId) header.push("id");
    header.push(...cols);
    header.push(wktColumn);

    const lines = [];
    lines.push(header.map(csvEscape).join(sep));

    features.forEach(f => {
        const row = [];

        if (includeId) row.push(csvEscape(f?.id ?? ""));

        cols.forEach(k => {
            row.push(csvEscape(f?.properties?.[k]));
        });

        let wktValue = "";

        if (f?.geometry) {
            // Create OL feature from GeoJSON-like object
            const olFeature = geojsonFormat.readFeature({
                type: "Feature",
                geometry: f.geometry,
                properties: {}
            }, {
                dataProjection: fromEpsg,
                featureProjection: toEpsg
            });

            wktValue = wktFormat.writeGeometry(olFeature.getGeometry());
        }

        row.push(csvEscape(wktValue));
        lines.push(row.join(sep));
    });

    const csv = BOM + lines.join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}