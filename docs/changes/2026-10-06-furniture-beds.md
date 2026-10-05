# Better-looking beds (2026-10-06)

Your request: "Can we improve the asset quality? Can we use better quality sofas, dining table, bed etc., which render more
naturally." This note covers the **beds**; the sofas and the tables/chairs were done in parallel and have their own notes.

Nothing was moved or resized. Every bed stands exactly where and as large as before; only how it is drawn changed.

## What looks different

Every bed in the home was a stack of plain boxes (base, mattress, a flat green slab for the cover, two white bricks for
pillows). They are now drawn as made beds, built from shapes in the app itself (no downloaded models or pictures):

- **Base:** the timber base now stands on a dark recessed plinth, so there is a shadow line under it and it no longer looks
  glued to the floor. The kids bed in the Study stands on four short oak legs instead (its box was already 40 mm off the floor).
- **Mattress:** rounded corners and edges, with piping along the top and bottom edges.
- **Duvet:** falls over the sides and the foot of the mattress in soft folds, gathers at the foot corners, is a little fuller
  in the middle, and is turned back below the pillows (the turned-down band shows the fold). Its hem is rolled, not a cut edge.
- **Pillows:** crowned and slightly dented where a head lies, with a flat pillowcase border, lying where the sleepers lie.
  Two on each double bed, one on the kids bed.
- **Throw:** a folded knit throw across the foot of each bed (new, see below).
- **Headboard:** the same timber headboard, now with thickness, rounded top corners and a slightly raised framed panel.
- **Fabric looks like fabric:** a fine woven texture and the soft sheen of cloth on the bedding (a chunky rib knit on the
  throw), and a little shading in the folds and along the pillow seams so white pillows keep their shape in bright light.
- **Bedroom 1:** the two accent cushions (sage and caramel) now lean against the pillows instead of being two boxes.
- **Study day seat** ("Day seat" button): a fitted rose cover and two cushions leaning on the back board.
- **Whole home 3D** now draws Bedroom 1's bed with the same builder as the Bedroom 1 page (layout A, as before), so the two
  views match. Bedroom 3 and the Study already shared their builders.
- Clicking a bed for its dimensions now reports the whole bed in all three rooms (the Study bed used to report a group with
  the desk). The overhanging duvet and throw are left out of that measurement, so it still reads the bed's footprint.

## What did not change

- **Footprints and positions:** Bedroom 1 1829 x 1524 in both layouts (A along the south wall, B head on the south wall);
  Bedroom 3 1829 x 1829, head on the east wall, centre 1863 from the north wall; Study bed 2000 x 900 against the east wall
  from 1050 (day seat 550 deep). The base outline equals these to within 1 mm (a new test measures the built beds).
- **Heights:** base top 250, mattress top 440, headboard top 1170 (Bedroom 1 and 3); Study box top 380, mattress top 490,
  back board top 690. The pillows stay under 560 in Bedroom 1 (the `pillowTopMm` the room checks use).
- **Colours:** your colours are kept: timber `#806047` base and `#9a7656` headboard, ivory sheet `#efe8dc`, sage duvet
  `#b7c7bd`, white pillows `#fbf8f1`; Study honey oak, white bedding and rose cover. The timber still follows the whole-home
  finish and the palette preview.
- **Clearances:** the duvet and throw overhang the base by at most about 33 mm (limit 40). In Bedroom 3 they stay about
  20 mm clear of the bedside cabinets, which stand 48.5 mm from the bed. In Bedroom 1 layout B they stay clear of the
  bedside table. The medicine cabinet doors (layout B, from 1250 up) are well above the cushions (top about 780).
- No config number, room, cabinet or other furniture was changed.

## Chosen without asking (defaults; easy to change)

- **Throws are new:** warm oatmeal `#bfa98a` knit in Bedroom 1 and Bedroom 3, navy `#273b52` (the desk accent colour) on the
  kids bed. They are decoration: like the other decor, they are left out of the high-quality Blender renders.
- Plinth recess 50 mm deep and 70 mm high, dark brown `#2b2724`; mattress set 20 mm in from the base edge; duvet falls about
  160 mm (120 mm on the kids bed); pillows 420 x 660 mm.
- The headboard keeps a timber face (as today) rather than becoming upholstered.

## Size and speed

- Triangles per bed: Bedroom 1 7,356; Bedroom 3 6,940; Study kids bed 5,300; Study day seat 4,292 (the boxes were 60 to 96).
  That is small for a graphics card. Drawn pieces per bed: 10 in Bedroom 1 (with the two cushions), 8 elsewhere, against
  5 to 7 boxes before, because pieces sharing a material are joined into one.
- Frame rate, measured in a headless browser with the graphics card, the same day, same script, old and new code:
  room pages 75 frames per second before and after (Bedroom 1, Bedroom 3, Study); Whole home 3D 20-21 before and 21-22
  after on this run (the machine was busier than during the 2026-10-05 measurement of 27, so compare only within a run).
  No measurable change.

## Checked

- Full test suite: 450 of 457 pass; the 7 failures are the known `Windows: ...` launcher tests. (On the first run
  `tests/current-project.test.mjs` also failed once while the machine was busy; it passed alone and on the re-run.)
  `npm run lint` and `npm run build` pass.
- New test `tests/bed-furniture.test.mjs`: measures each built bed (both Bedroom 1 layouts, Bedroom 3, the Study bed and day
  seat) against the configuration: base outline, base/mattress/headboard heights, pillow height, duvet and throw overhang,
  clearance to the Bedroom 3 cabinets and the Bedroom 1 bedside table, triangle budget, wood tags, decor tags.
- Pictures of every bed page (Overview, Top, East cabinetry view, Kids layout, layout B, Whole home 3D) and eye-level
  close-ups of each bed were looked at before and after; no page errors.

## Not verified

- The Blender archviz export was not run, so how the new bedding looks in the high-quality renders is not seen.
- Draft and Standard quality, the Evening mode and the palette preview were not looked at with the new beds.
- Daylight in the live views follows the clock, so before and after pictures taken hours apart are lit differently.
- For the lead: `bedding.js` has its own small fabric texture and soft-shape helpers; the sofa work added similar ones
  (`fabric.js`, `softForms.js`) in the same round. They can be unified later.
