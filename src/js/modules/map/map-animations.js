// resources/js/modules/map/map-animations.js

/**
 * Animate zoom in/out relative to current zoom.
 *
 * @param {import("ol/Map").default} map
 * @param {number} delta - Zoom delta (e.g. +1, -1)
 * @param {number} [fallbackZoom] - Fallback zoom if current zoom is null
 */
export function animateZoom(map, delta, fallbackZoom) {
    const view = map.getView();

    const currentZoom = view.getZoom();
    const zoom = currentZoom !== null && currentZoom !== undefined
        ? currentZoom
        : fallbackZoom;

    if (zoom === undefined) {
        return;
    }

    view.animate({
        zoom: zoom + delta,
        duration: 300,
        // easing: easeOut,
    });
}

/**
 * Animate map center (and optional zoom).
 *
 * @param {import("ol/Map").default} map
 * @param {[number, number]} center - Map coordinates (map projection, e.g. EPSG:25830)
 * @param {number} [zoom] - Optional zoom level
 */
export function animateCenter(map, center, zoom) {
    const view = map.getView();

    const animation = {
        center: center,
        duration: 500,
        // easing: easeOut,
    };

    if (zoom !== undefined) {
        animation.zoom = zoom;
    }

    view.animate(animation);
}

/**
 * Animate map rotation.
 *
 * @param {import("ol/Map").default} map
 * @param {number} degrees - Rotation increment in degrees (0 resets rotation)
 */
export function animateRotation(map, degrees) {
    const view = map.getView();

    const currentRotation = view.getRotation() ?? 0; // radians
    const increment = degrees * Math.PI / 180;       // degrees → radians

    const rotation = degrees !== 0
        ? currentRotation + increment
        : 0;

    view.animate({
        rotation: rotation,
        duration: 500,
        // easing: easeOut,
    });
}
