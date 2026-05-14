import { getCenter } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import { layerRegistry } from "../map/map-config";

const DEFAULT_ALLOWED_SCALES = [
    200,
    500,
    1000,
    2000,
    5000,
    7500,
    10000,
    20000
];

/**
 * Generates modal to ask to user pdf printing params
 * @param {*} capabilities 
 * @returns 
 */
export function openMapfishPrintModal(map, capabilities) {
    return new Promise((resolve) => {
        $("#mapfishPrintModal").remove();

        const scalesOptions = capabilities.scales
            .map(scale => `<option value="${scale}">${scale}</option>`)
            .join("");

        const dpisOptions = capabilities.dpis
            .map(dpi => `<option value="${dpi}">${dpi}</option>`)
            .join("");

        const layoutsOptions = capabilities.layouts
            .map(layout => `<option value="${layout.name}">${layout.name}</option>`)
            .join("");

        const formatsOptions = capabilities.outputFormats
            .filter(format => format.toLowerCase() === "pdf")
            .map(format => `<option value="${format}">${format.toUpperCase()}</option>`)
            .join("");

        const modalHtml = `
            <div class="modal fade" id="mapfishPrintModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">

                        <div class="modal-header">
                            <h5 class="modal-title">Choose PDF Printing settings</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Layout</label>
                                <select id="printLayout" class="form-select form-select-sm">
                                    ${layoutsOptions}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Scale (nearest scale calculated from current map view)</label>
                                <select id="printScale" class="form-select form-select-sm">
                                    ${scalesOptions}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">DPI</label>
                                <select id="printDpi" class="form-select form-select-sm">
                                    ${dpisOptions}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Format</label>
                                <select id="printFormat" class="form-select form-select-sm">
                                    ${formatsOptions || `<option value="pdf">PDF</option>`}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Title</label>
                                <input id="printTitle" class="form-control form-control-sm" value="My custom map printed in PDF">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Comment</label>
                                <input id="printComment" class="form-control form-control-sm" value="Generated from OL">
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">
                                Cancel
                            </button>
                            <button type="button" id="confirmMapfishPrint" class="btn btn-primary btn-sm">
                                Print
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        `;

        $("body").append(modalHtml);

        const nearestScale = getNextAllowedScale(map, capabilities);

        const selectedPrintableLayers = Array.from(layerRegistry.values())
            .filter(layer => layer.get("serviceType") !== "FILE")
            .map(layer => layer.get("description"))
            .filter(Boolean)
            .join(",");

        $("#printScale").val(String(nearestScale));
        $("#printComment").val("Selected layers: " + selectedPrintableLayers);

        const modalElement = document.getElementById("mapfishPrintModal");
        const modal = new bootstrap.Modal(modalElement);

        $("#confirmMapfishPrint").on("click", function () {
            const options = {
                layout: $("#printLayout").val(),
                scale: Number($("#printScale").val()),
                dpi: Number($("#printDpi").val()),
                outputFormat: $("#printFormat").val(),
                mapTitle: $("#printTitle").val(),
                mapComment: $("#printComment").val()
            };

            modal.hide();
            resolve(options);
        });

        $(modalElement).on("hidden.bs.modal", function () {
            $(this).remove();
        });

        modal.show();
    });
}

/**
 * Get capabilities of mapfish service
 * @param {*} mapfishBaseUrl 
 * @returns 
 */
export async function fetchMapfishCapabilities(mapfishBaseUrl) {
    if (!mapfishBaseUrl) {
        throw new Error("Mapfish info URL is required");
    }

    const infoUrl = mapfishBaseUrl + '/info.json'

    const response = await fetch(infoUrl, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Error loading Mapfish capabilities: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
        scales: (data.scales || []).map(item => Number(item.value)),
        dpis: (data.dpis || []).map(item => Number(item.value)),
        outputFormats: (data.outputFormats || []).map(item => item.name),
        layouts: (data.layouts || []).map(layout => ({
            name: layout.name,
            width: layout.map?.width ?? null,
            height: layout.map?.height ?? null,
            rotation: Boolean(layout.rotation)
        })),
        printURL: mapfishBaseUrl + '/print.pdf',
        createURL: mapfishBaseUrl + '/create.json'
    };
}

export function buildMapfishPrintRequest(map, printLayers = [], options = {}) {

    const targetSrs = options.srs || 'EPSG:25830';

    const page = buildPrintPage(map, {
        ...options,
        srs: targetSrs
    });

    return {
        layout: options.layout || 'A4 Portrait',
        outputFormat: options.outputFormat || 'pdf',
        dpi: options.dpi || 150,
        srs: targetSrs,
        units: getUnitsFromSrs(targetSrs),
        mapTitle: page.mapTitle,
        mapComment: page.mapComment,
        layers: printLayers
            .filter(layer => layer.visible !== false)
            .map(buildMapfishWmsLayer),
        pages: [page]
    };
}



function buildPrintPage(map, options = {}) {

    const view = map.getView();
    const size = map.getSize();

    const sourceProjection = view.getProjection().getCode();
    const targetSrs = options.srs;

    const extent = view.calculateExtent(size);
    const targetExtent = transformExtent(extent, sourceProjection, targetSrs);

    const center = getCenter(targetExtent);

    const rawScale = calculateScaleFromExtent(
        targetExtent,
        size,
        options.dpi || 150
    );

    const scale = options.scale;
    // const scale = getNextAllowedScale(
    //     rawScale,
    //     options.allowedScales || DEFAULT_ALLOWED_SCALES
    // );

    const rotationRadians = view.getRotation() || 0;
    const rotationDegrees = rotationRadians * 180 / Math.PI;

    return {
        center: [
            Number(center[0].toFixed(6)),
            Number(center[1].toFixed(6))
        ],
        scale,
        rotation: Number(rotationDegrees.toFixed(6)),
        mapTitle: options.mapTitle || '',
        mapComment: options.mapComment || ''
    };
}

function buildMapfishWmsLayer(layer) {

    const wmsLayer = {
        type: layer.type,
        baseURL: layer.baseUrl,// ensureWmsUrl(layer.baseUrl),
        layers: Array.isArray(layer.layers)
            ? layer.layers
            : [layer.layerName],
        styles: layer.styles || [''],
        format: layer.format || 'image/png',
        transparent: layer.transparent ?? true,
        opacity: layer.opacity ?? 1,
        singleTile: layer.singleTile ?? true
    };

    if (layer.cqlFilter && layer.cqlFilter.trim() !== '') {
        wmsLayer.customParams = {
            CQL_FILTER: layer.cqlFilter
        };
    }

    return wmsLayer;
}

function calculateScaleFromExtent(extent, size, dpi = 150) {

    const width = extent[2] - extent[0];
    const pixelWidth = size[0];

    const metersPerPixel = width / pixelWidth;

    return Math.round(metersPerPixel * dpi / 0.0254);
}

/**
 * Get nearest scale from actual zoom
 * @param {*} map 
 * @param {*} options 
 * @returns 
 */
function getNextAllowedScale(map, options = {}) {

    const view = map.getView();
    const size = map.getSize();

    const sourceProjection = view.getProjection().getCode();
    const targetSrs = view.getProjection().getCode();

    const extent = view.calculateExtent(size);
    const targetExtent = transformExtent(extent, sourceProjection, targetSrs);

    const center = getCenter(targetExtent);

    const rawScale = calculateScaleFromExtent(
        targetExtent,
        size,
        150
    );

    const allowedScales = options.scales || DEFAULT_ALLOWED_SCALES;

    const sorted = [...allowedScales].sort((a, b) => a - b);

    return sorted.find(s => s >= rawScale) || sorted[sorted.length - 1];
}

function ensureWmsUrl(url) {
    return url.endsWith('?') ? url : `${url}?`;
}

function getUnitsFromSrs(srs) {

    if (!srs) return 'm';

    if (srs.includes('4326')) return 'degrees';

    return 'm';
}