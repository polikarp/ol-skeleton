// Multi-protocol layer utilities for OpenLayers (WMS / WFS / WMTS / XYZ).
// Input signature requested:
//   (map, { layerName, serviceBaseUrl, version, title, crossOrigin, serviceType })
//
// Notes:
// - For WMTS/XYZ/WFS, extra protocol-specific config should come from the optional "options" param.
// - Keep your existing window.currentCqlFilterByLayer[layerName] for WMS/WFS filtering.
//
// All comments in English.

import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";

import TileWMS from "ol/source/TileWMS";
import WMTS from "ol/source/WMTS";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";

import GeoJSON from "ol/format/GeoJSON";
import { bbox as bboxStrategy } from "ol/loadingstrategy";
import { get as getProjection } from "ol/proj";
import WMTSTileGrid from "ol/tilegrid/WMTS";

// Use your registry (rename as you wish)
import { layerRegistry, layersInfo } from "./map-config";

const DEFAULT_CRS = "EPSG:25830";

/**
 * Normalize protocol type string.
 * @param {string} type
 * @returns {string}
 */
function normalizeType(type) {
  return String(type || "").trim().toUpperCase();
}

/**
 * Build a unique key for any protocol/layer.
 * @param {Object} params
 * @param {string} params.type
 * @param {string} params.layerName
 * @param {string} params.serviceBaseUrl
 * @returns {string}
 */
function buildLayerKey({ type, layerName, serviceBaseUrl }) {
  return `${normalizeType(type)}|${serviceBaseUrl}|${layerName}`;
}

/**
 * Create an OL layer for a given service type.
 *
 * Required inputs:
 * @param {Object} params
 * @param {string} params.layerName
 * @param {string} params.serviceBaseUrl
 * @param {string} [params.version]
 * @param {string|null} [params.title]
 * @param {string} [params.crossOrigin]
 * @param {string} params.serviceType   // "WMS" | "WFS" | "WMTS" | "XYZ"
 *
 * Optional:
 * @param {Object} [params.options]      // protocol-specific configuration
 *
 * @returns {import("ol/layer/Base").default}
 */
export function createOlLayerFromServiceType({layerName, serviceBaseUrl, version, title = null, serviceType, tiled, format, options = {},}) {
    if (!layerName) throw new Error("layerName is required");
    if (!serviceBaseUrl) throw new Error("serviceBaseUrl is required");
    if (!serviceType) throw new Error("serviceType is required");

    const type = normalizeType(serviceType);

    // Store some metadata on the layer for later refresh/remove logic
    const commonMeta = {
        serviceType: type,
        serviceBaseUrl,
        serviceVersion: version || null,
        layerName,
        title: title || layerName,
    };

    if (type === "WMS") {
        const source = new TileWMS({
            url: serviceBaseUrl,
            params: {
                SERVICE: type,
                VERSION: version || "1.3.0",
                REQUEST: "GetMap",
                LAYERS: layerName,
                TILED: tiled,
                TRANSPARENT: true,
                FORMAT: format || "image/png",
            },
        });

        const layer = new TileLayer({ source, visible: true });
        Object.entries(commonMeta).forEach(([k, v]) => layer.set(k, v));

        // Extra metadata (optional)
        layer.set("wfsEnabled", options.wfsEnabled ?? true);
        layer.set("wfsVersion", options.wfsVersion || "2.0.0");

        return layer;
  }

  if (type === "WFS") {
    /**
     * WFS is typically loaded as vector features.
     * We use bbox strategy for performance, and rebuild the URL with CQL if present.
     *
     * options example:
     * {
     *   typeName: "workspace:layer"   // defaults to layerName
     *   srsName: "EPSG:25830"         // defaults to EPSG:3857
     *   outputFormat: "application/json"
     *   maxFeatures: 5000
     * }
     */
    const srsName = options.srsName || DEFAULT_CRS;
    const typeName = options.typeName || layerName;
    const outputFormat = options.outputFormat || "application/json";
    const maxFeatures = options.maxFeatures || 5000;

    const source = new VectorSource({
      format: new GeoJSON(),
      strategy: bboxStrategy,
      loader: (extent, resolution, projection) => {
        // Build WFS GetFeature URL (bbox + optional CQL_FILTER)
        const bbox = `${extent.join(",")},${srsName}`;
        const cql = window.currentCqlFilterByLayer?.[layerName] ?? null;

        const sep = serviceBaseUrl.includes("?") ? "&" : "?";
        let url =
          `${serviceBaseUrl}${sep}` +
          `service=WFS` +
          `&request=GetFeature` +
          `&version=${encodeURIComponent(version || "2.0.0")}` +
          `&typeNames=${encodeURIComponent(typeName)}` +
          `&srsName=${encodeURIComponent(srsName)}` +
          `&bbox=${encodeURIComponent(bbox)}` +
          `&outputFormat=${encodeURIComponent(outputFormat)}` +
          `&count=${encodeURIComponent(String(maxFeatures))}`;

        if (cql && String(cql).trim().length > 0) {
          url += `&cql_filter=${encodeURIComponent(String(cql).trim())}`;
        }

        fetch(url)
          .then((r) => r.json())
          .then((geojson) => {
            const features = source.getFormat().readFeatures(geojson, {
              featureProjection: projection,
            });
            source.addFeatures(features);
          })
          .catch((err) => console.error("WFS load error", err));
      },
    });

    const layer = new VectorLayer({ source, visible: true });
    Object.entries(commonMeta).forEach(([k, v]) => layer.set(k, v));

    layer.set("wfsTypeName", typeName);
    layer.set("wfsSrsName", srsName);

    return layer;
  }

  if (type === "WMTS") {
    /**
     * WMTS needs tileGrid configuration.
     * options example:
     * {
     *   layer: "workspace:layer",     // defaults to layerName
     *   matrixSet: "EPSG:3857",
     *   format: "image/png",
     *   style: "default",
     *   projection: "EPSG:3857",
     *   origin: [x0, y0],
     *   resolutions: [...],
     *   matrixIds: [...]
     * }
     */
    const projection = getProjection(options.projection || DEFAULT_CRS);

    if (!options.origin || !options.resolutions || !options.matrixIds || !options.matrixSet) {
      throw new Error(
        "WMTS requires options.origin, options.resolutions, options.matrixIds and options.matrixSet"
      );
    }

    const tileGrid = new WMTSTileGrid({
      origin: options.origin,
      resolutions: options.resolutions,
      matrixIds: options.matrixIds,
    });

    const source = new WMTS({
      url: serviceBaseUrl,
      layer: options.layer || layerName,
      matrixSet: options.matrixSet,
      format: options.format || "image/png",
      style: options.style || "default",
      projection,
      tileGrid,
      wrapX: options.wrapX ?? true,
      crossOrigin,
    });

    const layer = new TileLayer({ source, visible: true });
    Object.entries(commonMeta).forEach(([k, v]) => layer.set(k, v));
    return layer;
  }

  if (type === "XYZ") {
    /**
     * XYZ is useful for external tiles (OSM, custom tile server).
     * options example:
     * { urlTemplate: "https://tile.server/{z}/{x}/{y}.png", maxZoom: 19 }
     */
    if (!options.urlTemplate) {
      throw new Error("XYZ requires options.urlTemplate");
    }

    const source = new XYZ({
      url: options.urlTemplate,
      maxZoom: options.maxZoom ?? 19,
      crossOrigin,
    });

    const layer = new TileLayer({ source, visible: true });
    Object.entries(commonMeta).forEach(([k, v]) => layer.set(k, v));
    return layer;
  }

  throw new Error(`Unsupported service type: ${type}`);
}

/**
 * Add a layer to map (or show if already exists).
 * Signature requested: (map, { layerName, serviceBaseUrl, version, title, crossOrigin, serviceType })
 *
 * Optional:
 * @param {Object} [opts.options] protocol-specific options (WMTS/WFS/XYZ)
 *
 * @returns {import("ol/layer/Base").default}
 */
export function addLayerToMap(map, layerName, { options = {} }) {

    const { serviceBaseUrl, version, title, serviceType, tiled, format } = layersInfo.get(layerName);
    if (!map) throw new Error("Map is required");
    if (!layerName || !serviceBaseUrl) throw new Error("layerName and serviceBaseUrl are required");

    const key = buildLayerKey({ type: serviceType, layerName, serviceBaseUrl });

    if (layerRegistry.has(key)) {
        const existing = layerRegistry.get(key);
        existing.setVisible(true);
        return existing;
    }

    const olLayer = createOlLayerFromServiceType({layerName, serviceBaseUrl, version, title, serviceType, tiled, format, options,});

    map.addLayer(olLayer);
    layerRegistry.set(key, olLayer);
    return olLayer;
}

/**
 * Remove/hide a layer from map.
 * Signature requested: (map, { layerName, serviceBaseUrl, version, title, crossOrigin, serviceType })
 *
 * @param {Object} opts
 * @param {boolean} [opts.remove=true] true -> remove from map and registry; false -> setVisible(false)
 */
export function removeLayerFromMap(map, layerName, removeOnUncheck) {
    if (!map) throw new Error("Map is required");
    const { serviceBaseUrl, serviceType } = layersInfo.get(layerName);
    if (!layerName || !serviceBaseUrl) throw new Error("layerName and serviceBaseUrl are required");

    const key = buildLayerKey({ type: serviceType, layerName, serviceBaseUrl });
    const olLayer = layerRegistry.get(key);

    if (!olLayer) return;

    if (removeOnUncheck) {
        map.removeLayer(olLayer);
        layerRegistry.delete(key);
    } else {
        olLayer.setVisible(false);
    }
}

/**
 * Refresh a layer based on its protocol.
 * - WMS: update CQL_FILTER and bust cache
 * - WFS: clear features and force reload by triggering source refresh
 *
 * Signature requested: (map, { layerName, serviceBaseUrl, version, title, crossOrigin, serviceType })
 *
 * @param {Object} opts
 * @param {boolean} [opts.bustCache=true]
 * @param {string}  [opts.cacheParam="_t"]
 * @returns {boolean}
 */
export function refreshLayer(map, layerName, { bustCache = true, cacheParam = "_t" }) {
    if (!map) throw new Error("Map is required");

    const { serviceBaseUrl, serviceType} = layersInfo.get(layerName);
    if (!layerName || !serviceBaseUrl) throw new Error("layerName and serviceBaseUrl are required");

    const type = normalizeType(serviceType);
    const key = buildLayerKey({ type, layerName, serviceBaseUrl });
    const olLayer = layerRegistry.get(key);
    if (!olLayer) return false;

    if (type === "WMS") {
        const source = olLayer.getSource?.();
        if (!source || typeof source.updateParams !== "function") return false;

        const cql = window.currentCqlFilterByLayer?.[layerName] ?? null;

        // Get current params
        const params = source.getParams ? { ...source.getParams() } : {};

        // Update / clear CQL_FILTER
        if (cql && String(cql).trim().length > 0) {
            params.CQL_FILTER = String(cql).trim();
        } else {
            params.CQL_FILTER = undefined;
        }

        // Force refresh of tiles
        if (bustCache) {
            params[cacheParam] = Date.now();
        }

        source.updateParams(params);
        olLayer.setVisible(true);
        return true;
    }

    if (type === "WFS") {
        const source = olLayer.getSource?.();
        if (!source) return false;

        // Clear current features and force reload on next render/extent load
        source.clear(true);

        // Trigger re-load by calling changed() (bbox loader will run when needed)
        source.changed();
        olLayer.setVisible(true);
        return true;
    }

    // WMTS/XYZ typically do not support server-side CQL refresh in the same way
    return false;
}

/**
 * Check if a layer is already registered.
 * @param {Object} params
 * @param {string} params.layerName
 * @param {string} params.serviceBaseUrl
 * @param {string} params.serviceType
 * @returns {boolean}
 */
export function hasLayer({ layerName, serviceBaseUrl, serviceType }) {
  const key = buildLayerKey({ type: serviceType, layerName, serviceBaseUrl });
  return layerRegistry.has(key);
}

/**
 * Optional: clear all registered layers from map.
 * @param {import("ol/Map").default} map
 */
export function clearAllLayers(map) {
  if (!map) throw new Error("Map is required");

  for (const layer of layerRegistry.values()) {
    map.removeLayer(layer);
  }
  layerRegistry.clear();
}
