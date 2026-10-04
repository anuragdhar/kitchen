import {DRAWING_DIMMER_CIRCUITS} from './drawingLightingConfig.js'
import {LOBBY_DIMMER_CIRCUITS} from './lobbyLightingConfig.js'
import {BEDROOM1_DIMMER_CIRCUITS} from './bedroom1LightingConfig.js'
import {BEDROOM3_DIMMER_CIRCUITS} from './bedroom3LightingConfig.js'

// Dimmer sliders per room page of EmptyRoomGallery.jsx (room key -> [circuit id, label] list). One slider per circuit: the
// general light where the room has one ('chandelier'), then one per track run (owner 2026-10-04: a run dims as a whole).
// The Study and the Kitchen have their own pages and import their lists directly.
export const ROOM_DIMMER_CIRCUITS = {
  drawing: DRAWING_DIMMER_CIRCUITS,
  lobby: LOBBY_DIMMER_CIRCUITS,
  bedroom1: BEDROOM1_DIMMER_CIRCUITS,
  bedroom3: BEDROOM3_DIMMER_CIRCUITS,
}
