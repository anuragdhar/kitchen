import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {HOME_ROOMS} from '../src/home/rooms.mjs'
import {HOME_PALETTES, TODAY_PALETTE, RECOMMENDED_PALETTE_ID, getPalette, STATUS_LABELS} from '../src/config/homePaletteConfig.js'
import {PALETTE_LIMITS, REQUIRED_ROLES, SURFACE_ROLES, checkPalette, contrastRatio, luminance, paletteChanges, paletteOk, paletteSceneMapping, roomMapping, roomSwatches, veneerTint, warmth} from '../src/home/palette.mjs'
import {VENEER_AVERAGE, paletteSurfaceSpec} from '../src/home/paletteAppearance.mjs'
import {MATERIALS, getMaterial} from '../src/home/materialCatalog.mjs'
import {DEFAULT_APPEARANCE, effectiveMaterials} from '../src/home/appearance.mjs'
import {TODAY_PALETTE_ID, validatePaletteChoice, parsePaletteChoice, paletteStore} from '../src/home/paletteStore.mjs'

const proposals = HOME_PALETTES.filter(palette => !palette.builtIn)
const clone = palette => structuredClone(palette)
const failed = rows => rows.filter(row => !row.pass).map(row => row.id + (row.room ? ':' + row.room : ''))

test('colour maths: luminance, contrast and warmth behave as documented', () => {
  assert.equal(luminance('#000000'), 0); assert.ok(Math.abs(luminance('#ffffff') - 1) < 1e-9)
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 1e-9)
  assert.equal(contrastRatio('#b27d4c', '#f4eee3'), contrastRatio('#f4eee3', '#b27d4c'))
  assert.ok(warmth('#f4eee3') > 10); assert.ok(warmth('#faf9f5') < 10)
  assert.throws(() => luminance('#FFF')); assert.throws(() => luminance('red'))
})

test('veneer tint reaches a darker target exactly and caps a lighter one', () => {
  const darker = veneerTint('#9c6b3f', VENEER_AVERAGE.teak)
  assert.equal(darker.reached, '#9c6b3f'); assert.equal(darker.exact, true)
  const same = veneerTint(VENEER_AVERAGE['white-oak'], VENEER_AVERAGE['white-oak'])
  assert.equal(same.tint, '#ffffff'); assert.equal(same.reached, VENEER_AVERAGE['white-oak'])
  const lighter = veneerTint('#ffffff', VENEER_AVERAGE.teak)
  assert.equal(lighter.tint, '#ffffff'); assert.equal(lighter.exact, false); assert.equal(lighter.reached, VENEER_AVERAGE.teak)
})

test('there is one recommended palette and two alternatives, after today', () => {
  assert.deepEqual(HOME_PALETTES.map(palette => palette.id), ['today', 'honey-oak', 'light-oak-sage', 'teak-brass'])
  assert.equal(HOME_PALETTES[0], TODAY_PALETTE); assert.equal(TODAY_PALETTE.builtIn, true); assert.equal(TODAY_PALETTE.id, TODAY_PALETTE_ID)
  assert.equal(getPalette(RECOMMENDED_PALETTE_ID).name, 'Honey oak and terracotta'); assert.equal(getPalette('nope'), null)
  assert.equal(proposals.length, 3); assert.ok(Object.isFrozen(getPalette(RECOMMENDED_PALETTE_ID).colours.woodHoney))
  for (const palette of HOME_PALETTES) for (const entry of Object.values(palette.colours)) if (entry.status) assert.ok(STATUS_LABELS[entry.status], `${palette.id}: ${entry.name}`)
})

test('every proposed palette passes every check for every room', () => {
  for (const palette of proposals) {
    const rows = checkPalette(palette, HOME_ROOMS)
    assert.deepEqual(failed(rows), [], palette.id); assert.ok(paletteOk(rows))
    for (const room of HOME_ROOMS) {
      const mapping = roomMapping(palette, room.id)
      assert.ok(mapping, `${palette.id}: ${room.id} is mapped`)
      for (const role of REQUIRED_ROLES[palette.rooms[room.id].type]) assert.ok(mapping[role], `${palette.id}: ${room.id} has ${role}`)
      for (const role of Object.keys(mapping)) assert.ok(SURFACE_ROLES.includes(role))
      assert.ok(rows.some(row => row.id === 'room-mapped' && row.room === room.id && row.pass))
    }
  }
})

test('each palette is a small, buildable set with a buying specification and no catalogue codes', () => {
  for (const palette of proposals) {
    const entries = Object.values(palette.colours)
    assert.ok(entries.length <= 16, `${palette.id} has ${entries.length} colours`)
    assert.ok(entries.filter(entry => entry.kind === 'paint').length <= 3, 'main wall, accent wall, ceiling')
    assert.ok(new Set(entries.filter(entry => entry.kind === 'wood').map(entry => entry.hex)).size <= PALETTE_LIMITS.maxWoodTonesWholeHome)
    for (const entry of entries) {
      assert.match(entry.hex, /^#[0-9a-f]{6}$/); assert.ok(entry.spec.length > 30, `${palette.id}: ${entry.name} needs a real specification`); assert.ok(entry.where)
      // A shade or laminate code looks like "SF 2345", "8292", "L152": none may be invented here.
      assert.doesNotMatch(entry.spec.replace(/IS 710|No\. 4|\b304\b|\d+(\.\d+)? ?(mm|ft|K)\b|\d+-\d+ mm/g, ''), /\b[A-Z]{0,3} ?\d{3,5}\b/, `${palette.id}: ${entry.name} must not name a catalogue code`)
      if (entry.kind === 'wood') assert.ok(VENEER_AVERAGE[entry.species] && getMaterial(entry.species, 'wood'), `${entry.name} needs a bundled veneer species for the preview`)
    }
    for (const key of ['living', 'bedroom', 'work', 'entry']) assert.ok([2700, 3000, 3500, 4000].includes(palette.lights[key]), `${palette.id}: ${key} light`)
  }
})

test('the checks catch the problems they are meant to catch', () => {
  const base = getPalette(RECOMMENDED_PALETTE_ID)
  let palette = clone(base); palette.colours.woodHoney.hex = '#f0e9dc'
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('wall-wood-contrast:drawing'), 'wood too close to the wall')
  palette = clone(base); palette.colours.extra = {name: 'Cherry', hex: '#8a4b32', kind: 'wood', species: 'cherry', spec: 'x'}; palette.rooms.drawing.roles.wood2 = 'extra'
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('wood-tones-per-room:drawing'), 'three woods in one room')
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('wood-tones-whole-home'))
  palette = clone(base); delete palette.rooms.study
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('room-mapped:study'), 'unmapped room')
  palette = clone(base); delete palette.roomDefaults.bedroom.fabric
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('room-mapped:bedroom3'), 'missing required role')
  palette = clone(base); palette.rooms.kitchen.roles.wood = 'missing'
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('room-mapped:kitchen'), 'unknown colour key')
  palette = clone(base); palette.lights.living = 4000
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('light-matches-intent:drawing'), 'cool light in a warm scheme')
  palette = clone(getPalette('light-oak-sage')); palette.lights.living = 2700
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('light-matches-intent:lobby'), 'warm light in a neutral scheme')
  palette = clone(base); palette.colours.wallIvory.hex = '#eef2f6'
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('wall-matches-intent'), 'cool wall in a warm scheme')
  palette = clone(base); palette.colours.wallIvory.hex = 'ivory'
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('colours-specified'))
  palette = clone(base); palette.colours.unused = {name: 'Unused', hex: '#123456', kind: 'accent', spec: 'x'}
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('no-unused-colours'))
  palette = clone(base); palette.rooms.attic = {type: 'living', roles: {}}
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('rooms-known'))
  palette = clone(base); palette.intent = 'cold'
  assert.ok(failed(checkPalette(palette, HOME_ROOMS)).includes('intent-declared'))
  assert.equal(Object.isFrozen(base.colours), true, 'checks never mutate the palette')
})

test('today is recorded honestly: it fails the scheme checks it is supposed to fail, and only those', () => {
  const names = failed(checkPalette(TODAY_PALETTE, HOME_ROOMS))
  assert.deepEqual(names.sort(), ['accent-count', 'metal-finishes-whole-home', 'wood-tones-per-room:drawing', 'wood-tones-per-room:study', 'wood-tones-whole-home'])
  // Owner decisions and existing things recorded for today.
  assert.equal(TODAY_PALETTE.colours.honeyOak.status, 'owner'); assert.equal(TODAY_PALETTE.colours.kitchenOak.status, 'owner')
  assert.equal(TODAY_PALETTE.colours.steel.status, 'owner'); assert.equal(TODAY_PALETTE.colours.olive.status, 'existing')
  assert.equal(TODAY_PALETTE.colours.panelBrown.hex, '#a47a52'); assert.equal(TODAY_PALETTE.colours.panelBrown.status, 'proposal')
  // The light colours are the ones in the lighting configs.
  assert.deepEqual({...TODAY_PALETTE.lights}, {living: 3000, bedroom: 3000, work: 4000, entry: 4000})
})

test('today matches the material system defaults it describes', () => {
  assert.equal(TODAY_PALETTE.colours.wallIvory.hex, getMaterial(DEFAULT_APPEARANCE.plaster, 'plaster').color)
  assert.equal(effectiveMaterials(DEFAULT_APPEARANCE, 'kitchen').wood, TODAY_PALETTE.colours.kitchenOak.species)
  assert.equal(TODAY_PALETTE.colours.teakDefault.species, DEFAULT_APPEARANCE.wood)
  assert.equal(TODAY_PALETTE.colours.teakDefault.hex, VENEER_AVERAGE.teak); assert.equal(TODAY_PALETTE.colours.kitchenOak.hex, VENEER_AVERAGE['white-oak'])
  assert.deepEqual(Object.keys(VENEER_AVERAGE).sort(), MATERIALS.filter(m => m.role === 'wood').map(m => m.id).sort())
})

test('what would change: the recommendation keeps every owner decision; the alternatives flag the ones they change', () => {
  const recommended = paletteChanges(TODAY_PALETTE, getPalette(RECOMMENDED_PALETTE_ID), HOME_ROOMS)
  assert.ok(recommended.length > 10)
  const flagged = recommended.filter(row => row.ownerDecision)
  assert.ok(flagged.length > 0 && flagged.every(row => row.role === 'door' && row.from.status === 'existing'), 'only the existing doors (re-polish) are flagged')
  assert.ok(!recommended.some(row => row.room === 'bedroom3' && row.role === 'wood'), 'Bedroom 3 honey oak is kept')
  assert.ok(!recommended.some(row => row.room === 'kitchen' && ['wood', 'tile', 'counter', 'light', 'metal'].includes(row.role)), 'the kitchen keeps its oak, tile and 4000 K')
  assert.ok(!recommended.some(row => row.room === 'drawing' && ['fabric', 'accent', 'furniture', 'light'].includes(row.role)), 'Drawing Room fabrics, dark carved wood and 3000 K are kept')
  assert.ok(!recommended.some(row => row.role === 'floor'), 'no new flooring')
  assert.ok(recommended.some(row => row.room === 'entry' && row.role === 'light' && row.from.kelvin === 4000 && row.to.kelvin === 3000))
  for (const id of ['light-oak-sage', 'teak-brass']) {
    const rows = paletteChanges(TODAY_PALETTE, getPalette(id), HOME_ROOMS)
    assert.ok(rows.some(row => row.room === 'bedroom3' && row.role === 'wood' && row.ownerDecision), `${id} changes the Bedroom 3 honey oak and says so`)
    assert.ok(!rows.some(row => row.role === 'floor'))
  }
  assert.deepEqual(paletteChanges(TODAY_PALETTE, TODAY_PALETTE, HOME_ROOMS), [])
})

test('room swatches resolve defaults and overrides', () => {
  const palette = getPalette(RECOMMENDED_PALETTE_ID)
  const by = room => Object.fromEntries(roomSwatches(palette, room).map(s => [s.role, s]))
  assert.equal(by('drawing').wood.name, 'Honey oak'); assert.equal(by('drawing').furniture.name, 'Dark walnut'); assert.equal(by('drawing').light.kelvin, 3000)
  assert.equal(by('kitchen').wood.name, 'Kitchen light oak'); assert.equal(by('kitchen').light.kelvin, 4000)
  assert.equal(by('entry').door.name, 'Brushed stainless steel'); assert.equal(by('pooja').light.kelvin, 2700)
  assert.deepEqual(roomSwatches(palette, 'nowhere'), []); assert.equal(roomMapping(palette, 'nowhere'), null)
})

test('live preview: today decides nothing, a palette decides tagged wood and plaster only', () => {
  assert.equal(paletteSceneMapping(TODAY_PALETTE, HOME_ROOMS), null)
  for (const room of HOME_ROOMS) for (const role of ['wood', 'plaster']) assert.equal(paletteSurfaceSpec('today', room.id, role), null)
  assert.equal(paletteSurfaceSpec('unknown-palette', 'drawing', 'wood'), null)
  assert.equal(paletteSurfaceSpec(RECOMMENDED_PALETTE_ID, 'not-a-room', 'wood'), null)
  assert.equal(paletteSurfaceSpec(RECOMMENDED_PALETTE_ID, 'drawing', 'metal'), null)
  const kitchen = paletteSurfaceSpec(RECOMMENDED_PALETTE_ID, 'kitchen', 'wood')
  assert.equal(kitchen.asset, 'white_oak_veneer'); assert.equal(kitchen.color, '#ffffff', 'the kitchen oak is drawn exactly as today')
  assert.deepEqual(paletteSurfaceSpec(RECOMMENDED_PALETTE_ID, 'kitchenShell', 'wood'), kitchen, 'the kitchen shell page uses the kitchen mapping')
  const wall = paletteSurfaceSpec('light-oak-sage', 'drawing', 'plaster')
  assert.equal(wall.color, '#faf9f5'); assert.equal(wall.reliefOnly, true); assert.equal(wall.asset, 'beige_wall_001')
  const teak = paletteSurfaceSpec('teak-brass', 'bedroom3', 'wood')
  assert.equal(teak.asset, 'teak_veneer'); assert.equal(teak.role, 'wood'); assert.match(teak.color, /^#[0-9a-f]{6}$/); assert.notEqual(teak.id, 'teak')
  assert.equal(paletteSurfaceSpec('teak-brass', 'bedroom3', 'wood'), teak, 'specs are cached, so material ids are stable')
  for (const palette of proposals) for (const room of HOME_ROOMS) {
    const wood = paletteSurfaceSpec(palette.id, room.id, 'wood')
    if (wood) assert.ok(MATERIALS.some(material => material.role === 'wood' && material.asset === wood.asset), `${palette.id}: ${room.id}`)
  }
})

test('palette choice: default is today, ids are validated, storage is separate from the appearance key', () => {
  assert.equal(paletteStore.getSnapshot().palette, 'today')
  assert.deepEqual(validatePaletteChoice({schemaVersion: 1, palette: 'honey-oak'}), {schemaVersion: 1, palette: 'honey-oak'})
  for (const bad of [null, {}, {schemaVersion: 2, palette: 'today'}, {schemaVersion: 1, palette: 'Bad Id'}, {schemaVersion: 1, palette: 7}]) assert.throws(() => validatePaletteChoice(bad))
  assert.throws(() => parsePaletteChoice('x'.repeat(1001))); assert.throws(() => parsePaletteChoice('{'))
  let calls = 0; const off = paletteStore.subscribe(() => calls++)
  paletteStore.set('teak-brass'); assert.equal(paletteStore.getSnapshot().palette, 'teak-brass'); assert.equal(calls, 1)
  paletteStore.set('teak-brass'); assert.equal(calls, 1, 'no event when nothing changes')
  assert.throws(() => paletteStore.set('Not valid')); assert.equal(paletteStore.getSnapshot().palette, 'teak-brass')
  paletteStore.set('today'); off(); assert.equal(paletteStore.getSnapshot().palette, 'today')
})

test('the palette is appearance only: no dimensions, and no room builder or room config reads it', () => {
  const config = fs.readFileSync(new URL('../src/config/homePaletteConfig.js', import.meta.url), 'utf8')
  assert.doesNotMatch(config, /^import /m, 'the palette config imports nothing')
  assert.doesNotMatch(config, /\b(widthMm|lengthMm|heightMm|depthMm|fromMm)\b/)
  const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? walk(new URL(entry.name + '/', dir)) : [new URL(entry.name, dir)])
  for (const file of walk(new URL('../src/rooms/', import.meta.url))) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /homePaletteConfig|paletteStore|paletteAppearance/, String(file))
  const scene = fs.readFileSync(new URL('../src/render/interiorScene.js', import.meta.url), 'utf8')
  assert.match(scene, /paletteSurfaceSpec\(paletteId,room,role\)\?\?getMaterial\(effectiveMaterials\(settings,room\)\[role\],role\)/, 'the saved appearance stays the fallback')
})
