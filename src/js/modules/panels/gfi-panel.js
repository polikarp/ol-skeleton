// gfi-panel.js
// Render identify results into a right panel using Bootstrap 5 accordion.
import GeoJSON from "ol/format/GeoJSON";
import {exportNormalizedFeaturesToGeoJSON} from '../export/exportToGeojson';
import { exportNormalizedFeaturesToCSV } from "../export/exportToCSV";
import { exportGfiRegistryToZipGeoJSON } from "../export/exportToZIP";
import { olGeomToGeoJsonLikeFeature } from "../map/utils";
import Feature from "ol/Feature";

//Registry of layers to export to geojson
const gfiExportRegistry = new Map();

function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeFeaturesFromGeoJsonLike(obj) {
    const feats = Array.isArray(obj?.features) ? obj.features : [];
    return feats.map((f, idx) => ({
        id: f?.id ?? f?.properties?.id ?? `feature_${idx + 1}`,
        properties: f?.properties ?? {},
        geometry: f?.geometry ?? null
    }));
}

function renderPropertiesTable(props) {
    const keys = Object.keys(props || {});
    if (keys.length === 0) {
        return `<div class="text-muted small">No properties.</div>`;
    }

    const rows = keys.map((k) => {
        const v = props[k];
        const value =
            v === null || v === undefined
                ? ""
                : typeof v === "object"
                    ? escapeHtml(JSON.stringify(v))
                    : escapeHtml(v);

        return `<tr><td>${escapeHtml(k)}</td><td>${value}</td></tr>`;
    });

    return `
      <table class="table table-sm table-striped gfi-kv mb-0">
        <tbody>${rows.join("")}</tbody>
      </table>
    `;
}

/**
 * Expected input:
 * results: [{ ok, layerName, layerTitle, format:"json"|"text", data }]
 */
export function renderGfiRightPanel({ results, headerId = "gfiPanelHeader", containerId = "#gfiPanelBody", getCqlFilter, onGeomHover, onGeomOut, zoomToGeometryFromGeoJson }) {
    const $container = $(containerId);
    const $header = $(headerId);

    const okResults = (results || []).filter((r) => r?.ok);

    if (okResults.length === 0) {
        $container.html(`<div class="text-muted small">No identify results.</div>`);
        return;
    }

     // Store geometries extracted from r.data BEFORE rendering
    const geomByHeaderId = {};

    const accId = "gfiAccordion";
    const html = `
      <div class="accordion" id="${accId}">
        ${okResults
            .map((r, layerIdx) => {
                const layerKey = `${accId}_layer_${layerIdx}`;
                const layerTitle = escapeHtml(r.layerTitle || r.layerName || `Layer ${layerIdx + 1}`);

                let features = [];
                if (r.format === "json") {
                    features = normalizeFeaturesFromGeoJsonLike(r.data);
                }

                const featureCount = features.length;

                
                let bodyHtml = "";
                if (r.format === "json") {
                    gfiExportRegistry.set(layerKey, {
                        features: features,
                        fileName: `${(r.layerName || layerTitle || "layer").toString().replace(/[^\w\-]+/g, "_")}`
                    });
                    bodyHtml = featureCount === 0
                        ? `<div class="text-muted small">No features found for this layer.</div>`
                        : `
                          <div class="accordion" id="${layerKey}_features">
                            ${features
                                .map((f, featIdx) => {
                                    const featKey = `${layerKey}_feat_${featIdx}`;
                                    const headerId = `${featKey}_h`;
                                    const geom = f?.geometry ?? null;
                                    if (geom) {
                                        geomByHeaderId[headerId] = geom;
                                    }
                                    return `
                                        <div class="accordion-item">
                                            <h2 class="accordion-header" id="${featKey}_h" data-hid="${headerId}">
                                                <div class="d-flex align-items-center justify-content-between">

                                                    <button class="accordion-button collapsed py-2 text-start flex-grow-1"
                                                            type="button"
                                                            data-bs-toggle="collapse"
                                                            data-bs-target="#${featKey}_c"
                                                            aria-expanded="false"
                                                            aria-controls="${featKey}_c">
                                                    ${escapeHtml(f.id)}
                                                    </button>

                                                    <div class="gfi-header-actions ms-2">
                                                        <i class="fa-solid fa-crosshairs gfi-zoom-icon" fa-xl data-hid="${headerId}" title="Go to location"></i>
                                                    </div>

                                                </div>
                                            </h2>

                                            <div id="${featKey}_c" class="accordion-collapse collapse"
                                                aria-labelledby="${featKey}_h"
                                                data-bs-parent="#${layerKey}_features">
                                                <div class="accordion-body py-2">
                                                    ${renderPropertiesTable(f.properties)}
                                                </div>
                                            </div>
                                        </div>
                                    `;

                                })
                                .join("")}
                          </div>
                        `;
                } else {
                    const txt = typeof r.data === "string" ? r.data.trim() : "";
                    bodyHtml = txt
                        ? `<div class="small">${txt}</div>`
                        : `<div class="text-muted small">Empty response.</div>`;
                }

                let cql = "";
                if (typeof getCqlFilter === "function") {
                    const filter = getCqlFilter({ layerTitle });
                    cql = filter ? `<br> (Active filter: ${filter})` : "";
                }

                return `
                  <div class="accordion-item">
                    <h2 class="accordion-header" id="${layerKey}_h">
                        <div class="d-flex align-items-center justify-content-between">
                            
                            <button class="accordion-button collapsed text-start flex-grow-1"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#${layerKey}_c"
                                    aria-expanded="${layerIdx === 0 ? "true" : "false"}"
                                    aria-controls="${layerKey}_c">
                            ${layerTitle}
                            ${cql}
                            <span class="ms-2 badge text-bg-secondary">${featureCount}</span>
                            </button>

                            <div class="ms-2 d-flex align-items-center pe-2">
                                <button type="button"
                                        class="gfi-export-btn"
                                        data-gfi-export-key="${layerKey}"
                                        data-file="geojson"
                                        title="Export GeoJSON"
                                        ${featureCount === 0 ? "disabled" : ""}>
                                    <i class="fa-solid fa-file-code fa-xl"></i>
                                </button>
                                <button type="button"
                                        class="gfi-export-btn"
                                        data-gfi-export-key="${layerKey}"
                                        data-file="csv"
                                        title="Export CSV"
                                        ${featureCount === 0 ? "disabled" : ""}>
                                    <i class="fa-solid fa-file-csv fa-xl"></i>
                                </button>
                            </div>

                        </div>
                    </h2>
                    <div id="${layerKey}_c" class="accordion-collapse collapse"
                         aria-labelledby="${layerKey}_h"
                         data-bs-parent="#${accId}">
                      <div class="accordion-body">
                        ${bodyHtml}
                      </div>
                    </div>
                  </div>
                `;
            })
            .join("")}
      </div>
    `;

    $container.html(html);

     /* ----------------------------------------------------
     * Hover handlers (delegated) -> highlight geometry on map
     * ---------------------------------------------------- */

    $container.off("mouseenter.gfiGeom", "h2.accordion-header[data-hid]");
    $container.off("mouseleave.gfiGeom", "h2.accordion-header[data-hid]");

    function isMobile() {
        return window.matchMedia("(max-width: 767px)").matches;
    }

    // Desktop hover -> highlight + zoom (inside onGeomHover)
    $container.on("mouseenter.gfiGeom", "h2.accordion-header[data-hid]", function () {
        if (isMobile()) return;

        const headerId = $(this).attr("data-hid");
        const geom = geomByHeaderId[headerId];
        if (!geom) return;

        onGeomHover?.(geom, { headerId });
    });

    $container.on("mouseleave.gfiGeom", "h2.accordion-header[data-hid]", function () {
        if (isMobile()) return;

        const headerId = $(this).attr("data-hid");
        onGeomOut?.({ headerId });
    });

    // Desktop click -> do nothing (but allow accordion toggle)
    $container.on("click.gfiGeom", "h2.accordion-header[data-hid]", function () {
        if (!isMobile()) return; // desktop: ignore
        // Mobile click -> highlight + zoom with offset
        $(this).toggleClass("opened");
        const headerId = $(this).attr("data-hid");
        if($(this).hasClass("opened")){
            const geom = geomByHeaderId[headerId];
            if (!geom) return;
            onGeomHover?.(geom, { headerId }); // highlight (no zoom on mobile from hover)
            zoomToGeometryFromGeoJson(geom, { offsetRatio: 0.33, duration: 300, maxZoom: 19 });
        }else{
            onGeomOut({headerId});
        }

    });

    // Go to geometry button in Desktop
    $container.on("click.gfi-buttom", "i.gfi-zoom-icon", function () {

        const headerId = $(this).data("hid");
        const geom = geomByHeaderId[headerId];
        if (!geom) return;

        //onGeomHover?.(geom, { headerId }); // highlight (no zoom on mobile from hover)
        zoomToGeometryFromGeoJson(geom, { offsetRatio: 0.5, duration: 300, maxZoom: 10 });
    });

    $container.off("click.exportGeojson").on("click.exportGeojson", "[data-gfi-export-key]", function (e) {
        // Prevent accordion toggle
        e.preventDefault();
        e.stopPropagation();

        const key = $(this).data("gfi-export-key");
        const fileType = $(this).data("file");
        const entry = gfiExportRegistry.get(key);

        if (!entry || !Array.isArray(entry.features) || entry.features.length === 0) {
            return;
        }

        if("geojson" == fileType){
            exportNormalizedFeaturesToGeoJSON(entry.features, {
                fileName: entry.fileName + '.geojson',
                fromEpsg: "EPSG:25830",
                toEpsg: "EPSG:4326"
            });
        }else{
            exportNormalizedFeaturesToCSV(entry.features, {
                fileName: entry.fileName + '.csv',
                fromEpsg: "EPSG:25830",
                toEpsg: "EPSG:4326"
            });
        }

        
    });

    $header.off("click.exportZip").on("click.exportZip", "button#gfiExportZipBtn", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if(window.LAST_DRAW_GEOM){
            let feature = olGeomToGeoJsonLikeFeature(window.LAST_DRAW_GEOM.clone(), {
                featureProjection: "EPSG:25830", 
                dataProjection: "EPSG:25830"
            });
            
            gfiExportRegistry.set("lastDrawGeom", {
                features: normalizeFeaturesFromGeoJsonLike({features: [feature]}),  
                fileName: "work_zone"
            });
        }
        
        exportGfiRegistryToZipGeoJSON(gfiExportRegistry);
    });

    
}
