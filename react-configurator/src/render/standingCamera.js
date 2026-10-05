import * as THREE from 'three'
import {STAND, clampPitchDeg, clampFovDeg, clampEyeMm, wrapHeadingDeg, lookDirection, headingOf, walkStep, walkKey, standReadout} from './standingCameraMath.mjs'

// "Stand here": puts the page's camera at eye height at a point on the floor and lets the viewer look around and walk
// (owner 2026-10-06: "an option of putting a camera inside the house at a 3D point and then seeing from that place").
// It borrows the page's own camera and gives it back unchanged on leave(): position, up, field of view, the orbit target and
// the orbit controls. While standing, its pointer, wheel and key listeners run first and stop the page's own (orbiting,
// click-for-dimensions, wall marking, measuring), so those are suspended, not removed.
// Scene units are metres with y up; floorY is the floor level. Maths and limits: standingCameraMath.mjs.
export function createStandingCamera({camera, controls, domElement, floorY = 0, bounds = null, onChange = () => {}}) {
  const state = {active: false, x: 0, z: 0, eyeM: STAND.eyeMm / 1000, headingDeg: 0, pitchDeg: 0, fovDeg: STAND.fovDeg}
  const keys = {forward: false, back: false, left: false, right: false}
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY), hit = new THREE.Vector3()
  let saved = null, drag = null, raf = 0, last = 0, lastSent = ''

  const report = () => {
    const readout = {active: state.active, ...standReadout(state)}, text = JSON.stringify(readout)
    if (text !== lastSent) { lastSent = text; onChange(readout) }
  }
  const apply = () => {
    if (bounds) { state.x = Math.min(bounds.maxX, Math.max(bounds.minX, state.x)); state.z = Math.min(bounds.maxZ, Math.max(bounds.minZ, state.z)) }
    const d = lookDirection(state.headingDeg, state.pitchDeg)
    camera.up.set(0, 1, 0); camera.position.set(state.x, floorY + state.eyeM, state.z)
    camera.lookAt(state.x + d.x, floorY + state.eyeM + d.y, state.z + d.z)
    if (camera.fov !== state.fovDeg) { camera.fov = state.fovDeg; camera.updateProjectionMatrix() }
    report()
  }
  const frame = now => {
    raf = requestAnimationFrame(frame)
    const step = walkStep(keys, state.headingDeg, (now - last) / 1000); last = now
    if (step.dx || step.dz) { state.x += step.dx; state.z += step.dz; apply() }
  }
  const floorPoint = event => {
    const rect = domElement.getBoundingClientRect()
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    return raycaster.ray.intersectPlane(floor, hit) ? hit : null
  }
  const stop = event => { event.stopImmediatePropagation(); event.preventDefault() }
  const onDown = event => { if (!state.active || event.button !== 0) return; stop(event); drag = {x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY}; domElement.setPointerCapture?.(event.pointerId) }
  const onMove = event => {
    if (!state.active) return
    stop(event)
    if (!drag) return
    state.headingDeg = wrapHeadingDeg(state.headingDeg - (event.clientX - drag.x) * STAND.lookDegPerPixel)
    state.pitchDeg = clampPitchDeg(state.pitchDeg + (event.clientY - drag.y) * STAND.lookDegPerPixel)
    drag.x = event.clientX; drag.y = event.clientY; apply()
  }
  const onUp = event => {
    if (!state.active) return
    stop(event)
    const click = drag && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) <= 6
    drag = null; domElement.releasePointerCapture?.(event.pointerId)
    if (!click) return
    const point = floorPoint(event)
    // A click on the floor walks there; a click toward the horizon (no floor under it, or absurdly far) is ignored.
    if (point && Math.hypot(point.x - state.x, point.z - state.z) < 40) { state.x = point.x; state.z = point.z; apply() }
  }
  const onWheel = event => { if (!state.active) return; stop(event); state.fovDeg = clampFovDeg(state.fovDeg + Math.sign(event.deltaY) * 3); apply() }
  const typing = target => target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  const onKey = down => event => {
    const key = walkKey(event.key)
    if (!state.active || !key || typing(event.target) || event.ctrlKey || event.metaKey || event.altKey) return
    keys[key] = down; event.preventDefault()
  }
  const keyDown = onKey(true), keyUp = onKey(false), capture = {capture: true}, wheelOptions = {capture: true, passive: false}
  domElement.addEventListener('pointerdown', onDown, capture); domElement.addEventListener('pointermove', onMove, capture)
  domElement.addEventListener('pointerup', onUp, capture); domElement.addEventListener('wheel', onWheel, wheelOptions)
  window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp)

  /** Start standing. Without a position it stands on the floor under the point the orbit camera was looking at. */
  const enter = (at = null) => {
    if (!state.active) {
      saved = {position: camera.position.clone(), up: camera.up.clone(), fov: camera.fov, target: controls.target.clone(), enabled: controls.enabled, update: controls.update}
      const look = new THREE.Vector3().subVectors(controls.target, camera.position)
      state.x = controls.target.x; state.z = controls.target.z; state.headingDeg = headingOf(look.x, look.z); state.pitchDeg = 0; state.fovDeg = STAND.fovDeg
      // OrbitControls.update() would pull the camera back onto its orbit every frame, so it rests while standing.
      controls.enabled = false; controls.update = () => false
      state.active = true; last = performance.now(); raf = requestAnimationFrame(frame)
    }
    if (at) set(at); else apply()
  }
  /** Give the camera back exactly as it was. */
  const leave = () => {
    if (!state.active) return
    cancelAnimationFrame(raf); state.active = false; drag = null; Object.keys(keys).forEach(key => { keys[key] = false })
    controls.update = saved.update; controls.enabled = saved.enabled
    camera.position.copy(saved.position); camera.up.copy(saved.up); camera.fov = saved.fov; camera.updateProjectionMatrix()
    controls.target.copy(saved.target); camera.lookAt(controls.target); controls.update(); saved = null; report()
  }
  /** Set any of {xMm, zMm, eyeMm, headingDeg, pitchDeg, fovDeg}; the rest keep their values. */
  const set = next => {
    if (Number.isFinite(next.xMm)) state.x = next.xMm / 1000
    if (Number.isFinite(next.zMm)) state.z = next.zMm / 1000
    if (Number.isFinite(next.eyeMm)) state.eyeM = clampEyeMm(next.eyeMm) / 1000
    if (Number.isFinite(next.headingDeg)) state.headingDeg = wrapHeadingDeg(next.headingDeg)
    if (Number.isFinite(next.pitchDeg)) state.pitchDeg = clampPitchDeg(next.pitchDeg)
    if (Number.isFinite(next.fovDeg)) state.fovDeg = clampFovDeg(next.fovDeg)
    if (state.active) apply()
  }
  const dispose = () => {
    leave()
    domElement.removeEventListener('pointerdown', onDown, capture); domElement.removeEventListener('pointermove', onMove, capture)
    domElement.removeEventListener('pointerup', onUp, capture); domElement.removeEventListener('wheel', onWheel, wheelOptions)
    window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp)
  }
  return {enter, leave, set, dispose, get active() { return state.active }, readout: () => ({active: state.active, ...standReadout(state)})}
}
