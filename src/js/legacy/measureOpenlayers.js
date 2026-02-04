// resources/js/legacy/measureOpenlayers.js
// (You can move this to resources/js/modules/map/measure-openlayers.js if you prefer)

import $ from 'jquery';

import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Draw from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';

import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';

import { getLength as getGeodesicLength, getArea as getGeodesicArea } from 'ol/sphere';

/**
 * Handle of measurement tools
 */

let measureInteraction;
let measureTooltipElement;
let measureTooltip;
let sketch;
let measureLayer;
let helpTooltip;
let measureTooltips = [];

export function addMeasureInteraction(map, type) {
    removeMeasureInteraction(map);

    const source = new VectorSource();

    measureLayer = new VectorLayer({
        source: source,
        style: new Style({
            stroke: new Stroke({ color: '#100cfcff', width: 2 }),
            fill: new Fill({ color: 'rgba(255, 204, 51, 0.3)' })
        })
    });

    map.addLayer(measureLayer);

    measureInteraction = new Draw({
        source: source,
        type: type, // 'LineString' or 'Polygon'
        style: new Style({
            fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
            stroke: new Stroke({ color: '#100cfcff', width: 2, lineDash: [10, 10] }),
            image: new CircleStyle({
                radius: 5,
                stroke: new Stroke({ color: '#100cfcff' }),
                fill: new Fill({ color: 'white' })
            })
        })
    });

    map.addInteraction(measureInteraction);

    addHelpTooltip(map);
    createMeasureTooltip(map);

    measureInteraction.on('drawstart', function (evt) {
        sketch = evt.feature;

        sketch.getGeometry().on('change', function (evt2) {
            const geom = evt2.target;
            const output = type === 'Polygon' ? formatArea(geom) : formatLength(geom);

            const tooltipCoord = (geom.getType() === 'Polygon')
                ? geom.getInteriorPoint().getCoordinates()
                : geom.getLastCoordinate();

            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
        });
    });

    measureInteraction.on('drawend', function () {
        measureTooltipElement.className = 'ol-tooltip2 ol-tooltip-static';
        measureTooltip.setOffset([0, -7]);

        sketch = null;
        measureTooltipElement = null;

        createMeasureTooltip(map);

        if (measureInteraction) {
            map.removeInteraction(measureInteraction);
            measureInteraction = null;
        }

        if (helpTooltip) {
            map.removeOverlay(helpTooltip);
        }
    });
}

export function removeMeasureInteraction(map) {
    if (measureInteraction) {
        map.removeInteraction(measureInteraction);
        measureInteraction = null;
    }
    if (measureLayer) {
        map.removeLayer(measureLayer);
        measureLayer = null;
    }
    if (measureTooltip) {
        map.removeOverlay(measureTooltip);
        measureTooltip = null;
    }
    if (measureTooltips.length > 0) {
        measureTooltips.forEach(tooltip => map.removeOverlay(tooltip));
        measureTooltips = [];
    }
    if (helpTooltip) {
        map.removeOverlay(helpTooltip);
        helpTooltip = null;
    }

    $('#btnCancelMeasure').addClass('d-none');
    $('#btnCancelMeasure').next('div').addClass('d-none');
}

function formatLength(line) {
    const length = getGeodesicLength(line);
    return length > 100 ? (length / 1000).toFixed(2) + ' km' : length.toFixed(1) + ' m';
}

function formatArea(polygon) {
    const area = getGeodesicArea(polygon);
    return area > 10000 ? (area / 1000000).toFixed(2) + ' km²' : area.toFixed(1) + ' m²';
}

function createMeasureTooltip(map) {
    if (measureTooltipElement && measureTooltipElement.parentNode) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }

    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'ol-tooltip2 ol-tooltip-measure';

    measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center'
    });

    map.addOverlay(measureTooltip);
    measureTooltips.push(measureTooltip);
}

function addHelpTooltip(map) {
    // Help tooltip
    const $helpTooltipElement = $('<div>')
        .addClass('ol-tooltip2 ol-tooltip-help')
        .html('Double click to finish measurement');

    const helpTooltipElement = $helpTooltipElement[0];

    helpTooltip = new Overlay({
        element: helpTooltipElement,
        offset: [15, 0],
        positioning: 'center-left'
    });

    map.addOverlay(helpTooltip);

    // Update mouse position
    map.on('pointermove', function (evt) {
        if (evt.dragging) return;
        if (helpTooltip) {
            helpTooltip.setPosition(evt.coordinate);
        }
    });

    // Remove help tooltip when drawing ends
    if (measureInteraction) {
        measureInteraction.on('drawend', function () {
            if (helpTooltip) {
                map.removeOverlay(helpTooltip);
                helpTooltip = null;
            }
        });
    }
}
