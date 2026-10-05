// Shared helpers for the per-room electrical plan tests (tests/*-electrical.test.mjs).
import assert from 'node:assert/strict'
import {ROOM_ELECTRICAL} from '../src/config/roomElectricalConfig.js'
import {roomElectricalModel, roomElectricalReport} from '../src/domain/roomElectricalModels.mjs'
import {checkRoomElectrical} from '../src/domain/roomElectrical.mjs'

/** The room's plan with one point changed (patch) or removed (patch === null). */
export function planWith(key, id, patch) {
  const plan = ROOM_ELECTRICAL[key]
  assert.ok(plan.points.some(p => p.id === id), `${id} is a point of ${key}`)
  return {...plan, points: plan.points.flatMap(p => p.id !== id ? [p] : patch === null ? [] : [{...p, ...patch}])}
}

/** All issues of the room's check after changing one point, as one string. */
export const issuesWith = (key, id, patch) => checkRoomElectrical(roomElectricalModel(key), planWith(key, id, patch)).issues.join(' | ')

/** The plan as written passes every rule; returns the report (model, plan, check, points with `where`). */
export function passingReport(key) {
  const report = roomElectricalReport(key)
  assert.deepEqual(report.check.issues, [], `${key} passes the generic check`)
  assert.ok(report.check.results.every(r => r.ok))
  return report
}

export const pointOf = (report, id) => { const p = report.points.find(p => p.id === id); assert.ok(p, `${id} exists`); return p }

/** [circuit id, watts] pairs and the room total, for the load assertions. */
export const loads = report => ({circuits: report.check.load.circuits.map(c => [c.id, c.watts]), totalW: report.check.load.totalW})
