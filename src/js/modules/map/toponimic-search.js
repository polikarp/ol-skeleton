// resources/js/addressSearchWfs.js
// Address autocomplete search using WFS + OpenLayers
// Requires: jQuery, OpenLayers

import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import GeoJSON from "ol/format/GeoJSON";
import {Stroke, Fill, Circle as CircleStyle} from "ol/style";
import {buffer as bufferExtent} from "ol/extent";

import {appendParams} from 'ol/uri.js';

import {applyProxyIfNeeded} from './wms-capabilities-loader';

const DEFAULT_SERVER = "http://localhost:9090/geoserver/ccgp";

/**
 * Initialize WFS address search with autocomplete and map interaction.
 *
 * @param {Object} options
 * @param {import("ol/Map").default} options.map
 * @param {string} options.wfsUrl
 * @param {boolean} options.useProxy
 * @param {string} options.proxyPath
 * @param {string} options.inputSelector
 * @param {string} options.resultsSelector
 * @param {string} options.clearButtonSelector
 * @param {number} options.minChars
 * @param {number} options.debounceMs
 */
export function initAddressSearchWfs({
    map,
    useProxy = false,
    proxyPath,
    wfsUrl = DEFAULT_SERVER,
    layerName = "ccgp:all_places_llm_search_vw",
    parentSelector = ".search-box",
    inputSelector = "#searchInput",
    resultsSelector = "#autocompleteResults",
    clearButtonSelector = "#clearSearch",
    minChars = 3,
    debounceMs = 300,
}) {

    if (!map) throw new Error("Map is required");

    if(!wfsUrl){
        $("div" + parentSelector).remove();
    }

    const searchLayer = new VectorLayer({
        source: new VectorSource(),
        zIndex: 1000,
    });

    map.addLayer(searchLayer);


    


    let debounceTimer = null;
    let searchMarker = null;

    const resultGeometries = new Map();

    const geoJsonFormat = new GeoJSON();


    /**
     * Toponimic search results
     * @param {*} query 
     */
    // async function searchTopo(query){
    //     const baseUrl = applyProxyIfNeeded(wfsUrl, useProxy, proxyPath);
    //     const params = {
    //         service: 'WFS',
    //         version: '1.1.0',
    //         request: 'GetFeature',
    //         typeName: layerName,
    //         outputFormat: 'application/json',
    //         srsName: 'EPSG:25830',
    //         maxFeatures: 50,
    //         CQL_FILTER: `lower ILIKE '%${query.toLowerCase()}%'`
    //     };

    //     const url = appendParams(`${baseUrl}/wfs`, params);

    //     const response = await fetch(url);
    //     const geojson = await response.json();
    //     return geojson;
    // }

    const TYPES = ["topolabel", "road", "toilet", "estate", "address", "block", "place", "pit"];

    async function searchTopoByType(query, type) {
        const safeQuery = query.toLowerCase().replaceAll("'", "''");
        const safeType = type.replaceAll("'", "''");
        const baseUrl = applyProxyIfNeeded(wfsUrl, useProxy, proxyPath);

        const params = {
            service: "WFS",
            version: "1.1.0",
            request: "GetFeature",
            typeName: layerName,
            outputFormat: "application/json",
            srsName: "EPSG:25830",
            maxFeatures: 15,
            CQL_FILTER: `lower ILIKE '%${safeQuery}%' AND type = '${safeType}'`
        };

        const url = appendParams(`${baseUrl}/wfs`, params);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`GeoServer WFS error: ${response.status}`);
        }

        return await response.json();
    }

    async function searchTopoGrouped(query) {
        const responses = await Promise.all(
            TYPES.map(type => searchTopoByType(query, type))
        );

        return {
            type: "FeatureCollection",
            features: responses.flatMap(response => response.features || [])
        };
    }

    /* ---------------------------------------------------------
     * Input handler (autocomplete)
     * --------------------------------------------------------- */
    $(document).on("input", inputSelector, async function () {
        const query = $(this).val().trim();
        const $results = $(resultsSelector);

        $(clearButtonSelector).toggleClass("d-none", query.length === 0);

        clearTimeout(debounceTimer);

        if (query.length < minChars) {
            $results.empty().addClass("d-none");
            return;
        }

        debounceTimer = setTimeout(async ()  => {
            const geojson = await searchTopoGrouped(query);

            $results.empty();
            resultGeometries.clear();

            const features = geojson?.features || [];

            if (features.length === 0) {
                $results.addClass("d-none");
                return;
            }

            features.forEach((feature, index) => {
                const props = feature.properties || {};
                const geometry = feature.geometry;

                const name = props.name || "";
                const type = props.type || "";

                if (!name || !geometry) return;

                const resultId = `address-result-${index}`;

                resultGeometries.set(resultId, geometry);

                const $li = $("<li>")
                    .addClass("list-group-item list-group-item-action d-flex align-items-center gap-2")
                    .attr("data-result-id", resultId)
                    .attr("data-type", type)
                    .append(
                        $("<i>").addClass(getPlaceTypeIcon(type))
                    )
                    .append(
                        $("<span>").text(name)
                    );

                $results.append($li);
            });

            $results.removeClass("d-none");

        }, debounceMs);

    });

    /* ---------------------------------------------------------
     * Result click handler
     * --------------------------------------------------------- */


    $(document).on("click", `${resultsSelector} li`, function () {
        const resultId = $(this).data("result-id");
        const geometry = resultGeometries.get(resultId);

        if (!geometry) return;

        const source = searchLayer.getSource();

        // Remove previous search results
        source.clear();

        let feature;

        try {
            feature = geoJsonFormat.readFeature(
                {
                    type: "Feature",
                    geometry,
                    properties: {}
                },
                {
                    dataProjection: "EPSG:25830",
                    featureProjection: map.getView().getProjection()
                }
            );
        } catch (err) {
            console.error("Error reading search geometry", err);
            return;
        }

        const olGeometry = feature.getGeometry();

        if (!olGeometry) return;

        // Apply style depending on geometry type
        feature.setStyle(getSearchResultStyle(olGeometry.getType()));

        source.addFeature(feature);

        zoomToBufferExtent(olGeometry, 200);

        $(inputSelector).val($(this).text());
        $(resultsSelector).empty().addClass("d-none");
        $(clearButtonSelector).removeClass("d-none");
    });

    /* ---------------------------------------------------------
     * Clear search handler
     * --------------------------------------------------------- */
    $(document).on("click", clearButtonSelector, function () {
        $(inputSelector).val("");
        $(resultsSelector).empty().addClass("d-none");
        $(this).addClass("d-none");

        if(searchLayer){
            searchLayer.getSource().clear();
        }
    });

    /**
     * Makes zoom to buffer. Add buffer in meters
     */
    function zoomToBufferExtent(olGeometry, meters = 500){
        const extent = bufferExtent(
            olGeometry.getExtent(),
            meters
        );
        map.getView().fit(extent, {
            padding: [80, 80, 80, 80],
            duration: 400,
            maxZoom: 11
        });
    }
}

/**
 * Get default style depends on geometryType
 * @param {*} geometryType 
 * @returns 
 */
function getSearchResultStyle(geometryType) {
    if (geometryType === "Point" || geometryType === "MultiPoint") {
        return new Style({
            image: new Icon({
                src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                scale: 0.05,
                anchor: [0.5, 1],
                anchorXUnits: "fraction",
                anchorYUnits: "fraction"
            })
        });
    }

    if (geometryType === "LineString" || geometryType === "MultiLineString") {
        return new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 4
            })
        });
    }

    if (geometryType === "Polygon" || geometryType === "MultiPolygon") {
        return new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 3
            }),
            fill: new Fill({
                color: "rgba(255, 0, 0, 0.15)"
            })
        });
    }

    return new Style({
        stroke: new Stroke({
            color: "#ff0000",
            width: 3
        }),
        fill: new Fill({
            color: "rgba(255, 0, 0, 0.15)"
        }),
        image: new CircleStyle({
            radius: 7,
            fill: new Fill({
                color: "#ff0000"
            }),
            stroke: new Stroke({
                color: "#ffffff",
                width: 2
            })
        })
    });
}

/**
 * Get fontawasome icons depending type
 */
const placeTypeIcons = new Map([
    ["topolabel", "fa-solid fa-location-dot"],
    ["road", "fa-solid fa-road"],
    ["toilet", "fa-solid fa-restroom"],
    ["estate", "fa-solid fa-building"],
    ["address", "fa-solid fa-house"],
    ["block", "fa-solid fa-vector-square"],
    ["place", "fa-solid fa-map-pin"],
    ["pit", "fa-solid fa-circle-down"]
]);

function getPlaceTypeIcon(type) {
    return placeTypeIcons.get(type) || "fa-solid fa-circle-question";
}



/* ============================================================
 * Helpers
 * ============================================================ */

/**
 * Escape XML special chars inside filter literal.
 * @param {string} value
 * @returns {string}
 */
function escapeXml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}
