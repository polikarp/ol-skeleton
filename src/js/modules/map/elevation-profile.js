// resources/js/modules/map/elevation-profile.js

import $ from 'jquery';

import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Draw from 'ol/interaction/Draw';

import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

import WKT from 'ol/format/WKT';

import Chart from 'chart.js/auto';

import { PROXY_PATH } from "./map-config";

/**
 * Module-scoped state for the elevation profile tool.
 */
let vectorSource = null;
let vectorLayer = null;
let draw = null;

let profileMarkerSource = null;
let profileMarkerLayer = null;

/**
 * Default GeoServer OWS endpoint (can be overridden via options).
 */
const GEOSERVER_HEIGHT_PROFILE_PROD = 'https://download.geoportal.gov.gi/geoserver/inspire/ows';

/**
 * Enable the elevation profile tool:
 * - User draws a LineString
 * - Request GeoServer WFS (profile_along_line_step)
 * - Render Chart.js profile
 * - Hover on chart -> highlights point on map
 *
 * @param {import("ol/Map").default} map
 * @param {object} [options]
 * @param {string} [options.geoserverOwsUrl] - GeoServer OWS endpoint
 * @param {number} [options.step=10] - Sampling step
 * @param {string} [options.typeName='profile_along_line_step'] - WFS typeName
 * @param {boolean} [options.useProxy=false] - If true, wraps with /proxy/geoserver?url=
 */
export function enableElevationProfile(map, options = {}) {
    const geoserverOwsUrl = options.geoserverOwsUrl ?? GEOSERVER_HEIGHT_PROFILE_PROD;
    const step = options.step ?? 10;
    const typeName = options.typeName ?? 'profile_along_line_step';
    const useProxy = options.useProxy ?? false;

    // Reset any previous state first
    removeElevation(map);

    vectorSource = new VectorSource();

    vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
            stroke: new Stroke({ color: 'blue', width: 4 }),
        }),
        zIndex: 1000,
    });

    map.addLayer(vectorLayer);

    draw = new Draw({
        source: vectorSource,
        type: 'LineString',
    });

    map.addInteraction(draw);

    draw.on('drawend', async (evt) => {
        $('#profileWindow').show();

        const geom = evt.feature.getGeometry();

        // Convert geometry to WKT in current map projection (EPSG:25830 in your case)
        const wktFormat = new WKT();
        const wkt = wktFormat.writeGeometry(geom);

        // Base64 encode WKT for viewparams
        const wkt64 = btoa(wkt);

        // GeoServer WFS request
        const url =
            `${geoserverOwsUrl}` +
            `?service=WFS&version=1.0.0&request=GetFeature` +
            `&typeName=${encodeURIComponent(typeName)}` +
            `&outputFormat=application/json` +
            `&viewparams=line:${encodeURIComponent(wkt64)};step:${encodeURIComponent(String(step))}`;

        const requestUrl = useProxy
            ? `${PROXY_PATH}${encodeURIComponent(url)}`
            : url;

        try {
            const response = await fetch(requestUrl, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`GeoServer profile request failed: HTTP ${response.status}`);
            }

            const geojson = await response.json();

            // Convert GeoServer GeoJSON into profile arrays
            const results = (geojson.features || []).map((f) => ({
                // GeoServer returns Point geometry coordinates
                coord: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
                elevation: f.properties.levelstr,
                distanceKm: (f.properties.distance_m / 1000.0),
            }));

            const elevations = results.map(r => r.elevation);
            const profileCoords = results.map(r => r.coord);
            const distances = results.map(r => r.distanceKm.toFixed(2) + ' km');

            // Recreate canvas to avoid Chart.js leftovers
            $('#profile').replaceWith('<canvas id="profile"></canvas>');
            $('#profileWindow').show();

            const canvas = document.getElementById('profile');
            if (!canvas) {
                throw new Error('Profile canvas element not found (#profile)');
            }

            const ctx = canvas.getContext('2d');

            // Render chart
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: distances,
                    datasets: [{
                        label: 'Elevation (m)',
                        data: elevations,
                        tension: 0.6,
                        fill: true,
                        pointRadius: 1,
                        pointHoverRadius: 6,
                        hitRadius: 10,
                    }]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'nearest',
                        intersect: false,
                    },
                    onHover: function (_evt, activeEls) {
                        if (activeEls && activeEls.length > 0) {
                            const idx = activeEls[0].index;
                            const coord = profileCoords[idx];
                            if (coord) {
                                highlightPointOnMap(map, coord);
                            }
                        } else {
                            clearProfileHighlight();
                        }
                    },
                    scales: {
                        y: { title: { display: true, text: 'Elevation (m)' } },
                        x: { title: { display: true, text: 'Distance (km)' } },
                    }
                }
            });

            // Remove draw interaction after drawing once
            if (draw) {
                map.removeInteraction(draw);
                draw = null;
            }

        } catch (err) {
            alert('Error fetching elevation data from GeoServer');
            console.error(err);
            removeElevation(map);
        }
    });
}

/**
 * Remove elevation profile tool:
 * - removes draw interaction
 * - removes line layer
 * - clears highlight marker
 *
 * @param {import("ol/Map").default} map
 */
export function removeElevation(map) {
    if (vectorSource) {
        vectorSource.clear();
    }

    if (draw) {
        map.removeInteraction(draw);
        draw = null;
    }

    if (vectorLayer) {
        map.removeLayer(vectorLayer);
        vectorLayer = null;
    }

    clearProfileHighlight();

    if (profileMarkerLayer) {
        map.removeLayer(profileMarkerLayer);
        profileMarkerLayer = null;
        profileMarkerSource = null;
    }

    vectorSource = null;
}

/**
 * Highlight profile point on map (expects map coordinates in EPSG:25830).
 *
 * @param {import("ol/Map").default} map
 * @param {[number, number]} mapCoord
 */
function highlightPointOnMap(map, mapCoord) {
    const feature = new Feature({
        geometry: new Point(mapCoord),
    });

    feature.setStyle(new Style({
        image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: 'red' }),
            stroke: new Stroke({ color: 'white', width: 2 }),
        }),
        zIndex: 1001,
    }));

    if (!profileMarkerLayer) {
        profileMarkerSource = new VectorSource();
        profileMarkerLayer = new VectorLayer({
            source: profileMarkerSource,
            zIndex: 1001,
        });
        map.addLayer(profileMarkerLayer);
    } else {
        profileMarkerSource.clear();
    }

    profileMarkerSource.addFeature(feature);
}

/**
 * Clear highlight marker only (keeps the marker layer if created).
 */
function clearProfileHighlight() {
    if (profileMarkerSource) {
        profileMarkerSource.clear();
    }
}
