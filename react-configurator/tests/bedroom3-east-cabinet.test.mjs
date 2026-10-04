import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {buildRoomReview} from '../src/domain/roomReview.mjs'

const r=EMPTY_ROOM_SHELLS.bedroom3,c=r.furniture.eastCabinet,b=r.furniture.bed
test('owner east-cabinet layout keeps the bed and openings, removes the west run',()=>{
  assert.deepEqual([r.widthMm,r.lengthMm,r.heightMm],[3963,3726,2700])
  assert.deepEqual(b,{lengthMm:1829,widthMm:1829,headWall:'east',centerFromNorthMm:1863})
  assert.deepEqual(r.doors.map(d=>[d.wall,d.fromMm,d.widthMm,d.heightMm]),[['north',0,900,2100],['north',2850,700,2100]])
  assert.deepEqual(r.southExtension.cabinet,{fromWestMm:0,widthMm:1771,depthMm:610,heightMm:2400,floorClearanceMm:100})
  assert.equal(r.furniture.westWardrobe,undefined)
  assert.equal(r.furniture.bedsideCabinetIdea,undefined)
  assert.equal(c.depthMm,18*25.4)
  assert.deepEqual([c.north.widthMm,c.north.heightMm,c.south.widthMm,c.south.heightMm],[750,2200,750,600])
  const bedNorth=b.centerFromNorthMm-b.widthMm/2,bedSouth=b.centerFromNorthMm+b.widthMm/2
  assert.equal(bedNorth-(c.north.fromNorthMm+c.north.widthMm),48.5)
  assert.equal(c.south.fromNorthMm-bedSouth,48.5)
  for(const unit of [c.north,c.south,c.bridge]){
    assert.ok(unit.fromNorthMm>0 && unit.fromNorthMm+unit.widthMm<r.lengthMm)
    assert.ok((unit.bottomMm||0)+unit.heightMm<=r.heightMm)
  }
})
test('AC placeholder fits a distinct open-bottom slatted bay above the bed',()=>{
  const a=c.ac,bridge=c.bridge
  assert.ok(a.unitWidthMm<a.bayWidthMm)
  assert.ok(a.unitDepthMm+a.wallGapMm<c.depthMm-c.panelMm)
  assert.ok(a.bottomMm>bridge.bottomMm)
  assert.ok(a.bottomMm+a.unitHeightMm<bridge.bottomMm+bridge.heightMm-c.panelMm)
  assert.ok(a.slatGapMm>0)
})
test('review plan identifies both east cabinets instead of the west run',()=>{
  const review=buildRoomReview({roomKey:'bedroom3',room:r})
  const cabinets=review.planItems.filter(i=>/cabinet/.test(i.label))
  assert.equal(cabinets.length,2)
  for(const item of cabinets){assert.equal(item.x1,r.widthMm-c.depthMm);assert.equal(item.x2,r.widthMm)}
  assert.match(review.text,/slatted AC cover/)
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
