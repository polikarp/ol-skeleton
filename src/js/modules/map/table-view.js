// Load data on table

import { refreshTableMiniMap } from "./table-mini-map";
import { zoomToGeometryOnMap, clearHighLightLayer } from "../handlers/highlight-element";

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

    $(document).on('dblclick', `${tableSelector} tbody tr`, function () {
        const index = $(this).data('result-index');
        openTableResultOnMap(index);
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
        state.layerResults = results || [];

        if (!results || !results.length) {
            $content.html(`
                <div class="text-muted text-center py-4">
                    No visible items found in current map view
                </div>
            `);
            return;
        }

        results.forEach((result, layerIndex) => {
            const layerName = result.name || result.layerName || `Layer ${layerIndex + 1}`;
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
                        data-bs-toggle="tab"
                        data-bs-target="#${paneId}"
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
                            <th class="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        features.forEach((feature, featureIndex) => {
            const globalIndex = state.results.length;

            state.results.push({
                layerIndex,
                featureIndex,
                result,
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
                        <button data-layerindex="${layerIndex}" data-featureindex="${featureIndex}" class="btn btn-sm btn-outline-primary js-open-result" title="Open on map">
                            <i class="fa-solid fa-location-crosshairs"></i>
                        </button>
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