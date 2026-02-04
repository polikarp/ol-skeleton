// layers.js
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

import { layerRegistry } from "./map-config";

/**
 * Build a unique key for any protocol/layer.
 * Using service.id is recommended to avoid collisions between services.
 * @param {Object} params
 * @param {number|string} params.serviceId
 * @param {string} params.type
 * @param {string} params.layerName
 * @returns {string}
 */
function buildLayerKey({ serviceId, type, layerName }) {
  return `${serviceId}|${String(type).toUpperCase()}|${layerName}`;
}

/**
 * Normalize protocol type string.
 * @param {string} type
 * @returns {string}
 */
function normalizeType(type) {
  return String(type || "").trim().toUpperCase();
}

/**
 * Create an OL layer based on service.type.
 * Supported: WMS, WMTS, WFS, XYZ
 *
 * @param {Object} params
 * @param {Object} params.service Row from gis_service
 * @param {string} params.layerName
 * @param {string|null} params.title
 * @param {string} [params.crossOrigin]
 * @returns {import("ol/layer/Base").default}
 */
export function createOlLayerFromService({
  service,
  layerName,
  title = null,
  crossOrigin = "anonymous",
}) {
  if (!service) throw new Error("service is required");
  if (!layerName) throw new Error("layerName is required");

  const type = normalizeType(service.type);
  const baseUrl = service.base_url;
  const version = service.version || undefined;
  const options = service.options || {};

  // Store some metadata on the layer for later refresh/remove logic
  const commonMeta = {
    serviceId: service.id,
    serviceType: type,
    serviceBaseUrl: baseUrl,
    serviceVersion: version,
    layerName,
    title: title || layerName,
  };

  if (type === "WMS") {
    const source = new TileWMS({
      url: baseUrl,
      crossOrigin,
      params: {
        SERVICE: "WMS",
        VERSION: version || "1.3.0",
        REQUEST: "GetMap",
        LAYERS: layerName,
        TILED: true,
        TRANSPARENT: true,
        FORMAT: options.format || "image/png",
      },
    });

    const layer = new TileLayer({ source, visible: true });

    Object.entries(commonMeta).forEach(([k, v]) => layer.set(k, v));
    layer.set("wfsEnabled", options.wfsEnabled ?? true);
    layer.set("wfsVersion", options.wfsVersion || "2.0.0");
    return layer;
  }

  if (type === "WMTS") {
    /**
     * WMTS needs tileGrid configuration.
     * You can store all needed WMTS parameters in gis_service.options.
     *
     * Expected options example:
     * {
     *   "layer": "workspace:layer",
     *   "matrixSet": "EPSG:3857",
     *   "format": "image/png",
     *   "style": "default",
     *   "projection": "EPSG:3857",
     *   "origin": [ -20037508.3428, 20037508.3428 ],
     *   "resolutions": [ ... ],
     *   "matrixIds": [ ... ]
     * }
     */
    const projection = getProjection(options.projection || "EPSG:3857");
    const tileGrid = new WMTSTileGrid({
      origin: options.origin,
      resolutions: options.resolutions,
      matrixIds: options.matrixIds,
    });

    const source = new WMTS({
      url: baseUrl,
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

  if (type === "WFS") {
    /**
     * WFS is typically loaded as vector features.
     * We use bbox strategy for performance, and rebuild the URL with CQL if present.
     *
     * Expected options example:
     * {
     *   "typeName": "workspace:layer",
     *   "srsName": "EPSG:25830",
     *   "outputFormat": "application/json",
     *   "maxFeatures": 5000
     * }
     */
    const srsName = options.srsName || "EPSG:3857";
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

        const sep = baseUrl.includes("?") ? "&" : "?";
        let url =
          `${baseUrl}${sep}` +
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

    const layer = new VectorLayer({
      source,
      visible: true,
    });

    Object.entries(commonMeta).forEach(([k, v]) => layer.set(k, v));
    layer.set("wfsTypeName", typeName);
    layer.set("wfsSrsName", srsName);
    return layer;
  }

  if (type === "XYZ") {
    /**
     * XYZ is useful for external tiles (OSM, Mapbox-like, custom tile server).
     * Expected options example:
     * { "urlTemplate": "https://tile.server/{z}/{x}/{y}.png", "maxZoom": 19 }
     */
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
 * Add layer to map (or show if already exists).
 * @param {import("ol/Map").default} map
 * @param {Object} params
 * @param {Object} params.service
 * @param {string} params.layerName
 * @param {string|null} params.title
 * @returns {import("ol/layer/Base").default}
 */
export function addLayerToMap(map, { service, layerName, title = null }) {
  if (!map) throw new Error("Map is required");

  const type = normalizeType(service.type);
  const key = buildLayerKey({ serviceId: service.id, type, layerName });

  if (layerRegistry.has(key)) {
    const existing = layerRegistry.get(key);
    existing.setVisible(true);
    return existing;
  }

  const olLayer = createOlLayerFromService({ service, layerName, title });
  map.addLayer(olLayer);
  layerRegistry.set(key, olLayer);
  return olLayer;
}

/**
 * Remove/hide layer from map.
 * @param {import("ol/Map").default} map
 * @param {Object} params
 * @param {Object} params.service
 * @param {string} params.layerName
 * @param {boolean} [params.remove]
 */
export function removeLayerFromMap(map, { service, layerName, remove = true }) {
  if (!map) throw new Error("Map is required");

  const type = normalizeType(service.type);
  const key = buildLayerKey({ serviceId: service.id, type, layerName });
  const olLayer = layerRegistry.get(key);

  if (!olLayer) return;

  if (remove) {
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
 * @param {Object} params
 * @param {Object} params.service
 * @param {string} params.layerName
 * @param {boolean} [params.bustCache]
 * @param {string} [params.cacheParam]
 * @returns {boolean}
 */
export function refreshLayer({
  service,
  layerName,
  bustCache = true,
  cacheParam = "_t",
}) {
  const type = normalizeType(service.type);
  const key = buildLayerKey({ serviceId: service.id, type, layerName });
  const olLayer = layerRegistry.get(key);
  if (!olLayer) return false;

  if (type === "WMS") {
    const source = olLayer.getSource?.();
    if (!source || typeof source.updateParams !== "function") return false;

    const cql = window.currentCqlFilterByLayer?.[layerName] ?? null;
    const params = source.getParams ? { ...source.getParams() } : {};

    if (cql && String(cql).trim().length > 0) {
      params.CQL_FILTER = String(cql).trim();
    } else {
      params.CQL_FILTER = undefined;
    }

    if (bustCache) params[cacheParam] = Date.now();
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

  // WMTS/XYZ typically don't support per-layer CQL filtering on the server side
  // You can implement cache-busting by changing the URL template/params if needed.
  return false;
}
