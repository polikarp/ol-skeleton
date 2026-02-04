// gfi-panel-state.js
// Minimal panel open/close helpers.

export function openGfiPanel() {
    $("#gfiRightPanel").css("display", "flex");
}

export function closeGfiPanel() {
    $("#gfiRightPanel").css("display", "none");
}

export function setGfiPanelLoading() {
    $("#gfiPanelBody").html(`<div class="text-muted small">Loading identify results…</div>`);
    openGfiPanel();
}
