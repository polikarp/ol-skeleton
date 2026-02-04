import { transform } from 'ol/proj';

/**
 * Enable mouse coordinates display in multiple projections
 *
 * @param {ol.Map} map OpenLayers map instance
 * @param {string|HTMLElement|jQuery} target DOM element for output
 */
export function enableMouseCoordinates(map, target) {

    const $target = $(target);

    map.on('pointermove', function (evt) {

        if (!evt.coordinate) {
            return;
        }

        // Map projection (assumed EPSG:25830)
        const c25830 = evt.coordinate;

        // Transform coordinates
        const c4326 = transform(c25830, 'EPSG:25830', 'EPSG:4326');
        const c3857 = transform(c25830, 'EPSG:25830', 'EPSG:3857');

        const text = `
            25830 → X: ${c25830[0].toFixed(2)} Y: ${c25830[1].toFixed(2)} |
            4326 → Lon: ${c4326[0].toFixed(6)} Lat: ${c4326[1].toFixed(6)}
        `;

        $target.text(text.trim());
    });
}
