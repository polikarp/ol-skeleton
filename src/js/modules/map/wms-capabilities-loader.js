

import WMSCapabilities from "ol/format/WMSCapabilities";

import { PROXY_PATH } from "./map-config";

/**
 * Build GetCapabilities URL
 */
function buildGetCapabilitiesUrl(baseUrl, version) {
    return (
        baseUrl +
        `?service=WMS&request=GetCapabilities&version=${encodeURIComponent(
            version || "1.3.0"
        )}`
    );
}

/**
 * Apply proxy only if useProxy === true
 */
export function applyProxyIfNeeded(url, useProxy, proxyPath = "http://geoproxy.local/geoserver.php?url=") {
    if (useProxy) {
        const normalizedUrl = encodeURIComponent(decodeURIComponent(url));
        return proxyPath + normalizedUrl;
    }
    return url;
}

/**
 * Flatten nested WMS layers
 */
function flattenLayers(layerNode, acc = []) {
    if (!layerNode) return acc;

    if (layerNode.Name) {
        acc.push(layerNode);
    }

    if (Array.isArray(layerNode.Layer)) {
        layerNode.Layer.forEach((child) => flattenLayers(child, acc));
    }

    return acc;
}

/**
 * Load WMS capabilities for one service
 */
export async function loadWmsCapabilitiesForService(
    service,
    { useProxy = false, proxyPath = PROXY_PATH } = {}
) {
    const capsUrl = buildGetCapabilitiesUrl(
        service.base_url,
        service.version
    );

    const url = applyProxyIfNeeded(capsUrl, useProxy, proxyPath);

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `GetCapabilities failed (${response.status}) for ${service.base_url}`
        );
    }

    const text = await response.text();

    const parser = new WMSCapabilities();
    const capabilities = parser.read(text);

    const rootLayer = capabilities?.Capability?.Layer;
    const flatLayers = flattenLayers(rootLayer);

    return flatLayers.map((l) => ({
        name: l.Name,
        title: l.Title || l.Name,
        desc: l.Abstract || l.Name,
        crs: l.CRS || l.SRS || [],
        bbox: l.BoundingBox || [],
        styles: l.Style || [],
        serviceId: service.id,
        serviceName: service.name,
        serviceBaseUrl: service.base_url,
        serviceVersion: service.version || "1.3.0",
    }));
}

/**
 * Load WMS layers for all services in config
 */
export async function loadWmsLayersFromConfig(
    config,
    { useProxy = false, proxyPath = PROXY_PATH } = {}
) {
    const services = config.services || [];
    const groups = config.groups || [];

    const groupsByServiceId = {};
    groups.forEach((g) => {
        if (!groupsByServiceId[g.service_id]) {
            groupsByServiceId[g.service_id] = [];
        }
        groupsByServiceId[g.service_id].push(g);
    });

    const servicesLayers = {};
    const groupsLayers = {};

    groups.forEach((g) => {
        groupsLayers[g.key] = [];
    });

    for (const service of services) {
        try {
            const layers = await loadWmsCapabilitiesForService(service, {
                useProxy,
                proxyPath,
            });

            servicesLayers[service.id] = layers;

            (groupsByServiceId[service.id] || []).forEach((g) => {
                groupsLayers[g.key] =
                    groupsLayers[g.key].concat(layers);
            });
        } catch (e) {
            console.error("WMS capabilities error:", e);
            servicesLayers[service.id] = [];
        }
    }

    return { servicesLayers, groupsLayers };
}
