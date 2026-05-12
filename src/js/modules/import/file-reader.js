import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { buildLayerKey } from "../map/layers-on-off";

export function registerFileLayerLoader({
    map,
    layerRegistry,
    appendFileLayersToMenu,
    triggerSelector = "#btnAddFileLayer",
    dataProjection = "EPSG:4326"
}) {
    $(document).on("click", triggerSelector, async () => {
        try {
            const fileHandles = await window.showOpenFilePicker({
                multiple: true,
                types: [
                    {
                        description: "GeoJSON files",
                        accept: {
                            "application/geo+json": [".geojson"],
                            "application/json": [".json"]
                        }
                    }
                ]
            });

            for (const handle of fileHandles) {
                const file = await handle.getFile();

                const fileLayer = await createGeoJsonLayerFromFile({
                    file,
                    map,
                    layerRegistry,
                    dataProjection
                });

                appendFileLayersToMenu([fileLayer]);
            }
        } catch (error) {
            if (error?.name === "AbortError") {
                return;
            }

            console.error("Could not load GeoJSON file", error);
            alert("Could not load selected GeoJSON file");
        }
    });
}

async function createGeoJsonLayerFromFile({
    file,
    map,
    layerRegistry,
    dataProjection = "EPSG:4326"
}) {
    const extension = getFileExtension(file.name);

    if (!["geojson", "json"].includes(extension)) {
        throw new Error(`Unsupported file extension: ${extension}`);
    }

    const SERVICE_TYPE_FILE = "FILE";

    const text = await file.text();
    const layerName = buildFileLayerName(file.name);
    const title = file.name;

    const features = readGeoJsonFeatures({
        text,
        map,
        dataProjection
    });

    const source = new VectorSource({
        features
    });

    const vectorLayer = new VectorLayer({
        source,
        visible: true,
        zIndex: 9000
    });

    vectorLayer.set("layerName", layerName);
    vectorLayer.set("title", title);
    vectorLayer.set("serviceType", SERVICE_TYPE_FILE);
    vectorLayer.set("serviceBaseUrl", SERVICE_TYPE_FILE.toLowerCase());
    vectorLayer.set("fileType", "geojson");
    vectorLayer.set("customLayer", true);
    vectorLayer.set("fileLayer", true);
    vectorLayer.set("identifiable", true);
    vectorLayer.set("showOnTable", true);

    map.addLayer(vectorLayer);

    if (layerRegistry) {
        const key = buildLayerKey({ type: SERVICE_TYPE_FILE, layerName, serviceBaseUrl: SERVICE_TYPE_FILE.toLowerCase()});
        layerRegistry.set(key, vectorLayer);
    }

    zoomToVectorLayer(map, vectorLayer, {});

    return {
        name: layerName,
        title,
        fileType: "geojson",
        serviceType: SERVICE_TYPE_FILE,
        dataProjection,
        featureProjection: map.getView().getProjection().getCode(),
        featureCount: features.length
    };
}

function readGeoJsonFeatures({
    text,
    map,
    dataProjection = "EPSG:4326"
}) {
    const format = new GeoJSON();

    return format.readFeatures(text, {
        dataProjection,
        featureProjection: map.getView().getProjection().getCode()
    });
}

function getFileExtension(filename) {
    return String(filename)
        .split(".")
        .pop()
        .toLowerCase();
}

function buildFileLayerName(filename) {
    const baseName = String(filename)
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .toLowerCase();

    return `file_${baseName}_${Date.now()}`;
}

export function zoomToVectorLayer(_map, vectorLayer, opts = {}) {
    if (!_map || !vectorLayer) return;

    const source = vectorLayer.getSource?.();
    if (!source) return;

    const extent = source.getExtent();

    if (!extent || isNaN(extent[0])) {
        return;
    }

    _map.updateSize();

    _map.getView().fit(extent, {
        duration: opts.duration ?? 250,
        maxZoom: opts.maxZoom ?? 19,
        padding: opts.padding ?? [24, 24, 24, 24]
    });
}