import Draw from "ol/interaction/Draw";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";

let miniMap = null;
let getState = null;

let drawInteraction = null;
let createSource = null;
let createLayer = null;

let pendingOlFeature = null;
let pendingLayerData = null;

/* Auxiliar layers for new features */

let auxiliaryCreateSource = null;
let auxiliaryCreateLayer = null;

const geoJsonFormat = new GeoJSON();

export function initTableCreateFeatureTools(options) {
    clearDrawInteraction();
    miniMap = options.miniMap;
    getState = options.getState;


    setTimeout(function () {
        createTemporaryLayer();
        ensureCreateFeatureModal();
        bindCreateFeatureEvents();
    }, 0);
}

export function clearTemporaryCreatedFeatures() {
    if (createSource) {
        createSource.clear();
    }

    if (auxiliaryCreateSource) {
        auxiliaryCreateSource.clear();
    }

    clearPendingFeature();
    clearDrawInteraction();
}

function createAuxiliaryCreateLayer() {

    if (auxiliaryCreateLayer) {
        auxiliaryCreateSource = auxiliaryCreateLayer.getSource();

        if (!miniMap.getLayers().getArray().includes(auxiliaryCreateLayer)) {
            miniMap.addLayer(auxiliaryCreateLayer);
        }

        return;
    }

    auxiliaryCreateSource = new VectorSource();

    auxiliaryCreateLayer = new VectorLayer({
        source: auxiliaryCreateSource,
        visible: true,
        zIndex: 10000,

        // Generic style for temporary created features
        style: function (feature) {

            const geometryType = feature.getGeometry()?.getType();

            // Point / MultiPoint
            if (
                geometryType === "Point" ||
                geometryType === "MultiPoint"
            ) {
                return new Style({
                    image: new CircleStyle({
                        radius: 8,
                        fill: new Fill({
                            color: "rgba(255, 193, 7, 0.95)"
                        }),
                        stroke: new Stroke({
                            color: "#000000",
                            width: 2
                        })
                    })
                });
            }

            // LineString / MultiLineString
            if (
                geometryType === "LineString" ||
                geometryType === "MultiLineString"
            ) {
                return new Style({
                    stroke: new Stroke({
                        color: "rgba(255, 193, 7, 1)",
                        width: 4
                    })
                });
            }

            // Polygon / MultiPolygon
            return new Style({
                stroke: new Stroke({
                    color: "rgba(255, 193, 7, 1)",
                    width: 3
                }),
                fill: new Fill({
                    color: "rgba(255, 193, 7, 0.25)"
                })
            });
        }
    });

    auxiliaryCreateLayer.setProperties({
        name: "auxiliaryCreateLayer",
        preserveOnMiniMapRefresh: true
    });

    miniMap.addLayer(auxiliaryCreateLayer);
}

function createTemporaryLayer() {
    if (createLayer) {
        createSource = createLayer.getSource();

        if (!miniMap.getLayers().getArray().includes(createLayer)) {
            miniMap.addLayer(createLayer);
        }

        return;
    }

    createSource = new VectorSource();

    createLayer = new VectorLayer({
        source: createSource,
        zIndex: 9999,
        style: new Style({
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({
                    color: "rgba(25, 135, 84, 0.85)"
                }),
                stroke: new Stroke({
                    color: "#000000",
                    width: 2
                })
            }),
            stroke: new Stroke({
                color: "rgba(25, 135, 84, 1)",
                width: 3
            }),
            fill: new Fill({
                color: "rgba(25, 135, 84, 0.25)"
            })
        })
    });
    createLayer.setProperties({
        name: "createLayerDraw",
        preserveOnMiniMapRefresh: true
    });

    miniMap.addLayer(createLayer);
}

function bindCreateFeatureEvents() {
    $(document)
        .off("click.tableCreateFeature", "#table-new-feature-btn")
        .on("click.tableCreateFeature", "#table-new-feature-btn", function () {
            openCreateFeatureConfirmModal();
        });

    $(document)
        .off("click.tableCreateFeatureConfirm", "#tableCreateFeatureConfirmBtn")
        .on("click.tableCreateFeatureConfirm", "#tableCreateFeatureConfirmBtn", function () {
            const modal = bootstrap.Modal.getInstance(
                document.getElementById("tableCreateFeatureConfirmModal")
            );

            if (modal) {
                modal.hide();
            }

            startCreateFeatureDraw();
            showCreateFeatureCancelButton();
        });

    $(document)
        .off("click.tableCreateFeatureCancelDraw", "#table-cancel-create-feature-btn")
        .on("click.tableCreateFeatureCancelDraw", "#table-cancel-create-feature-btn", function () {
            cancelCreateFeatureDraw();
        });

    $(document)
        .off("click.tableCreateFeatureSave", "#tableCreateFeatureSaveBtn")
        .on("click.tableCreateFeatureSave", "#tableCreateFeatureSaveBtn", function () {
            saveCreatedFeatureFromModal();
        });

    $(document)
        .off("click.tableCreateFeatureCancel", "#tableCreateFeatureCancelBtn")
        .on("click.tableCreateFeatureCancel", "#tableCreateFeatureCancelBtn", function () {
            cancelCreatedFeatureFromModal();
        });
}

function openCreateFeatureConfirmModal() {
    const modal = bootstrap.Modal.getOrCreateInstance(
        document.getElementById("tableCreateFeatureConfirmModal")
    );

    modal.show();
}

function showCreateFeatureCancelButton() {
    $("#table-cancel-create-feature-btn").removeClass("d-none");
    $("#table-new-feature-btn").prop("disabled", true);
}

function hideCreateFeatureCancelButton() {
    $("#table-cancel-create-feature-btn").addClass("d-none");
    $("#table-new-feature-btn").prop("disabled", false);
}

function cancelCreateFeatureDraw() {
    clearDrawInteraction();

    pendingOlFeature = null;
    pendingLayerData = null;

    if (createSource) {
        createSource.clear();
    }

    hideCreateFeatureCancelButton();
}

function startCreateFeatureDraw() {
    const activeLayer = getActiveLayerData();

    if (!activeLayer) {
        return;
    }

    clearDrawInteraction();

    drawInteraction = new Draw({
        source: createSource,
        type: activeLayer.geometryType
    });

    createAuxiliaryCreateLayer();

    drawInteraction.on("drawend", function (event) {
        pendingOlFeature = event.feature;
        pendingLayerData = activeLayer;
        setTimeout(function () {
            clearDrawInteraction();
            hideCreateFeatureCancelButton();
            openCreateFeatureModal(activeLayer);
        }, 0);
    });

    miniMap.addInteraction(drawInteraction);
}

function openCreateFeatureModal(activeLayer) {
    const fields = getFieldsForLayer(activeLayer.layerIndex);
    const $body = $("#tableCreateFeatureModalBody");

    let html = "";

    fields.forEach(function (field) {
        html += `
            <div class="mb-2">
                <label class="form-label small mb-1">${escapeHtml(field)}</label>
                <input type="text"
                       class="form-control form-control-sm table-create-feature-field"
                       data-field="${escapeHtml(field)}">
            </div>
        `;
    });

    if (!html) {
        html = `
            <div class="text-muted">
                No editable fields detected for this layer.
            </div>
        `;
    }

    $body.html(html);

    $("#tableCreateFeatureModalTitle").text("New feature - " + activeLayer.layerTitle);

    const modalEl = document.getElementById("tableCreateFeatureModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

function saveCreatedFeatureFromModal() {
    if (!pendingOlFeature || !pendingLayerData) {
        return;
    }

    const state = getState();
    const randomId = generateTemporaryId();
    const properties = {};

    $(".table-create-feature-field").each(function () {
        const field = $(this).data("field");
        properties[field] = $(this).val();
    });

    properties.id = randomId;
    properties._isTemporary = true;

    pendingOlFeature.setProperties({
        ...properties,
        _uid: randomId,
        _isTemporary: true,
        _layerIndex: pendingLayerData.layerIndex,
        _layerTitle: pendingLayerData.layerTitle
    });

    const geoJsonFeature = geoJsonFormat.writeFeatureObject(pendingOlFeature, {
        featureProjection: miniMap.getView().getProjection(),
        dataProjection: miniMap.getView().getProjection()
    });

    geoJsonFeature.properties = {
        ...properties
    };

    const auxiliaryFeature = pendingOlFeature.clone();

    auxiliaryFeature.setProperties({
        ...properties,
        _uid: randomId,
        _isTemporary: true,
        _layerIndex: pendingLayerData.layerIndex,
        _layerTitle: pendingLayerData.layerTitle
    });

    auxiliaryCreateSource.addFeature(auxiliaryFeature);

    createSource.removeFeature(pendingOlFeature);

    const item = {
        uid: randomId,
        id: randomId,
        layerIndex: pendingLayerData.layerIndex,
        layerTitle: pendingLayerData.layerTitle,
        featureIndex: getNextFeatureIndex(pendingLayerData.layerIndex),
        feature: geoJsonFeature,
        geometry: geoJsonFeature.geometry,
        olFeature: auxiliaryFeature,
        properties: geoJsonFeature.properties,
        isTemporary: true,
        source: "table-created"
    };

    if (!Array.isArray(state.results)) {
        state.results = [];
    }

    state.results.push(item);

    appendCreatedFeatureRow(item);

    closeCreateFeatureModal();
    clearPendingFeature();
}

function cancelCreatedFeatureFromModal() {
    if (pendingOlFeature) {
        createSource.removeFeature(pendingOlFeature);
    }

    closeCreateFeatureModal();
    clearPendingFeature();
}

function appendCreatedFeatureRow(item) {
    const $activeTab = $("#gisResultsTabs .nav-link.active");

    if (!$activeTab.length) {
        return;
    }

    let state = getState();

    const paneSelector = $activeTab.data("bs-target");

    if (!paneSelector) {
        return;
    }

    const $tbody = $(`${paneSelector} table.gis-results-table tbody`);

    if (!$tbody.length) {
        return;
    }

    const columns = getFieldsForLayer(item.layerIndex);
    const globalIndex = state.results.length - 1;

    let html = `
        <tr class="table-success table-created-feature-row"
            data-result-index="${globalIndex}">
    `;

    columns.forEach(function (column) {
        const value = item.feature.properties?.[column] ?? "-";
        html += `<td>${escapeHtml(formatCellValue(value))}</td>`;
    });

    html += `
            <td class="text-end">
                <div class="form-check form-switch m-0 d-flex justify-content-center">
                    <input
                        class="form-check-input js-toggle-mini-map-result"
                        type="checkbox"
                        data-layer-index="${item.layerIndex}"
                        data-feature-index="${item.featureIndex}"
                    >
                </div>
            </td>
        </tr>
    `;

    $tbody.prepend(html);
}

function getActiveLayerData() {
    const $activeTab = $("#gisResultsTabs .nav-link.active");

    if (!$activeTab.length) {
        return null;
    }

    const layerIndex = Number($activeTab.data("layer-index"));

    if (Number.isNaN(layerIndex)) {
        return null;
    }

    const state = getState();

    const firstLayerFeature = state.results.find(function (item) {
        return item.layerIndex === layerIndex &&
            item.feature &&
            item.feature.geometry;
    });

    const geometryType = normalizeGeometryType(firstLayerFeature?.feature?.geometry?.type || "Point");

    return {
        layerIndex,
        layerTitle: $activeTab.data("layer-title") || `Layer ${layerIndex + 1}`,
        geometryType
    };
}

function normalizeGeometryType(type) {
    if (!type) {
        return "Point";
    }
    if (type.startsWith("Multi")) {
        return type.replace("Multi", "");
    }
    return type;
}

function getFieldsForLayer(layerIndex) {
    let state = getState();
    const sourceItem = Array.isArray(state.results)
        ? state.results.find(function (item) {
            return item.layerIndex === layerIndex && item.feature?.properties;
        })
        : null;

    if (!sourceItem) {
        return [];
    }

    return Object.keys(sourceItem.feature.properties).filter(function (key) {
        return !shouldHideColumn(key) && !String(key).startsWith("_");
    });
}

function getNextFeatureIndex(layerIndex) {
    let state = getState();
    const indexes = Array.isArray(state.results)
        ? state.results
            .filter(function (item) {
                return item.layerIndex === layerIndex;
            })
            .map(function (item) {
                return Number(item.featureIndex);
            })
            .filter(function (value) {
                return !Number.isNaN(value);
            })
        : [];

    if (!indexes.length) {
        return 0;
    }

    return Math.max(...indexes) + 1;
}

function ensureCreateFeatureModal() {
    if ($("#tableCreateFeatureModal").length) {
        return;
    }

    $("body").append(`
        <div class="modal fade" id="tableCreateFeatureModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 id="tableCreateFeatureModalTitle" class="modal-title">
                            New feature
                        </h5>
                        <button type="button"
                                class="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"></button>
                    </div>

                    <div id="tableCreateFeatureModalBody" class="modal-body">
                    </div>

                    <div class="modal-footer">
                        <button type="button"
                                id="tableCreateFeatureCancelBtn"
                                class="btn btn-outline-secondary">
                            Cancel
                        </button>

                        <button type="button"
                                id="tableCreateFeatureSaveBtn"
                                class="btn btn-success">
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `);
}

function closeCreateFeatureModal() {
    const modalEl = document.getElementById("tableCreateFeatureModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.hide();
}

function clearDrawInteraction() {
    if (drawInteraction) {
        miniMap.removeInteraction(drawInteraction);
        drawInteraction = null;
    }
}

function clearPendingFeature() {
    pendingOlFeature = null;
    pendingLayerData = null;
}

function generateTemporaryId() {
    return "tmp_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

function shouldHideColumn(key) {
    const hiddenColumns = [
        "geom",
        "geometry",
        "the_geom"
    ];

    return hiddenColumns.includes(String(key).toLowerCase());
}

function formatCellValue(value) {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return value;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}