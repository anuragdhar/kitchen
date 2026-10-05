import {createBedMaterials, createMadeBed} from '../shared/furniture/Bed.js'

// The six-foot square bed (roomShellConfig.js bedroom3.furniture.bed), head on the east wall. Footprint and centre are the
// config's; the heights below are the ones this builder has always drawn (base top 250, mattress 190 so its top is at 440,
// an 85 mm timber headboard inside the footprint reaching 1170), kept unchanged by the 2026-10-06 furniture pass, which
// replaced the boxes with the made bed of rooms/shared/furniture/Bed.js. Colours are the owner's; the throw is new.
const PROFILE = {baseMm: 250, mattressMm: 190, headboardMm: 85, headboardTopMm: 1170}
const COLOURS = {frame: '#806047', headboard: '#9a7656', mattress: '#efe8dc', duvet: '#b7c7bd', pillow: '#fbf8f1', throw: '#bfa98a'}

export function createBedroom3Bed(room){
  const {bed}=room.furniture
  const group=createMadeBed({
    name:'Bedroom 3 six-foot square bed, headboard at east wall',lengthMm:bed.lengthMm,widthMm:bed.widthMm,
    base:{topMm:PROFILE.baseMm},mattressMm:PROFILE.mattressMm,
    headboard:{thicknessMm:PROFILE.headboardMm,topMm:PROFILE.headboardTopMm,bottomMm:PROFILE.baseMm},
    pillows:2,throw:{fromFootMm:110,lengthMm:430},seed:3,
  },createBedMaterials(COLOURS,{roomId:'bedroom3'}))
  group.position.set((room.widthMm-bed.lengthMm/2)/1000,0,bed.centerFromNorthMm/1000)
  return group
}
