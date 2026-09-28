// A501 site orientation. The architectural floor plan is drawn south-up
// (screen up = south, down = north, left = east, right = west; see
// docs/ARCHITECTURE.md "Coordinate contract"). Per the owner's 2026-09-28
// instruction, true north differs from plan north by about 30 degrees.
// Convention used here: positive degrees rotate the true-north needle
// CLOCKWISE on screen from plan-north (screen-down). The exact sense was not
// surveyed - if a site check shows the opposite, flip the sign here and every
// compass and the daylight sun path follow automatically.
export const TRUE_NORTH_OFFSET_DEG = 30

// Nominal site latitude used for the simplified sun-path model (Pune region).
export const SITE_LATITUDE_DEG = 18.5
