# AC outdoor unit under the shoe rack (owner proposal, 2026-10-05)

Status: a proposal, not decided. Nothing on site is measured. The app shows it only when you press
**Show AC outdoor unit under the shoe rack** on the Main entry page; the shoe rack is drawn without it by default.

## The idea

The Drawing Room AC has to be bought, and its outdoor unit needs a place. The new shoe rack at the north end of the
entry gallery stands on an iron-angle platform in the opening where the window and the wall below it come out, and it
projects outside. The owner's idea: stand the outdoor unit on that platform, in the bottom of the shoe rack, inside a
fixed grille on the outside, with a separate service door on the inside. The owner then asked whether it can go in
"the long way".

## Answer: yes in principle, and the long way is the one that fits

Two ways to place a typical compact 1.5 ton outdoor unit (about 800 wide x 550 high x 300 deep, about 35 kg):

| | Across: long fan face looking straight out | Lengthwise: turned, long side running outward |
| --- | --- | --- |
| Width it needs across the rack | 1200 (unit 800 + 100 air at the coil end + 300 for hands at the valves) | 440 (unit depth 300 + 100 air behind the coil + 40 to the grille) |
| Rack width as drawn | 865: does NOT fit | 865: fits, with about 425 to spare |
| How far the platform projects beyond the outer wall | about 440 | about 900 |
| Where the hot air goes | straight out through the front grille | sideways, through the east side of the cage |
| Where the unit breathes in | behind it and round its ends: tight inside a cage | through the opposite (west) side of the cage: a clean cross-flow |
| Service valves | on one end, reached past the unit | at the inner end, directly behind the service door |

So "the long way" works where "across" does not, unless the opening turns out to be at least 1200 mm wide. The price is
a platform that sticks out about 900 mm from the wall instead of about 440, which the structural engineer and the steel
fabricator must design for (the unit's weight, its vibration, and wind).

All figures are typical installation-manual clearances. The model actually bought decides the real ones.

## What it costs and what must be true

- **Shoe storage:** the bay takes the bottom 840 mm of the rack (800 clear plus a 40 mm closed divider). With the rack at
  7 ft that leaves about 1290 mm for shoes, a loss of about 39 %. At 6 1/2 ft it leaves about 1140 mm.
- **Open air on both sides (lengthwise) or in front (across):** about 1 m of free air where the fan blows, open to the
  sky. If the outside of that wall is a closed shaft, a covered corridor or the stair lobby, the hot air comes back and
  the AC loses capacity; then this is not the place. For the lengthwise way the side the fan blows toward (drawn as east,
  away from the main door) AND the opposite side must both be open.
- **The unit must stand beyond the wall thickness**, or the masonry blocks the air at its sides. The wall is assumed
  9 inches (230 mm); it is not measured.
- **Grille:** plain bars, at least 70 % open (drawn 10 mm bars at 60 mm, 83 % open), no louvres angled across the fan,
  the fan face no more than 50 mm behind the bars. Fixed and welded, since it is beside the main door; the unit is
  serviced only from inside.
- **Service door:** the full width of the bay, sealed with a gasket and lined, so noise, heat and dust stay out of the
  gallery. A technician must be able to reach the valves and take the unit's top and front covers off through it.
- **Divider:** a closed, insulated board between the unit and the shoes, sealed at the edges.
- **Platform:** drains outward (rain comes through the grille), anti-vibration pads under the unit, rust-proofed steel.
- **Pipe run:** from the planned indoor unit on the Drawing Room west wall the pipes would run roughly 9-10 m (estimated
  from the plan, not measured), against the "under 5 m" the work plan asks for. That is within what inverter units allow
  but needs extra refrigerant and loses a little capacity. With the indoor unit on the north wall or the east wall near
  the entry door the run drops to roughly 4-5 m. The drain pipe of the indoor unit still needs its own fall to a drain.
- **Noise:** an outdoor unit is about 50-55 dB at 1 m; it will be heard at the main door when it runs.
- **Society:** the grille and unit change the look of the outer wall (already an open item for the outer door).

## What is in the app

- `ENTRY.shoeRack.acBay` in `react-configurator/src/config/entryConfig.js`: orientation (`lengthwise`), discharge side,
  assumed wall thickness, bay height, the typical unit and the clearances. All in millimetres.
- `shoeRackAcBayGeometry` and `checkShoeRackAcBay` in `src/domain/entryFittings.mjs`: the sizes and the fit check for
  either orientation. As drawn: lengthwise fits; across fails on width (865 against 1200).
- `src/rooms/entry/ShoeRackAcBay.js`: the 3D preview (platform, cage, unit, divider, service door, shorter rack above).
- Tests in `tests/entry-fittings.test.mjs`.

## To find out before deciding

1. What is outside that wall: open air on which sides, and how much (open item A21).
2. The opening width and the wall thickness (open item A3).
3. The engineer's view on a platform projecting about 900 mm with about 35 kg on it (open item D1).
4. The AC dealer's view: the model's own clearances, and the pipe run from the chosen indoor position (open item C15).

## Not verified

Everything above is from typical figures and the plan drawing. Whole home 3D does not show the bay. The preview was
looked at once on the Main entry page.
