// One material and colour palette for the whole home (2026-10-05). Appearance only: no dimension, position or saved
// layout is read or written here. Rules and checks: src/home/palette.mjs. Owner-facing explanation: docs/PALETTE.md.
//
// A palette = named colours + light colours + which colour each surface role takes in each room.
//   hex     what the app draws (sRGB). For a wood it is the average tone of the finished surface, not a catalogue colour.
//   spec    what to ask a dealer for. No catalogue codes on purpose: the code is picked from the dealer's shade card or
//           laminate folder against a physical sample, in the room's own light.
//   status  owner = the owner decided it (dated note in the source), existing = it is in the flat and stays,
//           proposal = on the table but not decided, placeholder = a developer colour with no decision behind it.
//   species (woods) which bundled veneer map the live 3D preview tints to reach the hex (src/home/paletteAppearance.mjs).
//
// TODAY_PALETTE records what the app shows now and is the default. Choosing it changes nothing anywhere.
// The other palettes are proposals: nothing in a room builder or a room config reads them.

export const STATUS_LABELS = Object.freeze({owner: 'Owner decision', existing: 'Existing, stays', proposal: 'Open proposal', placeholder: 'Placeholder'})
export const RECOMMENDED_PALETTE_ID = 'honey-oak'
export const LIVE_PREVIEW_NOTE = 'The 3D views re-colour only the surfaces tagged as wood or wall plaster (cabinetry, doors, room walls). Floors, fabrics, metal, tiles, the fluted TV panel wall and the window frames keep their drawn colours.'

const deepFreeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(deepFreeze); Object.freeze(value) } return value }

// Room types decide which roles a room must answer and which light range the checks expect (palette.mjs).
const ROOM_TYPES = {entry: 'entry', drawing: 'living', lobby: 'living', pooja: 'alcove', kitchen: 'work', storage: 'store', bedroom1: 'bedroom', 'bedroom1-balcony': 'outdoor', bedroom3: 'bedroom', study: 'bedroom', terrace: 'outdoor', balcony: 'office'}
const rooms = overrides => Object.fromEntries(Object.entries(ROOM_TYPES).map(([id, type]) => [id, {type, roles: overrides[id] || {}}]))
const LIGHT_LABELS = {living: 'Drawing Room, Lobby / Dining', bedroom: 'Bedrooms and Study', work: 'Kitchen', entry: 'Main entry', alcove: 'Pooja ghar', outdoor: 'Balconies and terrace'}

// ---------------------------------------------------------------------------------------------------------------------
// Things that are the same in every palette: decided by the owner or already in the flat.
// ---------------------------------------------------------------------------------------------------------------------
const KEPT = {
  floorExisting: {name: 'Existing floor', hex: '#d9cfc0', kind: 'floor', status: 'existing', where: 'Every room. No palette asks for new flooring.',
    spec: 'Nothing to buy. The existing floor is NOT recorded anywhere in the project (the app draws room-identification tints, not the real tile), and this hex is an assumed light beige. Note the tile size, colour and finish on site, and take one loose tile or a photo in daylight to the laminate and paint dealers.'},
  steel: {name: 'Brushed stainless steel', hex: '#c9cdd1', kind: 'metal', status: 'owner', where: 'Main entry outer door (owner 2026-10-04: ventilated, lockable); the kitchen is handleless with steel appliances.',
    spec: 'Grade 304 stainless steel, brushed (satin, "No. 4") finish, not mirror polish. Same finish for the door, its grille and the shaft cover if that is made in steel.'},
  kitchenOak: {name: 'Kitchen light oak', hex: '#907962', kind: 'wood', species: 'white-oak', status: 'owner', where: 'Kitchen shutters and tall units (owner pin applied 2026-10-03).',
    spec: 'Light natural oak with visible knots and grain, matt: either a 1 mm textured ("synchro" or suede) oak-pattern laminate, or oak veneer with a clear matt PU polish, on BWP (IS 710) plywood. The hex is the average of the app\'s white oak veneer map, which is greyer than most shop samples: choose against the owner\'s reference photo, not against this colour.'},
  kitchenTile: {name: 'Kitchen patterned tile', hex: '#8c8c8c', kind: 'tile', status: 'placeholder', where: 'Kitchen walls, backsplash and shaft cladding, full height (600 x 1200 tile image). Drawn since the first kitchen model and kept when the herb grid was added on 2026-10-03; no dated owner decision about the tile itself was found.',
    spec: 'Grey-and-white patterned (Moroccan style) ceramic wall tile, matt, as drawn. Take a kitchen oak sample when choosing, so the grey does not fight the wood.'},
  counterCream: {name: 'Cream worktop', hex: '#e7ded2', kind: 'stone', status: 'placeholder', where: 'Kitchen counters.',
    spec: 'Light cream or off-white engineered quartz, or a light granite, polished, 18-20 mm. The worktop was never decided: this is the colour the kitchen has always been drawn with. Choose the slab at the yard.'},
  mirror: {name: 'Mirror', hex: '#bdced2', kind: 'glass', status: 'owner', where: 'Shoe rack doors at the entry; Bedroom 3 mirror cabinet.',
    spec: '5 mm clear silver mirror with polished edges, on a plywood backing. No tint, no bronze mirror.'},
  olive: {name: 'Olive green (existing wardrobe)', hex: '#6f7350', kind: 'accent', status: 'existing', where: 'The existing wardrobe on the south wall of Bedroom 3 (phone scan 2026-10-04). The app does not draw it in this colour yet.',
    spec: 'Nothing to buy: the wardrobe stays. The hex is an estimate, not measured: photograph a door in daylight and carry it when choosing fabrics. If the doors are ever re-laminated, that is a separate decision.'},
}
const pick = (...keys) => Object.fromEntries(keys.map(key => [key, KEPT[key]]))

// ---------------------------------------------------------------------------------------------------------------------
// Today: what the app shows now. Sources are the room builders and configs; the full list is in docs/PALETTE.md.
// ---------------------------------------------------------------------------------------------------------------------
export const TODAY_PALETTE = deepFreeze({
  id: 'today', builtIn: true, name: 'Today', intent: 'warm',
  summary: 'What the app draws now: finishes chosen room by room. The default wood is the teak veneer of Interior studio > Materials with white oak in the kitchen, Bedroom 3 is honey oak by the owner\'s choice, the Drawing Room adds a brown fluted panel wall and dark carved wood, and handles come in five different metals.',
  colours: {
    wallIvory: {name: 'Ivory painted plaster', hex: '#f4eee3', kind: 'paint', status: 'placeholder', where: 'Every tagged room wall (the default of Interior studio > Materials).', spec: 'Developer default. The real wall paint of the flat is not recorded.'},
    poojaWall: {name: 'Pooja warm wall', hex: '#d9b98d', kind: 'paint', status: 'placeholder', where: 'Inside the Pooja unit.', spec: 'Developer colour.'},
    ceilingWhite: {name: 'White ceiling (assumed)', hex: '#ffffff', kind: 'paint', status: 'placeholder', where: 'Ceilings are not drawn in the room views; white is assumed.', spec: 'Not recorded.'},
    kitchenCeiling: {name: 'Kitchen ceiling cream', hex: '#f4eadf', kind: 'paint', status: 'placeholder', where: 'Kitchen ceiling as drawn.', spec: 'Developer colour.'},
    teakDefault: {name: 'Teak veneer (app default)', hex: '#af8257', kind: 'wood', species: 'teak', status: 'placeholder', where: 'All tagged cabinetry and doors outside the kitchen and Bedroom 3.', spec: 'Developer default of the material system, not a decision.'},
    honeyOak: {name: 'Honey oak', hex: '#b27d4c', kind: 'wood', species: 'teak', status: 'owner', where: 'Bedroom 3 cabinetry, chest and wardrobe fronts (owner 2026-10-03 and 2026-10-04: "the existing honey-oak shade").', spec: 'Owner decision for Bedroom 3.'},
    panelBrown: {name: 'Fluted panel brown', hex: '#a47a52', kind: 'wood', species: 'teak', status: 'proposal', where: 'Drawing Room fluted TV panel wall and the south window frame.', spec: 'Open item C11 proposes "mid walnut, fluted"; the window is to match it (work plan, 2026-10-04). Shade not decided.'},
    darkWood: {name: 'Dark carved wood', hex: '#4a2f1e', kind: 'wood', species: 'teak', status: 'owner', where: 'Drawing Room coffee table, side tables and the two carved panels (from the owner\'s pins, applied 2026-10-03); Pooja unit.', spec: 'From the owner\'s reference pictures.'},
    studyDark: {name: 'Study bookshelf dark timber', hex: '#69452f', kind: 'wood', species: 'teak', status: 'existing', where: 'Trim of the existing three-bay glazed bookshelf in the Study (pale laminate with dark timber trim).', spec: 'Existing furniture; the hex approximates its description.'},
    doorExisting: {name: 'Existing wooden doors', hex: '#a47149', kind: 'wood', species: 'teak', status: 'existing', where: 'Room doors and the arrival door: they stay (entry note 2026-10-04). Drawn in four slightly different browns between views.', spec: 'Existing doors. The owner asked that the Drawing Room panel wall match the door.'},
    handleBrass: {name: 'Brass handles', hex: '#b89a5c', kind: 'metal', status: 'placeholder', where: 'Room doors; Pooja unit.', spec: 'Developer colour.'},
    handleGraphite: {name: 'Graphite handles', hex: '#5e625f', kind: 'metal', status: 'placeholder', where: 'Lobby storage, Bedroom 1, Study.', spec: 'Developer colour.'},
    darkTrim: {name: 'Dark brown pulls and trims', hex: '#44382c', kind: 'metal', status: 'placeholder', where: 'Bedroom 3 cabinetry.', spec: 'Developer colour.'},
    darkAluminium: {name: 'Dark aluminium', hex: '#333b42', kind: 'metal', status: 'placeholder', where: 'Balcony and terrace frames and railings.', spec: 'Developer colour.'},
    black: {name: 'Black steel', hex: '#26282b', kind: 'metal', status: 'placeholder', where: 'Storage racks, balcony office desk frame, entry cabinet pulls, balcony railings.', spec: 'Developer colour.'},
    fabricCream: {name: 'Cream upholstery', hex: '#e6dac6', kind: 'fabric', status: 'owner', where: 'Drawing Room sofas (owner pins, applied 2026-10-03); bed upholstery.', spec: 'From the owner\'s reference pictures.'},
    terracotta: {name: 'Terracotta', hex: '#b5573a', kind: 'accent', status: 'owner', where: 'Drawing Room cushions, curtains and rug border (owner pins, applied 2026-10-03).', spec: 'From the owner\'s reference pictures.'},
    bedSage: {name: 'Sage bed cover', hex: '#b7c7bd', kind: 'accent', status: 'placeholder', where: 'Bed covers in Bedroom 1 and Bedroom 3.', spec: 'Developer colour.'},
    studyBlue: {name: 'Study blue', hex: '#647d91', kind: 'accent', status: 'placeholder', where: 'Study (kids layout) bedding and chair.', spec: 'Developer colour.'},
    ...pick('floorExisting', 'steel', 'kitchenOak', 'kitchenTile', 'counterCream', 'mirror', 'olive'),
  },
  lights: {living: 3000, bedroom: 3000, work: 4000, entry: 4000},
  lightLabels: {...LIGHT_LABELS, entry: 'Main entry (proposed, owner to confirm)'},
  roomDefaults: {
    living: {wall: 'wallIvory', ceiling: 'ceilingWhite', floor: 'floorExisting', wood: 'teakDefault', door: 'doorExisting', metal: 'handleBrass', fabric: 'fabricCream', light: 'living'},
    bedroom: {wall: 'wallIvory', ceiling: 'ceilingWhite', floor: 'floorExisting', wood: 'teakDefault', door: 'doorExisting', metal: 'handleGraphite', fabric: 'fabricCream', light: 'bedroom'},
    work: {wall: 'wallIvory', ceiling: 'ceilingWhite', floor: 'floorExisting', wood: 'teakDefault', metal: 'black', light: 'work'},
    entry: {wall: 'wallIvory', ceiling: 'ceilingWhite', floor: 'floorExisting', wood: 'teakDefault', door: 'steel', metal: 'black', light: 'entry'},
    alcove: {wall: 'wallIvory', ceiling: 'ceilingWhite', floor: 'floorExisting', wood: 'teakDefault', metal: 'handleBrass'},
    store: {wall: 'wallIvory', floor: 'floorExisting', wood: 'teakDefault', metal: 'black'},
    office: {wall: 'wallIvory', floor: 'floorExisting', wood: 'teakDefault', metal: 'black'},
    outdoor: {wall: 'wallIvory', floor: 'floorExisting', metal: 'darkAluminium'},
  },
  rooms: rooms({
    entry: {accent: 'mirror'},
    drawing: {wood2: 'panelBrown', furniture: 'darkWood', accent: 'terracotta'},
    pooja: {wall: 'poojaWall', furniture: 'darkWood'},
    kitchen: {ceiling: 'kitchenCeiling', wood: 'kitchenOak', metal: 'steel', tile: 'kitchenTile', counter: 'counterCream'},
    bedroom1: {accent: 'bedSage'},
    bedroom3: {wood: 'honeyOak', metal: 'darkTrim', accent: 'olive', accent2: 'bedSage'},
    study: {wood2: 'studyDark', accent: 'studyBlue'},
  }),
})

// ---------------------------------------------------------------------------------------------------------------------
// Recommended: honey oak and terracotta. It keeps every owner decision and removes the placeholders around them.
// ---------------------------------------------------------------------------------------------------------------------
const PAINT_WALL = 'Interior acrylic emulsion of a premium washable grade, matt or low-sheen ("matt", "soft sheen"), two coats over putty and primer.'
const HONEY_OAK = deepFreeze({
  id: 'honey-oak', name: 'Honey oak and terracotta', intent: 'warm',
  summary: 'The owner\'s own choices made into one scheme: the honey oak of Bedroom 3 becomes the wood of the whole home, warm ivory walls, cream fabric with terracotta and olive accents (the olive picks up the existing Bedroom 3 wardrobe), brushed stainless handles to go with the entry door, and warm 3000 K light everywhere except the kitchen. The kitchen keeps its light oak and patterned tile; the dark carved wood stays as loose furniture only.',
  changeNote: 'It changes no owner decision. The flagged rows are the existing wooden doors, which would be polished to the same honey oak (the owner already asked for the panel wall to match the door), and the existing Study bookshelf is left as it is. The other rows replace developer placeholders and settle two open proposals: the panel wall shade (C11) and the entry light colour (C6).',
  colours: {
    wallIvory: {name: 'Warm ivory', hex: '#f4eee3', kind: 'paint', where: 'All walls, every room.',
      spec: `${PAINT_WALL} Shade family: warm off-white / ivory with a slight yellow base, not a grey-white and not a pink-white. Pick the code from the dealer's shade card held against the honey oak sample.`},
    wallSand: {name: 'Soft sand', hex: '#e3d5bf', kind: 'paint', where: 'At most one wall per room: the headboard wall in each bedroom, the Drawing Room west wall behind the long sofa and carved panels, the Lobby wall behind the dining table.',
      spec: `${PAINT_WALL} Shade family: beige / sand, two or three steps deeper than the ivory on the same strip of the shade card, so the two read as one colour in two strengths.`},
    ceiling: {name: 'Ceiling white', hex: '#ffffff', kind: 'paint', where: 'All ceilings, the Drawing Room plaster moulding, beams.',
      spec: 'Flat (dead matt) white ceiling emulsion or acrylic distemper, untinted. No sheen: the slab is not perfectly level and sheen shows it.'},
    woodHoney: {name: 'Honey oak', hex: '#b27d4c', kind: 'wood', species: 'teak', where: 'All built-in cabinetry and wardrobes, the Drawing Room TV console, fluted panel wall and south window frame, all room doors and frames (the existing doors polished to match), the shoe rack carcass, Lobby storage, Study shelving and desk, balcony office cabinets.',
      spec: 'ONE product for the whole home, bought in one lot: a 1 mm high-pressure laminate in a mid honey / natural oak pattern, matt or suede finish with vertical grain, on BWP (IS 710) plywood with matching 2 mm edge band. Where veneer is preferred (panel wall, doors): oak or teak veneer stained to the same honey tone with a matt melamine or PU polish. Match the existing Bedroom 3 cabinetry: carry a door or a drawer front to the dealer.'},
    woodWalnut: {name: 'Dark walnut', hex: '#4a2f1e', kind: 'wood', species: 'teak', where: 'Loose and carved pieces only: the Drawing Room coffee and side tables and the two carved wall panels, the Pooja unit. Never on built-in cabinetry.',
      spec: 'Solid sheesham or teak furniture in a dark walnut stain with a matt polish (what furniture shops call "walnut" or "provincial teak" finish). Bought as furniture, not as laminate.'},
    steel: {...KEPT.steel, status: undefined, where: 'Main entry outer door (decided), and all cabinet handles, door levers, hinges and kitchen profiles.',
      spec: 'Grade 304 stainless steel in a brushed / satin finish: the entry door as decided, plus satin stainless (or satin nickel) handles and lever sets of one design family for every door and cabinet. No chrome, no gold.'},
    brass: {name: 'Antique brass', hex: '#b89a5c', kind: 'metal', where: 'Pooja unit only: knobs, bells, lamp.', spec: 'Solid brass in an antique (not lacquered-shiny) finish. Small quantity, bought with the pooja fittings.'},
    fabricCream: {name: 'Cream', hex: '#e6dac6', kind: 'fabric', where: 'Sofas, bed upholstery and headboards, main curtains.',
      spec: 'Cotton-linen blend or a textured polyester that looks like linen, in cream / natural. Sofas: a tight weave with a stain-resistant finish and removable covers. Curtains: the same cream, lined, floor length.'},
    terracotta: {name: 'Terracotta', hex: '#b5573a', kind: 'accent', where: 'Cushions, the Drawing Room rug and side curtains, one throw per bedroom, dining chair seats.',
      spec: 'Burnt orange / terracotta in cotton or wool. Buy cushions and the rug first: they are cheap to change, and they set how much orange the home takes.'},
    olive: {...KEPT.olive, name: 'Olive green', status: undefined, where: 'The existing Bedroom 3 wardrobe (stays), and repeated in small things elsewhere so it looks intended: bed covers, a few cushions, planters.',
      spec: 'Muted olive / sage green in cotton. Match the existing wardrobe door in daylight; go slightly greyer rather than brighter.'},
    ...pick('floorExisting', 'kitchenOak', 'kitchenTile', 'counterCream', 'mirror'),
  },
  lights: {living: 3000, bedroom: 3000, work: 4000, entry: 3000, alcove: 2700, outdoor: 3000},
  lightLabels: LIGHT_LABELS,
  roomDefaults: {
    living: {wall: 'wallIvory', accentWall: 'wallSand', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodHoney', door: 'woodHoney', metal: 'steel', fabric: 'fabricCream', accent: 'terracotta', light: 'living'},
    bedroom: {wall: 'wallIvory', accentWall: 'wallSand', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodHoney', door: 'woodHoney', metal: 'steel', fabric: 'fabricCream', accent: 'olive', light: 'bedroom'},
    work: {wall: 'wallIvory', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodHoney', metal: 'steel', light: 'work'},
    entry: {wall: 'wallIvory', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodHoney', door: 'steel', metal: 'steel', light: 'entry'},
    alcove: {wall: 'wallIvory', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodHoney', metal: 'steel', light: 'alcove'},
    store: {wall: 'wallIvory', floor: 'floorExisting', wood: 'woodHoney', metal: 'steel'},
    office: {wall: 'wallIvory', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodHoney', metal: 'steel', light: 'bedroom'},
    outdoor: {wall: 'wallIvory', floor: 'floorExisting', metal: 'steel', light: 'outdoor'},
  },
  rooms: rooms({
    entry: {accent: 'mirror'},
    drawing: {furniture: 'woodWalnut'},
    pooja: {wood: 'woodWalnut', metal: 'brass'},
    kitchen: {wood: 'kitchenOak', tile: 'kitchenTile', counter: 'counterCream'},
    bedroom1: {accent2: 'terracotta'},
    bedroom3: {accent2: 'terracotta'},
    study: {accent: 'terracotta', accent2: 'olive'},
  }),
})

// ---------------------------------------------------------------------------------------------------------------------
// Alternative A: light oak and sage. Brighter and cooler; one wood for the whole home including the kitchen.
// ---------------------------------------------------------------------------------------------------------------------
const LIGHT_OAK = deepFreeze({
  id: 'light-oak-sage', name: 'Light oak and sage', intent: 'neutral',
  summary: 'The kitchen\'s light oak idea carried through the whole home: soft white walls, one pale natural oak everywhere, matt black handles, oatmeal fabric with sage and charcoal, and neutral 4000 K light in the living rooms. It makes the flat look larger and cooler, which suits a top floor with a south-west window, but it gives up the honey oak of Bedroom 3 and the terracotta of the Drawing Room.',
  changeNote: 'It changes owner decisions (Bedroom 3 honey oak, the Drawing Room cream-and-terracotta fabrics and dark carved wood, the kitchen oak tone) and re-finishes the existing doors: all of those stay proposals. The 3000 K of the tracks is itself only a proposal.',
  colours: {
    wallWhite: {name: 'Soft white', hex: '#faf9f5', kind: 'paint', where: 'All walls, every room.',
      spec: `${PAINT_WALL} Shade family: soft / warm white with only a trace of cream, not a brilliant blue-white. Pick the code from the dealer's shade card against the light oak sample.`},
    wallSage: {name: 'Pale sage grey', hex: '#d9ddd0', kind: 'paint', where: 'At most one wall per room: headboard walls, the Drawing Room west wall, the Lobby dining wall.',
      spec: `${PAINT_WALL} Shade family: a greyed light green ("sage", "pista grey"), pale enough to read as a neutral next to white.`},
    ceiling: {name: 'Ceiling white', hex: '#ffffff', kind: 'paint', where: 'All ceilings and mouldings.', spec: 'Flat (dead matt) white ceiling emulsion or acrylic distemper, untinted.'},
    woodLightOak: {name: 'Light natural oak', hex: '#c3ab91', kind: 'wood', species: 'red-oak', where: 'All cabinetry including the kitchen, the TV console, panel wall and window frame, all doors, loose tables.',
      spec: 'ONE product for the whole home: a 1 mm high-pressure laminate in a pale natural oak pattern with visible grain and knots, matt or suede, on BWP (IS 710) plywood, with matching edge band; or oak veneer with a clear matt PU polish (no stain). Avoid yellow "maple" patterns and grey-washed ones.'},
    black: {name: 'Matt black', hex: '#26282b', kind: 'metal', where: 'All cabinet handles and profile pulls, door levers, curtain rods, the kitchen herb grid.',
      spec: 'Powder-coated matt black aluminium or steel handles of one design family (profile / "G" or slim bar pulls). The entry door stays brushed stainless.'},
    fabricOatmeal: {name: 'Oatmeal', hex: '#e7e0d2', kind: 'fabric', where: 'Sofas, bed upholstery, main curtains.', spec: 'Linen-look weave in oatmeal / natural, slightly greyer than cream; removable covers on the sofas.'},
    sage: {name: 'Sage green', hex: '#8b9a7c', kind: 'accent', where: 'Cushions, bed covers, one rug; sits next to the existing olive wardrobe in Bedroom 3.', spec: 'Muted grey-green cotton or linen.'},
    charcoal: {name: 'Charcoal', hex: '#4b4b48', kind: 'accent', where: 'Small amounts: cushion piping, picture frames, lamp bases, dining chair frames.', spec: 'Dark warm grey, matt; in fabric a wool-look weave.'},
    ...pick('floorExisting', 'steel', 'kitchenTile', 'counterCream', 'mirror', 'olive'),
  },
  lights: {living: 4000, bedroom: 3000, work: 4000, entry: 4000, alcove: 3000, outdoor: 4000},
  lightLabels: LIGHT_LABELS,
  roomDefaults: {
    living: {wall: 'wallWhite', accentWall: 'wallSage', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodLightOak', door: 'woodLightOak', metal: 'black', fabric: 'fabricOatmeal', accent: 'sage', accent2: 'charcoal', light: 'living'},
    bedroom: {wall: 'wallWhite', accentWall: 'wallSage', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodLightOak', door: 'woodLightOak', metal: 'black', fabric: 'fabricOatmeal', accent: 'sage', light: 'bedroom'},
    work: {wall: 'wallWhite', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodLightOak', metal: 'black', light: 'work'},
    entry: {wall: 'wallWhite', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodLightOak', door: 'steel', metal: 'black', light: 'entry'},
    alcove: {wall: 'wallWhite', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodLightOak', metal: 'black', light: 'alcove'},
    store: {wall: 'wallWhite', floor: 'floorExisting', wood: 'woodLightOak', metal: 'black'},
    office: {wall: 'wallWhite', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodLightOak', metal: 'black', light: 'work'},
    outdoor: {wall: 'wallWhite', floor: 'floorExisting', metal: 'black', light: 'outdoor'},
  },
  rooms: rooms({
    entry: {accent: 'mirror'},
    drawing: {furniture: 'woodLightOak'},
    kitchen: {metal: 'steel', tile: 'kitchenTile', counter: 'counterCream'},
    bedroom3: {accent: 'olive', accent2: 'sage'},
  }),
})

// ---------------------------------------------------------------------------------------------------------------------
// Alternative B: teak and brass. Darker and more traditional; the warmest of the three.
// ---------------------------------------------------------------------------------------------------------------------
const TEAK_BRASS = deepFreeze({
  id: 'teak-brass', name: 'Teak and brass', intent: 'warm',
  summary: 'A deeper, more traditional scheme: cream walls with one muted terracotta wall per main room, mid-brown teak for all cabinetry and doors, antique brass handles, cream fabric with rust and bottle green, and 2700 K light. It suits the carved panels and the chandelier best, and hides wear, but it is the darkest of the three in rooms that are not large, and teak next to the kitchen\'s light oak is a visible jump at the kitchen door.',
  changeNote: 'It changes an owner decision (Bedroom 3 honey oak becomes teak) and re-polishes the existing doors: those stay proposals. The track lamps go from the proposed 3000 K to 2700 K.',
  colours: {
    wallCream: {name: 'Cream', hex: '#f1e6d2', kind: 'paint', where: 'All walls, every room.',
      spec: `${PAINT_WALL} Shade family: cream, clearly yellow-based, one step deeper than ivory. Pick the code from the dealer's shade card against the teak sample.`},
    wallClay: {name: 'Muted terracotta', hex: '#c98a66', kind: 'paint', where: 'One wall only in the Drawing Room (west, behind the carved panels), the Lobby dining wall and each headboard wall.',
      spec: `${PAINT_WALL} Shade family: a dusty terracotta / clay, greyed, not a bright orange. Try a 2 ft patch first: this colour is strong on a large wall.`},
    ceiling: {name: 'Ceiling white', hex: '#ffffff', kind: 'paint', where: 'All ceilings and mouldings.', spec: 'Flat (dead matt) white ceiling emulsion or acrylic distemper, untinted.'},
    woodTeak: {name: 'Mid teak', hex: '#9c6b3f', kind: 'wood', species: 'teak', where: 'All cabinetry outside the kitchen, the TV console, panel wall and window frame, all doors and frames, loose tables and the carved panels.',
      spec: 'Teak veneer (4 mm, on BWP plywood) with a melamine or PU polish in a natural mid-brown, satin sheen; or a 1 mm teak-pattern laminate in the same tone for wardrobes. One polish shade for the whole home, approved on a sample board.'},
    brass: {name: 'Antique brass', hex: '#a8894f', kind: 'metal', where: 'All cabinet handles and knobs, door levers, curtain rods, the Pooja fittings.',
      spec: 'Brass or brass-finished zinc handles in an antique / brushed finish of one design family; avoid bright gold PVD. The entry door stays brushed stainless.'},
    fabricCream: {name: 'Cream', hex: '#e6dac6', kind: 'fabric', where: 'Sofas, bed upholstery, main curtains.', spec: 'Cotton-linen blend in cream / natural; removable covers on the sofas.'},
    rust: {name: 'Rust', hex: '#a84f2c', kind: 'accent', where: 'Cushions, the Drawing Room rug, side curtains.', spec: 'Deep burnt orange / rust in cotton or wool, one step darker than terracotta.'},
    bottleGreen: {name: 'Bottle green', hex: '#3f5a45', kind: 'accent', where: 'A few cushions, bed covers, dining chair seats; sits with the existing olive wardrobe in Bedroom 3.', spec: 'Dark muted green in cotton or velvet.'},
    ...pick('floorExisting', 'steel', 'kitchenOak', 'kitchenTile', 'counterCream', 'mirror', 'olive'),
  },
  lights: {living: 2700, bedroom: 2700, work: 4000, entry: 3000, alcove: 2700, outdoor: 3000},
  lightLabels: LIGHT_LABELS,
  roomDefaults: {
    living: {wall: 'wallCream', accentWall: 'wallClay', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodTeak', door: 'woodTeak', metal: 'brass', fabric: 'fabricCream', accent: 'rust', accent2: 'bottleGreen', light: 'living'},
    bedroom: {wall: 'wallCream', accentWall: 'wallClay', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodTeak', door: 'woodTeak', metal: 'brass', fabric: 'fabricCream', accent: 'bottleGreen', light: 'bedroom'},
    work: {wall: 'wallCream', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodTeak', metal: 'brass', light: 'work'},
    entry: {wall: 'wallCream', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodTeak', door: 'steel', metal: 'brass', light: 'entry'},
    alcove: {wall: 'wallCream', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodTeak', metal: 'brass', light: 'alcove'},
    store: {wall: 'wallCream', floor: 'floorExisting', wood: 'woodTeak', metal: 'brass'},
    office: {wall: 'wallCream', ceiling: 'ceiling', floor: 'floorExisting', wood: 'woodTeak', metal: 'brass', light: 'bedroom'},
    outdoor: {wall: 'wallCream', floor: 'floorExisting', metal: 'steel', light: 'outdoor'},
  },
  rooms: rooms({
    entry: {accent: 'mirror'},
    drawing: {furniture: 'woodTeak'},
    kitchen: {wood: 'kitchenOak', metal: 'steel', tile: 'kitchenTile', counter: 'counterCream'},
    bedroom3: {accent: 'olive', accent2: 'bottleGreen'},
  }),
})

/** Today first (the default), then the recommendation, then the two alternatives. */
export const HOME_PALETTES = Object.freeze([TODAY_PALETTE, HONEY_OAK, LIGHT_OAK, TEAK_BRASS])
export const getPalette = id => HOME_PALETTES.find(palette => palette.id === id) || null

/** Decided or existing things no palette changes: shown on the Palette page and in docs/PALETTE.md. */
export const KEPT_IN_EVERY_PALETTE = Object.freeze([
  'Main entry outer door: ventilated brushed stainless steel (owner 2026-10-04).',
  'Track lights: white 48 V magnetic tracks, one dimmer per track (owner 2026-10-04). Only the lamp colour (Kelvin) differs between palettes.',
  'Drawing Room: no false ceiling; the existing ring chandelier and the two ceiling fans stay.',
  'Kitchen: light oak shutters (owner pin, 2026-10-03), the patterned wall tile as drawn (never formally decided) and the black herb grid on the shaft.',
  'Bedroom 3: the existing olive-green wardrobe (phone scan 2026-10-04).',
  'Entry: mirror doors on the shoe rack.',
  'Lobby sliding doors: aluminium with fluted glass (decided); the frame colour follows the palette\'s metal.',
  'Floors: the existing floor in every room.',
])
