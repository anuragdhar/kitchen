export const kitchen = {width:2324,length:4746,height:2700};
export const defaults = {
  east:[{id:'gas',x:1724,y:2400,w:700,d:600,h:900,color:'#123456'},
    {id:'garage_NE',x:1724,y:0,w:0,d:0,h:0,hidden:true,color:'#ccc'}],
  west:[{id:'shaft',x:0,y:3908,w:838,d:609,h:2700,fixed:true,color:'#999'},
    {id:'sink',x:0,y:1210,w:762,d:457,h:900,z:0,color:'#777'},
    {id:'sinkUpperDishRack',x:0,y:1210,w:762,d:320,h:700,z:1350,color:'#aaa'}],
  grid:0,materials:{cabinetBody:'#efe9df',handleFinish:'#9a8c7a',applianceFinish:'stainless'},
  eastModules:[{id:'e0',width:4746,type:'filler',drawers:0}],
  westModules:[{id:'w0',width:4136,type:'filler',drawers:0}],
  eastTopUpperDepth:550,westTopUpperDepth:450,hide3DObstructions:true,
};
export const options = {kitchen,defaults};
export function customProject(){
  const project=structuredClone(defaults);
  Object.assign(project.east[0],{y:2255,z:900,open:false,subcomponents:[{id:'hob-child',label:'Custom hob'}]});
  project.west[2].z=1423;
  project.grid=50;
  project.eastTopUpperDepth=425;
  project.hide3DObstructions=false;
  return project;
}
export function memoryStorage(initial={}){
  const map=new Map(Object.entries(initial));
  return {map,getItem:key=>map.get(key)??null,setItem:(key,value)=>{map.set(key,String(value));},removeItem:key=>map.delete(key)};
}
