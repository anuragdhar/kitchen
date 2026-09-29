// Room-local editable geometry is authoritative. A cropped whole-home model is
// a different, simplified scene, even when the selected render profile matches.
export const PARITY_ROOMS = Object.freeze(['bedroom3', 'balcony', 'kitchen', 'study', 'lobby', 'entry', 'storage', 'bedroom1']);
export const usesEditableRoomSource = room => PARITY_ROOMS.includes(room);

export function assertEditableRoomSource(sceneId, room) {
  if (usesEditableRoomSource(room) && sceneId !== room) {
    throw Error(`Open the ${room} Editable workspace and its 3D view. The ${sceneId || 'missing'} scene cannot be used as this room's Blender source.`);
  }
}

export function sourceSceneForRoom(records, selectedScene, room) {
  if (usesEditableRoomSource(room)) return records.find(record => record.id === room)?.id || '';
  return records.some(record => record.id === selectedScene) ? selectedScene : records[0]?.id || '';
}
