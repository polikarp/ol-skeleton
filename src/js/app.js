// import $ from 'jquery';
// window.bootstrap = bootstrap;
// window.$ = window.jQuery = $;
// import './bootstrap';
// import * as bootstrap from 'bootstrap';

/**
 * Application entry point
 * This file bootstraps vendor libraries and the GIS app
 */

// ----------------------------------------------------
// jQuery (make it global for plugins and legacy code)
// ----------------------------------------------------
import jQuery from "jquery";
window.$ = window.jQuery = jQuery;

// ----------------------------------------------------
// Bootstrap 5 (CSS + JS bundle with Popper)
// ----------------------------------------------------
import "bootstrap/dist/css/bootstrap.min.css";
import * as bootstrap from "bootstrap"; 
window.bootstrap = bootstrap;

// ----------------------------------------------------
// Material Dashboard (after Bootstrap)
// ----------------------------------------------------
import "../css/material-dashboard.css";
import "../js/material-dashboard.js";

// ----------------------------------------------------
// Application CSS (includes FontAwesome, jQuery UI, etc.)
// ----------------------------------------------------
import "../css/app.css";


import { initOpenLayersMap } from './modules/map/openlayers-map';
import { registerGisBottomMenuTools, registerGisLeftMenu } from './modules/menu/gis-menus.js';
import { enableMouseCoordinates } from './modules/map/mouse-coordinates';
import { initBaseMapMenu } from "./modules/map/base-map-menu";
import { loadLayers } from './modules/map/layers';
import { loadLayersFromConfig } from "./modules/map/wms-capabilities-loader";
import { renderLayersMenuFromWms } from "./modules/menu/layers-menu-renderer";
import { bindCheckboxToggles } from "./modules/menu/layers-checkbox-handler";
import { addMapCopyright } from "././modules/menu/copyright-tooltip";
import { initAddressSearchWfs } from "./modules/map/toponimic-search";
import { createSingleClickDispatcher } from "./modules/map/map-singleclick-dispatcher";
import { createHybridIdentifyHandler } from "./modules/handlers/get-element-info.js";
import { layerRegistry, PROXY_PATH } from "./modules/map/map-config";

import { openGfiPanel, closeGfiPanel, setGfiPanelLoading } from "./modules/panels/gfi-panel-state";
import { renderGfiRightPanel } from "./modules/panels/gfi-panel";
import { initHighlight, onGeomHover, onGeomOut, zoomToGeometryFromGeoJson } from "./modules/handlers/highlight-element.js";
import { adaptHybridResultsToPanel, hasAnyPanelContent } from "./modules/panels/gfi-results-adapter";

import { refreshLayer } from "./modules/map/layers-on-off";
import {applyProxyIfNeeded} from "./modules/map/wms-capabilities-loader";
import {initLayerFiltersManager} from "./modules/filters/layers-filter-manager"

import { createWfsLayerQueryService } from "./modules/map/wfs-layer-query-service";
import { createSpatialQueryTool } from "./modules/map/spatial-query-tool";

import LAYERS_CONFIG from "./data/layersConfig.js";

const MAP_CRS = "EPSG:25830";
const WFS_CRS = "EPSG:4326";
const SRID = 25830;
const USE_PROXY = import.meta.env.DEV;
const GEOM_PROP = "geom";
const SEARCH_SERVICE = "wfs";

const baseMapLayers = LAYERS_CONFIG.base_layers.map(layer => layer.layer_name);


let selectedBaseLayer = LAYERS_CONFIG.base_layers.find(layer => layer.visible_default)?.layer_name;


window.MAP_CLICK_BLOCKED = false;

$(function () {
    $("#iconSidebar").on("click", function () {
        if ($('#sidenav-main').is(":hidden")) {
            $('#sidenav-main').show('fast');
        } else {
            $('#sidenav-main').hide('fast');
        }
    });

    $("#iconSidebarClose").on("click", function () {
        $('#sidenav-main').hide('fast');
    });

});

//Load wms services from DDBB and generate menus of those layers in Layers menu
(async () => {
    try {

        const { groups, services, layers } = LAYERS_CONFIG;

        console.log("Groups:", groups);
        console.log("Services:", services);
        console.log("Layers:", layers);

        const bootstrap = {groups, services, layers};

        const { servicesLayers, groupsLayers, customLayers } =
            await loadLayersFromConfig(
                {
                    groups: bootstrap.groups,
                    services: bootstrap.services,
                    layers: bootstrap.layers
                },
                {
                    useProxy: USE_PROXY,
                    proxyPath: PROXY_PATH,
                }
            );

         renderLayersMenuFromWms(bootstrap, groupsLayers, {
                    useProxy: USE_PROXY,
                    proxyPath: PROXY_PATH,
                });

        Object.entries(servicesLayers).forEach(([serviceUrl, layers]) => {
            console.log(
                'Service:',
                serviceUrl,
                layers.map(l => ({
                name: l.name,
                title: l.title,
                serviceBaseUrl: l.serviceBaseUrl
                }))
            );
        });


        console.log("WMS layers by group:", groupsLayers);
        console.log("Custom layers:", customLayers);

        window.WMS_LAYERS_BY_SERVICE = servicesLayers;
        window.WMS_LAYERS_BY_GROUP = groupsLayers;
        window.CUSTOM_LAYERS = customLayers;

    } catch (err) {
        console.error("Error loading layers bootstrap:", err);
    }
})();


let map, queryService, spatialDrawTool;


document.addEventListener('DOMContentLoaded', () => {
    const mapa = initOpenLayersMap('map');
    map = mapa.map;
    //const useProxy = import.meta.env.VITE_APP_ENV === 'local';
    registerGisBottomMenuTools(mapa.map, {useProxy:USE_PROXY});
    initBaseMapMenu({
        layers: baseMapLayers,
        selectedLayer: selectedBaseLayer,
        containerSelector: "#baseMapMenuContent",
        onSelect: (layerName) => {}
    });
    registerGisLeftMenu(mapa.map);
    enableMouseCoordinates(mapa.map, '#mouse-coordinates');
    bindCheckboxToggles(mapa.map, {selector: ".layerCheckbox", removeOnUncheck: true});

    initHighlight(mapa.map, {
        dataProjection: MAP_CRS,
        zIndex: 9999
    });

    // ---- Query service ----
    queryService = createWfsLayerQueryService({
        layerRegistry,
        useProxy: USE_PROXY,
        proxyPath: PROXY_PATH,
        getCqlFilter: ({ layer }) => {
            return window.currentCqlFilterByLayer?.[layer.get("layerName")] || null;
        },
        geomPropName: GEOM_PROP,
        srid: SRID,
        count: 5000,
    });


    // ---- Draw tool (search by drawn polygon) ----
    spatialDrawTool = createSpatialQueryTool({
        map,
        queryService,
        showGfiLoading,
        drawMode: "Polygon",
        notify: (msg) => alert(msg),
        onResults: (resp) => {
                writeResultsOnGFIPanel(SEARCH_SERVICE, resp.results);
        },
    });

    //Single click events dispatcher
    const dispatcher = createSingleClickDispatcher(mapa.map);
    dispatcher.register(
        createHybridIdentifyHandler({
            layerRegistry,
            useProxy:USE_PROXY,
            proxyPath: PROXY_PATH,
            showGfiLoading,
            spatialDrawTool,
            getCqlFilter: ({ layer }) => {
                return window.currentCqlFilterByLayer?.[layer.get("layerName")] || null;
            },

            // WMS
            hitTolerance: 10,
            infoFormat: "application/json",

            // WFS
            toleranceMeters: 25,
            mapCrs: MAP_CRS,
            wfsCrs: WFS_CRS,
            count: 50,

            notify: (msg) => console.log(msg),

            onResults: ({ mode, results }) => {
                writeResultsOnGFIPanel(mode, results);
            },
        }),
        { id: "identify-hybrid", order: 100 }
    );

    // mapa.map.on("singleclick", () => {
    //     showGfiLoading();
    //     openGfiPanel();
    // });

    initLayerFiltersManager({
        map,
        refreshLayer,
        getWfsDescribeUrl
    });



    clickHandlers();

    addMapCopyright({mapSelector: "#map", year: window.APP_YEAR, version: window.APP_VERSION,});
    initAddressSearchWfs({map: mapa.map, useProxy:USE_PROXY, proxyPath: PROXY_PATH});

});


/**
 * Helpers functions
 */

function clickHandlers(){

    //Only for mobile resolution
    $('#toggleMenuBtn').on("click", function () {
        $('#menuButtons').toggleClass('show');
    });

    /**
     * Close info feature window
     */
    $("#gfiPanelClose").on("click", function () {
        closeGfiPanel();
        onGeomOut({});
    });

    /**
     * Layers search on left menu
     */
    $(document).off("keyup.layersSearch", "#layersSearchInput");
    $(document).off("keyup.layersSearch", "#layersSearchInput");
    $(document).on("keyup.layersSearch", "#layersSearchInput", function () {
        const q = ($(this).val() || "").toLowerCase().trim();
        const active = q.length >= 3;

        // 1) Filter layer rows by text (ONLY if active)
        $("#layersMenuSelector li[data-layer]").each(function () {
            if (!active) {
                $(this).removeClass("d-none");
                return;
            }

            const txt = $(this).text().toLowerCase();
            $(this).toggleClass("d-none", !txt.includes(q));
        });

        // 2) Group handling using only classes (NO .show()/.hide() on collapse elements)
        $("#layersMenuSelector ul.layerSelector").each(function () {
            const $groupUl = $(this);
            const groupKey = $groupUl.data("group-key");

            const $headerA = $("#layersMenuSelector a.toggle-arrow[data-group-key='" + groupKey + "']");
            const $headerLi = $headerA.closest("li");

            const hasLayers = $groupUl.find("li[data-layer]").length > 0;
            const visibleCount = $groupUl.find("li[data-layer]:not(.d-none)").length;

            // Placeholder "No layers"
            const $emptyRow = $groupUl.find("li[data-empty='true']");

            if (!active) {
                // --- SEARCH OFF: restore original state (collapsed_default) ---
                $headerLi.removeClass("d-none");
                $groupUl.removeClass("d-none");

                if ($emptyRow.length) {
                    $emptyRow.removeClass("d-none");
                }

                const collapsedDefault = String($groupUl.data("collapsed-default") || "0") === "1";

                // Keep 'collapse' class always, only toggle 'show'
                $groupUl.addClass("collapse");

                if (collapsedDefault) {
                    $groupUl.removeClass("show");
                    $headerA.attr("aria-expanded", "false");
                } else {
                    $groupUl.addClass("show");
                    $headerA.attr("aria-expanded", "true");
                }

                return;
            }

            // --- SEARCH ON (>=3): show only groups with matches ---
            if ($emptyRow.length) {
                $emptyRow.addClass("d-none");
            }

            const showGroup = hasLayers && visibleCount > 0;

            $headerLi.toggleClass("d-none", !showGroup);
            $groupUl.toggleClass("d-none", !showGroup);

            if (!showGroup) return;

            // Expand groups to reveal matches (but keep collapse class)
            $groupUl.addClass("collapse show");
            $headerA.attr("aria-expanded", "true");
        });
    });

    $(document).off("keydown.layersSearch", "#layersSearchInput");
    $(document).on("keydown.layersSearch", "#layersSearchInput", function (e) {
        if (e.key === "Escape") {
            $(this).val("").trigger("keyup");
        }
    });

    // Focus search input when WMS menu becomes visible
    $(document).on("mouseenter", "#wms-menu", function () {
        const $input = $("#layersSearchInput");
        if ($input.length) {
            $input.trigger("focus");
        }
    });

    // Draw polygon and query
    $("#btnSpatialDraw").on("click", function () {
        spatialDrawTool.activate();
    });

    // Cancel draw tool
    $("#btnSpatialDrawCancel").on("click", function () {
        spatialDrawTool.deactivate();
    });

    // Query what is visible on screen (viewport)
    $("#btnSpatialViewport").on("click", async function () {
        try {
            spatialDrawTool.deactivate();
            const extent = map.getView().calculateExtent(map.getSize());
            openGfiPanel();
            showGfiLoading();
            const resp = await queryService.query({ extentMap: extent, context: { mode: "viewport" } });

            writeResultsOnGFIPanel(SEARCH_SERVICE, resp.results);
            //console.log("Viewport query results:", resp);
        } catch (e) {
            console.error(e);
            alert(e?.message || "Viewport query error");
        }
    });

    $(".closeMenu").on("click", function () {
        const targetId = $(this).data("target");
        $("#" + targetId).hide();
    });


}

/**
 * Write results in GFI Panel
 * @param {} mode
 * @param {*} results
 * @returns
 */
function writeResultsOnGFIPanel(mode, results){
    hideGfiLoading();
    const panelResults = adaptHybridResultsToPanel(mode, results);

    if (!hasAnyPanelContent(panelResults)) {
        $("#gfiPanelBody").html(`<div class="text-muted small">No identify results.</div>`);
        openGfiPanel();
        return;
    }

    renderGfiRightPanel(
        {
            results: panelResults,
            containerId: "#gfiPanelBody",
            getCqlFilter: ({ layerTitle}) => {
                return window.currentCqlFilterByLayer?.[layerTitle] || null;
            },
            onGeomHover,
            onGeomOut,
            zoomToGeometryFromGeoJson
        });
    openGfiPanel();
}



// Optional: build DescribeFeatureType URL (if you need proxy or custom routing)
function getWfsDescribeUrl(layerName, $layerLi) {
    const serviceBaseUrl = String($layerLi.data("service-base-url") || "");
    let wfsBaseUrl = String($layerLi.data("wfs-base-url") || "");

    // If no explicit WFS base URL, derive it from serviceBaseUrl
    if (!wfsBaseUrl) {
        wfsBaseUrl = serviceBaseUrl;
        wfsBaseUrl = wfsBaseUrl.replace(/\/wms\/?$/i, "/ows");
    }

    const params = new URLSearchParams({
        service: "WFS",
        version: "1.1.0",
        request: "DescribeFeatureType",
        typeName: layerName
        // Do NOT set outputFormat=application/xml (GeoServer rejects it here)
        // outputFormat: "XMLSCHEMA" // optional if you want
    });

    
    return applyProxyIfNeeded(`${wfsBaseUrl}?${params.toString()}`, USE_PROXY, PROXY_PATH);
}


function showGfiLoading() {
    $("#gfiPanelBody").empty();
    $("#gfiLoading").removeClass("d-none");
}

function hideGfiLoading() {
    $("#gfiLoading").addClass("d-none");
}




