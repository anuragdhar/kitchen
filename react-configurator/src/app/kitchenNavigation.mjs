/** Optional initial workspace view for reproducible links and browser tooling.
 * It changes presentation only: no layout, storage, or dimensions are modified.
 * Missing/unknown values preserve the ordinary interactive-3D startup.
 */
export function getInitialKitchenView(search = '') {
  const requested = new URLSearchParams(search).get('kitchenView');
  return ['top', 'front', 'east', 'west', 'north', 'south', 'three', 'references'].includes(requested)
    ? requested : 'three';
}
