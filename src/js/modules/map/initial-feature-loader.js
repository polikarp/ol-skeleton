import { applyProxyIfNeeded } from "./wms-capabilities-loader";
import { buildWfsGetFeatureUrl } from "../../legacy/wfs-url-builder";
import { zoomToGeometryOnMap } from "../handlers/highlight-element";


/**
 * Loads an initial feature by layer configuration and feature ID.
 *
 * This function does NOT activate the layer.
 * The caller must activate the layer before calling this function.
 *
 * The loaded feature is highlighted and the map is optionally
 * fitted to its geometry.
 */
export async function loadInitialFeature({
    map,
    layerConfig,
    featureId,
    useProxy = false,
    proxyPath = null,
    fit = true
}) {

    if (!layerConfig || featureId == null) {
        return null;
    }

    const layerName = layerConfig.layer_name;
    const idField = layerConfig.id_field;

    if (!layerName) {
        throw new Error("Missing layer_name in layer configuration");
    }

    if (!idField) {
        throw new Error(`No id_field configured for layer: ${layerName}`);
    }

    const cqlFilter = `${idField} = ${featureId}`;

    const urlAux = buildWfsGetFeatureUrl({
        baseUrl: layerConfig.base_url,
        typeName: layerName,
        version: layerConfig.wfs_version || "2.0.0",
        cqlFilter,
        count: 1
    });

    const url = applyProxyIfNeeded(urlAux, useProxy, proxyPath);

    const fetchConfig = {
        method: "GET",
        headers: {
            Accept: "application/json"
        }
    };

    if (layerConfig.credentials === true) {
        fetchConfig.credentials = "include";
    }

    const response = await fetch(url, fetchConfig);

    if (!response.ok) {
        throw new Error(`Initial WFS request failed: HTTP ${response.status}`);
    }

    const geojson = await response.json();

    const feature = geojson?.features?.[0] ?? null;

    if (!feature) {
        console.warn(`Feature ${featureId} not found in layer ${layerName}`);
        return null;
    }

    if (feature.geometry) {

        const highlightKey =`${layerName}:${featureId}`;

        zoomToGeometryOnMap(
            feature.geometry,
            map,
            {
                key: highlightKey,
                fit,
                imageFillColor: '#006eff'
            }
        );
    }

    return feature;
}