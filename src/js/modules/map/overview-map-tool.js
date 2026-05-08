import OverviewMap from 'ol/control/OverviewMap';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import WMTS from 'ol/source/WMTS';

function cloneBaseLayer(layer) {
    if (!layer) {
        return new TileLayer({
            source: new OSM()
        });
    }

    const source = layer.getSource();
    let clonedSource = null;

    if (source instanceof OSM) {
        clonedSource = new OSM();

    } else if (source instanceof XYZ) {
        clonedSource = new XYZ({
            url: source.getUrls()?.[0] || source.getUrl(),
            attributions: source.getAttributions(),
            maxZoom: source.getMaxZoom(),
            minZoom: source.getMinZoom(),
            crossOrigin: 'anonymous'
        });

    } else if (source instanceof TileWMS) {
        clonedSource = new TileWMS({
            url: source.getUrls()?.[0] || source.getUrl(),
            params: {
                ...source.getParams()
            },
            serverType: 'geoserver',
            crossOrigin: 'anonymous'
        });

    } else {
        clonedSource = new OSM();
    }

    const clonedLayer = new TileLayer({
        source: clonedSource,
        opacity: layer.getOpacity(),
        visible: true
    });

    clonedLayer.set('isOverviewLayer', true);

    return clonedLayer;
}

export function registerOverviewMapTool(map, options = {}) {

    const collapsed = options.collapsed ?? false;
    const collapsible = options.collapsible ?? false;

    const selectedBaseLayer = map.getLayers().getArray()
        .find(layer =>
            layer.getVisible() &&
            layer.get('isBaseLayer')
        );

    const overviewLayer = cloneBaseLayer(selectedBaseLayer);

    const overviewControl = new OverviewMap({
        collapsed,
        collapsible,
        layers: [overviewLayer]
    });

    map.addControl(overviewControl);

    return overviewControl;
}