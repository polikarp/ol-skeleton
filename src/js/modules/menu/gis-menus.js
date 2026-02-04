/**
 * Handlers for bottom menú of GIS utilities
 */

import $ from 'jquery';
window.$ = window.jQuery = $;
(async () => {
  await import('jquery-ui-dist/jquery-ui.js');
})();
import { addMeasureInteraction, removeMeasureInteraction } from '../../legacy/measureOpenlayers';
import { enableElevationProfile, removeElevation } from '../map/elevation-profile';
import { animateZoom, animateCenter, animateRotation } from '../map/map-animations';
import {initialCenter, initialZoom, initialRotation} from '../map/map-config';


/**
 * Register legacy map tools handlers (measure + profile).
 * NOTE: This assumes the following functions already exist globally/imported:
 * - addMeasureInteraction(map, type)
 * - removeMeasureInteraction(map)
 * - enableElevationProfile(map)
 * - removeElevation(map)
 *
 * It also assumes jQuery UI is available if you use draggable/resizable.
 *
 * @param {import("ol/Map").default} map
 * @returns {{ getState: () => {measuring:boolean, profiling:boolean} }}
 */
export function registerGisBottomMenuTools(map, options = {}) {

    let measuring = false;
    let profiling = false;

    $('#btnMeasureLength').on('click', function () {
        addMeasureInteraction(map, 'LineString');
        $('#btnCancelMeasure').toggleClass('d-none');
        $('#btnCancelMeasure').next('div').toggleClass('d-none');
        measuring = true;
    });

    $('#btnMeasureArea').on('click', function () {
        addMeasureInteraction(map, 'Polygon');
        $('#btnCancelMeasure').toggleClass('d-none');
        $('#btnCancelMeasure').next('div').toggleClass('d-none');
        measuring = true;
    });

    $('#btnCancelMeasure').on('click', function () {
        removeMeasureInteraction(map);
        measuring = false;
    });

    $('#btnProfile').on('click', function () {
        enableElevationProfile(map, options);
        profiling = true;
    });

    $('#closeProfile').on('click', function () {
        $('#profileWindow').hide();
        removeElevation(map);
        profiling = false;
    });

    // Requires jQuery UI (draggable/resizable)
    if ($.fn.draggable && $.fn.resizable) {
        $('#profileWindow')
            .draggable({ handle: '.profile-header' })
            .resizable({ minWidth: 250, minHeight: 150 });
    } else {
        console.warn('jQuery UI draggable/resizable not available. Profile window will not be draggable/resizable.');
    }

     $('#gps').on('click', function () {

        if (!navigator.geolocation) {
            alert('Geolocation not supported by this browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function (position) {

                const coords = fromLonLat(
                    [position.coords.longitude, position.coords.latitude],
                    'EPSG:25830'
                );

                animateCenter(map, coords, 16);
            },
            function (error) {
                alert('Error getting GPS location');
                console.error(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });

    $('#home').on('click', function () {
        animateCenter(map, initialCenter, initialZoom);
        animateRotation(map, initialRotation);
    });

    $('#rotate').on('click', function () {
        animateRotation(map, initialRotation);
    });

    $('#rotate90').on('click', function () {
        animateRotation(map, -90);
    });

    return {
        getState: () => ({ measuring, profiling })
    };


}

export function registerGisLeftMenu(map, options = {}) {
    $('.toolbar-button').on('click', function (e) {
        e.stopPropagation();

        const targetId = $(this).data('target');
        const $targetMenu = $('#' + targetId);
        const buttonOffsetTop = $(this).offset().top;


        $('.gis-toolbar-flyout').not($targetMenu).fadeOut(150);


        if ($targetMenu.is(':visible')) {
            $targetMenu.fadeOut(150);
        } else {
            $targetMenu
                .css('top', buttonOffsetTop + 'px')
                .fadeIn(200);
        }
    });

    $('.base-thumb').on('click', function () {
        const selectedLayer = $(this).data('layer');
        map.getLayers().forEach(layer => {
            if (!layer.get('isBaseLayer')) {
                return;
            }
            layer.setVisible(layer.get('name') === selectedLayer);
        });

        $('.base-thumb').css('border', '2px solid transparent');
        $(this).css('border', '2px solid #0d6efd');
    });
}


