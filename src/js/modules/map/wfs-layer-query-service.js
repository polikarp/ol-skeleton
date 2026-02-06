
import { applyProxyIfNeeded } from "./wms-capabilities-loader";
import { buildWfsGetFeatureUrl } from "../../legacy/wfs-url-builder";
import { buildIntersectsCql, combineCql } from "./cql-spatial-builder";
import { polygonFromExtent } from "./geometry-helpers";

export function createWfsLayerQueryService({
  layerRegistry,
  useProxy,
  proxyPath,
  getCqlFilter,
  geomPropName = "geom",
  srid = 25830,
  count = 5000,
}) {

    function listActiveCandidates() {
        return Array.from(layerRegistry.values())
            .filter(l => l?.getVisible?.())
                .map(layer => ({
                    layer,
                    baseUrl: layer.get("serviceBaseUrl"),
                    typeName: layer.get("layerName"),
                    wfsEnabled: !!layer.get("wfsEnabled"),
                    wfsVersion: layer.get("wfsVersion") || "2.0.0",
                }))
        .filter(c => c.baseUrl && c.typeName && c.wfsEnabled);
    }

    async function fetchCandidate(c, bbox, finalCql) {
        const urlAux = buildWfsGetFeatureUrl({
            baseUrl: c.baseUrl,
            typeName: c.typeName,
            version: c.wfsVersion,
            bbox,
            bboxCrs: `EPSG:${srid}`,
            cqlFilter: finalCql,
            count,
        });

        const url = applyProxyIfNeeded(urlAux, useProxy, proxyPath);

        try {
            const resp = await fetch(url);
            if (!resp.ok) {
                return { ok: false, layerName: c.typeName, error: `HTTP ${resp.status}`, url };
            }
            const geojson = await resp.json();
            return {
                ok: true,
                layerName: c.typeName,
                count: geojson?.features?.length || 0,
                geojson,
                url,
                cql: finalCql,
            };
        } catch (e) {
            return { ok: false, layerName: c.typeName, error: e.message, url };
        }
    }

    async function query({ geometryMap = null, extentMap = null, context = {} }) {
        const candidates = listActiveCandidates();
        if (!candidates.length) {
            return { ok: false, error: "No active WFS-enabled layers", results: [] };
        }

        let queryGeom = geometryMap;
        if (!queryGeom && extentMap) {
            queryGeom = polygonFromExtent(extentMap);
        }

        if (!queryGeom) {
            return { ok: false, error: "No spatial input", results: [] };
        }


        const spatialCql = buildIntersectsCql({
            geomProp: geomPropName,
            geometry: queryGeom,
            srid,
        });

        const bbox = queryGeom.getExtent();

        const results = await Promise.all(
            candidates.map(c => {
                const attrCql = getCqlFilter({ layer: c.layer, context });
                const finalCql = combineCql(attrCql, spatialCql);
                return fetchCandidate(c, bbox, finalCql);
            })
        );

        return { ok: true, spatialCql, results };
    }

    return { query };
}
