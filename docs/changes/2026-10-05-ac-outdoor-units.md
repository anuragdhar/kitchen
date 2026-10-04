# AC outdoor units from the owner's plan marks, and the kitchen "all off" fix (2026-10-05)

## AC outdoor units

The owner marked four places on the plan in Whole home 3D. Each now has an outdoor unit drawn at a typical casing size
for its tonnage (1.5 ton: 800 wide x 550 high x 300 deep, about 35 kg). They are in
`react-configurator/src/config/acOutdoorUnitsConfig.js`, in plan pixels exactly as marked, and are drawn in Whole home 3D;
the Bedroom 3 unit is also drawn on the Bedroom 3 page.

| For | Where (from the mark) | Status | Size drawn | Long side | Fan blows |
| --- | --- | --- | --- | --- | --- |
| Bedroom 3 | east end of the Bedroom 3 balcony, on a stand (the green block on the builder's plan) | existing | 1.5 ton, as the owner said | north-south | east |
| Bedroom 2 (Study) | outside the west wall of the Home Office, north end, on a wall bracket | existing | 1.5 ton ASSUMED | north-south | west |
| Bedroom 1 | outside the kitchen north wall at its west corner, beside the shaft, on a wall bracket | proposal ("can we place") | 1.5 ton ASSUMED | east-west | north |
| Drawing Room | outside the west wall at its south end, on a wall bracket | proposal ("possible place") | 1.5 ton ASSUMED | north-south | west |

Each casing is drawn at the middle of its mark, moved only a few pixels (at most about 250 mm) so the coil stands 100 mm
off the wall behind it or the casing stays inside the balcony; the config records each move. Heights are assumed: 100 mm
(stand) for Bedroom 3, 300 mm (bracket) for the others.

### Bedroom 1: can it go outside the kitchen wall? Yes, with two checks

- It is the corner where the builder's plan already shows an AC position (the green block beside the shaft), outside
  the kitchen north wall and just east of the Bedroom 1 balcony glazing. The model's earlier concept position for it was
  in the same strip, about half a metre south.
- The marked area is about 520 x 280 mm; a 1.5 ton casing is 800 x 300, so it runs about 280 mm past the mark. As drawn
  it stays west of the kitchen window (which starts 612 mm from the kitchen's west wall), so it is not under the window,
  and about 75 mm clear of the balcony glazing.
- To check on site: free air to the north of it (about 1 m in front of the fan), that hot air does not blow into the
  kitchen window or the balcony when they are open, and the pipe run from the Bedroom 1 indoor unit (drawn on the west
  wall of Bedroom 1, so the pipes cross the room and the balcony: roughly 5-6 m).
- The Lobby's concept outdoor unit, which was drawn at this spot, moved about 1 m south along the same strip so the two
  do not overlap. That one is still only a concept position.

### Drawing Room: this place against the shoe rack idea

- Outside the west wall at the south end, the outdoor unit is about 2-3 m of pipe from the planned indoor unit (west
  wall, centred 2420 from the north wall). That is the shortest run of any option and needs no extra refrigerant.
- It takes nothing from the shoe rack, needs no projecting platform and no service door; an ordinary wall bracket does.
- The shoe rack idea (`docs/changes/2026-10-05-shoe-rack-ac-bay.md`) costs about 39 % of the shoe storage, a platform
  about 900 mm out from the wall, and a pipe run of roughly 9-10 m.
- So this place is the better one, provided the outside of the west wall there is open air, a technician can reach it
  (from the south window or with a ladder or rope access, since the flat is on an upper floor), and the society allows a
  unit on that face. The west wall also takes the afternoon sun, which costs a little efficiency; a small shade helps.
- Open item C15 lists both options.

### Not known

Tonnage of the Bedroom 1 and Bedroom 2 units and the Drawing Room unit to be bought; the real casing sizes; mounting
heights; what is around each position outside. The Study, Home Office and Bedroom 1 room pages do not draw these units
(their page frames do not map onto the plan exactly); Whole home 3D does.

## Kitchen: light stayed on with every slider off

In the kitchen 3D view, pressing "All off" and ticking "Dark room" still left the room brightly lit. Cause: the general
preview lighting ("Interior studio" overlay) is added to the kitchen scene after the room lights and keeps re-applying
itself; the kitchen's Dark room switch did not hide it (the other rooms' does), and it also reset the sliders' lights.
Fixed in `src/rooms/kitchen/KitchenTrackLights.js`: the slider levels are re-asserted before every frame and Dark room
hides the overlay. Measured on the 3D picture (mean brightness, 0-255): all off 184 (daylight and preview lighting still
on, as in every room); all off with Dark room 10; planned level with Dark room 24 (only the track and the under-cabinet
LED strips); planned level without Dark room 213. The dimmer bar in every room now says that Dark room is what switches
off daylight and the preview lighting.

## Later the same day: heights, and the window AC in the Bedroom 1 balcony

- **Bedroom 3 outdoor unit:** fixed on the wall about 6 ft up (owner). Underside 100 (floor stand) -> 1830 mm.
- **Bedroom 2 outdoor unit:** at the same place, 5 ft up (owner). Underside 300 (assumed) -> 1524 mm.
- **Window AC, 1.5 ton, already owned:** placed at the owner's mark (plan x 261-282, y 703-733) in the east side of the
  Bedroom 1 balcony, on a welded iron frame fixed to the wall. Config: `bedroom1.balconyExtension.windowAc` in
  `roomShellConfig.js`; drawn on the Bedroom 1 page and in Whole home 3D. Drawn at a typical casing, 660 wide x 430 high x
  700 deep (measure the real one), sitting on top of the 1 m parapet in the glazing, centred 1353 mm from the balcony's
  north end, 250 mm of it inside and 450 mm outside. It is clear of the balcony table and chair.
- **Bedroom 1 split outdoor unit "moved up":** it stays at its plan position beside the shaft but hangs higher, underside
  300 -> 1800 mm, so it is above the window AC (top 1430) with 370 mm between them; its top is at 2350.

### Can the window AC go there? Yes, with these conditions

- **It cools the balcony first.** Cold air reaches the bedroom through the 2.2 m opening between them, so that opening
  must stay open and clear. Bedroom 1 plus the balcony is about 13.5 square metres, well within 1.5 ton.
- **The iron frame** carries about 50 kg with vibration: welded angle, anchored into masonry (not into the aluminium
  glazing frame), sloping slightly outward so condensate and rain drain out. One glazing panel is cut to the casing size
  and the gap around the casing is sealed.
- **At least half the casing outside:** a window AC breathes through louvres on its sides, which must be outside the wall.
- **Water:** it drips condensate from the back. Fit a drain tray and pipe so it does not fall on the floors below.
- **Power:** its own 16/20 A socket on a separate circuit within cable reach, like the split units.
- **Noise:** a window AC has its compressor in the same casing, so it is louder in the room than a split unit.
- **The split unit above it** will draw in some of the window AC's warm exhaust when both run; expect a small loss on the
  split unit. If the window AC replaces the Bedroom 1 split AC altogether, that outdoor unit is not needed there at all.

To confirm on site: the real casing size of the window AC, the parapet height and what it is made of, and which glazing
panel is at that position.
