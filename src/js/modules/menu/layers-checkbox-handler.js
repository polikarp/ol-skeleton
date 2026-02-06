// Checkbox handlers for toggling WMS layers.
// Requires: jQuery

import { layersInfo } from "../map/map-config";
import { addLayerToMap, removeLayerFromMap } from "../map/layers-on-off";

/**
 * Read WMS info from checkbox data attributes.
 * Required:
 *  - data-layer
 *  - data-service-base-url
 *
 * Optional:
 *  - data-service-version
 *  - data-layer-title
 *
 * @param {HTMLElement} checkboxEl
 * @returns {{layerName: string, serviceBaseUrl: string, version: string, title: string}}
 */
function readDataFromCheckbox(checkboxEl) {
    const $cb = $(checkboxEl);

    const layerName = String($cb.data("layer") || "").trim();
    const serviceBaseUrl = String($cb.data("service-base-url") || "").trim();
    const version = String($cb.data("service-version") || "1.3.0").trim();
    const title = String($cb.data("layer-title") || layerName).trim();
    const serviceType = String($cb.data("service-type") || "").trim();

    return { layerName, serviceBaseUrl, version, title, serviceType };
}

/**
 * Bind checkbox "change" event to toggle WMS layers.
 * Uses delegated events so it works with dynamically rendered menus.
 *
 * @param {import("ol/Map").default} map
 * @param {Object} opts
 * @param {string} opts.selector
 * @param {boolean} opts.removeOnUncheck
 * @param {string} opts.crossOrigin
 */
export function bindCheckboxToggles(
    map,
    { selector = ".layerCheckbox", removeOnUncheck = true, crossOrigin = "anonymous" } = {}
) {
    if (!map) throw new Error("Map is required");

    $(document).on("change", selector, function () {

        const layerInfo = readDataFromCheckbox(this);
        const layerName = layerInfo.layerName;
        const serviceBaseUrl = layerInfo.serviceBaseUrl;
        const $row = $(this).closest("li");

        if (!layerName || !serviceBaseUrl) {
            console.error("Missing data-layer or data-service-base-url on checkbox", this);
            $(this).prop("checked", false);
            return;
        }


        if ($(this).is(":checked")) {
            //layersInfo store all layers info
            layersInfo.set(layerInfo.layerName, layerInfo);
            addLayerToMap(map, layerName, {});
            $row.find(".wms-legend").first().show();
            $row.find(".layerFilterBtn").removeClass("d-none");
        } else {
            removeLayerFromMap(map, layerName, removeOnUncheck );
            $row.find(".wms-legend").first().hide();
            $row.find(".layerFilterBtn").addClass("d-none");
        }
    });
}
