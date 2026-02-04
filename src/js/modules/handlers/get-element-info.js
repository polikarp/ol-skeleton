// get element info handler.js
// Hybrid identify:
// - If no CQL filter: WMS GetFeatureInfo (fast, always available)
// - If CQL filter exists: WFS GetFeature with bbox + cql_filter (only if WFS enabled)

import { transformExtent } from "ol/proj";
import {applyProxyIfNeeded} from "../map/wms-capabilities-loader";
import {buildWfsGetFeatureUrl} from "../../legacy/wfs-url-builder";

function makeBbox(coord, tol) {
    return [coord[0] - tol, coord[1] - tol, coord[0] + tol, coord[1] + tol];
}

function defaultNotify(msg) {
    // eslint-disable-next-line no-alert
    alert(msg);
}

// function buildWfsGetFeatureUrl({ baseUrl, typeName, version, bbox, bboxCrs, cqlFilter, count }) {
//     if (!baseUrl) throw new Error("baseUrl is required");
//     if (!typeName) throw new Error("typeName is required");
//     if (!version) throw new Error("version is required");

//     const sep = baseUrl.includes("?") ? "&" : "?";
//     const typeParam = String(version).startsWith("2") ? "typeNames" : "typeName";

//     const hasCql = cqlFilter !== null && cqlFilter !== undefined && String(cqlFilter).trim().length > 0;
//     const hasBbox = Array.isArray(bbox) && bbox.length === 4 && bbox.every(v => v !== null && v !== undefined && v !== "");

//     // GeoServer: if CQL is present, include the BBOX constraint inside the CQL to avoid bbox+cql issues.
//     // Otherwise, use the bbox parameter normally.
//     let finalCql = hasCql ? String(cqlFilter).trim() : "";
//     if (hasCql && hasBbox) {
//         // CQL BBOX expects: BBOX(geom, minx, miny, maxx, maxy, 'EPSG:xxxx')
//         // NOTE: use your geometry property name; in GeoServer it's often "the_geom" by default.
//         const geomProp = "geom";
//         const bboxCql = `BBOX(${geomProp}, ${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, '${bboxCrs}')`;
//         finalCql = `(${finalCql}) AND ${bboxCql}`;
//     }

//     let url =
//         `${baseUrl}${sep}` +
//         `service=WFS` +
//         `&request=GetFeature` +
//         `&version=${encodeURIComponent(version)}` +
//         `&${typeParam}=${encodeURIComponent(typeName)}` +
//         `&outputFormat=${encodeURIComponent("application/json")}` +
//         `&count=${encodeURIComponent(String(count))}`;

//     if (!hasCql && hasBbox) {
//         const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]},${bboxCrs}`;
//         url += `&bbox=${encodeURIComponent(bboxStr)}`;
//     }

//     if (finalCql) {
//         url += `&cql_filter=${encodeURIComponent(finalCql)}`;
//     }

//     return url;
// }


/**
 * @param {Object} p
 * @param {Map} p.wmsLayerRegistry
 * @param {function(Object):(string|null)} p.getCqlFilter function({layer, click}) => string|null
 * @param {number} [p.hitTolerance=10] pixel tolerance for WMS GetFeatureInfo
 * @param {string} [p.infoFormat="application/json"]
 * @param {number} [p.toleranceMeters=25] bbox tolerance in map units (meters in EPSG:25830)
 * @param {string} [p.mapCrs="EPSG:25830"]
 * @param {string} [p.wfsCrs="EPSG:4326"]
 * @param {number} [p.count=50]
 * @param {function(string):void} [p.notify]
 * @param {function(Object):void} [p.onResults] receives { mode, click, results }
 * @returns {Function} async handler(ctx)
 */
export function createHybridIdentifyHandler({
    wmsLayerRegistry,
    useProxy,
    proxyPath,
    showGfiLoading,
    spatialDrawTool,
    getCqlFilter,
    hitTolerance = 10,
    infoFormat = "application/json",
    toleranceMeters = 25,
    mapCrs = "EPSG:25830",
    wfsCrs = "EPSG:4326",
    count = 50,
    notify = defaultNotify,
    onResults = () => {},
}) {
    if (!wmsLayerRegistry || typeof wmsLayerRegistry.values !== "function") {
        throw new Error("createHybridIdentifyHandler: wmsLayerRegistry (Map) is required");
    }
    if (typeof getCqlFilter !== "function") {
        throw new Error("createHybridIdentifyHandler: getCqlFilter is required");
    }
    if (typeof showGfiLoading !== "function") {
        throw new Error("createHybridIdentifyHandler: showGfiLoading is required");
    }



    return async (ctx) => {
        spatialDrawTool.deactivate();
        const clickCoord = ctx.coordinate;

        const layers = Array.from(wmsLayerRegistry.values()).filter((l) => l?.getVisible?.());
        if (layers.length === 0) {
            notify("No active layers to identify.");
            return;
        }

        showGfiLoading();

        // Determine if we should use WFS mode: at least one layer has a non-empty CQL filter
        const layerCql = layers.map((layer) => ({
            layer,
            cql: getCqlFilter({
                layer,
                click: { coordinate: clickCoord, mapCrs },
            }),
        }));

        const anyCql = layerCql.some((x) => x.cql && String(x.cql).trim().length > 0);

        // -----------------------------
        // MODE A: WMS GetFeatureInfo
        // -----------------------------
        if (!anyCql) {
            const view = ctx.view;
            const resolution = view.getResolution();
            const projection = ctx.projection;

            if (!resolution) {
                notify("Map resolution is not available.");
                return;
            }

            const requests = layers.map(async (layer) => {
                const source = layer.getSource();
                const layerName = layer.get("wmsLayerName") || source?.getParams?.()?.LAYERS || "unknown";
                const serviceBaseUrl = layer.get("wmsServiceBaseUrl") || "unknown";

                if (!source || typeof source.getFeatureInfoUrl !== "function") {
                    return { ok: false, layerName, serviceBaseUrl, error: "No GetFeatureInfo support" };
                }

                let urlAux = source.getFeatureInfoUrl(clickCoord, resolution, projection, {
                    INFO_FORMAT: infoFormat,
                    FEATURE_COUNT: 25,
                    QUERY_LAYERS: layerName,
                    BUFFER: hitTolerance,
                });

                urlAux = urlAux.replace("REQUEST=GetMap", "REQUEST=GetFeatureInfo").replace("&TILED=true", "");

                const url = applyProxyIfNeeded(urlAux, useProxy, proxyPath);

                if (!url) return { ok: false, layerName, serviceBaseUrl, error: "No GetFeatureInfo URL" };

                try {
                    const resp = await fetch(url);
                    if (!resp.ok) return { ok: false, layerName, serviceBaseUrl, error: `HTTP ${resp.status}`, url };

                    const ct = resp.headers.get("content-type") || "";
                    if (ct.includes("application/json") || infoFormat === "application/json") {
                        const data = await resp.json().catch(() => null);
                        return { ok: true, layerName, serviceBaseUrl, format: "json", data, url };
                    }

                    const text = await resp.text();
                    return { ok: true, layerName, serviceBaseUrl, format: "text", data: text, url };
                } catch (e) {
                    return { ok: false, layerName, serviceBaseUrl, error: e?.message || "Fetch error", url };
                }
            });

            const results = await Promise.all(requests);

            onResults({
                mode: "wms",
                click: { coordinate: clickCoord, mapCrs },
                results,
            });

            return;
        }

        // -----------------------------
        // MODE B: WFS GetFeature + CQL
        // -----------------------------
        const candidates = layerCql
            .filter((x) => x.cql && String(x.cql).trim().length > 0)
            .map((x) => {
                const layer = x.layer;
                return {
                    layer,
                    cql: String(x.cql).trim(),
                    typeName: layer.get("wmsLayerName"),
                    baseUrl: layer.get("wmsServiceBaseUrl"),
                    wfsEnabled: !!layer.get("wfsEnabled"),
                    wfsVersion: layer.get("wfsVersion") || "2.0.0",
                };
            })
            .filter((x) => x.typeName && x.baseUrl);

        const anyWfsEnabled = candidates.some((c) => c.wfsEnabled);
        if (!anyWfsEnabled) {
            notify("CQL filter requested, but WFS is not enabled for the active layers.");
            return;
        }

        const bboxMap = makeBbox(clickCoord, toleranceMeters);
        const bboxWfs = mapCrs === wfsCrs ? bboxMap : transformExtent(bboxMap, mapCrs, wfsCrs);

        const requests = candidates
            .filter((c) => c.wfsEnabled)
            .map(async (c) => {
                const urlAux = buildWfsGetFeatureUrl({
                    baseUrl: c.baseUrl,
                    typeName: c.typeName,
                    version: c.wfsVersion,
                    bbox: bboxWfs,
                    bboxCrs: wfsCrs,
                    cqlFilter: c.cql,
                    count,
                });

                const url = applyProxyIfNeeded(urlAux, useProxy, proxyPath);

                try {
                    const resp = await fetch(url);
                    if (!resp.ok) return { ok: false, layerName: c.typeName, error: `HTTP ${resp.status}`, url, cql: c.cql };

                    const geojson = await resp.json();
                    const n = Array.isArray(geojson?.features) ? geojson.features.length : 0;

                    return { ok: true, layerName: c.typeName, count: n, geojson, url, cql: c.cql };
                } catch (e) {
                    return { ok: false, layerName: c.typeName, error: e?.message || "Fetch error", url, cql: c.cql };
                }
            });

        const results = await Promise.all(requests);

        const anyOk = results.some((r) => r.ok);
        if (!anyOk) {
            notify("WFS is not available for the active layers. No query was executed.");
            console.warn("WFS query errors:", results);
            return;
        }

        onResults({
            mode: "wfs",
            click: { coordinate: clickCoord, bboxMap, bboxWfs, mapCrs, wfsCrs },
            results,
        });
    };
}
