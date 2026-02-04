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

    const geoserverWMS = 'https://download.geoportal.gov.gi/geoserver/wms';
    //const geoserverWMS = '/geoserver/geoserver/wms';


    // GeoServer basemaps (WMS)
    const baseMapGib = new TileLayer({
        source: new TileWMS({
            url: geoserverWMS,
            params: {
                LAYERS: 'gibgis:basemap_basic_1',
                FORMAT: 'image/jpeg',
                TRANSPARENT: true,
            },
            serverType: 'geoserver',
        }),
        visible: true,
        name:'gibgis:basemap_basic_1',
        isBaseLayer: true
    });

    const baseMapGibAerial2013 = new TileLayer({
        source: new TileWMS({
            url: geoserverWMS,
            params: {
                LAYERS: 'gibgis:aerial2013_v3',
                FORMAT: 'image/jpeg',
            },
            serverType: 'geoserver',
        }),
        visible: false,
        name:'gibgis:aerial2013_v3',
        isBaseLayer: true
    });

    const baseMapGibAerial2003 = new TileLayer({
        source: new TileWMS({
            url: geoserverWMS,
            params: {
                LAYERS: 'gibgis:aerial2003',
                FORMAT: 'image/jpeg',
                TRANSPARENT: true,
            },
            serverType: 'geoserver',
        }),
        visible: false,
        name:'gibgis:aerial2003',
        isBaseLayer: true
    });

    const baseMapGibHybrid2013 = new TileLayer({
        source: new TileWMS({
            url: geoserverWMS,
            params: {
                LAYERS: 'gibgis:basemap_hybrid_2013_v3',
                FORMAT: 'image/jpeg',
                TRANSPARENT: true,
            },
            serverType: 'geoserver',
        }),
        visible: false,
        name:'gibgis:basemap_hybrid_2013_v3',
        isBaseLayer: true
    });

    // Optional extra basemaps (not EPSG:25830-native). Keep them disabled or use only if you know what you're doing.
    const osmLayer = new TileLayer({
        source: new OSM(),
        visible: false,
        name:'OSM_Base_Layer',
        isBaseLayer: true
    });

    const grayOSMLayer = new TileLayer({
        source: new XYZ({
            url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            attributions:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors ' +
                '&copy; <a href="https://carto.com/">CARTO</a>',
        }),
        visible: false,
        name:'OSM_Base_Gray_Layer',
        isBaseLayer: true
    });


    // Create map
    const map = new Map({
        controls: defaultControls({
            zoom: false,
        }),
        target: targetId,
        layers: [
            baseMapGib,
            baseMapGibAerial2013,
            baseMapGibAerial2003,
            baseMapGibHybrid2013,
            osmLayer,
            grayOSMLayer,
        ],
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
        layers: {
            baseMapGib,
            baseMapGibAerial2013,
            baseMapGibAerial2003,
            baseMapGibHybrid2013,
            osmLayer,
            grayOSMLayer,
        },
        searchLayer,
        searchSource,
    };
}
