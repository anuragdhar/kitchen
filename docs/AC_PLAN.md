# Air-conditioning plan for the whole home (2026-10-05)

Status: a PROPOSAL. Nothing in it is measured on site. Sizes are typical casings, the load figures are a rule of thumb,
and the drain points are assumed. An AC dealer confirms the sizes; the installer confirms every route before drilling.

Where it lives in the app (paths under `react-configurator/`):

- `src/config/acPlanConfig.js`: one entry per room (machine, size, indoor position, outdoor unit, pipe route, wall hole,
  drain route, power point), the rules of thumb, the drain points and how each outdoor unit is reached for service.
  It reads positions from the room, lighting and electrical configs; it does not copy them.
- `src/domain/acPlan.mjs`: the load estimate, route lengths and the checks. Tests: `tests/ac-plan.test.mjs`.
- Outdoor units stay in `src/config/acOutdoorUnitsConfig.js` at the owner's plan marks; two of them now carry a
  `planRecommendation`.
- Whole home 3D: press **Show AC pipe routes**. Thick coloured line = refrigerant pipes with the length to order; thin
  blue line = drain, ending in a blue disc at its discharge point; black ring = where the pipes start at the indoor unit.

## The plan, room by room

Positions are in millimetres. "From the north wall" and "from the west wall" are measured along the wall the unit hangs on.

| Room | Machine | Status | Estimate | Indoor unit | Outdoor unit | Pipe | Hole through the wall | Drain | Power |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Drawing Room | split, 1.5 ton | proposed (to buy) | 17.9 sq m, 1.46 ton | west wall, centred 2420 from the north wall, underside 2230, blows east | outside the west wall at its south end (owner's mark), underside 300 | 4.3 m | west wall, 2850 from the north wall, 2290 high, behind the south end of the unit | 10.0 m: down the outside of the west wall, round the corner, along the south face below the window sill, to the toilet south of the Lobby | AC point W1 of the electrical plan: west wall, 3080 from the north wall, 2300 high |
| Lobby / Dining | split, 1.5 ton | proposed | 16.4 sq m, 1.07 ton | north wall, centred 3133 from the west wall (150 short of the Pooja alcove), underside 2230, blows south | outside the kitchen north wall beside the Bedroom 1 balcony (the owner's "Bedroom 1" mark), underside 1800 | 4.4 m | back wall of the Pooja alcove at its west cheek, 2330 high; then the balcony glazing head above the window AC | 4.8 m: with the pipes to the Bedroom 1 balcony, then down to its floor drain | NEW point: north wall, 2473 from the west wall, 2300 high |
| Bedroom 1 + balcony | window AC, 1.5 ton | owned by the owner; position proposed | 13.5 sq m, 1.05 ton | in the balcony's east side on the iron frame, centred 1353 from the balcony's north end, on the 1000 parapet, blows west into the room | none (one casing) | none | none: a glazing panel is cut to the casing | 1.6 m: tray and tube from the back of the casing, back in beside it, down to the balcony floor drain | NEW socket in the balcony within the unit's lead |
| Bedroom 2 (Study) + Home Office | split, 1.5 ton (size not given) | existing | 19.0 sq m, 1.68 ton | west wall of the Study, centred 1886 from the north wall (150 short of the Home Office opening), underside 2230, blows east. Where it hangs today was not recorded | outside the Home Office west wall, north end, underside 1524 (existing) | 3.5 m | Home Office west wall, in the solid band above the window, north corner, 2450 high | 3.7 m: straight through the wall behind the unit into the toilet, down to its floor trap | existing point, not recorded |
| Bedroom 3 | split, 1.5 ton | existing | 14.8 sq m, 0.99 ton | east wall, 1348 to 2278 from the north wall, underside 2280 (phone scan), blows west | on the wall at the east end of the Bedroom 3 balcony, underside 1830 (existing) | 2.9 m (assumed route) | south wall, east of the balcony window, about 2380 high (assumed) | 4.9 m: with the pipes to the balcony, down to its floor drain (assumed) | existing point, not seen in the scan |
| Kitchen | none | not planned | 11.0 sq m, 1.09 ton while cooking | - | - | - | - | - | - |

**Kitchen: no AC.** The hob puts more heat into this small room than a home AC can remove, the chimney throws the
cooled air straight out, and cooking grease clogs an indoor coil within months. A wall or pedestal fan, the chimney and
the north window do the job; with the kitchen door open it also borrows cool air from the Lobby unit.

### How the estimate is made

A rule of thumb, stated so it can be argued with; the dealer's own heat-load sheet replaces it.

- 150 W per square metre of floor (walls, air leaks, lights), plus 50 W per square metre because this is the top floor
  under an uninsulated roof.
- 200 W per square metre of glass facing east, south or west (half that where a balcony shades it; north glass: nothing).
- 120 W per person normally in the room; equipment as listed (TV 150 W; Home Office PC, monitors and printer 400 W;
  cooking 1500 W).
- 1 ton = 3517 W. The sizes sold are 1, 1.5 and 2 ton; above 90 % of a size the room is at that unit's limit.

Pipe rules used: most inverter split units are charged at the factory for about 5 m of pipe and allow about 15 m with
extra gas (about 20 g per metre); many makers ask for at least 3 m. Every length above is the drawn route plus 0.5 m
for bends and the two ends. A drain must fall at least 1 in 100 all the way and never rise.

## The four questions

### (a) Drawing Room: outdoor unit on the west wall, not under the shoe rack; indoor unit on the west wall

- **West wall wins on pipe length:** 4.3 m, inside the factory charge. The same indoor unit piped to the bottom of the
  shoe rack is about 11 m: about 120 g of extra gas, a little lost cooling, and pipes boxed along two walls and up the
  entry gallery.
- The shoe rack idea also costs about 39 % of the shoe storage, a steel platform about 900 mm out from the wall, a sealed
  service door, and compressor noise at the main door (`docs/changes/2026-10-05-shoe-rack-ac-bay.md`).
- **Indoor unit on the west wall, centred 2420 from the north wall.** It is the only outside wall with free height (the
  south wall is window up to 2430, 270 mm under the ceiling). The hole goes straight out behind the unit. The cold air
  crosses the room the short way and lands between the seats: neither sofa of the current layout is in the stream.
  The casing is 420 mm clear of Track 2 and well clear of both fans. The electrical plan already has its power point
  there (W1). At the south end of the same wall it would blow along the south sofa, so it stays where it is.
- **What the west wall costs:** (1) there is no window on that wall, so a technician cannot reach the outdoor unit from
  inside; on the top floor, rope access from the roof is the realistic way, or the unit is hung at sill height close to
  the south-west corner so it can be reached from the south window. Agree this with the installer before buying.
  (2) The drain has nowhere close to go: as drawn it runs about 10 m along the outside to the toilet south of the Lobby.
  If a rainwater pipe stands on the west or south face, use that. (3) The society must allow a unit on that face.
- **Size:** the estimate is 1.46 ton with the glass doors to the Lobby closed: a 1.5 ton unit is at its limit on the
  hottest afternoons. Buy a 1.5 ton inverter rated for high outdoor temperature at least, and ask the dealer to price
  1.8 or 2 ton. If the next size is chosen, the outdoor casing is larger (about 890 x 700 x 340).

### (b) Bedroom 1: the split AC is not needed

- The owner's 1.5 ton window AC serves Bedroom 1 and its balcony together: 13.5 sq m, estimate 1.05 ton, so it has
  room to spare, as long as the opening between bedroom and balcony stays open.
- A second machine in the same room would fight the first one's thermostat and cost an indoor unit, an outdoor unit,
  a wall hole and a power point for nothing.
- **Recommendation: do not buy a split AC for Bedroom 1.** The outdoor unit the owner marked outside the kitchen north
  wall is kept in the config and is still drawn, now marked "not needed for Bedroom 1"
  (`planRecommendation` in `acOutdoorUnitsConfig.js`); the plan reuses that exact place for the Lobby unit (c). The split
  indoor unit that was drawn on the Bedroom 1 west wall is no longer drawn; it stays on record in
  `acPlanConfig.js` (`bedroom1.splitAlternative`).
- One honest drawback: a window AC has its compressor in the room's own casing, so it is louder at night than a split.
  If that proves a nuisance, the fallback is to replace the window AC with a split whose indoor unit hangs on the
  Bedroom 1 west wall south of the wardrobe; the Lobby would then need another outdoor place.

### (c) Lobby / Dining: yes, it needs its own unit; its outdoor unit goes outside the kitchen north wall

- With the sliding glass doors closed, the Drawing Room unit does nothing for the Lobby. With them open, the two rooms
  together need about 2.5 ton, more than one wall unit gives, and the Drawing Room unit is already at its limit.
- The Lobby has no outside wall and no window; its heat is the roof, four people at the table and the kitchen next door.
  Estimate 1.07 ton: a 1 ton unit is just short, so 1.5 ton (an inverter runs gently most of the time).
- **Where the outdoor unit really goes:** the Lobby touches no outside wall. The nearest open air is the corner outside
  the kitchen north wall beside the Bedroom 1 balcony, the place the owner marked for Bedroom 1 and the builder's plan
  shows as an AC position. Since Bedroom 1 no longer needs it (b), the Lobby takes it: 4.4 m of pipe.
- **Indoor unit:** north wall, hard up to the Pooja alcove. It hangs on the masonry above the closed old Bedroom 1
  door, east of the dining table (not over it), blows across the room toward the south wall, clears the fan and both
  tracks, and does not blow at the Drawing Room unit.
- **Route:** east along the wall into the Pooja alcove, along its west cheek at ceiling level in a slim painted casing,
  through its back wall into the top of the Bedroom 1 balcony wardrobe, along the balcony's east side, and out through
  the glazing head above the window AC. The drain follows as far as the balcony and drops to the balcony floor drain.
- The outdoor unit hangs above the window AC (370 mm between them). When both run, it draws in some of the window AC's
  warm exhaust: a small loss. If the installer objects, the other place is outside the balcony glazing further north,
  with about 2 m more pipe.
- **Buy it later if money is tight, but lay the pipes, drain, cable and power point now**, before plaster, paint, the
  Pooja woodwork and the balcony wardrobe. Afterwards the route is closed.

### (d) Bedroom 2 (Study): indoor unit on the west wall, just north of the Home Office opening

- It is the only place: the bookshelf fills the north wall to 2395, the south wall has the tall cabinet and the terrace
  door, the east wall is the far side of the room from the outdoor unit, the Home Office walls are window and cabinet,
  and the wall above the Home Office opening is only 330 mm high.
- From there the pipes run 3.5 m: along the Home Office north wall behind the upper cabinet (its rear cable chase),
  out through the solid band above the west window, down to the existing outdoor unit. The drain cannot go that way
  (it would have to rise), so it goes straight through the wall behind the unit into the toilet.
- Two things to know. (1) From that wall the air blows across the room onto the bed as the Study is drawn today
  (the kids layout): set the louvres up, or keep the pillow end out of the stream when the furniture is finally
  arranged. (2) The Study and Home Office together come to 1.68 ton, mostly the west and south glass of the Home Office
  and the computer: a 1.5 ton unit will struggle there on hot afternoons. Sun-control film or blinds on the Home Office
  west glass is the cheap fix; a fan at the opening pulls cool air into the office.
- The owner says this AC exists. Where its indoor unit hangs today and its tonnage were never recorded: check both.

## What the installer must verify

1. Every drain point: the floor trap of the toilet south of the Lobby, the floor drain of the Bedroom 1 balcony, the
   floor drain of the Bedroom 3 balcony, and any rainwater pipe on the west or south face. None is confirmed. A drain
   must never drip on the floors below.
2. Drawing Room outdoor unit: what is outside the west wall, how it will be reached for service, and the society's
   consent for that face.
3. Lobby route: that the Pooja alcove's back wall can be cored where it meets the balcony, that the casing can pass
   through the top of the balcony wardrobe, and which glazing panel above the window AC becomes a solid panel.
4. The corner outside the kitchen north wall: free air in front of the outdoor unit's fan (north), and that the window
   AC below and the kitchen window beside it do not feed it hot air.
5. Bedroom 3: the real route of the existing pipes; that the planned slatted cabinet bay leaves enough open area and
   has a front that comes off for service (the unit is above the bed head, so its drain tray must be sound).
6. The makers' own figures for the chosen models: factory-charged pipe length, maximum length and lift, minimum
   length, clearances, and the breaker and cable size.
7. Louvre setting in the Drawing Room so the stream does not rattle the chandelier, which hangs about 1.4 m in front
   of the unit.
8. Each AC on its own circuit: 16/20 A socket or isolator, 20 A breaker, 4 sq mm copper with earth.

## What to measure

- Drawing Room: the wall thickness at the west wall; the height from the floor to the roof parapet outside; the exact
  free wall between the north end and the west sofa; whether a rainwater pipe exists on the west or south face.
- Lobby: the Pooja alcove depth and the thickness of its back wall; the height of the old door head; the distance from
  the alcove to the balcony glazing.
- Bedroom 1 balcony: the real casing of the window AC; the parapet height and material; where the floor drain is.
- Bedroom 2: where the indoor unit hangs, its nameplate (tonnage, model), the pipe route, where its drain goes.
- Bedroom 3: the nameplate, the pipe route and where the drain goes.
- Every outdoor unit: the real casing size and the free air around it.

## Not verified

Everything is from the plan drawing, the phone scans and typical figures. The route lengths are plan lengths (the plan
scale varies a little from room to room); treat them as plus or minus half a metre. The compass sides are the plan's
nominal ones. No dealer or installer has seen this.
