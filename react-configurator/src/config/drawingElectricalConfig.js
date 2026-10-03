// Proposed electrical, lighting and data points for the Drawing Room, layout C (owner request 2026-10-03: "main electricity
// points, keeping in mind devices and phone charging"). A planning layout for a licensed electrician, not a wiring design:
// existing wiring, earthing, circuit sizes and the building's intercom/broadband entry must be verified on site.
//
// Positions are in the Drawing Room frame (millimetres): x from the west wall, z from the north wall.
//   wall: 'north' | 'south' -> alongMm is x;  wall: 'east' | 'west' -> alongMm is z;  heightMm is the box centre above the floor.
//   wall: 'ceiling' -> xMm, zMm;  wall: 'floor' -> xMm, zMm;  wall: 'closet' -> inside the pocket's west cabinet (xMm, heightMm).
// kind: 'power' (socket outlets), 'charging' (sockets with USB-A/C), 'lighting' (light point or switchboard), 'data'
// (CAT6, coax, phone, intercom, conduit), 'dedicated' (its own circuit). hidden: true where the box is meant to sit behind
// equipment or furniture; every other point must stay reachable.
// Heights follow common Indian practice: switchboards 1200, low sockets 300, TV box behind the screen, AC point near the unit.
export const DRAWING_ELECTRICAL = {
  layout: 'southSofas',
  points: [
    // ---- North wall: the TV wall ----
    {id: 'N1', name: 'TV box (behind the screen)', kind: 'power', wall: 'north', alongMm: 1600, heightMm: 1000, hidden: true,
      outlets: '3 x 6 A sockets in a recessed media box + 1 CAT6 + end of the HDMI conduit',
      use: 'TV, Soundbar 300 and a streaming stick; recessed so the plugs do not push the TV off the wall'},
    {id: 'N2', name: 'Media point under the TV', kind: 'power', wall: 'north', alongMm: 1700, heightMm: 300,
      outlets: '2 x 6 A sockets + 1 TV coax (DTH/cable) + 1 CAT6 (spare)',
      use: 'Bass Module 500 and a set-top box or game console; a 50 mm conduit runs up inside the wall to N1 for HDMI (eARC)'},
    {id: 'N3', name: 'West cabinet light', kind: 'lighting', wall: 'closet', xMm: 380, heightMm: 2450,
      outlets: 'LED batten with a door-contact switch',
      use: 'lights the winter-clothes closet when its doors open; nothing to remember to switch off'},
    // ---- East wall: arrival side, past the entry door's swing ----
    {id: 'E1', name: 'Main switchboard + drop-zone charger', kind: 'lighting', wall: 'east', alongMm: 1250, heightMm: 1200,
      outlets: 'switches for chandelier, uplight, reading light (2-way), sofa glow; 1 x 6 A socket; 1 USB-A + USB-C charger',
      use: 'first wall on the left after the entry door swing (850 mm); phones and keys can charge on arrival'},
    {id: 'E2', name: 'Router cabinet', kind: 'data', wall: 'east', alongMm: 1090, heightMm: 1560, hidden: true,
      outlets: '2 x 6 A sockets + fibre/broadband entry + telephone line + 2 CAT6 out (to N1 and N2)',
      use: 'router and landline base inside the lattice cell of the east-wall cabinet'},
    {id: 'E3', name: 'Intercom', kind: 'data', wall: 'east', alongMm: 1810, heightMm: 1775, hidden: true,
      outlets: 'building intercom cable + 1 x 6 A socket if the handset needs mains',
      use: 'intercom handset in the third cell of the cabinet, near the entry door'},
    {id: 'E4', name: 'Utility socket', kind: 'power', wall: 'east', alongMm: 1850, heightMm: 300,
      outlets: '1 x 6/16 A combined socket',
      use: 'vacuum cleaner, festival lights, a room heater in winter'},
    // ---- West wall ----
    {id: 'W1', name: 'AC point', kind: 'dedicated', wall: 'west', alongMm: 3080, heightMm: 2300,
      outlets: '1 x 16 A socket (or isolator) on its own circuit',
      use: 'the existing split AC indoor unit (centred z 2420); keep beside the unit, not behind it'},
    {id: 'W2', name: 'Wall uplight', kind: 'lighting', wall: 'west', alongMm: 850, heightMm: 1800,
      outlets: 'light point', use: 'west wall uplight (drawingLightingConfig), switched at E1'},
    {id: 'W3', name: 'Lamp + charging, west sofa north end', kind: 'charging', wall: 'west', alongMm: 1835, heightMm: 300,
      outlets: '1 x 6 A socket + 1 USB-A + USB-C', use: 'side-table lamp and phones at the end of the west sofa'},
    {id: 'W4', name: 'Charging above the west sofa', kind: 'charging', wall: 'west', alongMm: 3800, heightMm: 1000,
      outlets: '1 USB-A + USB-C charger + 1 x 6 A socket', use: 'reachable from the west sofa seats without getting up; just above the sofa back (about 925 mm)'},
    {id: 'W5', name: 'Reading light', kind: 'lighting', wall: 'west', alongMm: 4645, heightMm: 1550,
      outlets: 'light point with a local switch (2-way with E1)', use: 'reading light over the corner seat of the L'},
    // ---- South wall: below the window sill (550 mm) along the window ----
    {id: 'S1', name: 'Sofa glow driver', kind: 'power', wall: 'south', alongMm: 1155, heightMm: 300, hidden: true,
      outlets: '1 x 6 A switched socket (switched at E1)', use: 'LED driver for the low glow strip under the south sofa'},
    {id: 'S2', name: 'Lamp + charging, south sofa east end', kind: 'charging', wall: 'south', alongMm: 2450, heightMm: 300,
      outlets: '1 x 6 A socket + 1 USB-A + USB-C + 2-way chandelier switch', use: 'side-table lamp and phones at the open end of the south sofa'},
    {id: 'S3', name: 'Spare / heater socket', kind: 'power', wall: 'south', alongMm: 3050, heightMm: 300,
      outlets: '1 x 6/16 A combined socket', use: 'room heater, air purifier or decorative lights by the window'},
    // ---- Ceiling and floor ----
    {id: 'C1', name: 'Chandelier', kind: 'lighting', wall: 'ceiling', xMm: 1745, zMm: 3425,
      outlets: 'ceiling light point with a hook rated for the fitting', use: 'over the coffee table; 2-way switched at E1 and S2. Moves 125 mm south of the layout A point'},
    {id: 'F1', name: 'Floor box at the coffee table', kind: 'charging', wall: 'floor', xMm: 1230, zMm: 3425, optional: true,
      outlets: 'flush floor box: 1 x 6 A + USB-A/C, lid closes over plugs',
      use: 'charging at the table and the west sofa; must be chased into the floor before tiling, under the rug'},
  ],
  circuits: [
    'Lighting: one 6 A MCB circuit for C1, W2, W5, N3 and the sofa glow (S1).',
    'Sockets: one 16 A MCB circuit for N1, N2, E1, E2, E3, E4, W3, W4, S2, S3 and F1, protected by a 30 mA RCBO/RCCB.',
    'AC: W1 on its own circuit sized to the AC nameplate (typically 16-20 A), with its own MCB.',
    'Media: plug-in surge protection (or a surge device at the board) for N1, N2 and E2.',
    'Data: CAT6 from E2 to N1 and N2, coax to N2, phone line to E2; run low-voltage cables in their own conduits, crossing mains only at right angles.',
  ],
  safety: 'All sockets three-pin with an effective earth, BIS-marked (IS 1293); modular boxes and plates; concealed PVC conduit. A licensed electrician must confirm the existing wiring, earthing, MCB/RCBO ratings and the intercom and broadband entry before any chasing.',
}
