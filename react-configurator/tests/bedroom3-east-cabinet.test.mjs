import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {buildRoomReview} from '../src/domain/roomReview.mjs'
import {checkBedroom3EastCabinet, eastCabinetRoles, toiletFrameGapMm, EAST_CABINET_RULES} from '../src/domain/bedroom3EastCabinet.mjs'

const r=EMPTY_ROOM_SHELLS.bedroom3,c=r.furniture.eastCabinet,b=r.furniture.bed
const patched=patch=>{const room=structuredClone(r);patch(room.furniture.eastCabinet,room);return checkBedroom3EastCabinet(room)}

test('owner east-cabinet layout keeps the bed and openings, removes the west run',()=>{
  assert.deepEqual([r.widthMm,r.lengthMm,r.heightMm],[3963,3726,2700])
  assert.deepEqual(b,{lengthMm:1829,widthMm:1829,headWall:'east',centerFromNorthMm:1863})
  // Phone scan 2026-10-04 (docs/SITE_SCAN_2026-10-04_BEDROOM3.md): toilet door 2525 + 780 x 2000 (was 2850 + 700 x 2100);
  // the existing wardrobe fills the south bay at x 365-1905, 2450 high (was 0-1771 x 2400).
  assert.deepEqual(r.doors.map(d=>[d.wall,d.fromMm,d.widthMm,d.heightMm]),[['north',0,900,2100],['north',2525,780,2000]])
  assert.deepEqual(r.southExtension.cabinet,{fromWestMm:365,widthMm:1540,depthMm:610,heightMm:2450,floorClearanceMm:100,source:'phone scan 2026-10-04'})
  assert.equal(r.furniture.westWardrobe,undefined)
  assert.equal(r.furniture.bedsideCabinetIdea,undefined)
  assert.equal(c.depthMm,18*25.4)
  const bedNorth=b.centerFromNorthMm-b.widthMm/2,bedSouth=b.centerFromNorthMm+b.widthMm/2
  assert.equal(bedNorth-(c.north.fromNorthMm+c.north.widthMm),48.5)
  assert.equal(c.south.fromNorthMm-bedSouth,48.5)
  for(const unit of [c.north,c.south,c.bridge]){
    assert.ok(unit.fromNorthMm>0 && unit.fromNorthMm+unit.widthMm<r.lengthMm)
    assert.ok((unit.bottomMm||0)+unit.heightMm<=r.heightMm)
  }
})

// Baseline changed on purpose. Owner 2026-10-05: "In room 3 swap the place of dressing, move it to south side; in place of
// dressing show full depth cabinet till ceiling." Before: north = mirror dressing cabinet 750 x 2200 (mirror 580-2130),
// south = low cabinet 750 x 600 with two drawers, bridge z 150-3576 (3426 long, 4 doors).
test('owner swap 2026-10-05: the mirror dressing cabinet is the south unit, a full-height storage cabinet the north one',()=>{
  assert.deepEqual(eastCabinetRoles(r),{dressing:'south',storage:'north'})
  const s=c.south,n=c.north
  assert.deepEqual([s.fromNorthMm,s.widthMm,s.heightMm,s.mirrorBottomMm,s.mirrorTopMm,s.mirrorHinge,s.drawerCount],[2826,750,2200,580,2130,'north',2],'the dressing cabinet keeps its size and mirror band')
  assert.equal(s.depthMm,undefined,'the dressing cabinet takes the run depth (18 in)')
  assert.deepEqual([n.kind,n.fromNorthMm,n.widthMm,n.heightMm,n.doorCount,n.loftBottomMm],['storage',150,750,2700,2,2200])
  assert.equal(n.heightMm,r.heightMm,'floor to the ceiling of the model')
  assert.equal(n.depthMm,c.depthMm,'"full depth" is the run\'s 18 in by default; the owner can change this field')
  // The overhead run starts where the full-height cabinet ends and still reaches the south end.
  assert.deepEqual([c.bridge.fromNorthMm,c.bridge.widthMm,c.bridge.doorCount],[900,2676,3])
  assert.equal(c.bridge.fromNorthMm,n.fromNorthMm+n.widthMm)
  assert.equal(c.bridge.fromNorthMm+c.bridge.widthMm,s.fromNorthMm+s.widthMm)
  assert.equal(c.bridge.bottomMm,s.heightMm,'the run sits on the dressing cabinet')
  // AC bay, shelf and bed are unchanged.
  assert.deepEqual([c.ac.centerFromNorthMm,c.ac.bayWidthMm],[1863,1200])
  assert.deepEqual(c.shelf,{fromNorthMm:900,widthMm:1926,depthMm:250,heightMm:1650})
})

test('the swapped cabinetry passes the pure checks: doors open, a person stands at the mirror, the toilet door is clear',()=>{
  const result=checkBedroom3EastCabinet(r),m=result.measures
  assert.deepEqual(result.issues,[])
  assert.deepEqual([m.northToBedMm,m.southToBedMm],[48.5,48.5])
  assert.equal(m.toiletFrameGapMm,200.8,'the storage cabinet front is about 200 mm east of the toilet door frame (x 3305)')
  // Mirror door hinged on its north edge: open, it stands beside the bed, 873 mm off the window wall; it clears the bed.
  assert.deepEqual(m.mirrorDoor,{hinge:'north',widthMm:714,toBedMm:66.5,openToSouthWallMm:873,sweepToSouthWallMm:168})
  // Standing spot 650 deep in front of the mirror, clear of the bed and 151 mm east of the balcony door (x 2005-2705).
  assert.deepEqual(m.standingSpot,{x1:2855.8,x2:3505.8,z1:2826,z2:3576,toBedMm:48.5,toBalconyDoorPathMm:150.8})
  assert.deepEqual(m.storageLeaves.map(l=>[l.hinge,l.widthMm,l.toBedMm]),[['north',357,423.5],['south',357,66.5]])
})

test('what the swap leaves for the owner: an open storage door narrows the toilet doorway; the dressing cabinet stands in front of part of the window',()=>{
  const result=checkBedroom3EastCabinet(r)
  assert.equal(result.warnings.length,3,result.warnings.join(' | '))
  assert.match(result.warnings[0],/north-hinged door 1 of the north full-height storage cabinet reaches 156.2 mm into the line of the toilet doorway, 159 mm off the north wall/)
  // Not met: "nothing covers the balcony window". The window runs to x 3705 and the 18 in cabinets start at x 3505.8, so the
  // 2200 mm dressing cabinet stands 150 mm in front of the window's east 199 mm from the sill up (the old 600 mm low cabinet
  // was below the 920 sill). The overhead run already stood in front of the top light there before the swap.
  assert.deepEqual(result.windowCover.map(w=>[w.unit,w.x1,w.x2,w.acrossMm,w.gapMm,w.fromMm,w.toMm]),[['south',3505.8,3705,199.2,150,920,2200],['bridge',3505.8,3705,199.2,150,2200,2360]])
})

test('the checks catch a deeper north cabinet at the toilet door, a south-hinged mirror door at the window, and clashes',()=>{
  // 24 in (609.6 mm) wardrobe depth would leave about 48 mm to the toilet door frame.
  assert.equal(toiletFrameGapMm(r,609.6),48.4)
  assert.match(patched(e=>{e.north.depthMm=609.6}).issues.join(' | '),/front is 48.4 mm from the toilet door frame \(at least 100\)/)
  assert.ok(EAST_CABINET_RULES.toiletFrameMinMm===100)
  assert.match(patched(e=>{e.south.mirrorHinge='south'}).issues.join(' | '),/standing open, the mirror door is 159 mm in front of the balcony window/)
  assert.match(patched(e=>{e.south.fromNorthMm=2700}).issues.join(' | '),/the south mirror dressing cabinet overlaps the bed/)
  assert.match(patched(e=>{e.south.standDepthMm=1400}).issues.join(' | '),/standing spot at the mirror is in the path of the balcony door/)
  assert.match(patched(e=>{e.north.depthMm=1600}).issues.join(' | '),/stands in front of the toilet door/)
  assert.match(patched(e=>{e.south.fromNorthMm=2990}).issues.join(' | '),/the south mirror dressing cabinet leaves the room/)
})

test('AC placeholder fits a distinct open-bottom slatted bay above the bed',()=>{
  const a=c.ac,bridge=c.bridge
  assert.ok(a.unitWidthMm<a.bayWidthMm)
  assert.ok(a.unitDepthMm+a.wallGapMm<c.depthMm-c.panelMm)
  assert.ok(a.bottomMm>bridge.bottomMm)
  assert.ok(a.bottomMm+a.unitHeightMm<bridge.bottomMm+bridge.heightMm-c.panelMm)
  assert.ok(a.slatGapMm>0)
  assert.ok(a.centerFromNorthMm-a.bayWidthMm/2>bridge.fromNorthMm,'the shortened run still has a closed compartment north of the AC bay')
})

test('review plan names the storage and dressing cabinets and reports the window finding',()=>{
  const review=buildRoomReview({roomKey:'bedroom3',room:r})
  const cabinets=review.planItems.filter(i=>/cabinet/.test(i.label))
  assert.deepEqual(cabinets.map(i=>i.label),['NE full-height storage cabinet 750x457.2x2700','SE dressing cabinet 750x457.2x2200'])
  for(const item of cabinets){assert.equal(item.x1,r.widthMm-c.depthMm);assert.equal(item.x2,r.widthMm)}
  assert.match(review.text,/slatted AC cover/)
  assert.match(review.text,/South-east: the mirror dressing cabinet 750 x 2200 mm, mirror door 580-2130 mm hinged on its north edge/)
  assert.match(review.text,/North-east: a full-height storage cabinet 750 wide x 457 deep, floor to the 2700 mm ceiling/)
  assert.match(review.text,/stands 150 mm in front of the east 199.2 mm of the balcony window/)
  assert.doesNotMatch(review.text,/CLASH/)
})

test('west chest stays clear of the bed, entry swing envelope and south storage',()=>{
  const chest=r.furniture.westChest,a=chest.artwork
  assert.deepEqual([chest.widthMm,chest.depthMm,chest.heightMm],[1400,450,800])
  assert.equal(chest.fromNorthMm+chest.widthMm/2,b.centerFromNorthMm)
  assert.equal(r.widthMm-b.lengthMm-chest.depthMm,1684)
  assert.ok(chest.fromNorthMm>r.doors[0].widthMm)
  assert.ok(chest.fromNorthMm+chest.widthMm<r.lengthMm)
  assert.ok(a.widthMm<chest.widthMm)
  assert.equal(a.bottomMm-chest.heightMm,250)
  assert.ok(a.bottomMm+a.heightMm<r.heightMm)
  const review=buildRoomReview({roomKey:'bedroom3',room:r})
  const item=review.planItems.find(i=>i.label.startsWith('West chest'))
  assert.deepEqual([item.x1,item.x2,item.z1,item.z2],[0,450,1163,2563])
  assert.match(review.text,/Closed chest to bed foot: 1684 mm/)
})
