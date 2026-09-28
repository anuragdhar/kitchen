// Stable room identifiers shared by inspiration, materials and lighting. Order is a tour, not a measured path.
export const HOME_ROOMS = Object.freeze([
  ['entry','Main entry'], ['drawing','Drawing room'], ['lobby','Lobby / dining'],
  ['pooja','Pooja ghar'], ['kitchen','Kitchen'], ['storage','Storage'],
  ['bedroom1','Bedroom 1'], ['bedroom1-balcony','Bedroom 1 balcony'],
  ['bedroom3','Bedroom 3'], ['study','Study / Bedroom 2'], ['terrace','Terrace'], ['balcony','Balcony office'],
].map(([id,label],order)=>Object.freeze({id,label,order})));
export function assertRoom(id) { if (!HOME_ROOMS.some(room=>room.id===id)) throw new Error(`Unknown room: ${id}`); return id; }
