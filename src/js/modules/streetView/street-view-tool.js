//Handles Google Street View function. If api key is not present, street view button will be removed

import $ from 'jquery';

window.$ = window.jQuery = $;
(async () => {
  await import('jquery-ui-dist/jquery-ui.js');
})();

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { transform } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';

// let GOOGLE_API_KEY = 'AIzaSyDQ46LAUm6W4UNWF71WocAE59YTBi7B4_o';

let googleMapsConfigured = false;
let streetViewLibraryPromise = null;
let googleMapsEvent = null;

async function loadGoogleStreetViewLibrary() {
    if (!googleMapsConfigured) {
        setOptions({
            key: window.GOOGLE_API_KEY,
            v: 'weekly'
        });

        googleMapsConfigured = true;
    }

    if (!streetViewLibraryPromise) {
        streetViewLibraryPromise = importLibrary('streetView');
    }

    return streetViewLibraryPromise;
}

export function registerStreetViewTool(map) {
    let streetViewMode = false;
    let panorama = null;
    let service = null;

    const $btn = $('#btnStreetView');

    if (!window.GOOGLE_API_KEY || window.GOOGLE_API_KEY.trim() === '') {
        $btn.prev('div.button-separator').remove();
        $btn.remove();

        return {
            getState: () => ({ streetViewMode })
        };
    }

    const $panel = $('#streetViewPanel');
    const $status = $('#streetViewStatus');
    const $map = $(map.getTargetElement());

    const streetViewFeature = new Feature();

    const streetViewLayer = new VectorLayer({
        zIndex: 99999,
        source: new VectorSource({
            features: [streetViewFeature]
        })
    });

    streetViewLayer.setVisible(false);
    map.addLayer(streetViewLayer);

    function initStreetViewDraggable() {
        if (!$panel.length) {
            return;
        }

        if (typeof $panel.draggable !== 'function') {
            console.error('jQuery UI draggable is not loaded');
            return;
        }

        // Avoid duplicated or broken draggable instances
        if ($panel.data('ui-draggable')) {
            $panel.draggable('destroy');
        }

        $panel.draggable({
            handle: '.street-view-header',
            scroll: false,
            containment: 'window',
            appendTo: 'body'
        });
    }

    function enable() {
        streetViewMode = true;
        $btn.addClass('active');
        $map.addClass('street-view-active');
    }

    function disable() {
        streetViewMode = false;
        $btn.removeClass('active');
        $map.removeClass('street-view-active');
    }

    function showStatus(msg) {
        $status.text(msg).show();
    }

    function hideStatus() {
        $status.text('').hide();
    }

    function removeStreetViewMarker() {
        streetViewFeature.setGeometry(null);
        streetViewLayer.setVisible(false);
    }

    function createStreetViewStyle(rotationRad = 0) {
        return new Style({
            image: new Icon({
                src:
                    'data:image/svg+xml;utf8,' +
                    encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg"
                             width="64"
                             height="64"
                             viewBox="0 0 64 64">

                            <circle
                                cx="32"
                                cy="32"
                                r="18"
                                fill="#1976d2"
                                stroke="white"
                                stroke-width="4"
                            />

                            <path
                                d="M32 8 L46 34 L32 28 L18 34 Z"
                                fill="#ffeb3b"
                                stroke="#222"
                                stroke-width="2"
                            />

                        </svg>
                    `),
                anchor: [0.5, 0.5],
                rotateWithView: true,
                rotation: rotationRad,
                scale: 0.9
            })
        });
    }

    function showStreetViewMarker(mapCoord, rotationRad = 0) {
        streetViewLayer.setVisible(true);

        streetViewFeature.setGeometry(
            new Point(mapCoord)
        );

        streetViewFeature.setStyle(
            createStreetViewStyle(rotationRad)
        );
    }

    function getStreetViewMapCoordFromLatLng(latLng) {
        return transform(
            [latLng.lng(), latLng.lat()],
            'EPSG:4326',
            map.getView().getProjection().getCode()
        );
    }

    function updateMarkerFromPanorama(animateMap = true) {
        if (!panorama) {
            return;
        }

        const pos = panorama.getPosition();

        if (!pos) {
            return;
        }

        const mapCoord = getStreetViewMapCoordFromLatLng(pos);
        const heading = panorama.getPov()?.heading || 0;
        const rotationRad = heading * Math.PI / 180;

        showStreetViewMarker(mapCoord, rotationRad);

        if (animateMap) {
            map.getView().animate({
                center: mapCoord,
                duration: 300
            });
        }
    }

    async function openStreetView(coord) {
        const {
            StreetViewService,
            StreetViewPanorama,
            StreetViewStatus,
            StreetViewSource,
            event
        } = await loadGoogleStreetViewLibrary();

        // googleMapsEvent = event;

        if (!service) {
            service = new StreetViewService();
        }

        const lonlat = transform(
            coord,
            map.getView().getProjection().getCode(),
            'EPSG:4326'
        );

        const position = {
            lat: lonlat[1],
            lng: lonlat[0]
        };

        showStatus('Buscando Street View...');

        service.getPanorama(
            {
                location: position,
                radius: 50,
                source: StreetViewSource.OUTDOOR
            },
            (data, status) => {
                if (status !== StreetViewStatus.OK) {
                    showStatus('Street View not available');
                    removeStreetViewMarker();
                    return;
                }

                hideStatus();

                $panel.stop(true, true).fadeIn(150, function () {
                    initStreetViewDraggable();

                    const container = document.getElementById('streetViewContainer');

                    if (!container) {
                        console.error('Street View container not found');
                        return;
                    }

                    if (!panorama) {
                        panorama = new StreetViewPanorama(
                            container,
                            {
                                position: data.location.latLng,
                                pov: {
                                    heading: 0,
                                    pitch: 0
                                },
                                zoom: 1,
                                addressControl: false,
                                fullscreenControl: true,
                                motionTracking: false
                            }
                        );

                        panorama.addListener('position_changed', () => {
                            updateMarkerFromPanorama(true);
                        });

                        panorama.addListener('pov_changed', () => {
                            updateMarkerFromPanorama(false);
                        });
                    } else {
                        panorama.setPosition(data.location.latLng);
                        updateMarkerFromPanorama(true);
                    }

                    setTimeout(() => {
                        triggerStreetViewResize();
                        panorama.setPosition(data.location.latLng);
                        updateMarkerFromPanorama(true);
                    }, 200);
                });
            }
        );
    }

    function triggerStreetViewResize() {
        if (!panorama) {
            return;
        }

        if (window.google?.maps?.event) {
            window.google.maps.event.trigger(panorama, 'resize');
        }
    }

    $btn.on('click', () => {
        streetViewMode ? disable() : enable();
    });

    $('#closeStreetView').on('click', () => {
        $panel.fadeOut(150);
        disable();
        hideStatus();
        removeStreetViewMarker();
    });

    map.on('singleclick', (evt) => {
        if (!streetViewMode) {
            return;
        }

        openStreetView(evt.coordinate);
        disable();
    });

    /**
     * Handle esc keyboard button to disable street view
     */
    $(document).on('keydown.streetview', (e) => {
        if (e.key !== 'Escape') {
            return;
        }
        if (!streetViewMode) {
            return;
        }
        disable();
        hideStatus();
        removeStreetViewMarker();
    });

    return {
        getState: () => ({ streetViewMode }),
        enable,
        disable,
        removeStreetViewMarker
    };
}