// Add a custom copyright control to an OpenLayers map container.
// Requires: jQuery, OpenLayers map already initialized in DOM.

/**
 * Append a copyright label inside the OpenLayers map controls container.
 *
 * @param {Object} options
 * @param {string} options.mapSelector - CSS selector of the map container
 * @param {string} options.year
 * @param {string} options.version
 */
export function addMapCopyright({
    mapSelector = "#map",
    year,
    version,
}) {
    if (!year || !version) {
        console.warn("Year or version not provided for map copyright");
    }

    const $map = $(mapSelector);
    if ($map.length === 0) {
        console.error("Map container not found:", mapSelector);
        return;
    }

    const $controlsContainer = $map.find(".ol-overlaycontainer-stopevent");
    if ($controlsContainer.length === 0) {
        console.error("OpenLayers controls container not found inside map");
        return;
    }

    const $copyright = $(`
        <div class="ol-unselectable ol-control map-copyright">
            © HM Government Of Gibraltar ${escapeHtml(year)} - ${escapeHtml(version)}
        </div>
    `);

    $controlsContainer.append($copyright);
}

/* ============================================================
 * Helpers
 * ============================================================ */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
