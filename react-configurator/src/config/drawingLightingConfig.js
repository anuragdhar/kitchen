// Concept fixture centers, measured from the Drawing Room's west and north walls.
// The existing chandelier is the only ceiling fixture; walls supply the other layers.
export const DRAWING_LIGHTING = {
  ambient: [
    {xMm:1745,zMm:2420,label:'Existing chandelier over oval table'},
  ],
  wallUplight:{wall:'west',fromNorthMm:850,heightMm:1800,label:'West wall uplight'},
  reading:{wall:'west',fromNorthMm:4645,heightMm:1550,label:'Window-seat reading light'},
  tvBias:{wall:'east',fromNorthMm:1500,heightMm:1100,label:'TV bias light'},
  seatGlow:{fromNorthMm:4790,heightMm:120,label:'Window-seat low glow'},
}
