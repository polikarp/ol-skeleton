/**
 * Manage drawing tools for searching
 */

import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Draw, { createBox } from "ol/interaction/Draw";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import CircleStyle from "ol/style/Circle";
import Overlay from "ol/Overlay";
import { layerRegistry } from "./map-config";


let drawConfirmOverlay = null;
let lastDrawGeom = null;

function initDrawConfirmPopup(map, clear, queryService, showGfiLoading, notify, onResults) {

    
    if ($("#draw-confirm-popup").length === 0) {
        $("body").append(`
            <div id="draw-confirm-popup" class="ol-popup" style="
                background:#fff;
                padding:10px;
                border-radius:8px;
                box-shadow:0 6px 18px rgba(0,0,0,.15);
                display:none;
                min-width:220px;
            ">
                <div class="fw-bold mb-2">Search in area?</div>
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-sm btn-outline-secondary" id="drawCancelBtn">Cancel</button>
                    <button class="btn btn-sm btn-primary" id="drawSearchBtn">Search</button>
                </div>
            </div>
        `);
    }

    drawConfirmOverlay = new Overlay({
        element: document.getElementById("draw-confirm-popup"),
        positioning: "bottom-center",
        stopEvent: true,
        offset: [0, -10],
    });

    map.addOverlay(drawConfirmOverlay);

    $(document).on("click", "#drawCancelBtn", function () {
        drawConfirmOverlay.setPosition(undefined);
        $("#draw-confirm-popup").hide();
        clear(); 
        lastDrawGeom = null;
        window.MAP_CLICK_BLOCKED = false;
    });

    $(document).on("click", "#drawSearchBtn", async function () {

        drawConfirmOverlay.setPosition(undefined);
        $("#draw-confirm-popup").hide();
        window.MAP_CLICK_BLOCKED = false;
        if (!lastDrawGeom) return;
        if(layerRegistry.size === 0){
          $("#drawCancelBtn").trigger("click");
          alert("No active layers");
          return;
        }

        showGfiLoading();

        try {
            const resp = await queryService.query({
                geometryMap: lastDrawGeom,
                context: { mode: "draw" }
            });

            if (!resp?.ok) {
                notify(resp?.error || "Spatial query failed");
                return;
            }

            onResults(resp);

        } catch (e) {
            console.error(e);
            notify(e?.message || "Spatial query error");
        }

        lastDrawGeom = null;
    });
}



/**
 * UI tool:
 * - Draw a geometry (Polygon or Box)
 * - Delegates querying to queryService.query()
 */
export function createSpatialQueryTool({
    map,
    queryService,
    showGfiLoading,
    drawMode = "Polygon",
    notify = (msg) => alert(msg),
    onResults = () => {},
}) {
  const drawSource = new VectorSource();

  const drawLayer = new VectorLayer({
    source: drawSource,
    style: new Style({
      stroke: new Stroke({ color: "#100cfcff", width: 2 }),
      fill: new Fill({ color: "rgba(255, 204, 51, 0.2)" }),
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({ color: "#100cfcff" }),
        fill: new Fill({ color: "white" }),
      }),
    }),
  });

  let drawInteraction = null;

  function clear() {
    drawSource.clear();
  }

  function deactivate() {
    if (drawInteraction) {
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
    }
    map.removeLayer(drawLayer);
    clear();
    window.MAP_CLICK_BLOCKED = false;
  }

  function activate() {

    deactivate();
    map.addLayer(drawLayer);

    const drawOpts =
        drawMode === "Box"
            ? { source: drawSource, type: "Circle", geometryFunction: createBox(), stopClick: true }
            : { source: drawSource, type: "Polygon", stopClick: true };

    drawInteraction = new Draw(drawOpts);
    map.addInteraction(drawInteraction);

    initDrawConfirmPopup(map, clear, queryService, showGfiLoading, notify, onResults);

    drawInteraction.on("drawend", (evt) => {

        clear();
        drawSource.addFeature(evt.feature);

        const geom = evt.feature.getGeometry()?.clone();
        if (!geom) return;

        map.removeInteraction(drawInteraction);
        drawInteraction = null;

        lastDrawGeom = geom;

        // Anchor popup to polygon center
        const extent = geom.getExtent();
        const center = [
            (extent[0] + extent[2]) / 2,
            (extent[1] + extent[3]) / 2
        ];

        window.MAP_CLICK_BLOCKED = true;
        drawConfirmOverlay.setPosition(center);
        $("#draw-confirm-popup").show();
        const overlayCoord = drawConfirmOverlay.getPosition();
        map.dispatchEvent({
            type: "singleclick",
            coordinate: overlayCoord
        });
        
    });
}


  // function activate() {
  //   deactivate();

  //   map.addLayer(drawLayer);

  //   const drawOpts =
  //     drawMode === "Box"
  //       ? { source: drawSource, type: "Circle", geometryFunction: createBox(), stopClick: true }
  //       : { source: drawSource, type: "Polygon", stopClick: true };

  //   drawInteraction = new Draw(drawOpts);
  //   map.addInteraction(drawInteraction);

  //   drawInteraction.on("drawend", (evt) => {
  //       showGfiLoading();
  //       clear();
  //       drawSource.addFeature(evt.feature);

  //       const geom = evt.feature.getGeometry()?.clone();
  //       if (!geom) return;

  //       // drawInteraction.setActive(false);
  //       // drawInteraction.abortDrawing();
  //       map.removeInteraction(drawInteraction);
  //       drawInteraction = null;

  //       (async () => {
  //           try {
  //               const resp = await queryService.query({
  //                   geometryMap: geom,
  //                   context: { mode: "draw" }
  //               });

  //               if (!resp?.ok) {
  //                   notify(resp?.error || "Spatial query failed");
  //                   return;
  //               }

  //               onResults(resp);
  //           } catch (e) {
  //               console.error(e);
  //               notify(e?.message || "Spatial query error");
  //           }
  //       })();
  //   });
  // }

  return { activate, deactivate, clear };
}
