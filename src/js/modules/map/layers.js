/**
 * Load OWS bootstrap catalog from backend.
 *
 * Returns:
 * {
 *   groups: [...],
 *   services: [...]
 * }
 */
export async function loadLayers() {

    const response = await fetch('/api/layers/getLayers', {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to load layers bootstrap');
    }

    return await response.json();
}
