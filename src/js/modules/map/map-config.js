/**
 * Global constants and untilities of map
 */

export const initialCenter = [288760.1575, 4001428.7578];
export const initialZoom = 2;
export const initialRotation = 0;

/**
 * Store active layers on map
 */
export const wmsLayerRegistry = new Map();
export const layerRegistry = new Map();
export const PROXY_PATH = "http://geoproxy.local/geoserver.php?url=";
/*
* Stores important info of layers:
* {layerName, serviceBaseUrl, version, title, serviceType}
*/
export const layersInfo = new Map();
