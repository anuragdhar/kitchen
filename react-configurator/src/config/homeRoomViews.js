import {KITCHEN} from './kitchenConfig.js'

// A501 plan pixels: south is up, east is left. The Blender GLB uses metres,
// Y up, and the same plan directions after the export transform.
export const HOME_ROOM_LAYOUTS=[
  {key:'bedroom3',name:'Bedroom 3',bounds:[50,198,255,390],color:'#db8b47',render:'bedroom-three',extraRenders:[['bedroom3-overview.png','Bedroom 3 furnished overview'],['bedroom3-vanity.png','Bedroom 3 vanity']],
    bakedModel:'/models/A501-bedroom3-baked.glb',
    // Dedicated bedroom source: Blender (x,y,z) metres -> glTF (x,z,-y).
    bakedView:{center:[2.93,1.1,5.91],span:3.94,interiorPosition:[2.8,1.45,4.10],interiorTarget:[2.8,1.1,6.25]}},
  {key:'study',name:'Study',bounds:[255,198,424,444],color:'#7c93b8',render:'study-bedroom-two'},
  {key:'balcony',name:'Balcony office',bounds:[424,188,496,316],color:'#ac91c3',render:'balcony-office',camera:[.3,1.8,.4]},
  {key:'terrace',name:'Terrace',bounds:[255,69,424,188],color:'#b7bb8b',render:'terrace'},
  {key:'kitchen',name:'Kitchen',bounds:[130,503,255,KITCHEN.mergedShaftPlan.y2],color:'#dca56c',render:'kitchen'},
  {key:'lobby',name:'Lobby / Dining',bounds:[255,449,515,612],color:'#80b9c5',render:'lobby-dining'},
  {key:'drawing',name:'Drawing Room',bounds:[515,449,688,715],color:'#a0ba86',render:'drawing-room',extraRenders:[['drawing-room-elegant-seating.png','Drawing Room seating and materials'],['drawing-room-chandelier-lighting.png','Drawing Room earlier lighting concept']],
    bakedModel:'/models/A501-drawing-baked.glb',
    // Blender (x,y,z) metres -> glTF (x,z,-y); authored plan bounds stay unchanged.
    bakedView:{center:[11.551,1.1,11.701],span:5.348,interiorPosition:[11.1,1.48,14.0],interiorTarget:[11.78,1.28,10.3]}},
  {key:'bedroom1',name:'Bedroom 1',bounds:[339,612,515,794],color:'#bda4d5',render:'bedroom-one'},
  {key:'bedroom1-balcony',name:'Bedroom 1 balcony',bounds:[273,672,339,794],color:'#d8c5a8',render:'bedroom-one-balcony'},
  {key:'entry',name:'Main entry',bounds:[515,715,688,874],color:'#c2a88e',render:'main-entry'},
]

export const BLENDER_ROOM_VIEWS={
  ...Object.fromEntries(HOME_ROOM_LAYOUTS.map(room=>[room.key,room])),
  storage:{key:'storage',name:'Storage',bounds:[145,396,205,451],render:'storage'},
  pooja:{key:'pooja',name:'Pooja Ghar',bounds:[255,612,317,662],render:'pooja-ghar',camera:[.3,1.8,.4],cameraSpan:2.2},
}
