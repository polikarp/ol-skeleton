// resources/js/addressSearchWfs.js
// Address autocomplete search using WFS + OpenLayers
// Requires: jQuery, OpenLayers

import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import {applyProxyIfNeeded} from './wms-capabilities-loader';

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
    wfsUrl = "https://download.geoportal.gov.gi/geoserver/inspire/wfs",
    inputSelector = "#searchInput",
    resultsSelector = "#autocompleteResults",
    clearButtonSelector = "#clearSearch",
    minChars = 3,
    debounceMs = 300,
}) {

    const searchLayer = new VectorLayer({
        source: new VectorSource(),
        zIndex: 1000,
    });

    map.addLayer(searchLayer);


    if (!map) throw new Error("Map is required");


    let debounceTimer = null;
    let searchMarker = null;



    /**
     * Execute WFS filtered request.
     * @param {string} query
     * @returns {jqXHR}
     */
    function getFilteredAddress(query) {
        const filterXml = `
            <wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs"
                service="WFS" version="1.1.0"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">
                <wfs:Query typeName="feature:unitaddress_for_geoportal"
                    srsName="EPSG:25830"
                    xmlns:feature="http://geoportal.gov.gi/inspire">
                    <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
                        <ogc:PropertyIsLike matchCase="false" wildCard="*" singleChar="." escapeChar="!">
                            <ogc:PropertyName>address_text_for_search</ogc:PropertyName>
                            <ogc:Literal>*%${escapeXml(query)}%*</ogc:Literal>
                        </ogc:PropertyIsLike>
                    </ogc:Filter>
                </wfs:Query>
            </wfs:GetFeature>
        `;

        return $.ajax({
            url: applyProxyIfNeeded(wfsUrl, useProxy, proxyPath),
            type: "POST",
            dataType: "xml",
            contentType: "text/xml",
            data: filterXml,
        });
    }

    /* ---------------------------------------------------------
     * Input handler (autocomplete)
     * --------------------------------------------------------- */
    $(document).on("input", inputSelector, function () {
        const query = $(this).val().trim();
        const $results = $(resultsSelector);

        $(clearButtonSelector).toggleClass("d-none", query.length === 0);

        clearTimeout(debounceTimer);

        if (query.length < minChars) {
            $results.empty().addClass("d-none");
            return;
        }

        debounceTimer = setTimeout(() => {
            getFilteredAddress(query).done((xml) => {
                $results.empty();

                const features = xml.getElementsByTagNameNS("*", "unitaddress_for_geoportal");
                if (!features || features.length === 0) {
                    $results.addClass("d-none");
                    return;
                }

                for (let i = 0; i < features.length; i++) {
                    const item = features[i];

                    const name = $(item)
                        .find("inspire\\:address_text_for_search, address_text_for_search")
                        .text();

                    const pos = $(item)
                        .find("gml\\:pos, pos")
                        .text()
                        .split(" ")
                        .map(Number);

                    if (pos.length !== 2) continue;

                    const [y, x] = pos;

                    const $li = $("<li>")
                        .addClass("list-group-item list-group-item-action")
                        .text(name)
                        .attr("data-x", x)
                        .attr("data-y", y);

                    $results.append($li);
                }

                $results.removeClass("d-none");
            });
        }, debounceMs);
    });

    /* ---------------------------------------------------------
     * Result click handler
     * --------------------------------------------------------- */
    $(document).on("click", `${resultsSelector} li`, function () {
        const x = parseFloat($(this).data("x"));
        const y = parseFloat($(this).data("y"));

        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

        const coord = [x, y];

        // Center map
        map.getView().animate({ center: coord, zoom: 7 });

        // Remove previous marker
        if (searchMarker) {
            searchLayer.getSource().removeFeature(searchMarker);
        }

        // Add marker
        searchMarker = new Feature({
            geometry: new Point(coord),
        });

        searchMarker.setStyle(
            new Style({
                image: new Icon({
                    src: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                    scale: 0.05,
                    anchor: [0.5, 1],
                    anchorXUnits: "fraction",
                    anchorYUnits: "fraction",
                }),
            })
        );

        searchLayer.getSource().addFeature(searchMarker);

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

        if (searchMarker) {
            searchLayer.getSource().removeFeature(searchMarker);
            searchMarker = null;
        }
    });
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
