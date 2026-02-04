// resources/js/legacy/wfs-url-builder.js

/**
 * Build a WFS GetFeature URL.
 * - If CQL exists, put BBOX inside the CQL to avoid bbox+cql issues in GeoServer.
 */
export function buildWfsGetFeatureUrl({
  baseUrl,
  typeName,
  version,
  bbox,
  bboxCrs,
  cqlFilter,
  count,
}) {
    if (!baseUrl) throw new Error("baseUrl is required");
    if (!typeName) throw new Error("typeName is required");
    if (!version) throw new Error("version is required");

    const sep = baseUrl.includes("?") ? "&" : "?";
    const typeParam = String(version).startsWith("2") ? "typeNames" : "typeName";

    const hasCql =
        cqlFilter !== null &&
        cqlFilter !== undefined &&
        String(cqlFilter).trim().length > 0;

    const hasBbox =
        Array.isArray(bbox) &&
        bbox.length === 4 &&
        bbox.every((v) => v !== null && v !== undefined && v !== "");

    // GeoServer: if CQL is present, include bbox inside the CQL to avoid bbox+cql issues.
    let finalCql = hasCql ? String(cqlFilter).trim() : "";
    if (hasCql && hasBbox) {
        const geomProp = "geom"; // IMPORTANT: adapt if your geometry attribute is different (e.g. "the_geom")
        const bboxCql = `BBOX(${geomProp}, ${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, '${bboxCrs}')`;
        finalCql = `(${finalCql}) AND ${bboxCql}`;
    }

    let url =
        `${baseUrl}${sep}` +
        `service=WFS` +
        `&request=GetFeature` +
        `&version=${encodeURIComponent(version)}` +
        `&${typeParam}=${encodeURIComponent(typeName)}` +
        `&outputFormat=${encodeURIComponent("application/json")}` +
        `&count=${encodeURIComponent(String(count))}`;

    // Only add bbox param if there is no CQL
    if (!hasCql && hasBbox) {
        const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]},${bboxCrs}`;
        url += `&bbox=${encodeURIComponent(bboxStr)}`;
    }

    if (finalCql) {
        url += `&cql_filter=${encodeURIComponent(finalCql)}`;
    }

  return url;
}
