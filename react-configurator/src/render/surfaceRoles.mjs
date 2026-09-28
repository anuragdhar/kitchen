// Explicit roles, not a heuristic based on a material's colour or an object's name.
export function tagSurfaceMaterial(material,role,roomId){
  if(!['wood','plaster'].includes(role))throw new Error(`Unknown interior surface role: ${role}`);
  material.userData={...material.userData,interiorRole:role,...(roomId?{interiorRoom:roomId}:{})};
  return material;
}
