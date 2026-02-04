/**
 * Extract minimal legend info from GeoServer GetLegendGraphic (application/json)
 * Returns:
 * [{ type, fill, stroke, label }]
 */
export function extractLegendItems(legendJson) {
    const rules = legendJson?.Legend?.[0]?.rules || [];
    const items = [];

    for (const rule of rules) {
        const label = (rule?.title || rule?.name || "").trim();
        const symbolizers = Array.isArray(rule?.symbolizers) ? rule.symbolizers : [];

        const geom = extractGeometryStyle(symbolizers);
        if (!geom) continue; // skip text-only rules

        items.push({
            type: geom.type,
            fill: geom.fill,
            stroke: geom.stroke,
            label
        });
    }

    return items;
}

function extractGeometryStyle(symbolizers) {
    // Point
    for (const s of symbolizers) {
        const p = s?.Point;
        if (!p) continue;

        const g0 = Array.isArray(p.graphics) ? p.graphics[0] : null;
        if (g0) {
        return {
            type: "point",
            fill: g0.fill || null,
            stroke: g0.stroke || null
        };
        }
    }

    // Line
    for (const s of symbolizers) {
        const l = s?.Line;
        if (!l) continue;

        return {
        type: "line",
        fill: null,
        stroke: l.stroke || null
        };
    }

    // Polygon
    for (const s of symbolizers) {
        const p = s?.Polygon;
        if (!p) continue;

        return {
        type: "polygon",
        fill: p.fill || null,
        stroke: p.stroke || null
        };
    }

    return null;
}



