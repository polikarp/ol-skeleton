// Load data on table

import { refreshTableMiniMap } from "./table-mini-map";
import { zoomToGeometryOnMap, clearHighLightLayer } from "../handlers/highlight-element";
import { exportNormalizedFeaturesToGeoJSON } from "../export/exportToGeojson";
import { exportNormalizedFeaturesToCSV } from "../export/exportToCSV";

export function initTableViewPanel({
    map,
    miniMap,
    queryService,
    spatialDrawTool,
    zoomToGeometryFromGeoJson,
    appScreensSelector = '#appScreens',
    openButtonSelector = '#openBusinessScreenBtn',
    backButtonSelector = '#backToGisBtn',
    refreshButtonSelector = '#refreshTableViewBtn',
    tableSelector = '#gisResultsTable',
    miniMapSelector = '#tableMiniMap'
}) {
    const state = {
        results: []
    };

    map.on('moveend', () => {
        clearResults();
    });

    $(openButtonSelector).on('click', () => {
        showBusinessScreen();
    });

    $(backButtonSelector).on('click', () => {
        showGisScreen();
        clearResults();
        clearHighLightLayer(miniMap);
    });

    $(refreshButtonSelector).on('click', async () => {
        try {
            clearResults();
            await loadViewportResultsTable();
            initTableMiniMap();
        } catch (e) {
            console.error(e);
            alert(e?.message || 'Viewport table refresh error');
        }
    });

    $(document).on('click', 'table button.js-open-result', function (e) {
        e.stopPropagation();

        const layerIndex = $(this).data("layerindex");
        const featureIndex = $(this).data("featureindex");
        openTableResultOnMiniMap(layerIndex, featureIndex);
    });

    /**
     * Click event handler to show/hide on map
     */
    $(document).on('change', '.js-toggle-mini-map-result', function () {
        const layerIndex = Number($(this).data('layer-index'));
        const featureIndex = Number($(this).data('feature-index'));
        const checked = $(this).is(':checked');
        toggleTableResultOnMiniMap(
            layerIndex,
            featureIndex,
            checked
        );
    });

    /**
     * Click event handler to export button, geojson or csv
     */
    $(document).on('click', 'button.table-export-btn', function () {

        const $button = $(this);
        const exportType = $button.data('file');
        const $activeTab = $('#gisResultsTabs .nav-link.active');

        if (!$activeTab.length) {
            return;
        }

        const layerTitle = $activeTab.data("layer-title");

        const activePaneSelector = $activeTab.data('bs-target');
        if (!activePaneSelector) {
            return;
        }

        const layerIndex = $activeTab.data("layer-index");

        const activeResults = state.results.filter(function (item) {
            return item.layerIndex === layerIndex;
        }).map(item => item.feature);


        if (!activeResults.length) {
            alert('No results available for export');
            return;
        }



        if (exportType === 'geojson') {
            exportNormalizedFeaturesToGeoJSON(activeResults, {fileName: layerTitle + ".geojson"});
        }

        if (exportType === 'csv') {
            exportNormalizedFeaturesToCSV(activeResults, {fileName: layerTitle + ".csv"});
        }
    });


    function showBusinessScreen() {
        $(appScreensSelector).addClass('show-business');

        setTimeout(async () => {
            map.updateSize();

            try {
                await loadViewportResultsTable();
                initTableMiniMap();
            } catch (e) {
                console.error(e);
                alert(e?.message || 'Viewport table query error');
            }

        }, 500);
    }

    function showGisScreen() {
        $(appScreensSelector).removeClass('show-business');

        setTimeout(() => {
            map.updateSize();
        }, 500);
    }

    function clearResults() {
        state.results = null;
    }

    async function loadViewportResultsTable() {
        const $tbody = $(`${tableSelector} tbody`);

        $tbody.html(`
            <tr>
                <td colspan="5" class="text-center py-4">
                    Loading visible map data...
                </td>
            </tr>
        `);

        spatialDrawTool?.deactivate?.();

        const extent = map.getView().calculateExtent(map.getSize());

        const resp = await queryService.query({
            extentMap: extent,
            context: {
                mode: 'viewport-table'
            }
        });

        const results = resp?.results || [];

        state.results = results;

        renderViewportResultsTable(results);
        
    }

    function renderViewportResultsTable(results) {
        const $tabs = $('#gisResultsTabs');
        const $content = $('#gisResultsTabContent');

        $tabs.empty();
        $content.empty();

        state.results = [];

        if (!results || !results.length) {
            $content.html(`
                <div class="text-muted text-center py-4">
                    No visible items found in current map view
                </div>
            `);
            return;
        }

        results.forEach((result, layerIndex) => {
            const layerName = result.title || result.name || result.layerName || `Layer ${layerIndex + 1}`;
            const tabId = `gis-layer-tab-${layerIndex}`;
            const paneId = `gis-layer-pane-${layerIndex}`;
            const geojson = result.geojson || {};
            const features = geojson.features || [];
            const isActive = layerIndex === 0;

            $tabs.append(`
                <li class="nav-item" role="presentation">
                    <button
                        class="nav-link ${isActive ? 'active' : ''}"
                        id="${tabId}"
                        data-layer-index="${layerIndex}"
                        data-bs-toggle="tab"
                        data-bs-target="#${paneId}"
                        data-layer-title="${layerName}"
                        type="button"
                        role="tab">
                        ${escapeHtml(layerName)}
                        <span class="badge bg-secondary ms-1">${features.length}</span>
                    </button>
                </li>
            `);
            

            $content.append(`
                <div
                    class="tab-pane fade ${isActive ? 'show active' : ''}"
                    id="${paneId}"
                    role="tabpanel"
                    aria-labelledby="${tabId}">
                    ${buildLayerTableHtml(result, layerIndex)}
                </div>
            `);
        });

        $tabs.append(`
                <li class="nav-item ms-auto d-flex align-items-center pe-2">
                    <button type="button"
                            class="table-export-btn"
                            data-file="geojson"
                            title="Export GeoJSON">
                        <i class="fa-solid fa-file-code fa-lg"></i>
                    </button>
                    <button type="button"
                            class="table-export-btn ms-2"
                            data-file="csv"
                            title="Export CSV">
                        <i class="fa-solid fa-file-csv fa-lg"></i>
                    </button>
                </li>
            `);
    }

    function buildLayerTableHtml(result, layerIndex) {
        const geojson = result.geojson || {};
        const features = geojson.features || [];

        if (!features.length) {
            return `
                <div class="text-muted text-center py-4">
                    No items found for this layer
                </div>
            `;
        }

        const columns = getGeoJsonPropertyColumns(features);

        let html = `
            <div class="table-responsive gis-results-table-wrapper">
                <table class="table table-sm table-hover align-middle gis-results-table">
                    <thead>
                        <tr>
        `;

        columns.forEach(column => {
            html += `<th>${escapeHtml(column)}</th>`;
        });

        html += `
                            <th class="text-end">Show/hide on map</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        features.forEach((feature, featureIndex) => {
            const globalIndex = state.results.length;

            state.results.push({
                layerIndex,
                featureIndex,
                feature
            });

            html += `
                <tr data-result-index="${globalIndex}">
            `;

            columns.forEach(column => {
                const value = feature.properties?.[column] ?? '-';
                html += `<td>${escapeHtml(formatCellValue(value))}</td>`;
            });

            html += `
                    <td class="text-end">
                        <div class="form-check form-switch m-0 d-flex justify-content-center">
                            <input
                                class="form-check-input js-toggle-mini-map-result"
                                type="checkbox"
                                data-layer-index="${layerIndex}"
                                data-feature-index="${featureIndex}"
                            >
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    function getGeoJsonPropertyColumns(features) {
        const columns = new Set();

        features.forEach(feature => {
            const props = feature.properties || {};

            Object.keys(props).forEach(key => {
                if (!shouldHideColumn(key)) {
                    columns.add(key);
                }
            });
        });

        return Array.from(columns);
    }

    function shouldHideColumn(key) {
        const hiddenColumns = [
            'geom',
            'geometry',
            'the_geom'
        ];

        return hiddenColumns.includes(String(key).toLowerCase());
    }

    function formatCellValue(value) {
        if (value === null || value === undefined) return '-';

        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return value;
    }

    function openTableResultOnMap(index) {
        const result = state.results?.[index];

        if (!result) return;

        showGisScreen();

        setTimeout(() => {
            if (result.geometry) {
                zoomToGeometryFromGeoJson(result.geometry, {
                    duration: 700
                });
            }
        }, 550);
    }

    function openTableResultOnMiniMap(layerIndex, featureIndex) {
        const result = state.results?.find(
            item =>
                item.layerIndex === layerIndex &&
                item.featureIndex === featureIndex
        );
        if (!result?.feature || !miniMap) {
            return;
        }
        const geometry = result.feature.geometry;
        if (!geometry) {
            return;
        }
        zoomToGeometryOnMap(geometry, miniMap, {
            fit: true,
            duration: 700
        });
    }

    /**
     * Activate on map or not one element
     * @param {*} layerIndex 
     * @param {*} featureIndex 
     * @param {*} checked 
     * @returns 
     */
    function toggleTableResultOnMiniMap(layerIndex, featureIndex, checked) {

        const result = state.results?.find(
            item =>
                item.layerIndex === layerIndex &&
                item.featureIndex === featureIndex
        );
        if (!result || !tableMiniMap) {
            return;
        }
        const geometry =
            result.feature?.geometry ||
            result.geometry;

        if (!geometry) {
            return;
        }

        const key = `${layerIndex}_${featureIndex}`;

        zoomToGeometryOnMap(
            geometry,
            miniMap,
            {
                key,
                remove: !checked,
                fit: false
            }
        );
    }

    
    function initTableMiniMap() {
        refreshTableMiniMap();
    }

    function getResultName(props) {
        return props.name ||
            props.title ||
            props.label ||
            props.description ||
            props.id ||
            '-';
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    return {
        showBusinessScreen,
        showGisScreen,
        clearResults,
        loadViewportResultsTable
    };
}

/**
 * Handle dragging table/map separator
 */
export function initTableMiniMapResizable() {
    const $container = $('.business-content');
    const $tableWrapper = $('#gisResultsTabsWrapper');
    const $miniMap = $('#tableMiniMap');
    const $handle = $('#tableMapResizeHandle');

    let dragging = false;
    let startY = 0;
    let startTableHeight = 0;
    let startMapHeight = 0;

    $handle.on('mousedown', function (e) {
        e.preventDefault();

        dragging = true;
        startY = e.clientY;
        startTableHeight = $tableWrapper.outerHeight();
        startMapHeight = $miniMap.outerHeight();

        $('body').addClass('resizing-table-map');
    });

    $(document).on('mousemove', function (e) {
        if (!dragging) {
            return;
        }

        const delta = e.clientY - startY;

        const newTableHeight = startTableHeight + delta;
        const newMapHeight = startMapHeight - delta;

        const minTableHeight = 160;
        const minMapHeight = 120;
        const maxTotalHeight = $container.height() - $handle.outerHeight();

        if (
            newTableHeight < minTableHeight ||
            newMapHeight < minMapHeight ||
            newTableHeight + newMapHeight > maxTotalHeight
        ) {
            return;
        }

        $tableWrapper.css({
            flex: '0 0 auto',
            height: `${newTableHeight}px`
        });

        $miniMap.css({
            flex: '0 0 auto',
            height: `${newMapHeight}px`
        });

        if (tableMiniMap) {
            tableMiniMap.updateSize();
        }
    });

    $(document).on('mouseup', function () {
        if (!dragging) {
            return;
        }

        dragging = false;
        $('body').removeClass('resizing-table-map');

        if (tableMiniMap) {
            tableMiniMap.updateSize();
        }
    });
}