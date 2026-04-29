import { getCenter } from 'ol/extent';
import { transformExtent } from 'ol/proj';

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

    const scale = getNextAllowedScale(
        rawScale,
        options.allowedScales || DEFAULT_ALLOWED_SCALES
    );

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

function getNextAllowedScale(scale, allowedScales) {

    const sorted = [...allowedScales].sort((a, b) => a - b);

    return sorted.find(s => s >= scale) || sorted[sorted.length - 1];
}

function ensureWmsUrl(url) {
    return url.endsWith('?') ? url : `${url}?`;
}

function getUnitsFromSrs(srs) {

    if (!srs) return 'm';

    if (srs.includes('4326')) return 'degrees';

    return 'm';
}