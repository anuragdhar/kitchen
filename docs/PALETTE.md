# One material and colour palette for the whole home (2026-10-05)

Open **Palette** on the home page to see everything below with swatches. The data is
`react-configurator/src/config/homePaletteConfig.js`; the checks are `src/home/palette.mjs`.

Nothing in this document has been applied to a room. It is a proposal with two alternatives. Hex values are what the app
draws; they are not shop colours. No catalogue codes are given on purpose: the code has to be picked from the dealer's
shade card or laminate folder, against a physical sample, in the room's own light.

## 1. What the home looks like today, and why it is not a scheme

Finishes were chosen one room at a time. The checks on the Palette page count, for today's app:

- **7 different wood tones** (4 in the Drawing Room alone: the default teak, the brown fluted panel, dark carved wood and
  the doors), where a scheme wants 2 per room and 3 in the home.
- **6 metal finishes** for handles and frames (brass, graphite, dark brown, black, dark aluminium, stainless).
- **5 fabric and accent colours** with no link between rooms (cream and terracotta in the Drawing Room, sage bed covers,
  blue in the Study, the olive wardrobe).

What is behind each finish matters more than the colour itself:

| Kind | What | Where it comes from |
| --- | --- | --- |
| Owner decision | Honey oak cabinetry in Bedroom 3 | "existing honey-oak shade", 2026-10-03 and 2026-10-04 |
| Owner decision | Light knotty oak in the kitchen (the app's white oak veneer) | pin applied 2026-10-03 |
| Owner decision | Cream sofas, terracotta cushions and curtains, dark carved wood panels and tables in the Drawing Room | the two living-room pins, applied 2026-10-03 (the exact hexes are the developer's reading of the pictures) |
| Owner decision | Ventilated stainless steel outer door | 2026-10-04 |
| Owner decision | White 48 V magnetic track lights, one dimmer per track; no false ceiling | 2026-10-04 |
| Owner decision | Mirror doors on the shoe rack | reference of 2026-09-29 |
| Owner decision | The Drawing Room south window gets a wooden shade; the panel wall is to match the door | 2026-10-04 (which shade: open, C11 and C19) |
| Existing, stays | Olive-green wardrobe in Bedroom 3 (the app draws it beige and re-colours it as wood: it is not shown olive anywhere) | phone scan 2026-10-04 |
| Existing, stays | The wooden room doors and the arrival door; the ring chandelier and two fans in the Drawing Room; the glazed bookshelf in the Study (pale laminate, dark trim) | entry note 2026-10-04, scans |
| Existing, stays | The floor in every room. **It is not recorded anywhere**: the room pages draw identification colours (orange in Bedroom 3, green in the Drawing Room, teal in the Lobby, purple in Bedroom 1), not the real tile | - |
| Open proposal | Fluted TV panel wall and window frame in brown `#a47a52` ("mid walnut") | C11, C19 |
| Open proposal | 3000 K for the tracks in the living rooms and bedrooms, 4000 K in the kitchen (C26) and at the entry (C6) | lighting configs; "decisions taken without asking" |
| Placeholder | Teak veneer on all other cabinetry, ivory walls (`#f4eee3`): the defaults of Interior studio > Materials | developer |
| Placeholder | Kitchen patterned grey tile (full height), cream worktop `#e7ded2`, cream ceiling | drawn since the first kitchen model; no dated decision found |
| Placeholder | Every handle colour, bed covers, rugs, the Study's blue and rose, balcony frames, the dark TV console | developer |

Room by room, as drawn (authored colour; tagged wood and walls are then shown in the default teak / white oak / ivory):

| Room | Walls | Floor as drawn | Wood | Metal | Fabric and accents | Light |
| --- | --- | --- | --- | --- | --- | --- |
| Main entry | `#d3ccc2` | `#bda890` | shoe rack `#d8c9a8` (scan texture), east cabinet `#b18b67`, arrival door `#c9a578` | stainless door `#c9cdd1`, brass-tone hardware `#ad936a`, black pulls | mirror doors `#bdced2` | round panels, 4000 K proposed |
| Drawing Room | `#dfd2c4` | plan green `#6b8e63` | panel and window frame `#a47a52`, dark console `#6a4429`, tables `#4a2f1e`, carved panels `#6b4529`, door `#a47149` | brass handle `#b89a5c`, bronze chandelier | cream `#e6dac6`, terracotta `#b5573a`, amber `#c9803f`, rust curtains `#9a5a36` | white tracks, 3000 K |
| Lobby / Dining | `#d6d1c9` | plan teal `#4b93a7` | storage `#ad8968` with cream fronts `#e4dacb`, table `#a98259` | graphite `#5e625f` | chair fabric `#ded2bd`, sage-grey rug | white tracks, 3000 K |
| Pooja ghar | warm wall `#d9b98d`, stone `#f2e9d9` | stone | dark doors `#4a2e22`, platform `#aa825c` | brass `#c6a15b` | cane, amber glass | warm glow, no Kelvin set |
| Kitchen | patterned tile, full height | `#ded6cc` | body `#efe9df`, shutters `#b99673` (shown as white oak) | handleless; steel appliances; black plinth and window frame | worktop `#e7ded2`, terracotta pots | one track, 4000 K |
| Storage | none drawn | `#d7c9b5` | sliding cover `#c5b49e` | black racks `#26282b` | - | none |
| Bedroom 1 | `#d6d1c9` | plan purple `#9f7aea` | wardrobes `#d0c0aa` / `#e9e1d4`, bed `#806047`, door `#a47149` | graphite `#373b3c` | cream `#efe8dc`, sage cover `#b7c7bd` | white tracks, 3000 K |
| Bedroom 1 balcony | - | `#b79a78` | wardrobe `#a78059` with sage fronts `#dce6dd`, desk `#b28a60` | dark aluminium `#333b42` | - | none |
| Bedroom 3 | `#d6d1c9` | plan orange `#db8b47` | honey oak `#b27d4c` / `#96633d`, doors `#916b4d`, existing wardrobe drawn beige `#e4dacb` | dark trims `#44382c` | cream, sage cover `#b7c7bd` | white tracks, 3000 K |
| Study / Bedroom 2 | `#cfc7bb` | brown `#866447` | bookshelf `#69452f` with pale panels, south cabinet `#c8a97e`, door `#8b6747`, kids oak `#b98a5d` | graphite `#5f625d` | blue `#647d91`, rose `#b68689`, navy desk accent | white tracks, 3000 K |
| Terrace | - | `#c9c5bc` | - | railing `#343b40` | - | none |
| Balcony office | `#f4f1eb` | marble `#f5f5f2` | pale oak texture `#c9aa7b` | black `#20262c` | - | none |

## 2. Recommended: Honey oak and terracotta

It is the owner's own choices, made into one scheme. The wood the owner picked for Bedroom 3 becomes the wood of the
home; the cream and terracotta of the Drawing Room pins become the fabrics of the home; the olive wardrobe that is
staying becomes the second accent, so it looks intended; the handles follow the stainless entry door.

| Use | Name | Hex | Where | What to ask for |
| --- | --- | --- | --- | --- |
| Wall, main | Warm ivory | `#f4eee3` | All walls | Premium washable interior acrylic emulsion, matt or low sheen. Shade family: warm off-white / ivory with a slight yellow base (not grey-white, not pink-white) |
| Wall, accent | Soft sand | `#e3d5bf` | At most one wall per room: bed headboard walls, Drawing Room west wall behind the long sofa, Lobby wall behind the dining table | Same paint. Beige / sand, two or three steps deeper than the ivory on the same strip of the shade card |
| Ceiling | Ceiling white | `#ffffff` | All ceilings, the Drawing Room moulding | Flat (dead matt) white ceiling emulsion or acrylic distemper, untinted |
| Wood 1 | Honey oak | `#b27d4c` | All built-in cabinetry, the TV console, the fluted panel wall, the south window frame, room doors, shoe rack, Lobby storage, Study, balcony office | ONE product, one lot: 1 mm high-pressure laminate in a mid honey / natural oak pattern, matt or suede, vertical grain, on BWP (IS 710) plywood with matching 2 mm edge band. Where veneer is used (panel wall, doors, window): oak or teak veneer stained to the same tone, matt melamine or PU polish. Match the existing Bedroom 3 cabinetry |
| Wood 2 | Kitchen light oak | `#907962` | Kitchen only (owner decision) | Light natural oak with knots, matt: textured oak laminate, or oak veneer with clear matt PU. Choose against the owner's reference photo; the app's veneer map is greyer than shop samples |
| Wood 3 (loose pieces only) | Dark walnut | `#4a2f1e` | Drawing Room coffee and side tables and the carved panels; the Pooja unit | Bought as furniture: sheesham or teak in a dark walnut stain, matt polish. Never used for built-in cabinetry |
| Floor | Existing floor | (not recorded) | Every room | Nothing to buy. Record the tile first (section 6) |
| Metal | Brushed stainless | `#c9cdd1` | Entry door (decided), every handle, lever, hinge, kitchen profile | Grade 304, brushed / satin. Satin stainless or satin nickel handles of one design family. No chrome, no gold |
| Metal, pooja only | Antique brass | `#b89a5c` | Pooja knobs, bells, lamp | Solid brass, antique finish |
| Doors | Honey oak | `#b27d4c` | Room doors and frames | The existing wooden doors stay and are re-polished to the honey tone (they are already close); a new door is a BWP flush door with the same laminate or veneer on both faces |
| Fabric, main | Cream | `#e6dac6` | Sofas, bed upholstery and headboards, main curtains | Cotton-linen blend or linen-look weave, removable sofa covers, lined floor-length curtains |
| Accent 1 | Terracotta | `#b5573a` | Cushions, Drawing Room rug and side curtains, one throw per bedroom, dining chair seats | Burnt orange cotton or wool |
| Accent 2 | Olive green | `#6f7350` (estimate) | The existing Bedroom 3 wardrobe, repeated in bed covers, a few cushions, planters | Muted olive / sage cotton, matched to the wardrobe door in daylight |
| Tile | Kitchen patterned tile | `#8c8c8c` | Kitchen walls as drawn | Grey-and-white patterned matt ceramic; never formally decided, kept here |
| Worktop | Cream | `#e7ded2` | Kitchen | Light cream quartz or light granite; never decided, kept as drawn |

Light colour: **3000 K** in the Drawing Room, Lobby, bedrooms, Study, balcony office, balconies and at the **entry**
(today 4000 K is proposed there; the entry opens straight into a 3000 K room, and a colour jump at the door reads as a
fault); **4000 K** in the kitchen; **2700 K** inside the Pooja unit. Ask for CRI 90 or better and buy all lamps of one
colour from one maker in one lot.

Why this one:

1. It changes **no owner decision**. Honey oak, the kitchen oak, the cream and terracotta, the stainless door, the white
   tracks and the mirror doors all stay.
2. It settles the open questions the same way the owner has already leaned: C11 and C19 (panel wall and window shade)
   become honey oak, which is "the wall matches the door" and "one wood tone in the room".
3. The flat is on the top floor with a south-west Drawing Room window: strong, warm afternoon sun. Ivory walls and a
   mid-tone wood hold up in that light; a very white scheme glares and a dark one heats up visually.
4. Honey oak against ivory has a contrast of 3.1 : 1 in the app's values, so cabinetry reads clearly without looking
   heavy. The dark walnut is limited to pieces that can be moved or replaced.

## 3. Alternative A: Light oak and sage (brighter, cooler)

Soft white walls `#faf9f5`, pale sage-grey accent wall `#d9ddd0`, one **light natural oak** `#c3ab91` for all cabinetry
including the kitchen, **matt black** handles `#26282b`, oatmeal fabric `#e7e0d2` with sage `#8b9a7c` and charcoal
`#4b4b48`; 4000 K in the living rooms and entry, 3000 K in bedrooms.
It makes the flat look larger and is the closest to the kitchen pin. It gives up the honey oak of Bedroom 3 and the
terracotta of the Drawing Room, so it changes owner decisions; pale laminate also shows marks sooner.

## 4. Alternative B: Teak and brass (deeper, traditional)

Cream walls `#f1e6d2`, one muted terracotta wall `#c98a66` per main room, **mid teak** `#9c6b3f` for all cabinetry and
doors outside the kitchen (teak veneer with melamine or PU polish), **antique brass** handles `#a8894f`, cream fabric
with rust `#a84f2c` and bottle green `#3f5a45`; 2700 K in the living rooms and bedrooms.
It suits the carved panels and the chandelier best and hides wear. It is the darkest in rooms that are not large, the
teak sits awkwardly beside the kitchen's light oak, and it replaces the Bedroom 3 honey oak.

## 5. Room by room (recommended palette)

| Room | Walls | Accent wall | Wood | Doors | Metal | Fabric / accents | Light |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Main entry | Warm ivory | - | Honey oak | Stainless (outer); wooden arrival door polished honey | Stainless | Mirror doors | 3000 K |
| Drawing Room | Warm ivory | Soft sand (west wall) | Honey oak; dark walnut loose pieces | Honey oak | Stainless | Cream; terracotta | 3000 K |
| Lobby / Dining | Warm ivory | Soft sand (dining wall) | Honey oak | Honey oak | Stainless | Cream; terracotta | 3000 K |
| Pooja ghar | Warm ivory | - | Dark walnut | - | Antique brass | - | 2700 K |
| Kitchen | Warm ivory (where not tiled) | - | Kitchen light oak | - | Stainless | Patterned tile; cream worktop | 4000 K |
| Storage | Warm ivory | - | Honey oak | - | Stainless | - | - |
| Bedroom 1 | Warm ivory | Soft sand (headboard) | Honey oak | Honey oak | Stainless | Cream; olive; terracotta | 3000 K |
| Bedroom 1 balcony | Warm ivory | - | - | - | Stainless | - | 3000 K |
| Bedroom 3 | Warm ivory | Soft sand (headboard) | Honey oak (as today) | Honey oak | Stainless | Cream; olive (existing wardrobe); terracotta | 3000 K |
| Study / Bedroom 2 | Warm ivory | Soft sand | Honey oak; the existing bookshelf is left as it is | Honey oak | Stainless | Cream; terracotta; olive | 3000 K |
| Terrace | Warm ivory | - | - | - | Stainless | - | 3000 K |
| Balcony office | Warm ivory | - | Honey oak | - | Stainless | - | 3000 K |

## 6. What changes from today (recommended palette)

The Palette page lists all 42 rows. In short:

- **Wood:** the default teak everywhere outside the kitchen and Bedroom 3 becomes honey oak (in the app the two look
  almost the same; in the shop it means one laminate for the whole home). The brown fluted panel and window frame become
  honey oak. The Pooja unit is dark walnut.
- **Handles:** five different metals become brushed stainless; brass only in the Pooja unit.
- **Fabrics:** sage bed covers and the Study's blue and rose become olive and terracotta.
- **Walls:** stay ivory; one soft sand wall is added in the main rooms. The Pooja interior goes from tan to ivory.
- **Light:** entry 4000 K to 3000 K; Pooja, balconies and terrace get a stated colour.
- **Flagged, proposals only (existing things):** the existing wooden doors in the Drawing Room, Lobby, Bedroom 1,
  Bedroom 3 and Study would be re-polished to the honey tone. Nothing else touches a decision or an existing item.

Alternative A flags 14 rows and alternative B 8 (Bedroom 3 honey oak, the Drawing Room fabrics and dark wood, the kitchen
oak tone in A, and the doors). They are listed on the Palette page.

## 7. What to buy first, as samples (before any order)

1. **Record the floor.** Photograph the existing floor tile in daylight in two rooms and note its size and finish.
   Every other sample is judged against it, and it is the one finish nobody has written down.
2. **Honey oak laminate:** three or four A4 samples from the dealer's folder in the "natural / honey oak, matt" range,
   plus one veneer offcut polished to the same tone. Hold them against a Bedroom 3 drawer front and an existing door.
3. **Kitchen oak:** two light knotty oak samples next to the honey oak, to see that they sit together at the kitchen door.
4. **Paint:** 200 ml sample pots of two ivories and one sand. Paint 2 ft squares on the Drawing Room west wall (afternoon
   sun) and on a north-facing bedroom wall; look at them at noon, at 5 pm and under the 3000 K lamps.
5. **One handle** in satin stainless, and one lever set, to check against the entry door finish.
6. **Fabric:** half-metre cuts of the cream, a terracotta and an olive; put them on the existing sofa beside the olive
   wardrobe photo.
7. **One 3000 K and one 4000 K lamp** of the track maker under consideration, tried at the entry in the evening.

## 8. The checks, and their limits

`checkPalette` (run on the Palette page and in `tests/home-palette.test.mjs`) requires for each proposed palette: every
colour has a hex and a buying specification; every room has every role its type needs; at most 2 wood tones per room and
3 in the home; at most 2 metal finishes; wall-to-wood contrast of at least 1.3 : 1; at most one main fabric plus three
accents; wall warmth and lamp colour that match the palette's stated intent (warm or neutral). All three palettes pass;
today's finishes fail five of them.

The checks compare hex values. They cannot tell how a real laminate looks beside a real floor, and the olive wardrobe
and the floor are estimates. Samples in the room decide.

## 9. Seeing it in 3D

The Palette page (and Interior studio > Materials) has a palette preview selector. **Today** is the default and leaves
every view exactly as it was. A chosen palette re-colours only what the material system already tags: cabinetry, doors
and room walls. It does **not** change floors, fabrics, handles, tiles, lamp colour, the fluted panel wall, the dark TV
console or the accent wall, because those are plain colours inside the room builders. Showing them would need, in the
room builders and room pages (not done, other work is in progress there):

- tagging the untagged surfaces with new roles (`fabric`, `accent`, `metal`, `floor`, `accentWall`) and extending
  `surfaceRoles.mjs` and `interiorScene.js` to colour those roles;
- tagging the fluted panel, its hidden door and the TV console as wood, and drawing the existing wardrobe in olive
  instead of tagging it as wood;
- passing each lighting config's `kelvin` to the lamps (today every track renders in the same warm colour whatever the
  config says).

The wood preview tints the nearest bundled veneer map to the palette's tone; it shows tone, not a supplier's grain.
