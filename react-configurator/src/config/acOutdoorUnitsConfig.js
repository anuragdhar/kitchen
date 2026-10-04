// AC outdoor units, placed from the owner's marks on the A501 plan (the "mark" tool of Whole home 3D, 2026-10-05).
//
// Frame: pixels of the 800 x 875 plan image (ENTRY.planScale gives metres per pixel). The plan is south-up, so plan x
// grows WEST and plan y grows NORTH. `mark` is the rectangle the owner drew, kept as given. `centre` is where the casing is
// drawn: the middle of the mark, moved only as far as its note says, so the casing stands clear of a wall or railing.
//  longAxis   which way the casing's long side runs ('north-south' or 'east-west'), read from the shape of the mark
//  fanFaces   the compass side the fan blows toward: always the open side, away from the building
//  bottomMm   underside of the casing above that floor level; ASSUMED (stand or wall bracket), nothing is measured
//  roomPage   the room page that also draws the unit (only where the page's frame maps onto the plan exactly)
//  status     'existing' = the owner says the unit is there today; 'proposal' = the owner asked whether it can go there
// Sizes are TYPICAL casings for the tonnage, valve cover included; the real unit's nameplate and manual govern.
export const AC_OUTDOOR_UNIT_SIZES = {
  1: {widthMm: 720, heightMm: 500, depthMm: 260, weightKg: 26},
  1.5: {widthMm: 800, heightMm: 550, depthMm: 300, weightKg: 35},
  2: {widthMm: 890, heightMm: 700, depthMm: 340, weightKg: 48},
}

// Typical installation-manual clearances: behind the coil, and free air in front of the fan.
export const AC_OUTDOOR_CLEARANCE = {rearMm: 100, frontMm: 1000}

export const AC_OUTDOOR_UNITS = [
  {id: 'bedroom3', serves: 'Bedroom 3', tons: 1.5, tonsKnown: true, status: 'existing', roomPage: 'bedroom3',
    mark: {x1: 45, y1: 144, x2: 64, y2: 187},
    centre: {planX: 59.8, planY: 165.5, note: 'moved 5 px west of the mark centre so the casing stays inside the east edge of the balcony'},
    // Owner, later 2026-10-05: it is fixed on the wall, about 6 ft (1830 mm) up; it was first drawn on a floor stand.
    longAxis: 'north-south', fanFaces: 'east', mount: 'on a wall bracket at the east end of the Bedroom 3 balcony, about 6 ft above its floor (owner 2026-10-05)', bottomMm: 1830},
  {id: 'study', serves: 'Bedroom 2 (Study)', tons: 1.5, tonsKnown: false, status: 'existing',
    mark: {x1: 494, y1: 274, x2: 513, y2: 319},
    centre: {planX: 511, planY: 296.5, note: 'moved 7 px west of the mark centre so the coil is 100 mm off the outer face of the Home Office west wall'},
    // Owner, later 2026-10-05: at the same place, 5 ft (1524 mm) up; it was first drawn at an assumed 300.
    longAxis: 'north-south', fanFaces: 'west', mount: 'on a wall bracket outside the west wall of the Home Office (the balcony of Bedroom 2), north end, about 5 ft up (owner 2026-10-05)', bottomMm: 1524},
  {id: 'bedroom1', serves: 'Bedroom 1', tons: 1.5, tonsKnown: false, status: 'proposal',
    mark: {x1: 238, y1: 701, x2: 265, y2: 715},
    centre: {planX: 248, planY: 717.5, note: 'moved 3 px east and 10 px north of the mark centre so the coil is 100 mm off the kitchen north wall and the casing clears the Bedroom 1 balcony glazing'},
    // Owner, later 2026-10-05: the window AC goes on an iron frame just beside this place (bedroom1.balconyExtension.windowAc,
    // top at 1430), and this unit "can move up": raised from 300 to 1800 so it hangs above the window AC with 370 mm between.
    longAxis: 'east-west', fanFaces: 'north', mount: 'on a wall bracket outside the kitchen north wall, at its west corner beside the shaft, above the window AC', bottomMm: 1800},
  // The Drawing Room has no AC yet (work-plan task ac-choose: about 1.5 ton). This is the owner's "possible place" for its
  // outdoor unit; the other idea is the bottom of the shoe rack (ENTRY.shoeRack.acBay). Neither is decided.
  {id: 'drawing', serves: 'Drawing Room', tons: 1.5, tonsKnown: false, status: 'proposal',
    mark: {x1: 686, y1: 454, x2: 708, y2: 506},
    centre: {planX: 703.2, planY: 480, note: 'moved 6 px west of the mark centre so the coil is 100 mm off the outer face of the Drawing Room west wall'},
    longAxis: 'north-south', fanFaces: 'west', mount: 'on a wall bracket outside the Drawing Room west wall, at its south end', bottomMm: 300},
]
