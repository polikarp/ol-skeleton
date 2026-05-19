/**
 * Handles Street View coverage overlay as an OpenLayers XYZ layer.
 */

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

let coverageLayer = null;

/**
 * Creates the Street View coverage layer if it does not exist.
 */
function createStreetViewCoverageLayer() {
    if (coverageLayer) {
        return coverageLayer;
    }

    coverageLayer = new TileLayer({
        zIndex: 99990,
        visible: false,
        source: new XYZ({
            maxZoom: 19,
            crossOrigin: 'anonymous',
            url: 'https://mt{0-3}.google.com/vt/?lyrs=svv|cb_client:apiv3&style=50&x={x}&y={y}&z={z}',
            attributions: `© ${new Date().getFullYear()} Google Maps`
        })
    });

    coverageLayer.set('name', 'street-view-coverage');
    coverageLayer.set('isStreetViewCoverage', true);

    return coverageLayer;
}

/**
 * Shows the Street View coverage layer.
 */
export function showStreetViewCoverage(map) {
    const layer = createStreetViewCoverageLayer();

    if (!map.getLayers().getArray().includes(layer)) {
        map.addLayer(layer);
    }

    layer.setVisible(true);
}

/**
 * Hides the Street View coverage layer.
 */
export function hideStreetViewCoverage() {
    if (coverageLayer) {
        coverageLayer.setVisible(false);
    }
}

/**
 * Toggles the Street View coverage layer.
 */
export function setStreetViewCoverageVisible(map, visible) {
    if (visible) {
        showStreetViewCoverage(map);
        return;
    }

    hideStreetViewCoverage();
}

/**
 * Removes the Street View coverage layer from the map.
 */
export function destroyStreetViewCoverage(map) {
    if (!coverageLayer) {
        return;
    }

    if (map && map.getLayers().getArray().includes(coverageLayer)) {
        map.removeLayer(coverageLayer);
    }

    coverageLayer = null;
}