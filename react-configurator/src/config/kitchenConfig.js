export const KITCHEN = { width:2324, length:4746, height:2700, door:{w:1100,x:612}, window:{w:1100,h:1800,sill:900,x:612}, shaft:{w:610,l:838,x:0,y:4146}, northClear:300, westGap:{from:0,to:1220,w:1220}, walkway:{floor:1324,eye:1004} };
export const EAST_INIT = [
  {id:'spice', label:'Spice 150 open', w:150, d:500, h:200, y:1850, x:1724, color:'#D9C7B5'},
  {id:'gas', label:'Gas Middle 700W hidden chimney small', w:700, d:600, h:900, y:2000, x:1624, color:'#2a2a2a'},
  {id:'dishwasher', label:'Dishwasher 600W north of Gas', w:600, d:600, h:880, y:2850, x:1724, color:'#A8A8A8'},
  {id:'washing', label:'Washing LAST near North y3800', w:600, d:600, h:880, y:3800, x:1724, color:'#E5E0DA', last:true}
];
export const WEST_INIT = [
  {id:'microwave', label:'Microwave 500W', w:500, d:400, h:350, y:1300, x:0, color:'#1a1a1a'},
  {id:'foodprocessor', label:'Food Processor 500W', w:500, d:400, h:300, y:1900, x:0, color:'#C0C0C0'},
  {id:'waterpurifier', label:'Water Purifier near Sink hidden under 320D LED touching shaft', w:300, d:300, h:400, y:3350, x:0, color:'#7EB8E8'},
  {id:'sink', label:'Sink 600W almost touching shaft', w:600, d:400, h:900, y:3550, x:0, color:'#222'},
  {id:'shaft', label:'Shaft 61x83.8 LAST NW y4146', w:610, d:838, h:2700, y:4146, x:0, color:'#999', fixed:true, last:true}
];

