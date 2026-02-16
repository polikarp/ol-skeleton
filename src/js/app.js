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

import { initOpenLayersMap } from "./modules/map/openlayers-map";
import { registerGisBottomMenuTools, registerGisLeftMenu } from "./modules/menu/gis-menus.js";
import { enableMouseCoordinates } from "./modules/map/mouse-coordinates";
import { initBaseMapMenu } from "./modules/map/base-map-menu";
import { loadLayersFromConfig, applyProxyIfNeeded } from "./modules/map/wms-capabilities-loader";
import { renderLayersMenuFromWms } from "./modules/menu/layers-menu-renderer";
import { bindCheckboxToggles } from "./modules/menu/layers-checkbox-handler";
import { addMapCopyright } from "./modules/menu/copyright-tooltip";
import { initAddressSearchWfs } from "./modules/map/toponimic-search";
import { createSingleClickDispatcher } from "./modules/map/map-singleclick-dispatcher";
import { createHybridIdentifyHandler } from "./modules/handlers/get-element-info.js";
import { layerRegistry, PROXY_PATH } from "./modules/map/map-config";

import { closeGfiPanel } from "./modules/panels/gfi-panel-state";
import { renderGfiRightPanel } from "./modules/panels/gfi-panel";
import { initHighlight, onGeomHover, onGeomOut, zoomToGeometryFromGeoJson } from "./modules/handlers/highlight-element.js";
import { adaptHybridResultsToPanel, hasAnyPanelContent } from "./modules/panels/gfi-results-adapter";

import { refreshLayer } from "./modules/map/layers-on-off";
import { initLayerFiltersManager } from "./modules/filters/layers-filter-manager";

import { createWfsLayerQueryService } from "./modules/map/wfs-layer-query-service";
import { createSpatialQueryTool } from "./modules/map/spatial-query-tool";

const MAP_CRS = "EPSG:25830";
const WFS_CRS = "EPSG:4326";
const SRID = 25830;
const USE_PROXY = false; // import.meta.env.DEV;
const GEOM_PROP = "geom";
const SEARCH_SERVICE = "wfs";

window.MAP_CLICK_BLOCKED = false;

let map, queryService, spatialDrawTool;
let LAYERS_CONFIG;
let baseMapLayers = [];
let selectedBaseLayer = null;

/**
 * Load runtime layers configuration from public/data.
 * This keeps config editable without rebuilding.
 */
async function loadLayersConfig() {
  const url = import.meta.env.BASE_URL + "data/layersConfig.json";
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error(`Failed to load layersConfig.json (HTTP ${resp.status}) ${url}`);
  return await resp.json();
}

/**
 * Read URL params and build the bootstrap object (groups/services/layers).
 */
function readBootstrapFromUrlConfig() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  if (!type) {
    console.warn('Missing URL parameter "type".');
    return null;
  }

  if (!LAYERS_CONFIG || !LAYERS_CONFIG[type]) {
    console.warn(`No config entry for type="${type}".`);
    return null;
  }

  const { groups, services, layers } = LAYERS_CONFIG[type];
  return { type, groups, services, layers };
}

/**
 * Load WMS capabilities, build groups and menus, and expose globals used by other modules.
 */
async function bootstrapLayersFromConfig() {
  const bootstrapData = readBootstrapFromUrlConfig();
  if (!bootstrapData) return;

  const { groups, services, layers } = bootstrapData;

  const { servicesLayers, groupsLayers, customLayers } = await loadLayersFromConfig(
    { groups, services, layers },
    { useProxy: USE_PROXY, proxyPath: PROXY_PATH }
  );

  renderLayersMenuFromWms({ groups, services, layers }, groupsLayers, {
    useProxy: USE_PROXY,
    proxyPath: PROXY_PATH,
  });

  window.WMS_LAYERS_BY_SERVICE = servicesLayers;
  window.WMS_LAYERS_BY_GROUP = groupsLayers;
  window.CUSTOM_LAYERS = customLayers;
}

/**
 * Initialize UI click handlers that do not require async bootstrapping.
 */
function bindStaticUiHandlers() {
  // Sidebar toggles
  $(function () {
    $("#iconSidebar").on("click", function () {
      if ($("#sidenav-main").is(":hidden")) {
        $("#sidenav-main").show("fast");
      } else {
        $("#sidenav-main").hide("fast");
      }
    });

    $("#iconSidebarClose").on("click", function () {
      $("#sidenav-main").hide("fast");
    });
  });

  // Close info panel
  $("#gfiPanelClose").on("click", function () {
    closeGfiPanel();
    onGeomOut({});
  });
}

/**
 * Main app bootstrap (single entrypoint).
 * Ensures deterministic order and avoids missing DOMContentLoaded.
 */
async function initApp() {
  // 1) Load runtime config first
  LAYERS_CONFIG = await loadLayersConfig();

  // Base layers config computed once
  baseMapLayers = (LAYERS_CONFIG.base_layers || []).map((l) => l.layer_name);
  selectedBaseLayer = (LAYERS_CONFIG.base_layers || []).find((l) => l.visible_default)?.layer_name || null;

  // 2) Bind UI handlers (safe once DOM exists)
  bindStaticUiHandlers();

  // 3) Build menus and layer groups from config (async)
  await bootstrapLayersFromConfig();

  // 4) Initialize map + tools
  const mapa = initOpenLayersMap("map", LAYERS_CONFIG);
  map = mapa.map;

  registerGisBottomMenuTools(map, { useProxy: USE_PROXY });

  initBaseMapMenu({
    layers: baseMapLayers,
    selectedLayer: selectedBaseLayer,
    containerSelector: "#baseMapMenuContent",
    onSelect: () => {},
  });

  registerGisLeftMenu(map);
  enableMouseCoordinates(map, "#mouse-coordinates");
  bindCheckboxToggles(map, { selector: ".layerCheckbox", removeOnUncheck: true });

  initHighlight(map, { dataProjection: MAP_CRS, zIndex: 9999 });

  // Query service
  queryService = createWfsLayerQueryService({
    layerRegistry,
    useProxy: USE_PROXY,
    proxyPath: PROXY_PATH,
    getCqlFilter: ({ layer }) => window.currentCqlFilterByLayer?.[layer.get("layerName")] || null,
    geomPropName: GEOM_PROP,
    srid: SRID,
    count: 5000,
  });

  // Draw tool
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

  // Single click dispatcher
  const dispatcher = createSingleClickDispatcher(map);
  dispatcher.register(
    createHybridIdentifyHandler({
      layerRegistry,
      useProxy: USE_PROXY,
      proxyPath: PROXY_PATH,
      showGfiLoading,
      spatialDrawTool,
      getCqlFilter: ({ layer }) => window.currentCqlFilterByLayer?.[layer.get("layerName")] || null,
      hitTolerance: 10,
      infoFormat: "application/json",
      toleranceMeters: 25,
      mapCrs: MAP_CRS,
      wfsCrs: WFS_CRS,
      count: 50,
      notify: (msg) => console.log(msg),
      onResults: ({ mode, results }) => writeResultsOnGFIPanel(mode, results),
    }),
    { id: "identify-hybrid", order: 100 }
  );

  initLayerFiltersManager({
    map,
    refreshLayer,
    getWfsDescribeUrl,
  });

  clickHandlers();

  addMapCopyright({ mapSelector: "#map", year: window.APP_YEAR, version: window.APP_VERSION });
  initAddressSearchWfs({ map, useProxy: USE_PROXY, proxyPath: PROXY_PATH });
}

// Ensure bootstrap runs even if DOMContentLoaded already fired
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initApp().catch((e) => console.error("Bootstrap error:", e));
  });
} else {
  initApp().catch((e) => console.error("Bootstrap error:", e));
}

/**
 * Handlers & helpers
 */

function clickHandlers() {
  // Only for mobile resolution
  $("#toggleMenuBtn").on("click", function () {
    $("#menuButtons").toggleClass("show");
  });

  // Draw polygon and query
  $("#btnSpatialDraw").on("click", function () {
    spatialDrawTool.activate();
  });

  // Cancel draw tool
  $("#btnSpatialDrawCancel").on("click", function () {
    spatialDrawTool.deactivate();
  });

  // Query viewport
  $("#btnSpatialViewport").on("click", async function () {
    try {
      spatialDrawTool.deactivate();
      const extent = map.getView().calculateExtent(map.getSize());
      showGfiLoading();
      const resp = await queryService.query({ extentMap: extent, context: { mode: "viewport" } });
      writeResultsOnGFIPanel(SEARCH_SERVICE, resp.results);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Viewport query error");
    }
  });

  $(".closeMenu").on("click", function () {
    const targetId = $(this).data("target");
    $("#" + targetId).hide();
  });

  // Layers search (your existing logic can stay here as-is)
  // ...
}

function writeResultsOnGFIPanel(mode, results) {
  hideGfiLoading();
  const panelResults = adaptHybridResultsToPanel(mode, results);

  if (!hasAnyPanelContent(panelResults)) {
    $("#gfiPanelBody").html(`<div class="text-muted small">No identify results.</div>`);
    return;
  }

  renderGfiRightPanel({
    results: panelResults,
    containerId: "#gfiPanelBody",
    getCqlFilter: ({ layerTitle }) => window.currentCqlFilterByLayer?.[layerTitle] || null,
    onGeomHover,
    onGeomOut,
    zoomToGeometryFromGeoJson,
  });
}

function getWfsDescribeUrl(layerName, $layerLi) {
  const serviceBaseUrl = String($layerLi.data("service-base-url") || "");
  let wfsBaseUrl = String($layerLi.data("wfs-base-url") || "");

  if (!wfsBaseUrl) {
    wfsBaseUrl = serviceBaseUrl;
    wfsBaseUrl = wfsBaseUrl.replace(/\/wms\/?$/i, "/ows");
  }

  const params = new URLSearchParams({
    service: "WFS",
    version: "1.1.0",
    request: "DescribeFeatureType",
    typeName: layerName,
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
