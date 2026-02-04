// map-singleclick-dispatcher.js
// Minimal dispatcher for OpenLayers map singleclick, allowing multiple handlers to be plugged in.

const DEFAULT_ID = () => `h_${Math.random().toString(16).slice(2)}`;

/**
 * Create a singleclick dispatcher.
 *
 * @param {import("ol/Map").default} map
 * @returns {{ register: Function, unregister: Function, dispose: Function }}
 */
export function createSingleClickDispatcher(map) {
    if (!map) throw new Error("createSingleClickDispatcher: map is required");

    /** @type {Array<{id:string, order:number, enabled:boolean, fn:Function}>} */
    const handlers = [];

    const sortHandlers = () => handlers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const eventFn = async (evt) => {
        // Shared context for all handlers
        const ctx = {
            map,
            evt,
            coordinate: evt.coordinate,
            pixel: evt.pixel,
            view: map.getView(),
            projection: map.getView().getProjection(),
            stop: false, // any handler can set ctx.stop = true
        };

        for (const h of handlers) {
            if (!h.enabled) continue;

            try {
                // If a handler returns false, we stop the chain (optional pattern)
                const res = await h.fn(ctx);
                if (res === false || ctx.stop) break;
            } catch (e) {
                console.warn(`singleclick handler "${h.id}" failed:`, e);
            }
        }
    };

    map.on("singleclick", eventFn);

    return {
        /**
         * Register a handler
         * @param {Function} fn async (ctx) => void | false
         * @param {Object} [opts]
         * @param {string} [opts.id]
         * @param {number} [opts.order=100]
         * @param {boolean} [opts.enabled=true]
         * @returns {string} handler id
         */
        register(fn, opts = {}) {
            const id = opts.id || DEFAULT_ID();
            handlers.push({
                id,
                order: opts.order ?? 100,
                enabled: opts.enabled ?? true,
                fn,
            });
            sortHandlers();
            return id;
        },

        /**
         * Unregister handler by id
         * @param {string} id
         */
        unregister(id) {
            const idx = handlers.findIndex((h) => h.id === id);
            if (idx >= 0) handlers.splice(idx, 1);
        },

        /**
         * Dispose dispatcher
         */
        dispose() {
            handlers.length = 0;
            map.un("singleclick", eventFn);
        },
    };
}
