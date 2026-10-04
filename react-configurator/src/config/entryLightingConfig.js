// Main entry ceiling lights. Owner 2026-10-04 (work-plan task entry-ceiling-plan, OPEN_ITEMS C6): ROUND recessed LED panel
// lights, the Orient Electric type already used in the home, single colour (not the 3-in-1 colour-changing version); proposed
// neutral white 4000 K, two of 6-8 W along the length of the corridor, on one switch at the door. The owner repeated on
// 2026-10-04 that the entry gets a circular light, not the linear strips the 3D views had been drawing (those were the generic
// "Interior studio" proposal strips; src/home/lighting.mjs now keeps them out of the Entry). Nothing linear is drawn here.
//
// Positions are PLAN PIXELS like entryConfig.js (plan x grows WEST, plan y grows NORTH; ENTRY.planScale converts to metres),
// so Whole home 3D and the Main entry page place the same fittings. Sizes in millimetres are typical catalogue figures for
// this kind of panel, not measured. The fittings are drawn at the slab (ENTRY.wallHeightMm): how far the PVC ceiling of the
// corridor drops is not decided yet (OPEN_ITEMS C5). The two parts of the entry a person walks through are the "sections"
// of src/domain/entryFittings.mjs: the corridor (section 1) and the inner gallery (section 4).
export const ENTRY_LIGHTING = {
  kelvin: 4000, colour: 'single-colour neutral white 4000 K (owner to confirm; warm white 3000 K is the alternative)',
  fittingType: 'round LED panel, Orient Electric type, single colour',
  switching: [
    {id: 'S1', lights: ['E1', 'E2'], where: 'beside the outer door, inside the corridor', note: 'owner: one switch at the door for the corridor lights'},
    {id: 'S2', lights: ['E3', 'E4'], where: 'beside the Drawing Room door, inside the gallery', note: 'proposal: the gallery pair on its own switch; a two-way switch at the arrival door is an option'},
  ],
  fittings: [
    // Section 1, the corridor from the outer door to the arrival door (plan x 575-688, y 810-874): two panels recessed in the
    // PVC plank ceiling, on the corridor's centre line, about 540 mm in from each end wall and 1.1 m apart.
    {id: 'E1', section: 'corridor', kind: 'recessed', planX: 660, planY: 842, watts: 8, lumens: 800, diameterMm: 120, cutOutMm: 105},
    {id: 'E2', section: 'corridor', kind: 'recessed', planX: 603, planY: 842, watts: 8, lumens: 800, diameterMm: 120, cutOutMm: 105},
    // Section 4, the inner gallery from the arrival door past the shoe rack to the Drawing Room door (plan x 515-575,
    // y 715-874): two surface-mounted panels of the same family (the gallery keeps its plaster slab, so nothing to recess into).
    // E3 sits about 780 mm in front of the shoe rack's mirror doors, so a person at the mirror is lit from in front, with the
    // fold-down seat and the key tray under it; E4 is in front of the open east cabinet and the Drawing Room door.
    {id: 'E3', section: 'gallery', kind: 'surface', planX: 545, planY: 835, watts: 8, lumens: 800, diameterMm: 170, depthMm: 35},
    {id: 'E4', section: 'gallery', kind: 'surface', planX: 545, planY: 748, watts: 8, lumens: 800, diameterMm: 170, depthMm: 35},
  ],
}
