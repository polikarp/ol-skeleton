

export function registerMoveEndHandler(map, minZoomLevelDisplay) {

    map.on('moveend', () => {

        const zoom = parseInt(map.getView().getZoom());
        const $btn = $('#openTableBtn, #btnSpatialViewport');
        const $icon = $btn.find('i');
        
        if (zoom < minZoomLevelDisplay || window.LAST_DRAW_GEOM) {
            // Disable buttons when zoom is too low
            $icon.addClass('text-muted').css({ opacity: 0.5 });
            $btn.prop('disabled', true).css('cursor', 'not-allowed');

        } else if(!window.LAST_DRAW_GEOM) {
            // Enable buttons when zoom is valid and there is no drawn zone by user
            $icon.removeClass('text-muted').css({ opacity: 1 });
            $btn.prop('disabled', false).css('cursor', 'pointer');
        }


    });

}
