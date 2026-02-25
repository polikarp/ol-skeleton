

import $ from "jquery";

export function initCompass(map) {

    const $compass = $("#map-compass");
    const $btn = $compass.find(".ol-compass-btn");
    const $needle = $compass.find(".compass-needle");

    const view = map.getView();

    let isDragging = false;
    let moved = false;
    let pointerId = null;

    function updateNeedleFromView() {
        const rot = view.getRotation() || 0;
        const deg = (-rot * 180) / Math.PI;
        $needle.css("transform", `rotate(${deg}deg)`);
    }

    // Convert pointer position to rotation (radians)
    function pointerToRotation(evt) {
        const svg = $compass.find("svg").get(0);
        const rect = svg.getBoundingClientRect();

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const x = evt.clientX - cx;
        const y = evt.clientY - cy;

        // Angle where 0 should be "north" (top)
        const angle = Math.atan2(y, x);           // [-pi, pi], 0 at east
        const northAngle = angle + Math.PI / 2;   // 0 at north (top)

        // Set map rotation so dragging feels natural.
        // If direction feels inverted in your setup, remove the minus sign.
        return -northAngle;
    }

    // Keep compass in sync when user rotates map by other means
    view.on("change:rotation", updateNeedleFromView);
    updateNeedleFromView();

    // Pointer events: drag on compass rotates the map in real time
    $btn.on("pointerdown", function (e) {
        e.preventDefault();

        isDragging = true;
        moved = false;
        pointerId = e.originalEvent.pointerId;

        this.setPointerCapture(pointerId);
    });

    $btn.on("pointermove", function (e) {
        if (!isDragging) return;

        const ev = e.originalEvent;
        if (pointerId !== null && ev.pointerId !== pointerId) return;

        moved = true;

        const rot = pointerToRotation(ev);
        view.setRotation(rot); // live rotation while dragging
    });

    $btn.on("pointerup pointercancel", function (e) {
        if (!isDragging) return;

        const ev = e.originalEvent;
        if (pointerId !== null && ev.pointerId !== pointerId) return;

        isDragging = false;

        try {
        this.releasePointerCapture(pointerId);
        } catch (_) {}

        pointerId = null;

        // If it was a click (no real move), reset north
        if (!moved) {
        view.animate({ rotation: 0, duration: 300 });
        }
    });
}