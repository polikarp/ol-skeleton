//Creates mini map for table results

import Map from 'ol/Map';
import View from 'ol/View';

import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';

import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';

let tableMiniMap = null;
let mainMap = null;
let miniMapSelector = null;

export function createTableMiniMap(map, targetSelector) {
    mainMap = map;
    miniMapSelector = targetSelector;

    const $target = $(miniMapSelector);

    if (!mainMap || !$target.length) {
        return null;
    }

    tableMiniMap = new Map({
        target: $target.attr("id"),
        layers: [],
        view: new View({
            projection: mainMap.getView().getProjection(),
            center: mainMap.getView().getCenter(),
            zoom: mainMap.getView().getZoom(),
            rotation: mainMap.getView().getRotation()
        }),
        // controls: contrdefaults.defaults({
        //     attribution: false,
        //     rotate: false,
        //     zoom: true
        // }),
        // interactions: interaction.defaults.defaults({
        //     mouseWheelZoom: true,
        //     dragPan: true,
        //     doubleClickZoom: true
        // })
    });

    return tableMiniMap;
}

export function refreshTableMiniMap() {
    if (!tableMiniMap || !mainMap) {
        return;
    }

    clearTableMiniMapLayers();

    mainMap.getLayers().forEach(function (layer) {
        if (!shouldCloneLayer(layer)) {
            return;
        }

        const clonedLayer = cloneLayerForMiniMap(layer);

        if (clonedLayer) {
            tableMiniMap.addLayer(clonedLayer);
        }
    });

    syncTableMiniMapView();
}

export function getTableMiniMap() {
    return tableMiniMap;
}

function clearTableMiniMapLayers() {
    const layersToRemove = [];
    tableMiniMap.getLayers().forEach(function (layer) {
        // if (layer.get('isMiniMapHighlight') === true) {
        //     return;
        // }
        layersToRemove.push(layer);
    });
    layersToRemove.forEach(function (layer) {
        tableMiniMap.removeLayer(layer);
    });
}

function shouldCloneLayer(layer) {
    if (!layer || !layer.getVisible()) {
        return false;
    }

    if (layer.get("isMiniMapLayer")) {
        return false;
    }

    if (layer.get("excludeFromMiniMap") === true) {
        return false;
    }

    return true;
}

function syncTableMiniMapView() {
    const mainView = mainMap.getView();
    const miniView = tableMiniMap.getView();

    miniView.setCenter(mainView.getCenter());
    miniView.setZoom(mainView.getZoom());
    miniView.setRotation(mainView.getRotation());

    setTimeout(function () {
        tableMiniMap.updateSize();

        const extent = mainView.calculateExtent(mainMap.getSize());

        miniView.fit(extent, {
            size: tableMiniMap.getSize(),
            padding: [20, 20, 20, 20],
            nearest: true
        });
    }, 250);
}

function cloneLayerForMiniMap(layer) {
    const source = layer.getSource();

    if (!source) {
        return null;
    }

    const clonedSource = cloneSourceForMiniMap(source);

    if (!clonedSource) {
        return null;
    }

    const commonOptions = {
        source: clonedSource,
        visible: layer.getVisible(),
        opacity: layer.getOpacity(),
        zIndex: layer.getZIndex()
    };

    let clonedLayer = null;

    if (layer instanceof TileLayer) {
        clonedLayer = new TileLayer(commonOptions);
    } else if (layer instanceof ImageLayer) {
        clonedLayer = new ImageLayer(commonOptions);
    } else if (layer instanceof VectorLayer) {
        clonedLayer = new VectorLayer({
            ...commonOptions,
            style: layer.getStyle()
        });
    }

    if (!clonedLayer) {
        return null;
    }

    clonedLayer.setProperties({
        layerName: layer.get("layerName"),
        description: layer.get("description"),
        serviceType: layer.get("serviceType"),
        isMiniMapLayer: true
    });

    return clonedLayer;
}

function cloneSourceForMiniMap(source) {
    if (source instanceof TileWMS) {
        return new TileWMS({
            url: getSourceUrl(source),
            params: {
                ...source.getParams()
            },
            serverType: source.getServerType ? source.getServerType() : undefined,
            crossOrigin: "anonymous"
        });
    }

    if (source instanceof ImageWMS) {
        return new ImageWMS({
            url: getSourceUrl(source),
            params: {
                ...source.getParams()
            },
            serverType: source.getServerType ? source.getServerType() : undefined,
            crossOrigin: "anonymous"
        });
    }

    if (source instanceof OSM) {
        return new OSM({
            crossOrigin: "anonymous"
        });
    }

    if (source instanceof XYZ) {
        return new XYZ({
            url: getSourceUrl(source),
            crossOrigin: "anonymous"
        });
    }

    if (source instanceof VectorLayer) {
        return new VectorLayer({
            features: source.getFeatures().map(function (feature) {
                return feature.clone();
            })
        });
    }

    return null;
}

function getSourceUrl(source) {
    if (source.getUrls && source.getUrls()) {
        return source.getUrls()[0];
    }

    if (source.getUrl) {
        return source.getUrl();
    }

    return undefined;
}