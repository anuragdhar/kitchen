// Extracted verbatim from App.jsx's buildPlanDxf() (see docs/REFACTOR_PLAN.md
// Phase 4). Pure string builder: same inputs always produce the same DXF text.

// ctx: {KITCHEN, grid, planDimensions, activeEast, activeWest}
export function buildPlanDxf(ctx) {
  const {KITCHEN, grid, planDimensions, activeEast, activeWest} = ctx
  const lines=['0','SECTION','2','ENTITIES']
  const addLine=(x1,y1,x2,y2,layer='PLAN')=>lines.push('0','LINE','8',layer,'10',String(x1),'20',String(y1),'30','0','11',String(x2),'21',String(y2),'31','0')
  const addText=(x,y,text,height=90,layer='TEXT')=>lines.push('0','TEXT','8',layer,'10',String(x),'20',String(y),'30','0','40',String(height),'1',text)
  const addRect=(x,y,w,h,layer)=>{addLine(x,y,x+w,y,layer); addLine(x+w,y,x+w,y+h,layer); addLine(x+w,y+h,x,y+h,layer); addLine(x,y+h,x,y,layer)}
  const usableLen=KITCHEN.length
  const {eastDepthMm:eastDepth,westDepthMm:westDepth,walkwayMm:walkway}=planDimensions
  const windowBelow=KITCHEN.windowBelow||{x:KITCHEN.window.x,w:KITCHEN.window.w,depth:300}
  addRect(0,0,KITCHEN.width,KITCHEN.length,'ROOM')
  addRect(KITCHEN.door.x,0,KITCHEN.door.w,110,'DOOR')
  addRect((KITCHEN.width-KITCHEN.window.w)/2,KITCHEN.length-110,KITCHEN.window.w,110,'WINDOW')
  addRect(KITCHEN.width-eastDepth,0,eastDepth,usableLen,'EAST_CABINETS')
  addRect(0,KITCHEN.westGap.to,westDepth,usableLen-KITCHEN.westGap.to,'WEST_CABINETS')
  addRect(0,0,westDepth,KITCHEN.westGap.to,'WEST_DOOR_CLEAR')
  addRect(windowBelow.x,KITCHEN.length-windowBelow.depth,windowBelow.w,windowBelow.depth,'WINDOW_BELOW_REFERENCE')
  activeEast.forEach(it=>{addRect(KITCHEN.width-it.d,it.y,it.d,it.w,`EAST_${it.id.toUpperCase()}`); addText(KITCHEN.width-it.d+35,it.y+it.w/2,`EAST ${it.id} y${it.y}mm`,70)})
  activeWest.forEach(it=>{addRect(0,it.y,it.d,it.w,`WEST_${it.id.toUpperCase()}`); addText(35,it.y+it.w/2,`WEST ${it.id} y${it.y}mm`,70)})
  addText(KITCHEN.width/2,KITCHEN.length-220,'NORTH (N)',120)
  addText(KITCHEN.width/2,120,'SOUTH (S)',120)
  addText(120,KITCHEN.length/2,'WEST (W)',100)
  addText(KITCHEN.width-360,KITCHEN.length/2,'EAST (E)',100)
  addText(KITCHEN.width/2, -90, `Room width ${KITCHEN.width} mm`, 90, 'DIM')
  addLine(0,-60,KITCHEN.width,-60,'DIM')
  addText(KITCHEN.width+160, KITCHEN.length/2, `Room length ${KITCHEN.length} mm`, 90, 'DIM')
  addLine(KITCHEN.width+90,0,KITCHEN.width+90,KITCHEN.length,'DIM')
  addText(KITCHEN.width-eastDepth/2, 220, `East base depth ${eastDepth} mm`, 70, 'DIM')
  addLine(KITCHEN.width-eastDepth,160,KITCHEN.width,160,'DIM')
  addText(200, 220, `West counter depth ${westDepth} mm`, 70, 'DIM')
  addLine(0,160,westDepth,160,'DIM')
  addText(KITCHEN.width/2, KITCHEN.length/2, 'Walkway width '+walkway+' mm', 80, 'DIM')
  addLine(westDepth,KITCHEN.length/2-180,KITCHEN.width-eastDepth,KITCHEN.length/2-180,'DIM')
  addText(windowBelow.x+80, KITCHEN.length-150, 'Below window area 300 mm only', 70, 'DIM')
  addText(-60, KITCHEN.westGap.to/2, `West door clear zone y0-y${KITCHEN.westGap.to} (${KITCHEN.westGap.to} mm)`, 70, 'DIM')
  addLine(-90,0,-90,KITCHEN.westGap.to,'DIM')
  addText(20, -170, `Scale 1:1 mm | ${KITCHEN.width}W x ${KITCHEN.length}L x ${KITCHEN.height}H | Walkway ${walkway} mm | Grid ${grid?grid+'mm':'Off'} | East ${eastDepth}D West ${westDepth}D`, 60, 'DIM')
  if(grid===50||grid===100){
    for(let x=0;x<=KITCHEN.width;x+=grid) addLine(x,0,x,KITCHEN.length,'GRID')
    for(let y=0;y<=KITCHEN.length;y+=grid) addLine(0,y,KITCHEN.width,y,'GRID')
  }
  lines.push('0','ENDSEC','0','EOF')
  return lines.join('\n')
}
