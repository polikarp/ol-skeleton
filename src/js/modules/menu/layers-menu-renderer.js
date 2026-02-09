import {applyProxyIfNeeded} from '../map/wms-capabilities-loader';
import {extractLegendItems} from '../map/get-legend-json';
import { PROXY_PATH } from "../map/map-config";


/**
 * Build HTML for the layers menu from groups + parsed WMS layers.
 *
 * Expected inputs:
 * - bootstrap.groups: [{ key, title, collapsed_default, order_idx, ... }]
 * - groupsLayers: { [groupKey]: [{ name, title, desc, serviceId, serviceBaseUrl, serviceVersion, ... }] }
 *
 * Output structure (per group):
 * <li> (group header with collapse toggle)
 * <ul class="collapse ..."> (children)
 *   <li> (layer row with checkbox + label + optional filter icon)
 */
/*

/**
 * Render the layers selector menu using WMS layers grouped by logical group.
 * If showLegends === true, it renders the legend container right under each layer row,
 * and automatically shows it when the checkbox is checked.
 *
 * @param {Object} bootstrap
 * @param {Array}  bootstrap.groups
 * @param {Object} groupsLayers - { [groupKey]: [layer, layer, ...] }
 * @param {Object} options
 * @param {boolean} options.useProxy
 * @param {string} options.proxyPath
 * @param {boolean} options.showLegends
 * @param {number|null} options.legendScale
 */

let layersLegends = {};



export function renderLayersMenuFromWms(
    bootstrap,
    groupsLayers,
    { useProxy = false, proxyPath = PROXY_PATH, showLegends = true, legendScale = null } = {}
) {
    const $menu = $("#layersMenuSelector");
    $menu.empty();

    const groups = (bootstrap?.groups || [])
        .slice()
        .sort((a, b) => (a.order_idx ?? 9999) - (b.order_idx ?? 9999));

    const services = (bootstrap?.services || []);


    groups.forEach((group) => {
        const groupKey = group.key;
        const groupTitle = group.title || group.key;
        const isCollapsedDefault = !!group.collapsed_default;
        const serviceType = services.filter(s => s.group_id == group.id).map(s => s.type);
        const collapseId = `group_${String(groupKey).replace(/[^a-zA-Z0-9_-]/g, "_")}_layers`;
        const expanded = isCollapsedDefault ? "false" : "true";
        const collapseClass = isCollapsedDefault ? "collapse" : "collapse show";

        // Group header
        const groupHeaderHtml = `
            <li class="fw-bold mt-2">
                <a class="text-decoration-none toggle-arrow"
                   data-bs-toggle="collapse"
                   href="#${collapseId}"
                   role="button"
                   aria-expanded="${expanded}"
                   aria-controls="${collapseId}"
                   data-group-key="${escapeAttr(groupKey)}"
                   data-group-title="${escapeAttr(groupTitle)}"
                   data-service-id="${group.service_id ?? ""}">
                    ${escapeHtml(groupTitle)}
                </a>
            </li>
        `;

        const $groupUl = $(`
            <ul id="${collapseId}"
                class="${collapseClass} list-unstyled layerSelector"
                data-group-key="${escapeAttr(groupKey)}"
                data-service-id="${group.service_id ?? ""}"
                data-collapsed-default="${isCollapsedDefault ? "1" : "0"}">
            </ul>
        `);

        const layers = (groupsLayers?.[groupKey] || [])
            .slice()
            .sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));

        if (layers.length === 0) {
            $groupUl.append(`
                <li class="d-flex align-items-center mb-1 text-muted"
                    data-empty="true"
                    data-group-key="${escapeAttr(groupKey)}">
                    <span class="small">No layers</span>
                </li>
            `);
        } else {
            layers.forEach((layer) => {
                const layerName = layer.name;
                const layerTitle = layer.title || layer.name;
                const layerDesc = layer.desc || "";

                const safeId = `wms_${groupKey}_${layerName}`.replace(/[^a-zA-Z0-9_-]/g, "_");
                const inputId = `${safeId}_switch`;

                // Legend URL (render-time)
                let legendImgTag = "";
                if (showLegends) {
                    const legendUrlDirect = buildLegendGraphicUrl({
                        serviceBaseUrl: layer.serviceBaseUrl,
                        layerName: layerName,
                        version: layer.serviceVersion || "1.3.0",
                        style: null,
                        format: "image/png",
                        scale: legendScale,
                    });

                    const legendUrlDirectJson = buildLegendGraphicUrl({
                        serviceBaseUrl: layer.serviceBaseUrl,
                        layerName: layerName,
                        version: layer.serviceVersion || "1.3.0",
                        style: null,
                        format: "application/json",//"image/png",
                        scale: legendScale,
                    });


                    //const legendUrl = applyProxyIfNeeded(legendUrlDirect, useProxy, proxyPath);

                    const legendJson = applyProxyIfNeeded(legendUrlDirectJson, useProxy, proxyPath);

                    //Store in layersLegends object layers legends in json format to write with our html/css
                    loadLegendJsonPromise(
                            legendJson,
                            (legendItems) => {
                                layersLegends[layerName] = legendItems;
                            },
                            (err) => console.error(layerName + '   ' + err)
                        );


                    // Hidden by default; you can show/hide on checkbox change.
                    // We add data-legend-url to make toggling trivial later.
                    legendImgTag = `
                        <div class="wms-legend mt-1 ms-4"
                             data-layer="${escapeAttr(layerName)}"
                             data-service-base-url="${escapeAttr(layer.serviceBaseUrl)}"
                             data-legend-url="${escapeAttr(legendUrlDirect)}"
                             style="display:none;">
                            <img class="wms-legend-img"
                                 alt="Legend"
                                 src="${escapeAttr(legendUrlDirect)}"
                                 style="max-width: 100%; height:auto; display:block;">
                        </div>
                    `;
                }

                // NOTE: checkbox is NOT checked by default here.
                // If you have initial active layers, set checked based on your own state and legend will show.
                const checkedAttr = "";

                const layerRowHtml = `
                    <li class="d-flex flex-column mb-1"
                        data-layer="${escapeAttr(layerName)}"
                        data-layer-title="${escapeAttr(layerTitle)}"
                        data-layer-desc="${escapeAttr(layerDesc)}"
                        data-group-key="${escapeAttr(groupKey)}"
                        data-service-id="${escapeAttr(layer.serviceId)}"
                        data-service-base-url="${escapeAttr(layer.serviceBaseUrl)}"
                        data-service-version="${escapeAttr(layer.serviceVersion || "1.3.0")}">

                        <div class="d-flex align-items-center">
                            <input id="${inputId}"
                                   type="checkbox"
                                   role="switch"
                                   class="me-2 layerCheckbox"
                                   title="Add layer"
                                   ${checkedAttr}
                                   data-layer="${escapeAttr(layerName)}"
                                   data-layer-title="${escapeAttr(layerTitle)}"
                                   data-group-key="${escapeAttr(groupKey)}"
                                   data-service-id="${escapeAttr(layer.serviceId)}"
                                   data-service-base-url="${escapeAttr(layer.serviceBaseUrl)}"
                                   data-service-version="${escapeAttr(layer.serviceVersion || "1.3.0")}"
                                   data-service-type="${serviceType}">

                            <label for="${inputId}" class="mb-0 flex-grow-1"
                                   title="${escapeAttr(layerDesc)}">
                                ${escapeHtml(layerTitle)}
                            </label>

                            &nbsp;&nbsp;

                            <i class="fa-solid fa-filter icon-button d-none layerFilterBtn"
                               data-layer="${escapeAttr(layerName)}"
                               data-group-key="${escapeAttr(groupKey)}"
                               data-service-id="${escapeAttr(layer.serviceId)}"
                               data-service-base-url="${escapeAttr(layer.serviceBaseUrl)}"></i>
                        </div>

                        ${legendImgTag}
                    </li>
                `;

                $groupUl.append(layerRowHtml);
            });
        }

        $menu.append(groupHeaderHtml);
        $menu.append($groupUl);
    });

    // After rendering, auto-show legends for pre-checked layers (if any).
    if (showLegends) {
        $("#layersMenuSelector .layerCheckbox:checked").each(function () {
            const $row = $(this).closest("li");
            $row.find(".wms-legend").show();
        });
    }
}

function loadLegendJsonPromise(legendUrlDirectJson, onSuccess, onError) {
    fetch(legendUrlDirectJson, {
        headers: { "Accept": "application/json" }
    })
    .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
    })
    .then(json => onSuccess(extractLegendItems(json)))
    .catch(err => onError?.(err));
}

/**
 * Build a WMS GetLegendGraphic URL for a layer.
 * @param {Object} opts
 * @param {string} opts.serviceBaseUrl
 * @param {string} opts.layerName
 * @param {string} opts.version
 * @param {string} opts.format
 * @param {number|null} opts.scale
 * @returns {string}
 */
function buildLegendGraphicUrl({ serviceBaseUrl, layerName, version = "1.3.0", format = "image/png", scale = null }) {
    const params = new URLSearchParams();
    params.set("SERVICE", "WMS");
    params.set("REQUEST", "GetLegendGraphic");
    params.set("VERSION", version);
    params.set("FORMAT", format);
    params.set("LAYER", layerName);

    if (scale && Number.isFinite(scale)) {
        params.set("SCALE", String(scale));
    }

    return `${serviceBaseUrl}?${params.toString()}`;
}


/**
 * Basic escaping helpers for safe attribute/text injection.
 * These prevent broken HTML when Title/Abstract contain quotes or special chars.
 */
function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
    // Same as escapeHtml for attributes
    return escapeHtml(str);
}
