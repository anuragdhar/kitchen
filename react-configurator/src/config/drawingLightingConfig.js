// Concept fixture centers, measured from the Drawing Room's west and north walls.
// The existing chandelier is the only ceiling fixture; walls supply the other layers.
export const DRAWING_LIGHTING = {
  ambient: [
    {xMm:1750,zMm:3300,label:'Existing chandelier over oval table'},
  ],
  wallUplight:{wall:'west',fromNorthMm:850,heightMm:1800,label:'West wall uplight'},
  reading:{wall:'west',fromNorthMm:4645,heightMm:1550,label:'South sofa reading light'},
  tvBias:{wall:'north',heightMm:1145,label:'TV bias light behind the north-wall TV'},
  seatGlow:{fromNorthMm:4810,heightMm:120,label:'South sofa low glow'},
}
