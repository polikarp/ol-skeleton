/**
 * Handler to highlight selected, clicke, hovered, etc element on Map
 */

import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Style, Stroke, Fill, Circle as CircleStyle } from "ol/style";

let _map = null;
let _source = null;
let _layer = null;
let _format = null;

let _dataProjection = "EPSG:25830"; // Change if your GeoJSON comes in another CRS
let _lastKey = null;

/**
 * Initialize highlight layer for GFI hover.
 * @param {import("ol/Map").default} map OpenLayers map instance
 * @param {Object} [options]
 * @param {string} [options.dataProjection="EPSG:4326"] GeoJSON input projection
 * @param {number} [options.zIndex=9999] Layer zIndex
 * @returns {{ layer: any, source: any }}
 */
export function initHighlight(map, options = {}) {
    _map = map;

    _dataProjection = options.dataProjection || "EPSG:4326";

    if (_layer && _source) {
        // Already initialized
        return { layer: _layer, source: _source };
    }

    _format = new GeoJSON();

    _source = new VectorSource();

    _layer = new VectorLayer({
        source: _source,
        style: function (feature) {
            const geomType = feature.getGeometry().getType();

            if (geomType === "Point" || geomType === "MultiPoint") {
                return new Style({
                    image: new CircleStyle({
                        radius: 7,
                        fill: new Fill({ color: "rgba(255,0,0,0.8)" }),
                        stroke: new Stroke({ color: "#fff", width: 2 })
                    })
                });
            }

            return new Style({
                stroke: new Stroke({
                    color: "rgba(255,0,0,0.9)",
                    width: 3
                }),
                fill: new Fill({
                    color: "rgba(255,0,0,0.2)"
                })
            });
        },
        zIndex: Number.isFinite(options.zIndex) ? options.zIndex : 9999
    });

    _map.addLayer(_layer);

    return { layer: _layer, source: _source };
}

/**
 * Highlight geometry on hover.
 * @param {Object|null} geometry GeoJSON geometry object
 * @param {Object} [meta]
 * @param {string} [meta.headerId]
 */
export function onGeomHover(geometry, meta = {}) {
    if (!_map || !_source || !_format) {
        console.warn("initGfiHighlight(map) must be called before onGeomHover()");
        return;
    }
    if (!geometry) return;

    const key = meta?.headerId || JSON.stringify(geometry);
    if (_lastKey === key) return;
    _lastKey = key;

    _source.clear();

    let feature;
    try {
        feature = _format.readFeature(
        { type: "Feature", geometry, properties: {} },
        {
            dataProjection: _dataProjection,
            featureProjection: _map.getView().getProjection()
        }
        );
    } catch (err) {
        console.error("Error reading geometry for highlight", err);
        return;
    }

    _source.addFeature(feature);

    // Desktop: zoom on hover
    // if (!isMobile()) {
    //     zoomToGeometryFromGeoJson(geometry, { duration: 550, maxZoom: 10 });
    // }
}

export function onGeomOut(meta = {}) {
    if (!_map || !_source) return;

    const key = meta?.headerId;
    if (key && _lastKey !== key) return;

    _lastKey = null;
    _source.clear();
}



function isMobile() {
  return window.matchMedia("(max-width: 576px)").matches;
}

/**
 * Zoom to a GeoJSON geometry (same input as onGeomHover).
 * Desktop: centered.
 * Mobile: centered with vertical offset (~1/3 screen).
 */
export function zoomToGeometryFromGeoJson(geometry, opts = {}) {
    if (!_map || !_format || !geometry) return;

    const view = _map.getView();

    let feature;
    try {
        feature = _format.readFeature(
        { type: "Feature", geometry, properties: {} },
        {
            dataProjection: _dataProjection,
            featureProjection: view.getProjection()
        }
        );
    } catch (err) {
        console.error("Error reading geometry for zoom", err);
        return;
    }

    const olGeom = feature.getGeometry();
    if (!olGeom) return;

    const duration = opts.duration ?? 250;
    const maxZoom = opts.maxZoom ?? 19;

    // Update map size before fit (prevents wrong fit when layout changes)
    _map.updateSize();
    const size = _map.getSize();
    if (!size) return;

    const padding = opts.padding || (isMobile() ? [16, 16, 16, 16] : [24, 24, 24, 24]);

    view.fit(olGeom.getExtent(), { duration, maxZoom });

    // Mobile offset (push target up ~1/3 screen)
    if (!isMobile()) return;

    const offsetRatio = opts.offsetRatio ?? 0.33;

    window.setTimeout(() => {
        const center = view.getCenter();
        const res = view.getResolution();
        const size2 = _map.getSize();
        if (!center || !res || !size2) return;

        const shiftPxY = Math.round(size2[1] * offsetRatio);
        const newCenter = [center[0], center[1] + (shiftPxY * res)];

        view.animate({ center: newCenter, duration: 200 });
    }, duration + 30);
}
