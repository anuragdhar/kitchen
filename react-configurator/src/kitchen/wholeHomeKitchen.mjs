// The simplified kitchen of the Whole home 3D page, worked out from the kitchen's saved project (pure: no React, Three.js
// or DOM). Millimetres in the kitchen frame of kitchenConfig.js: x west to east, y south to north along the runs.
// WholeHome3D.jsx draws the boxes; this module only decides which items, base spans and upper runs there are.
import {KITCHEN, EAST_INIT, WEST_INIT, KITCHEN_AUTOSAVE_KEY, NORTH_HOB_OPTION_Y_MM, EAST_TOP_UPPER_DEPTH, WEST_TOP_UPPER_DEPTH, autoFillModules} from '../config/kitchenConfig.js'
import {versionedStorageKey} from '../persistence/projectStorage.mjs'

/**
 * The saved kitchen project as plain fields (east, west, eastModules, ...), or {} when nothing readable is saved.
 * `getStorage` returns the Storage (window.localStorage); it is called inside the guard, so blocked storage reads as {}.
 * The kitchen page autosaves a versioned document under `<key>:schema-1` (persistence/projectStorage.mjs, PROJECT_FORMAT.md)
 * and never rewrites the legacy key, so that document comes first; a legacy autosave is the fallback. Read-only: this
 * preview never writes or migrates either key.
 */
export function readSavedKitchen(getStorage) {
  try {
    const storage = getStorage()
    const data = JSON.parse(storage.getItem(versionedStorageKey(KITCHEN_AUTOSAVE_KEY)) ?? storage.getItem(KITCHEN_AUTOSAVE_KEY) ?? '{}')
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
    // A versioned document keeps the module lists under `modules` (projectCodec.mjs encodeProject); a legacy one as eastModules/westModules.
    return data.modules && typeof data.modules === 'object' ? {...data, eastModules: data.modules.east, westModules: data.modules.west} : data
  } catch { return {} }
}

/** Saved (or default) items of both runs; the shaft takes its merged size and a hob left at the old y 1350 moves north. */
export function wholeHomeKitchenItems(saved) {
  return [...(Array.isArray(saved.east) ? saved.east : EAST_INIT), ...(Array.isArray(saved.west) ? saved.west : WEST_INIT)]
    .map(item => item.id === 'shaft' ? {...item, y: KITCHEN.shaft.y, w: KITCHEN.shaft.l, d: KITCHEN.shaft.w}
      : item.id === 'gas' && item.y === 1350 ? {...item, y: NORTH_HOB_OPTION_Y_MM} : item)
}

/**
 * Base cabinet spans in drawing order, [{side, start, end}] along y. Modules are laid from the north end; on the west run a
 * span is cut where the washing machine, dishwasher or sink stands (those are drawn as appliances instead).
 */
export function wholeHomeBaseSpans(saved, items) {
  const westWetSlots = items.filter(item => !item.hidden && ['washing', 'dishwasher', 'sink'].includes(item.id)).sort((a, b) => a.y - b.y)
  const spans = []
  for (const [side, modules] of [
    ['east', Array.isArray(saved.eastModules) ? saved.eastModules : autoFillModules(KITCHEN.length)],
    ['west', Array.isArray(saved.westModules) ? saved.westModules : autoFillModules(KITCHEN.length - KITCHEN.westGap.to)],
  ]) {
    let cursor = KITCHEN.length
    for (const module of modules) {
      const width = Number(module.width) || 0
      if (width <= 0) continue
      const from = cursor - width, to = cursor
      if (side === 'west') {
        let start = from
        for (const item of westWetSlots) {
          const cutStart = Math.max(from, item.y), cutEnd = Math.min(to, item.y + item.w)
          if (cutEnd <= cutStart) continue
          if (cutStart > start) spans.push({side, start, end: cutStart})
          start = Math.max(start, cutEnd)
        }
        if (start < to) spans.push({side, start, end: to})
      } else spans.push({side, start: from, end: to})
      cursor -= width
    }
  }
  return spans
}

/**
 * Upper runs, east then west: [{side, start, end, upperDepth, rack, lowerSpans}]. `rack` is the visible west dish rack
 * (the lower wall cabinets stop either side of it, `lowerSpans`); the top cabinets run the whole length at `upperDepth`.
 */
export function wholeHomeUpperRuns(saved, items) {
  return ['east', 'west'].map(side => {
    const start = side === 'east' ? 0 : KITCHEN.westGap.to, end = KITCHEN.length
    const upperDepth = Number(saved[side + 'TopUpperDepth']) || (side === 'east' ? EAST_TOP_UPPER_DEPTH : WEST_TOP_UPPER_DEPTH)
    const rack = side === 'west' ? items.find(i => i.id === 'sinkUpperDishRack' && !i.hidden) : null
    const lowerSpans = rack ? [[start, Math.max(start, rack.y)], [Math.min(end, rack.y + rack.w), end]] : [[start, end]]
    return {side, start, end, upperDepth, rack, lowerSpans}
  })
}
