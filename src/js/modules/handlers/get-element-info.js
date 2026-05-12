// get element info handler.js
// Hybrid identify:
// - GeoJSON file layers: local vector identify
// - If no CQL filter: WMS GetFeatureInfo
// - If CQL filter exists: WFS GetFeature with bbox + cql_filter

import { transformExtent } from "ol/proj";
import { applyProxyIfNeeded } from "../map/wms-capabilities-loader";
import { buildWfsGetFeatureUrl } from "../../legacy/wfs-url-builder";
import GeoJSON from "ol/format/GeoJSON";

function makeBbox(coord, tol) {
    return [coord[0] - tol, coord[1] - tol, coord[0] + tol, coord[1] + tol];
}

function defaultNotify(msg) {
    // eslint-disable-next-line no-alert
    alert(msg);
}

function identifyGeoJsonLayersAtPixel(map, pixel, layers, hitTolerance = 10) {
    const resultsByLayer = new Map();

    map.forEachFeatureAtPixel(
        pixel,
        (feature, layer) => {
            if (!layer || layer.get("fileType") !== "geojson") {
                return;
            }

            const layerName =
                layer.get("layerName") ||
                layer.get("title") ||
                layer.get("name") ||
                "geojson_layer";

            const layerTitle =
                layer.get("title") ||
                layer.get("layerTitle") ||
                layerName;

            if (!resultsByLayer.has(layerName)) {
                resultsByLayer.set(layerName, {
                    ok: true,
                    layerName,
                    layerTitle,
                    format: "json",
                    data: {
                        type: "FeatureCollection",
                        features: []
                    },
                    geojson: {
                        type: "FeatureCollection",
                        features: []
                    },
                    error: null
                });
            }

            const props = { ...feature.getProperties() };
            delete props.geometry;

            const geometry = feature.getGeometry();

            const geojsonFeature = {
                type: "Feature",
                id: feature.getId?.() ?? null,
                geometry: null,
                properties: props
            };

            if (geometry) {
                geojsonFeature.geometry = new GeoJSON().writeGeometryObject(geometry);
            }

            const result = resultsByLayer.get(layerName);

            result.data.features.push(geojsonFeature);
            result.geojson.features.push(geojsonFeature);
        },
        {
            hitTolerance,
            layerFilter: (layer) =>
                layers.includes(layer) &&
                layer.getVisible?.() === true &&
                layer.get("fileType") === "geojson"
        }
    );

    return Array.from(resultsByLayer.values());
}

/**
 * @param {Object} p
 * @param {import("ol/Map").default} p.map
 * @param {Map} p.layerRegistry
 * @param {function(Object):(string|null)} p.getCqlFilter function({layer, click}) => string|null
 * @param {number} [p.hitTolerance=10] pixel tolerance for WMS/vector identify
 * @param {string} [p.infoFormat="application/json"]
 * @param {number} [p.toleranceMeters=25] bbox tolerance in map units
 * @param {string} [p.mapCrs="EPSG:25830"]
 * @param {string} [p.wfsCrs="EPSG:4326"]
 * @param {number} [p.count=50]
 * @param {function(string):void} [p.notify]
 * @param {function(Object):void} [p.onResults] receives { mode, click, results }
 * @returns {Function} async handler(ctx)
 */
export function createHybridIdentifyHandler({
    map,
    layerRegistry,
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
    getState = () => {}
}) {
    if (!map || typeof map.forEachFeatureAtPixel !== "function") {
        throw new Error("createHybridIdentifyHandler: map is required");
    }

    if (!layerRegistry || typeof layerRegistry.values !== "function") {
        throw new Error("createHybridIdentifyHandler: layerRegistry (Map) is required");
    }

    if (typeof getCqlFilter !== "function") {
        throw new Error("createHybridIdentifyHandler: getCqlFilter is required");
    }

    if (typeof showGfiLoading !== "function") {
        throw new Error("createHybridIdentifyHandler: showGfiLoading is required");
    }

    return async (ctx) => {
        const state = getState?.() ?? {};

        if (
            window.MAP_CLICK_BLOCKED === true ||
            state.measuring === true ||
            state.profiling === true ||
            state.streetViewMode === true
        ) {
            return;
        }

        spatialDrawTool?.deactivate?.();

        const clickCoord = ctx.coordinate;

        const layers = Array.from(layerRegistry.values()).filter((l) => l?.getVisible?.());

        if (layers.length === 0) {
            notify("No active layers to identify.");
            return;
        }

        const geojsonLayers = layers.filter((layer) => layer.get("fileType") === "geojson");
        const serviceLayers = layers.filter((layer) => layer.get("fileType") !== "geojson");

        showGfiLoading();

        const vectorResults = identifyGeoJsonLayersAtPixel(
            map,
            ctx.pixel,
            geojsonLayers,
            hitTolerance
        );

        if (serviceLayers.length === 0) {
            onResults({
                mode: "wms",
                click: { coordinate: clickCoord, mapCrs },
                results: vectorResults
            });

            return;
        }

        const layerCql = serviceLayers.map((layer) => ({
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

            const requests = serviceLayers.map(async (layer) => {
                const source = layer.getSource();
                const layerName = layer.get("layerName") || source?.getParams?.()?.LAYERS || "unknown";
                const serviceBaseUrl = layer.get("serviceBaseUrl") || "unknown";

                if (!source || typeof source.getFeatureInfoUrl !== "function") {
                    return { ok: false, layerName, serviceBaseUrl, error: "No GetFeatureInfo support" };
                }

                let urlAux = source.getFeatureInfoUrl(clickCoord, resolution, projection, {
                    INFO_FORMAT: infoFormat,
                    FEATURE_COUNT: 25,
                    QUERY_LAYERS: layerName,
                    BUFFER: hitTolerance,
                });

                urlAux = urlAux
                    .replace("REQUEST=GetMap", "REQUEST=GetFeatureInfo")
                    .replace("&TILED=true", "");

                const url = applyProxyIfNeeded(urlAux, useProxy, proxyPath);

                if (!url) {
                    return { ok: false, layerName, serviceBaseUrl, error: "No GetFeatureInfo URL" };
                }

                try {
                    const resp = await fetch(url);

                    if (!resp.ok) {
                        return {
                            ok: false,
                            layerName,
                            serviceBaseUrl,
                            error: `HTTP ${resp.status}`,
                            url
                        };
                    }

                    const ct = resp.headers.get("content-type") || "";

                    if (ct.includes("application/json") || infoFormat === "application/json") {
                        const data = await resp.json().catch(() => null);
                        return { ok: true, layerName, serviceBaseUrl, format: "json", data, url };
                    }

                    const text = await resp.text();
                    return { ok: true, layerName, serviceBaseUrl, format: "text", data: text, url };
                } catch (e) {
                    return {
                        ok: false,
                        layerName,
                        serviceBaseUrl,
                        error: e?.message || "Fetch error",
                        url
                    };
                }
            });

            const results = await Promise.all(requests);

            onResults({
                mode: "wms",
                click: { coordinate: clickCoord, mapCrs },
                results: [
                    ...vectorResults,
                    ...results
                ],
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
                    typeName: layer.get("layerName"),
                    baseUrl: layer.get("serviceBaseUrl"),
                    wfsEnabled: !!layer.get("wfsEnabled"),
                    wfsVersion: layer.get("wfsVersion") || "2.0.0",
                };
            })
            .filter((x) => x.typeName && x.baseUrl);

        const anyWfsEnabled = candidates.some((c) => c.wfsEnabled);

        if (!anyWfsEnabled) {
            if (vectorResults.length > 0) {
                onResults({
                    mode: "wfs",
                    click: { coordinate: clickCoord, mapCrs },
                    results: vectorResults
                });

                return;
            }

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

                    if (!resp.ok) {
                        return {
                            ok: false,
                            layerName: c.typeName,
                            error: `HTTP ${resp.status}`,
                            url,
                            cql: c.cql
                        };
                    }

                    const geojson = await resp.json();
                    const n = Array.isArray(geojson?.features) ? geojson.features.length : 0;

                    return {
                        ok: true,
                        layerName: c.typeName,
                        count: n,
                        geojson,
                        url,
                        cql: c.cql
                    };
                } catch (e) {
                    return {
                        ok: false,
                        layerName: c.typeName,
                        error: e?.message || "Fetch error",
                        url,
                        cql: c.cql
                    };
                }
            });

        const results = await Promise.all(requests);

        const finalResults = [
            ...vectorResults,
            ...results
        ];

        const anyOk = finalResults.some((r) => r.ok);

        if (!anyOk) {
            notify("WFS is not available for the active layers. No query was executed.");
            console.warn("WFS query errors:", results);
            return;
        }

        onResults({
            mode: "wfs",
            click: { coordinate: clickCoord, bboxMap, bboxWfs, mapCrs, wfsCrs },
            results: finalResults,
        });
    };
}