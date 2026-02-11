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

    drawInteraction.on("drawend", (evt) => {
        showGfiLoading();
        clear();
        drawSource.addFeature(evt.feature);

        const geom = evt.feature.getGeometry()?.clone();
        if (!geom) return;

        // drawInteraction.setActive(false);
        // drawInteraction.abortDrawing();
        map.removeInteraction(drawInteraction);
        drawInteraction = null;

        (async () => {
            try {
                const resp = await queryService.query({
                    geometryMap: geom,
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
        })();
    });
  }

  return { activate, deactivate, clear };
}
