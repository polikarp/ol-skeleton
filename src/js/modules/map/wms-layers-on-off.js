// WMS layer activation/deactivation utilities for OpenLayers.

import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import {wmsLayerRegistry} from "./map-config";

/**
 * Internal registry to keep references to OL layers.
 * Key: "<serviceBaseUrl>|<layerName>"
 */


/**
 * @param {string} layerName
 * @returns {string}
 */
function buildLayerKey(layerName) {
    return `${layerName}`;
}

/**
 * Create an OpenLayers Tile WMS layer.
 * @param {Object} params
 * @param {string} params.layerName
 * @param {string} params.serviceBaseUrl
 * @param {string} params.version
 * @param {string} params.title
 * @param {string} params.crossOrigin
 * @returns {import("ol/layer/Tile").default}
 */
export function createOlWmsTileLayer({
    layerName,
    serviceBaseUrl,
    version = "1.3.0",
    title = null,
    crossOrigin = "anonymous",
}) {
    const source = new TileWMS({
        url: serviceBaseUrl,
        params: {
            SERVICE: "WMS",
            VERSION: version,
            REQUEST: "GetMap",
            LAYERS: layerName,
            TILED: true,
            TRANSPARENT: true,
            FORMAT: "image/png",
        }
    });

    const layer = new TileLayer({
        source,
        visible: true,
    });

    layer.set("wmsLayerName", layerName);
    layer.set("wmsServiceBaseUrl", serviceBaseUrl);
    layer.set("title", title || layerName);
    layer.set("wfsEnabled", true); // asume always true
    layer.set("wfsVersion", "2.0.0");

    return layer;
}

/**
 * Add WMS layer to map (or show if already exists in registry).
 * @param {import("ol/Map").default} map
 * @param {Object} opts
 * @param {string} opts.layerName
 * @param {string} opts.serviceBaseUrl
 * @param {string} opts.version
 * @param {string} opts.title
 * @param {string} opts.crossOrigin
 */
export function addWmsLayerToMap(
    map,
    { layerName, serviceBaseUrl, version = "1.3.0", title = null, crossOrigin = "anonymous" }
) {
    if (!map) throw new Error("Map is required");
    if (!layerName || !serviceBaseUrl) throw new Error("layerName and serviceBaseUrl are required");

    const key = buildLayerKey(layerName);

    if (wmsLayerRegistry.has(key)) {
        const existing = wmsLayerRegistry.get(key);
        existing.setVisible(true);
        return existing;
    }

    const olLayer = createOlWmsTileLayer({
        layerName,
        serviceBaseUrl,
        version,
        title,
        crossOrigin,
    });

    map.addLayer(olLayer);
    wmsLayerRegistry.set(key, olLayer);

    return olLayer;
}

/**
 * Remove WMS layer from map (or just hide).
 * @param {import("ol/Map").default} map
 * @param {Object} opts
 * @param {string} opts.layerName
 * @param {string} opts.serviceBaseUrl
 * @param {boolean} opts.remove - true: remove layer from map and registry; false: setVisible(false)
 */
export function removeWmsLayerFromMap(map, { layerName, serviceBaseUrl, remove = true }) {
    if (!map) throw new Error("Map is required");
    if (!layerName || !serviceBaseUrl) throw new Error("layerName and serviceBaseUrl are required");

    const key = buildLayerKey(layerName);
    const olLayer = wmsLayerRegistry.get(key);

    if (!olLayer) return;

    if (remove) {
        map.removeLayer(olLayer);
        wmsLayerRegistry.delete(key);
    } else {
        olLayer.setVisible(false);
    }
}

/**
 * Check if a WMS layer is already registered.
 * @param {string} layerName
 * @param {string} serviceBaseUrl
 * @returns {boolean}
 */
export function hasWmsLayer(layerName, serviceBaseUrl) {
    const key = buildLayerKey(layerName);
    return wmsLayerRegistry.has(key);
}

/**
 * Optional: clear all registered WMS layers from map.
 * @param {import("ol/Map").default} map
 */
export function clearAllWmsLayers(map) {
    if (!map) throw new Error("Map is required");

    for (const layer of wmsLayerRegistry.values()) {
        map.removeLayer(layer);
    }
    wmsLayerRegistry.clear();
}


/**
 * Refresh (re-render) a registered WMS layer by updating its CQL_FILTER param.
 * Works with layers created by createOlWmsTileLayer (TileWMS source).
 *
 * Requirements:
 * - layer must be registered in wmsLayerRegistry with key "<serviceBaseUrl>|<layerName>"
 * - window.currentCqlFilterByLayer[layerName] contains the CQL string (or undefined/null to clear)
 *
 * @param {Object} opts
 * @param {string} opts.layerName
 * @param {string} opts.serviceBaseUrl
 * @param {boolean} [opts.bustCache=true] Add a cache-buster param to force tile refresh
 * @param {string}  [opts.cacheParam="_t"] Cache-buster param name
 * @returns {boolean} true if layer found and refreshed; false otherwise
 */
export function refreshWmsLayer({
    layerName,
    serviceBaseUrl,
    bustCache = true,
    cacheParam = "_t",
}) {
    if (!layerName) {
        throw new Error("layerName is required");
    }

    const key = buildLayerKey(layerName);
    const olLayer = wmsLayerRegistry.get(key);

    if (!olLayer) {
        return false;
    }

    const source = olLayer.getSource?.();
    if (!source || typeof source.updateParams !== "function") {
        console.warn("Layer source does not support updateParams (expected TileWMS).", { layerName, serviceBaseUrl });
        return false;
    }

    const cql = window.currentCqlFilterByLayer?.[layerName] ?? null;

    // Get current params
    const params = source.getParams ? { ...source.getParams() } : {};

    // Update / clear CQL_FILTER
    if (cql && String(cql).trim().length > 0) {
        params.CQL_FILTER = String(cql).trim();
    } else {
        // Clear filter if empty
        params.CQL_FILTER = undefined;
    }

    // Force refresh of tiles
    if (bustCache) {
        params[cacheParam] = Date.now();
    }

    source.updateParams(params);

    // Make sure it's visible (optional)
    olLayer.setVisible(true);

    return true;
}
