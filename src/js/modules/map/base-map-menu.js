/**
 * Base map selector menu (jQuery module)
 *
 * Requirements:
 * - jQuery must be available (imported in app.js and assigned to window.$ / window.jQuery)
 * - HTML container must exist (default: #baseMapMenuContent)
 *
 * Images path convention:
 * /images/baselayers/{layerName}.png
 */

export function initBaseMapMenu({
    layers = [],
    selectedLayer = null,
    containerSelector = "#baseMapMenuContent",
    onSelect = null
} = {}) {
    if (!Array.isArray(layers)) {
        return;
    }

    // Render initial menu
    renderBaseMapMenu({ layers, selectedLayer, containerSelector });


}

/**
 * Render base map selector thumbnails
 *
 * @param {string[]} layers
 * @param {string|null} selectedLayer
 * @param {string} containerSelector
 */
export function renderBaseMapMenu({ layers, selectedLayer = null, containerSelector }) {
    const $container = $(containerSelector);

    if (!$container.length || !Array.isArray(layers)) {
        return;
    }

    $container.empty();

    layers.forEach((layer) => {
        // Extract layer name after workspace (equivalent to Str::after in Laravel)
        const layerName = layer.includes(":")
            ? layer.split(":")[1]
            : layer;

        const $img = $("<img>", {
            src: `/images/baselayers/${layerName}.png`,
            class: "img-fluid rounded base-thumb",
            "data-layer": layer,
            title: layer
        });

        // Highlight selected base layer
        if (layer === selectedLayer) {
            $img.css("border", "2px solid #0d6efd");
        }

        const $col = $("<div>", { class: "col-4" }).append($img);
        $container.append($col);
    });
}
