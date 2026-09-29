// Concept fixture centres, measured from the Drawing Room's west and north walls. There is one set per seating
// layout (roomShellConfig.js drawing: "northTv" is the default tvWall layout, "cornerSofas" the alternative).
// The existing chandelier is the only ceiling fixture; walls supply the other layers.
export const DRAWING_LIGHTING = {
  northTv: {
    ambient: [{xMm: 1750, zMm: 3300, label: 'Existing chandelier over oval table'}],
    wallUplight: {fromNorthMm: 850, heightMm: 1800, label: 'West wall uplight'},
    reading: {fromNorthMm: 4645, heightMm: 1550, label: 'South sofa reading light'},
    sofaGlow: {xMm: 1140, lengthMm: 2250, fromNorthMm: 4810, heightMm: 120, label: 'South sofa low glow'},
  },
  cornerSofas: {
    ambient: [{xMm: 1745, zMm: 1900, label: 'Existing chandelier over oval table'}],
    wallUplight: {fromNorthMm: 850, heightMm: 1800, label: 'West wall uplight'},
    reading: null,
    sofaGlow: {xMm: 1155, lengthMm: 2250, fromNorthMm: 930, heightMm: 120, label: 'North sofa low glow'},
  },
}
