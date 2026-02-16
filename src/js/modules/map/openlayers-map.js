// resources/js/modules/map/openlayers-map.js

import 'ol/ol.css';

import proj4 from 'proj4';
import { register as registerProj4 } from 'ol/proj/proj4';

import Map from 'ol/Map';
import View from 'ol/View';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';

import TileWMS from 'ol/source/TileWMS';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';

import ScaleLine from 'ol/control/ScaleLine';
import { defaults as defaultControls } from 'ol/control';

import {initialCenter, initialZoom, initialRotation} from './map-config';
import LAYERS_CONFIG from "/public/data/layersConfig.js";

/**
 * Initialize OpenLayers map with EPSG:25830, custom resolutions/extent,
 * and GeoServer WMS basemaps + search vector layer.
 *
 * @param {string} targetId - DOM element id where the map will be rendered.
 * @returns {{ map: Map, layers: any, searchLayer: VectorLayer, searchSource: VectorSource }|null}
 */
export function initOpenLayersMap(targetId = 'map') {

    const target = document.getElementById(targetId);
    if (!target) {
        return null;
    }

    // Define projections
    proj4.defs(
        'EPSG:25830',
        '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
    );
    proj4.defs(
        'EPSG:900913',
        '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs'
    );
    registerProj4(proj4);

    // Map extent and resolutions for EPSG:25830
    const extent = [276486.2885, 3994246.2864, 305419.1190, 4008267.4237];
    const resolutions = [
        33.524080254556836,
        16.76204127278418,
        8.381020063639209,
        4.1905100318196045,
        2.0952550159098011,
        1.0476275079549006,
        0.5238137539774506,
        0.2619068769887253,
        0.1309534384943626,
        0.0654767192471813,
    ];

    
    const baseLayers = LAYERS_CONFIG.base_layers;

    const baseLayersOl = buildBaseLayers(baseLayers);

   // Create map
    const map = new Map({
        controls: defaultControls({
            zoom: false,
        }),
        target: targetId,
        layers: baseLayersOl,
        view: new View({
            projection: 'EPSG:25830',
            resolutions: resolutions,
            constrainResolution: false,
            extent: extent,
            center: initialCenter,
            zoom: initialZoom,
            rotation: initialRotation,
        }),
    });

    // Scale line control
    const scaleLineControl = new ScaleLine({
        units: 'metric',
        bar: true,
        steps: 4,
        minWidth: 100,
    });
    map.addControl(scaleLineControl);

    // Search layer
    const searchSource = new VectorSource();
    const searchLayer = new VectorLayer({
        source: searchSource,
        zIndex: 1000,
    });
    map.addLayer(searchLayer);


    return {
        map,
        layers: baseLayersOl,
        searchLayer,
        searchSource,
    };
}


function buildBaseLayers(baseLayersJson) {
    return (baseLayersJson || []).map(r => {
        const opts = r.options ? JSON.parse(r.options) : {};

        if (r.layer_type === "wms") {
            return new TileLayer({
                source: new TileWMS({
                    url: r.base_url,
                    params: {
                        LAYERS: r.layer_name,
                        FORMAT: opts.format || "image/png",
                        TRANSPARENT: opts.transparent ?? true,
                    },
                    serverType: "geoserver",
                }),
                visible: !!r.visible_default,
                name: r.layer_name,
                isBaseLayer: true
            });
        }

        if (r.layer_type === "osm") {
            return new TileLayer({
                source: new OSM(),
                visible: !!r.visible_default,
                name: r.layer_name,
                isBaseLayer: true
            });
        }

        if (r.layer_type === "xyz") {
            return new TileLayer({
                source: new XYZ({
                    url: r.base_url
                }),
                visible: !!r.visible_default,
                name: r.layer_name,
                isBaseLayer: true
            });
        }
    });
}
