import {applyProxyIfNeeded} from '../map/wms-capabilities-loader';
import {extractLegendItems} from '../map/get-legend-json';
import { layersInfo, PROXY_PATH } from "../map/map-config";


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



// export function renderLayersMenuFromWms(
//     bootstrap,
//     groupsLayers,
//     { useProxy = false, proxyPath = PROXY_PATH, showLegends = true, legendScale = null } = {}
// ) {
//     const $menu = $("#layersMenuSelector");
//     $menu.empty();

//     const groups = (bootstrap?.groups || [])
//         .slice()
//         .sort((a, b) => (a.order_idx ?? 9999) - (b.order_idx ?? 9999));

//     const services = (bootstrap?.services || []);


//     groups.forEach((group) => {
//         const groupKey = group.key;
//         const groupTitle = group.title || group.key;
//         const isCollapsedDefault = !!group.collapsed_default;
//         let serviceType = services.filter(s => s.group_id == group.id).map(s => s.type);
//         const collapseId = `group_${String(groupKey).replace(/[^a-zA-Z0-9_-]/g, "_")}_layers`;
//         const expanded = isCollapsedDefault ? "false" : "true";
//         const collapseClass = isCollapsedDefault ? "collapse" : "collapse show";

//         // Group header
//         const groupHeaderHtml = `
//             <li class="fw-bold mt-2">
//                 <a class="text-decoration-none toggle-arrow"
//                    data-bs-toggle="collapse"
//                    href="#${collapseId}"
//                    role="button"
//                    aria-expanded="${expanded}"
//                    aria-controls="${collapseId}"
//                    data-group-key="${escapeAttr(groupKey)}"
//                    data-group-title="${escapeAttr(groupTitle)}"
//                    data-service-id="${group.service_id ?? ""}">
//                     ${escapeHtml(groupTitle)}
//                 </a>
//             </li>
//         `;

//         const $groupUl = $(`
//             <ul id="${collapseId}"
//                 class="${collapseClass} list-unstyled layerSelector"
//                 data-group-key="${escapeAttr(groupKey)}"
//                 data-service-id="${group.service_id ?? ""}"
//                 data-collapsed-default="${isCollapsedDefault ? "1" : "0"}">
//             </ul>
//         `);

//         const layers = (groupsLayers?.[groupKey] || [])
//             .slice()
//             .sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));

//         if (layers.length === 0) {
//             $groupUl.append(`
//                 <li class="d-flex align-items-center mb-1 text-muted"
//                     data-empty="true"
//                     data-group-key="${escapeAttr(groupKey)}">
//                     <span class="small">No layers</span>
//                 </li>
//             `);
//         } else {
//             layers.forEach((layer) => {
//                 const layerName = layer.name || layer.layer_name;
//                 const title = layer.title || layer.name;
//                 const desc = layer.desc || layer.description ||  "";
//                 const serviceBaseUrl = layer.serviceBaseUrl || layer.base_url;
//                 const version = layer.serviceVersion || layer.options.version || "1.3.0";
//                 const format = layer.options?.format ?? "image/png";
//                 const tiled = layer.options?.tiled ?? true;
//                 if (!serviceType.length) {
//                     serviceType = layer.type;
//                 }
//                 //Store all layers info in this Map
//                 layersInfo.set(layerName, { layerName, title, desc, serviceBaseUrl, version, serviceType, format, tiled });

//                 const safeId = `wms_${groupKey}_${layerName}`.replace(/[^a-zA-Z0-9_-]/g, "_");
//                 const inputId = `${safeId}_switch`;

//                 // Legend URL (render-time)
//                 let legendImgTag = "";
//                 if (showLegends) {
//                     const legendUrlDirect = buildLegendGraphicUrl({
//                         serviceBaseUrl: serviceBaseUrl,
//                         layerName: layerName,
//                         version: version,
//                         style: null,
//                         format: format,
//                         scale: legendScale,
//                     });

//                     const legendUrlDirectJson = buildLegendGraphicUrl({
//                         serviceBaseUrl: serviceBaseUrl,
//                         layerName: layerName,
//                         version: version,
//                         style: null,
//                         format: "application/json",
//                         scale: legendScale,
//                     });


//                     //const legendUrl = applyProxyIfNeeded(legendUrlDirect, useProxy, proxyPath);

//                     const legendJson = applyProxyIfNeeded(legendUrlDirectJson, useProxy, proxyPath);

//                     //Store in layersLegends object layers legends in json format to write with our html/css
//                     loadLegendJsonPromise(
//                             legendJson,
//                             (legendItems) => {
//                                 layersLegends[layerName] = legendItems;
//                             },
//                             (err) => console.error(layerName + '   ' + err)
//                         );


//                     // Hidden by default; you can show/hide on checkbox change.
//                     // We add data-legend-url to make toggling trivial later.
//                     legendImgTag = `
//                         <div class="wms-legend mt-1 ms-4"
//                              data-layer="${escapeAttr(layerName)}"
//                              data-service-base-url="${escapeAttr(serviceBaseUrl)}"
//                              data-legend-url="${escapeAttr(legendUrlDirect)}"
//                              style="display:none;">
//                             <img class="wms-legend-img"
//                                  alt="Legend"
//                                  src="${escapeAttr(legendUrlDirect)}"
//                                  style="max-width: 100%; height:auto; display:block;">
//                         </div>
//                     `;
//                 }

//                 // NOTE: checkbox is NOT checked by default here.
//                 // If you have initial active layers, set checked based on your own state and legend will show.
//                 const checkedAttr = "";

//                 const layerRowHtml = `
//                     <li class="d-flex flex-column mb-1" data-layer="${escapeAttr(layerName)}">
//                         <div class="d-flex align-items-center">
//                             <input id="${inputId}"
//                                    type="checkbox"
//                                    role="switch"
//                                    class="me-2 layerCheckbox"
//                                    title="Add layer"
//                                    ${checkedAttr}
//                                    data-layer="${escapeAttr(layerName)}">

//                             <label for="${inputId}" class="mb-0 flex-grow-1" title="${escapeAttr(desc)}">
//                                 ${escapeHtml(title)}
//                             </label>

//                             &nbsp;&nbsp;

//                             <i class="fa-solid fa-filter icon-button d-none layerFilterBtn"
//                                data-layer="${escapeAttr(layerName)}">
//                             </i>
//                         </div>

//                         ${legendImgTag}
//                     </li>
//                 `;

//                 $groupUl.append(layerRowHtml);
//             });
//         }

//         $menu.append(groupHeaderHtml);
//         $menu.append($groupUl);
//     });

//     // After rendering, auto-show legends for pre-checked layers (if any).
//     if (showLegends) {
//         $("#layersMenuSelector .layerCheckbox:checked").each(function () {
//             const $row = $(this).closest("li");
//             $row.find(".wms-legend").show();
//         });
//     }
// }

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

    const services = bootstrap?.services || [];

    const groupsByParentId = new Map();

    groups.forEach(group => {
        const parentId = group.parent_id ?? null;

        if (!groupsByParentId.has(parentId)) {
            groupsByParentId.set(parentId, []);
        }

        groupsByParentId.get(parentId).push(group);
    });

    function normalizeGroupKey(group) {
        return String(group.key || `group_${group.id}`);
    }

    function getSafeId(value) {
        return String(value).replace(/[^a-zA-Z0-9_-]/g, "_");
    }

    function getServiceTypeForGroup(group, layer) {
        const groupServiceTypes = services
            .filter(service => String(service.group_id) === String(group.id))
            .map(service => service.type);

        if (groupServiceTypes.length === 1) {
            return groupServiceTypes[0];
        }

        if (groupServiceTypes.length > 1) {
            return groupServiceTypes;
        }

        return layer?.type || layer?.layer_type || "wms";
    }

    function renderLayer(group, layer) {
        const groupKey = normalizeGroupKey(group);

        const layerName = layer.name || layer.layer_name;
        const title = layer.title || layer.name || layer.layer_name;
        const desc = layer.desc || layer.description || "";
        const serviceBaseUrl = layer.serviceBaseUrl || layer.base_url;
        const version = layer.serviceVersion || layer.options?.version || "1.3.0";
        const format = layer.options?.format ?? "image/png";
        const tiled = layer.options?.tiled ?? true;
        const serviceType = getServiceTypeForGroup(group, layer);

        layersInfo.set(layerName, {
            layerName,
            title,
            desc,
            serviceBaseUrl,
            version,
            serviceType,
            format,
            tiled,
            groupId: group.id,
            groupKey
        });

        const safeId = getSafeId(`wms_${groupKey}_${layerName}`);
        const inputId = `${safeId}_switch`;

        let legendImgTag = "";

        if (showLegends) {
            const legendUrlDirect = buildLegendGraphicUrl({
                serviceBaseUrl,
                layerName,
                version,
                style: null,
                format,
                scale: legendScale
            });

            

            // const legendUrlDirectJson = buildLegendGraphicUrl({
            //     serviceBaseUrl,
            //     layerName,
            //     version,
            //     style: null,
            //     format: "application/json",
            //     scale: legendScale
            // });

            // const legendJson = applyProxyIfNeeded(legendUrlDirectJson, useProxy, proxyPath);

            // loadLegendJsonPromise(
            //     legendJson,
            //     (legendItems) => {
            //         layersLegends[layerName] = legendItems;
            //     },
            //     (err) => console.error(`${layerName} ${err}`)
            // );

            
            legendImgTag = `
                <div class="wms-legend mt-1 ms-4"
                    data-layer="${escapeAttr(layerName)}"
                    data-service-base-url="${escapeAttr(serviceBaseUrl)}"
                    data-legend-url="${escapeAttr(legendUrlDirect)}"
                    style="display:none;">
                    <img class="wms-legend-img"
                        alt="Legend"
                        src="${escapeAttr(legendUrlDirect)}"
                        onerror="this.closest('.wms-legend')?.remove();"
                        style="max-width: 100%; height:auto; display:block;">
                </div>
            `;
            
        }

        return `
            <li class="d-flex flex-column mb-1" data-layer="${escapeAttr(layerName)}">
                <div class="d-flex align-items-center h-30">
                    <input id="${inputId}"
                           type="checkbox"
                           role="switch"
                           class="me-2 layerCheckbox"
                           title="Add layer"
                           data-layer="${escapeAttr(layerName)}">

                    <label for="${inputId}" class="mb-0 flex-grow-1" title="${escapeAttr(desc)}">
                        ${escapeHtml(title)}
                    </label>

                    &nbsp;&nbsp;

                    <i class="fa-solid fa-filter icon-button d-none layerFilterBtn"
                       data-layer="${escapeAttr(layerName)}">
                    </i>
                </div>

                ${legendImgTag}
            </li>
        `;
    }

    function renderGroup(group, level = 0) {
        const groupKey = normalizeGroupKey(group);
        const groupTitle = group.title || group.key;
        const isCollapsedDefault = !!group.collapsed_default;

        const childrenGroups = (groupsByParentId.get(group.id) || [])
            .slice()
            .sort((a, b) => (a.order_idx ?? 9999) - (b.order_idx ?? 9999));

        const layers = (groupsLayers?.[groupKey] || [])
            .slice()
            .sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));

        const collapseId = `group_${getSafeId(groupKey)}_layers`;
        const expanded = isCollapsedDefault ? "false" : "true";
        const collapseClass = isCollapsedDefault ? "collapse" : "collapse show";
        const marginClass = level > 0 ? "ms-3" : "";

        const $wrapper = $(`
            <li class="layer-group-wrapper ${marginClass}"
                data-group-id="${escapeAttr(group.id)}"
                data-group-key="${escapeAttr(groupKey)}"
                data-parent-id="${escapeAttr(group.parent_id ?? "")}">
                <div class="fw-bold mt-2">
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
                </div>

                <ul id="${collapseId}"
                    class="${collapseClass} list-unstyled layerSelector"
                    data-group-key="${escapeAttr(groupKey)}"
                    data-service-id="${group.service_id ?? ""}"
                    data-collapsed-default="${isCollapsedDefault ? "1" : "0"}">
                </ul>
            </li>
        `);

        const $groupUl = $wrapper.find(`#${collapseId}`);

        childrenGroups.forEach(childGroup => {
            $groupUl.append(renderGroup(childGroup, level + 1));
        });

        layers.forEach(layer => {
            $groupUl.append(renderLayer(group, layer));
        });

        if (childrenGroups.length === 0 && layers.length === 0) {
            $groupUl.append(`
                <li class="d-flex align-items-center mb-1 text-muted"
                    data-empty="true"
                    data-group-key="${escapeAttr(groupKey)}">
                    <span class="small">No layers</span>
                </li>
            `);
        }

        return $wrapper;
    }

    const rootGroups = groupsByParentId.get(null) || [];

    rootGroups.forEach(group => {
        $menu.append(renderGroup(group, 0));
    });

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
