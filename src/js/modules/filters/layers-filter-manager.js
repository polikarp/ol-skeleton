/**
 * Manage layers filtering
 */

import { UI } from "../../constants/i18.en";
import { Modal } from "bootstrap";


const schemaCache = new Map(); // key: typename -> [{name,type}]
const modalId = "#layerFiltersModal";
const tabsId = "#layerFiltersTabs";
const tabsContentId = "#layerFiltersTabContent";

let bsModal = null;

/**
 * Initialize the layer filters manager.
 * @param {Object} options
 * @param {Function} options.refreshWmsLayer - function({layerName}) to refresh WMS after applying filter
 * @param {Function} [options.getWfsDescribeUrl] - function(layerName, $layerLi) => url (optional)
 */
export function initLayerFiltersManager({ refreshWmsLayer, getWfsDescribeUrl }) {
    if (!window.currentCqlFilterByLayer) window.currentCqlFilterByLayer = {};

    // Bootstrap modal instance
    const el = document.querySelector(modalId);
    if (el) {
        // eslint-disable-next-line no-undef
        bsModal = Modal.getOrCreateInstance(el);
    }

    // Open modal on filter icon click
    $(document).off("click.layerFilter", ".layerFilterBtn");
    $(document).on("click.layerFilter", ".layerFilterBtn", async function (e) {
        e.preventDefault();
        e.stopPropagation();

        const layerName = $(this).data("layer");
        const $layerLi = $(this).closest("li[data-layer]");

        await openFiltersModalForLayer({
            layerName,
            $layerLi,
            refreshWmsLayer,
            getWfsDescribeUrl
        });
    });

    // Add condition row
    $(document).off("click.layerFilterAddRow", ".btnLayerFilterAddRow");
    $(document).on("click.layerFilterAddRow", ".btnLayerFilterAddRow", function () {
        const layerName = $(this).data("layer");
        const $pane = getPaneByLayerName(layerName);

        addRowToPane($pane);

        // Copy field options from first row to the new one if already loaded
        const $first = $pane.find(".layerFilterRow").first().find(".layerFilterField");
        const $last = $pane.find(".layerFilterRow").last().find(".layerFilterField");

        if ($first.length && $last.length && $last.find("option").length === 0) {
            $last.html($first.html());
        }

        normalizeRowsUi($pane);
    });

    // Remove condition row
    $(document).off("click.layerFilterRemoveRow", ".btnLayerFilterRemoveRow");
    $(document).on("click.layerFilterRemoveRow", ".btnLayerFilterRemoveRow", function () {
        const $row = $(this).closest(".layerFilterRow");
        const $pane = $row.closest(".tab-pane");

        $row.remove();

        // Always keep at least one row
        ensureAtLeastOneRow($pane);
        normalizeRowsUi($pane);
    });

    // Apply filter inside tab (multi-conditions)
    $(document).off("click.layerFilterApply", ".btnLayerFilterApply");
    $(document).on("click.layerFilterApply", ".btnLayerFilterApply", function () {
        const layerName = $(this).data("layer");
        const $pane = getPaneByLayerName(layerName);

        const clauses = [];

        $pane.find(".layerFilterRow").each(function (idx) {
            const $row = $(this);

            const field = $row.find(".layerFilterField").val();
            const type = $row.find(".layerFilterField option:selected").data("type") || "string";
            const op = $row.find(".layerFilterOp").val();
            const val = $row.find(".layerFilterValue").val();

            const one = buildCql(field, op, type, val);
            if (!one) return; // Ignore empty rows

            if (clauses.length === 0) {
                clauses.push(one);
            } else {
                const logic = "AND";//($row.find(".layerFilterLogic").val() || "AND").toUpperCase();
                clauses.push(`${logic} ${one}`);
            }
        });

        const cql = clauses.length ? `(${clauses.join(" ")})` : null;

        if (!cql) {
            delete window.currentCqlFilterByLayer[layerName];
        } else {
            window.currentCqlFilterByLayer[layerName] = cql;
        }

        updateLayerFilterIcon(layerName);
        updateTabPreview(layerName);

        if (typeof refreshWmsLayer === "function") {
            refreshWmsLayer({ layerName });
        }
    });

    // Clear filter inside tab (clear all rows and reset to one)
    $(document).off("click.layerFilterClear", ".btnLayerFilterClear");
    $(document).on("click.layerFilterClear", ".btnLayerFilterClear", function () {
        const layerName = $(this).data("layer");
        delete window.currentCqlFilterByLayer[layerName];

        const $pane = getPaneByLayerName(layerName);

        // Reset rows: keep only one empty row
        $pane.find(".layerFilterRows").empty();
        addRowToPane($pane);
        normalizeRowsUi($pane);

        updateLayerFilterIcon(layerName);
        updateTabPreview(layerName);

        if (typeof refreshWmsLayer === "function") {
            refreshWmsLayer({ layerName });
        }
    });
}

/**
 * Open modal and ensure the tab for the requested layer exists and is active.
 */
async function openFiltersModalForLayer({ layerName, $layerLi, refreshWmsLayer, getWfsDescribeUrl }) {
    const layerTitle = $layerLi.text().replace(/\s+/g, " ").trim();
    ensureTabExists(layerName, layerTitle);

    // Activate requested tab
    activateTab(layerName);

    // Load schema (fields) via WFS DescribeFeatureType and populate selects
    const $pane = getPaneByLayerName(layerName);
    $pane.find(".layerFilterStatus").text("Loading fields...");

    // Ensure at least one row exists
    ensureAtLeastOneRow($pane);
    normalizeRowsUi($pane);

    try {
        if(!window.currentCqlFilterByLayer[layerName]){
            const fields = await getFieldsForLayer(layerName, $layerLi, getWfsDescribeUrl);
            populateFieldsSelect($pane, fields);
            $pane.find(".layerFilterStatus").text("");
        }

    } catch (err) {
        console.error(err);
        $pane.find(".layerFilterStatus").text("Error loading fields (WFS DescribeFeatureType).");
    }

    // Sync preview + icon status
    updateTabPreview(layerName);
    updateLayerFilterIcon(layerName);

    // Show modal
    if (bsModal) bsModal.show();
}

/**
 * Ensure tab and pane exist for a layer.
 * IMPORTANT: do NOT use layerName directly as DOM id (e.g., "workspace:layer").
 * We normalize it to a safe DOM id.
 */
function ensureTabExists(layerName, layerTitle) {
    const domId = normalizeDomId(layerName);

    const tabBtnId = `tab_${domId}`;
    const paneId = `pane_${domId}`;

    if ($(tabsId).find(`#${tabBtnId}`).length) return;

    const tabHtml = `
      <li class="nav-item" role="presentation">
        <button class="nav-link"
                id="${tabBtnId}"
                data-bs-toggle="tab"
                data-bs-target="#${paneId}"
                type="button"
                role="tab"
                aria-controls="${paneId}"
                aria-selected="false"
                data-layer="${escapeAttr(layerName)}">
          ${escapeHtml(layerTitle)}
        </button>
      </li>
    `;

    const paneHtml = `
      <div class="tab-pane fade"
           id="${paneId}"
           role="tabpanel"
           aria-labelledby="${tabBtnId}"
           data-layer="${escapeAttr(layerName)}">

        <div class="small text-muted mb-2 layerFilterStatus"></div>

        <!-- Conditions container -->
        <div class="layerFilterRows"></div>

        <div class="d-flex gap-2 mt-3 align-items-center">
          <button type="button"
                  class="btn btn-sm btn-primary btnLayerFilterAddRow"
                  data-layer="${escapeAttr(layerName)}">
            + ${(UI.ADD_CONDITION ?? "Add condition")}
          </button>

          <div class="ms-auto d-flex gap-2">
            <button type="button"
                    class="btn btn-sm btn-primary btnLayerFilterApply"
                    data-layer="${escapeAttr(layerName)}">
              ${UI.APPLY}
            </button>

            <button type="button"
                    class="btn btn-sm btn-outline-secondary btnLayerFilterClear"
                    data-layer="${escapeAttr(layerName)}">
              ${UI.CLEAR}
            </button>
          </div>
        </div>


        <div class="mt-3 small">
          <div class="text-muted">CQL preview</div>
          <code class="d-block p-2 bg-light border rounded layerFilterPreview"></code>
        </div>


      </div>
    `;

    $(tabsId).append(tabHtml);
    $(tabsContentId).append(paneHtml);

    // Ensure one initial row
    const $pane = getPaneByLayerName(layerName);
    ensureAtLeastOneRow($pane);
    normalizeRowsUi($pane);
}

/**
 * Activate the tab for a given layerName.
 */
function activateTab(layerName) {
    const domId = normalizeDomId(layerName);
    const tabBtnSelector = `#tab_${domId}`;

    // eslint-disable-next-line no-undef
    const tabEl = document.querySelector(tabBtnSelector);
    if (!tabEl) return;

    // eslint-disable-next-line no-undef
    const tab = bootstrap.Tab.getOrCreateInstance(tabEl);
    tab.show();
}

/**
 * Returns the HTML for one condition row.
 */
function renderFilterRowHtml({ isFirstRow }) {
    // Comments in English
    const logicHtml = isFirstRow
        ? `<div class="col-md-2 d-none layerFilterLogicCol"></div>`
        : `
          <div class="col-md-2 layerFilterLogicCol">
            <label class="form-label small mb-1">Logic</label>
            <select class="form-select form-select-sm layerFilterLogic">
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>
        `;

    const removeBtnHtml = isFirstRow
        ? `<div class="col-md-1 d-none layerFilterRemoveCol"></div>`
        : `
            <div class="col-md-1 d-flex align-items-end layerFilterRemoveCol">
                <i class="fa-solid fa-xmark btnLayerFilterRemoveRow text-danger filter-remove-icon"
                    role="button"
                    tabindex="0"
                    title="Remove condition"></i>
            </div>
        `;

    // Field select options are filled later by populateFieldsSelect().
    return `
      <div class="row g-2 align-items-end layerFilterRow">


        <div class="col-md-3">
          <label class="form-label small mb-1">${UI.FIELD}</label>
          <select class="form-select form-select-sm layerFilterField"></select>
        </div>

        <div class="col-md-3">
          <label class="form-label small mb-1">${UI.OPERATOR}</label>
          <select class="form-select form-select-sm layerFilterOp">
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value=">=">&gt;=</option>
            <option value="<">&lt;</option>
            <option value="<=">&lt;=</option>
            <option value="ILIKE">Contains</option>
            <option value="IN">IN (a,b,c)</option>
          </select>
        </div>

        <div class="col-md-3">
          <label class="form-label small mb-1">${UI.VALUE}</label>
          <input type="text" class="form-control form-control-sm layerFilterValue" />
        </div>

        ${removeBtnHtml}
      </div>
    `;
}

/**
 * Ensures there is at least one row in the pane.
 */
function ensureAtLeastOneRow($pane) {
    // Comments in English
    const $rows = $pane.find(".layerFilterRows");
    if ($rows.find(".layerFilterRow").length === 0) {
        $rows.append(renderFilterRowHtml({ isFirstRow: true }));
    }
}

/**
 * Adds a row to the pane.
 */
function addRowToPane($pane) {
    // Comments in English
    const $rows = $pane.find(".layerFilterRows");
    const isFirst = $rows.find(".layerFilterRow").length === 0;
    $rows.append(renderFilterRowHtml({ isFirstRow: isFirst }));
}

/**
 * Normalizes row UI: first row hides logic/remove; next rows show them.
 */
function normalizeRowsUi($pane) {
    // Comments in English
    const $rows = $pane.find(".layerFilterRow");
    $rows.each(function (idx) {
        const $r = $(this);

        const $logicCol = $r.find(".layerFilterLogicCol");
        const $removeCol = $r.find(".layerFilterRemoveCol");

        if (idx === 0) {
            $logicCol.addClass("d-none");
            $removeCol.addClass("d-none");
        } else {
            $logicCol.removeClass("d-none");
            $removeCol.removeClass("d-none");
        }
    });
}

/**
 * Get fields by calling WFS DescribeFeatureType.
 * Cache by typename (layerName).
 */
async function getFieldsForLayer(layerName, $layerLi, getWfsDescribeUrl) {
    if (schemaCache.has(layerName)) return schemaCache.get(layerName);

    const url = typeof getWfsDescribeUrl === "function"
        ? getWfsDescribeUrl(layerName, $layerLi)
        : buildDefaultDescribeUrl(layerName, $layerLi);

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`DescribeFeatureType failed: ${res.status}`);

    const text = await res.text();
    const fields = parseDescribeFeatureTypeXsd(text);

    schemaCache.set(layerName, fields);
    return fields;
}

/**
 * Default DescribeFeatureType URL builder.
 * Attempts to derive WFS endpoint from serviceBaseUrl (/ows).
 */
function buildDefaultDescribeUrl(layerName, $layerLi) {
    const serviceBaseUrl = String($layerLi.data("service-base-url") || "");
    let wfsBaseUrl = String($layerLi.data("wfs-base-url") || "");

    // If no explicit WFS base, reuse OWS endpoint (GeoServer typical)
    if (!wfsBaseUrl) {
        wfsBaseUrl = serviceBaseUrl; // usually .../geoserver/<ws>/ows
    }

    const params = new URLSearchParams({
        service: "WFS",
        version: "1.1.0",
        request: "DescribeFeatureType",
        typeName: layerName, // IMPORTANT: use full typename if needed (workspace:layer)
        outputFormat: "application/xml"
    });

    return `${wfsBaseUrl}?${params.toString()}`;
}

/**
 * Parse XSD returned by DescribeFeatureType.
 * Keeps non-geometry fields (simple heuristic).
 */
function parseDescribeFeatureTypeXsd(xsdText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xsdText, "application/xml");

    // Typical pattern: <xsd:element name="field" type="xsd:string" .../>
    const els = Array.from(xml.getElementsByTagNameNS("*", "element"));

    const out = [];
    for (const el of els) {
        const name = el.getAttribute("name");
        const type = (el.getAttribute("type") || "").toLowerCase();

        if (!name) continue;

        // Skip geometry (common gml types)
        if (type.includes("gml:") || type.includes("gml")) continue;

        out.push({
            name,
            type: mapXsdType(type)
        });
    }

    // Remove duplicates and sort
    const uniq = new Map();
    out.forEach((f) => uniq.set(f.name, f));
    return Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Maps XSD types to a small set of UI types.
 */
function mapXsdType(t) {
    if (t.includes("int") || t.includes("integer") || t.includes("decimal") || t.includes("double") || t.includes("float")) return "number";
    if (t.includes("date") || t.includes("time")) return "date";
    return "string";
}

/**
 * Populate all field selects inside the pane (for all rows).
 */
function populateFieldsSelect($pane, fields) {
    const $sels = $pane.find(".layerFilterField");

    $sels.each(function () {
        const $sel = $(this);
        $sel.empty();

        if (!fields || fields.length === 0) {
            $sel.append(`<option value="">(no fields)</option>`);
            return;
        }

        for (const f of fields) {
            $sel.append(
                `<option value="${escapeAttr(f.name)}" data-type="${escapeAttr(f.type)}">${escapeHtml(f.name)}</option>`
            );
        }
    });
}

/**
 * Build CQL from UI controls.
 */
function buildCql(field, op, type, rawValue) {
    const f = String(field || "").trim();
    const o = String(op || "").trim().toUpperCase();
    const v = String(rawValue || "").trim();

    if (!f || !o || !v) return null;

    if (o === "IN") {
        const parts = v.split(",").map((x) => x.trim()).filter(Boolean);
        if (!parts.length) return null;
        const list = parts.map((p) => quoteCqlValue(type, p)).join(",");
        return `${f} IN (${list})`;
    }

    if (o === "LIKE" || o === "ILIKE") {
        const val = v.includes("%") ? v : `%${v}%`;
        return `${f} ${o} '${escapeCqlString(val)}'`;
    }

    return `${f} ${o} ${quoteCqlValue(type, v)}`;
}

/**
 * Quotes the CQL value depending on type.
 */
function quoteCqlValue(type, val) {
    if (type === "number") return String(val).trim();
    // date and string: quote
    return `'${escapeCqlString(String(val).trim())}'`;
}

/**
 * Escapes single quotes in CQL strings.
 */
function escapeCqlString(s) {
    return String(s).replace(/'/g, "''");
}

/**
 * Update filter preview (tab) from currentCqlFilterByLayer.
 */
function updateTabPreview(layerName) {
    const cql = window.currentCqlFilterByLayer?.[layerName] || "";
    const $pane = getPaneByLayerName(layerName);

    // If preview is not present, this does nothing.
    $pane.find(".layerFilterPreview").text(cql || "(no filter)");
}

/**
 * Toggle icon depending on active filter.
 * Default: fa-filter
 * Active:  fa-filter-circle-xmark (or any you want)
 */
function updateLayerFilterIcon(layerName) {
    const hasFilter = !!window.currentCqlFilterByLayer?.[layerName];

    // Find the icon(s) in the menu for this layer
    const $icons = $(`#layersMenuSelector .layerFilterBtn[data-layer="${cssEscape(layerName)}"]`);

    $icons.each(function () {
        const $i = $(this);

        if (hasFilter) {
            $i.removeClass("fa-filter").addClass("fa-filter-circle-xmark");
            $i.addClass("text-primary");
            $i.attr("title", "Filter active");
        } else {
            $i.removeClass("fa-filter-circle-xmark").addClass("fa-filter");
            $i.removeClass("text-primary");
            $i.attr("title", "Filter layer");
        }
    });
}

/**
 * Return the jQuery pane for a given layerName (searched by data-layer).
 * Uses attribute selector escaping (NOT DOM id).
 */
function getPaneByLayerName(layerName) {
    return $(`${tabsContentId} .tab-pane[data-layer="${cssEscape(layerName)}"]`);
}

/**
 * Normalize any string into a safe DOM id token (no ":" or other special chars).
 * Example: "workspace:my-layer" -> "workspace_my-layer"
 */
function normalizeDomId(s) {
    return String(s ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_");
}

/**
 * Small helpers
 */
function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/`/g, "&#096;");
}

function cssEscape(s) {
    // Minimal CSS escape for attribute selectors
    return String(s)
        .replace(/\\/g, "\\\\") // escape backslash first
        .replace(/"/g, '\\"')   // escape double quotes
        .replace(/:/g, "\\:");  // escape colon (workspace:layer)
}
