import React,{useState} from 'react'
import KitchenConfigurator from './App.jsx'
import DxfWorkspace from './DxfWorkspace.jsx'
import BalconyOffice3D from './BalconyOffice3D.jsx'
import StudyRoom3D from './StudyRoom3D.jsx'
import {BALCONY_OFFICE} from './config/balconyOfficeConfig.js'
import {STUDY_ROOM} from './config/studyRoomConfig.js'
import floorPlanImage from '../../Interior/home a 501 floor - unmodified.png'

const rooms={
  kitchen:{name:'Kitchen',eyebrow:'Detailed design available',description:'Open the existing galley kitchen planner, elevations, 3D view, materials, validation and exports.',color:'#b45309'},
  study:{name:'Study',eyebrow:'Ready to design together',description:'A new room workspace for layout, storage, lighting, desk placement and finishes.',color:'#2563eb'},
  balcony:{name:'Balcony office',eyebrow:'Active design area',description:'Turn the narrow east balcony into a focused, comfortable home office.',color:'#7c3aed'},
  dxf:{name:'DXF workspace',eyebrow:'Floor-plan tools',description:'View the included architectural DXF, inspect layers, load another file and prepare controlled drawing edits.',color:'#0f766e'},
}

const buttonStyle={border:0,borderRadius:999,padding:'10px 16px',fontWeight:800,cursor:'pointer'}

function HomeHeader({section,onHome}){
  return <header style={{position:'sticky',top:0,zIndex:50,background:'rgba(252,250,247,.94)',backdropFilter:'blur(14px)',borderBottom:'1px solid #e7e0d7'}}>
    <div style={{maxWidth:1920,margin:'0 auto',minHeight:68,padding:'0 clamp(18px,3vw,48px)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
      <button onClick={onHome} style={{...buttonStyle,background:'transparent',padding:'8px 0',fontSize:18,color:'#241f1a',display:'flex',alignItems:'center',gap:10}} aria-label="Return to whole home plan">
        <span style={{width:32,height:32,display:'grid',placeItems:'center',borderRadius:10,background:'#241f1a',color:'#fff'}}>H</span>
        Home Design Studio
      </button>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:13,color:'#6f665e'}}>{section==='home'?'Whole home':rooms[section]?.name}</span>
        {section!=='home'&&<button onClick={onHome} style={{...buttonStyle,background:'#eee8e1',color:'#241f1a'}}>← Floor plan</button>}
      </div>
    </div>
  </header>
}

function RoomHotspot({room,style,onOpen}){
  const info=rooms[room]
  return <button onClick={()=>onOpen(room)} aria-label={`Open ${info.name}`} style={{position:'absolute',...style,border:`3px solid ${info.color}`,background:`${info.color}28`,borderRadius:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:4,transition:'transform .2s ease, background .2s ease',boxShadow:'0 4px 16px rgba(0,0,0,.12)'}}>
    <span style={{background:info.color,color:'#fff',borderRadius:999,padding:'6px 10px',fontWeight:900,fontSize:'clamp(10px,1.6vw,14px)',boxShadow:'0 2px 8px rgba(0,0,0,.2)'}}>{info.name}</span>
  </button>
}

function WholeHome({onOpen}){
  return <main style={{minHeight:'calc(100vh - 68px)',background:'linear-gradient(135deg,#f6f0e8 0%,#fcfaf7 46%,#eef3f5 100%)',padding:'clamp(24px,3vw,48px) clamp(18px,3vw,48px)'}}>
    <div style={{maxWidth:1920,margin:'0 auto'}}>
      <div style={{maxWidth:1080,marginBottom:'clamp(22px,2vw,34px)'}}>
        <div style={{fontSize:12,fontWeight:900,letterSpacing:'.16em',textTransform:'uppercase',color:'#9a5b1d'}}>A501 home</div>
        <h1 style={{fontSize:'clamp(32px,5vw,62px)',lineHeight:1.02,letterSpacing:'-.04em',margin:'10px 0 14px',color:'#241f1a'}}>Design your home, one room at a time.</h1>
        <p style={{fontSize:'clamp(16px,2vw,20px)',lineHeight:1.55,color:'#655c54',margin:0}}>Start from the complete floor plan. Choose a highlighted room to open its dedicated design workspace.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(360px,.9fr)',gap:'clamp(20px,2vw,34px)',alignItems:'start'}} className="home-plan-grid">
        <section style={{background:'#fff',border:'1px solid #e5ded6',borderRadius:24,padding:'clamp(10px,2vw,20px)',boxShadow:'0 22px 60px rgba(52,41,30,.1)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,margin:'0 4px 14px'}}>
            <div><b style={{fontSize:18}}>Whole-home floor plan</b><div style={{fontSize:12,color:'#756b62',marginTop:3}}>Click Kitchen or Study</div></div>
            <span style={{fontSize:12,fontWeight:800,color:'#756b62',background:'#f4f0eb',padding:'7px 10px',borderRadius:999}}>2 rooms + DXF tools</span>
          </div>
          <div style={{position:'relative',width:'100%',margin:'0 auto',overflow:'hidden',borderRadius:16,background:'#fff'}}>
            <img src={floorPlanImage} alt="A501 whole home architectural floor plan" style={{display:'block',width:'100%',height:'auto'}}/>
            <div aria-label="Plan directions: east is left, south is up, west is right, north is down" style={{position:'absolute',right:'2.5%',top:'2.5%',width:'clamp(62px,11vw,92px)',aspectRatio:'1',borderRadius:'50%',background:'rgba(255,255,255,.94)',border:'2px solid #241f1a',boxShadow:'0 5px 18px rgba(0,0,0,.15)',fontWeight:900,color:'#241f1a',fontSize:'clamp(9px,1.4vw,13px)'}}>
              <span style={{position:'absolute',top:4,left:'50%',transform:'translateX(-50%)'}}>S</span>
              <span style={{position:'absolute',bottom:4,left:'50%',transform:'translateX(-50%)',color:'#b91c1c'}}>N</span>
              <span style={{position:'absolute',left:6,top:'50%',transform:'translateY(-50%)'}}>E</span>
              <span style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)'}}>W</span>
              <span style={{position:'absolute',left:'50%',top:'20%',width:2,height:'60%',background:'#241f1a',transform:'translateX(-50%)'}}/>
              <span style={{position:'absolute',left:'20%',top:'50%',height:2,width:'60%',background:'#241f1a',transform:'translateY(-50%)'}}/>
              <span style={{position:'absolute',left:'50%',bottom:'14%',transform:'translateX(-50%)',width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:'11px solid #b91c1c'}}/>
            </div>
            <RoomHotspot room="kitchen" onOpen={onOpen} style={{left:'15.5%',top:'57.4%',width:'16.5%',height:'19.5%'}}/>
            <RoomHotspot room="study" onOpen={onOpen} style={{left:'31.8%',top:'22.2%',width:'21.4%',height:'28.7%'}}/>
            <RoomHotspot room="balcony" onOpen={onOpen} style={{left:'52.8%',top:'20.7%',width:'10.8%',height:'16.2%'}}/>
          </div>
        </section>

        <aside className="home-room-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:14}}>
          {Object.entries(rooms).map(([key,room])=><button key={key} onClick={()=>onOpen(key)} style={{textAlign:'left',padding:'clamp(16px,1.5vw,22px)',minHeight:190,borderRadius:20,border:'1px solid #e1d9d0',background:'#fff',cursor:'pointer',boxShadow:'0 10px 30px rgba(52,41,30,.07)',display:'flex',flexDirection:'column'}}>
            <span style={{display:'inline-block',width:11,height:11,borderRadius:99,background:room.color,marginRight:8}}/>
            <span style={{fontSize:12,fontWeight:900,letterSpacing:'.08em',textTransform:'uppercase',color:room.color}}>{room.eyebrow}</span>
            <div style={{fontSize:26,fontWeight:900,color:'#241f1a',margin:'10px 0 6px'}}>{room.name}</div>
            <div style={{fontSize:14,lineHeight:1.5,color:'#6f665e'}}>{room.description}</div>
            <div style={{marginTop:'auto',paddingTop:16,fontWeight:900,color:'#241f1a'}}>Open workspace →</div>
          </button>)}
          <div style={{gridColumn:'1 / -1',padding:18,borderRadius:18,border:'1px dashed #bcb1a5',color:'#6f665e',background:'rgba(255,255,255,.55)',fontSize:13,lineHeight:1.5}}>
            More sections—balconies, bedrooms, living and dining—can be activated later without changing the room-workspace structure.
          </div>
        </aside>
      </div>
    </div>
    <style>{`
      @media(max-width:1050px){.home-plan-grid{grid-template-columns:1fr!important}.home-room-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:620px){.home-room-grid{grid-template-columns:1fr!important}}
      @media(min-width:1600px){.home-room-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    `}</style>
  </main>
}

function StudyWorkspace(){
  const topics=['Room purpose','Desk and seating','Storage','Lighting','Electrical points','Materials and mood']
  return <main style={{minHeight:'calc(100vh - 68px)',background:'#eef3f6',padding:'clamp(24px,5vw,64px) clamp(14px,4vw,40px)'}}>
    <div style={{maxWidth:1100,margin:'0 auto'}}>
      <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'#dbeafe',color:'#1d4ed8',padding:'7px 11px',borderRadius:999,fontSize:12,fontWeight:900}}>NEW ROOM WORKSPACE</div>
      <h1 style={{fontSize:'clamp(38px,7vw,76px)',letterSpacing:'-.05em',margin:'14px 0 8px',color:'#172033'}}>Study</h1>
      <p style={{fontSize:19,lineHeight:1.55,maxWidth:760,color:'#566174'}}>The floor-plan shell is now modelled at {STUDY_ROOM.dimensions.widthMm} × {STUDY_ROOM.dimensions.lengthMm} mm, with its lobby entry, terrace opening, balcony-office connection and closed former toilet doorway.</p>
      <StudyRoom3D/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginTop:32}}>
        {topics.map((topic,index)=><div key={topic} style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:18,padding:20,minHeight:112}}>
          <div style={{fontSize:11,fontWeight:900,color:'#2563eb'}}>0{index+1}</div>
          <div style={{fontSize:17,fontWeight:900,color:'#172033',marginTop:12}}>{topic}</div>
          <div style={{fontSize:13,color:'#768191',marginTop:5}}>To define with you</div>
        </div>)}
      </div>
      <div style={{marginTop:28,padding:24,borderRadius:22,background:'#172033',color:'#fff'}}>
        <div style={{fontSize:12,fontWeight:900,letterSpacing:'.1em',color:'#93c5fd'}}>FIRST DESIGN QUESTION</div>
        <div style={{fontSize:'clamp(20px,3vw,30px)',fontWeight:800,marginTop:8}}>How do you want to use the study day to day?</div>
        <div style={{color:'#b9c4d3',marginTop:8}}>For example: focused work, reading, video calls, two-person use, hobbies, or guest accommodation.</div>
      </div>
    </div>
  </main>
}

function BalconyWorkspace(){
  const office=BALCONY_OFFICE
  const ideas=[
    ['Work wall','A shallow custom desk across the 1200 mm end wall keeps the long aisle clear.'],
    ['Vertical storage','Wall-mounted shelves and closed overhead storage use height without consuming floor area.'],
    ['Comfort layer','Glare control, ventilation, task lighting and acoustic treatment make the narrow space usable for long sessions.'],
  ]
  return <main style={{minHeight:'calc(100vh - 68px)',background:'linear-gradient(145deg,#f5f3ff,#f7fee7)',padding:'clamp(24px,5vw,64px) clamp(14px,4vw,40px)'}}>
    <div style={{maxWidth:1100,margin:'0 auto'}}>
      <div style={{fontSize:12,fontWeight:900,letterSpacing:'.12em',color:'#7c3aed'}}>STUDY-ADJACENT SPACE</div>
      <h1 style={{fontSize:'clamp(36px,7vw,72px)',letterSpacing:'-.05em',margin:'10px 0 8px',color:'#231942'}}>Balcony home office</h1>
      <p style={{fontSize:19,lineHeight:1.55,maxWidth:780,color:'#5f5870'}}>The active design area is the narrow east-side balcony, approximately 1200 × 2623 mm. The immediate goal is a dedicated one-person office—not a redesign of the whole study.</p>

      <BalconyOffice3D/>

      <div style={{display:'grid',gridTemplateColumns:'minmax(240px,.7fr) minmax(0,1.3fr)',gap:18,marginTop:30}} className="balcony-design-grid">
        <section style={{background:'#231942',color:'#fff',borderRadius:22,padding:24,minHeight:340,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:20,border:'2px solid rgba(255,255,255,.32)',borderRadius:12}}/>
          <div style={{position:'relative',zIndex:1,display:'flex',height:'100%',flexDirection:'column',justifyContent:'space-between'}}>
            <div><div style={{fontSize:12,color:'#c4b5fd',fontWeight:900}}>EXISTING ENVELOPE</div><div style={{fontSize:31,fontWeight:900,marginTop:7}}>{(office.dimensions.widthMm/1000).toFixed(1)} × {(office.dimensions.lengthMm/1000).toFixed(1)} m</div><div style={{fontSize:14,color:'#ddd6fe',marginTop:5}}>Floor to ceiling: {office.dimensions.sourceLabels.floorToCeiling} / {office.dimensions.floorToCeilingMm} mm</div></div>
            <div style={{display:'grid',gap:8,fontSize:13,color:'#ddd6fe'}}>
              <div>South ↑ &nbsp; West →</div><div>← East</div><div>North ↓ &nbsp; cabinet wall</div><div>Target: one-person workstation</div>
            </div>
          </div>
        </section>
        <section style={{display:'grid',gap:12}}>
          {ideas.map(([title,copy],index)=><div key={title} style={{background:'#fff',border:'1px solid #ded8ea',borderRadius:18,padding:20,display:'grid',gridTemplateColumns:'42px 1fr',gap:12}}>
            <div style={{width:38,height:38,borderRadius:12,display:'grid',placeItems:'center',background:'#ede9fe',color:'#6d28d9',fontWeight:900}}>{index+1}</div>
            <div><div style={{fontSize:18,fontWeight:900,color:'#231942'}}>{title}</div><div style={{fontSize:14,lineHeight:1.5,color:'#6b6477',marginTop:4}}>{copy}</div></div>
          </div>)}
        </section>
      </div>
      <div style={{marginTop:20,display:'grid',gap:10}}>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>Balcony envelope:</b> floor-to-ceiling height is {office.dimensions.sourceLabels.floorToCeiling} ({office.dimensions.floorToCeilingMm} mm). On the <b>{office.envelope.windowWalls.join(' and ')} walls</b>, the lower {office.envelope.sourceLabels.lowerBrickParapet} ({office.envelope.lowerBrickParapetMm} mm) is brick, the middle {office.envelope.sourceLabels.windowBand} ({office.envelope.windowBandMm} mm) is window, and the top {office.envelope.sourceLabels.upperBrickBand} ({office.envelope.upperBrickBandMm} mm) is brick.</div>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>North-wall cabinet:</b> the upper cabinet begins at the ceiling and is {office.cabinetry.northWall.upper.sourceLabels.height} high × {office.cabinetry.northWall.upper.sourceLabels.depth} deep. Its northwest bay conceals the existing water heater behind removable ventilated access. In the northeast bay, the router shelf is set as high as practical while retaining top ventilation and service clearance; three rubber-lined openings let its horizontal antennas project straight through the side panel by an adjustable amount. Two adjustable horizontal shelves create two book-height tiers plus a shallow accessory tier below the router while preserving a rear cable chase. Directly below it, the cabinet steps back to {office.cabinetry.northWall.lower.sourceLabels.depth} deep and measures {office.cabinetry.northWall.lower.sourceLabels.height} high × {office.cabinetry.northWall.lower.sourceLabels.width} wide.</div>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>Cabinet fronts:</b> one lift-up flap on the upper cabinet. The tall north-wall cabinet uses two-panel bypass sliders above and below the tabletop line. The west-side lower run has one east-facing hinged door per bay; the recessed desk-foot pocket keeps the north door clear, and the centre door opens without another panel covering the printer.</div>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>North cabinet access:</b> the cabinet remains 3 feet wide, with full-width bypass sliders and no swing-clearance conflict. Its book-storage grid has three divided columns, three adjustable tiers below the tabletop line, and two above it, allowing at least 11 inches clear height for typical 10-inch books.</div>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>Adjustable workstation:</b> a custom 226.8 × 76.2 cm west desktop on the 129 cm FLEXISPOT frame, adjustable from 29 to 47.6 inches with a 33-inch seated preset. The frame is shifted 15.2 cm south while retaining its full span. Both feet align with full-depth cut-through slots in the cabinet plinth and top rail, allowing the complete desk to slide out or back in after opening the north and south doors.</div>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>West-side storage:</b> the lower cabinet is a uniform 1 foot deep and runs from the north cabinet to the south end. The north bay combines the PC tower with the recessed desk-foot pocket. The printer sits low on a pull-out tray in the centre bay; above it, a continuous 15.2 cm-deep rear channel lets the monitor clamp move south. The south bay remains general storage.</div>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>Monitor setup:</b> dual-arm stand on the west-side worktop, with both screens facing the person; Lenovo D32qc-20 31.5-inch QHD display on the right and BenQ GW2490 23.8-inch FHD display on the left. A continuous rear channel across the centre cabinet bay reserves 5.5 inches below the tabletop and 6 inches of rear depth, so the clamp can be repositioned south without striking the cabinet.</div>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>Preliminary electrical plan:</b> retain the existing heater and router points. Add four fixed earthed outlets: one desk-power feed in the centre service zone, two in the PC/UPS bay, and one in the printer bay. The desk feed supplies an eight-outlet rail fixed beneath the moving top for both monitors, laptop charger, dock, combined phone/watch charger and desk motor, leaving two spares. Provide two Cat6 runs from the router chase to the dock. Keep the heater on its dedicated circuit and have a licensed electrician verify earthing, thirty-milliamp residual-current protection, cable and breaker sizing, and the existing points before energising.</div>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>Equipment inventory:</b><ul style={{margin:'8px 0 0',paddingLeft:20}}>{office.equipment.inventory.map((item,index)=><li key={`${item.category}-${index}`} style={{marginBottom:5}}><b>{item.category}:</b> {item.make} {item.model} — {item.dimensions} <span style={{color:'#7c7288'}}>({item.status})</span></li>)}</ul></div>
        <div style={{padding:18,borderRadius:16,background:'#fff',border:'1px solid #ded8ea',color:'#5f5870',fontSize:14}}><b style={{color:'#231942'}}>Floor-plan note:</b> close the former toilet-to-study doorway. The toilet keeps a single entrance from the drawing-room side. After the balcony enclosure and desk orientation are confirmed, the edited DXF copy can show the exact workstation, storage, lighting and electrical points.</div>
      </div>
    </div>
    <style>{`@media(max-width:780px){.balcony-design-grid{grid-template-columns:1fr!important}}`}</style>
  </main>
}

export default function HomeApp(){
  const [section,setSection]=useState('home')
  return <>
    <HomeHeader section={section} onHome={()=>setSection('home')}/>
    {section==='home'&&<WholeHome onOpen={setSection}/>} 
    {section==='kitchen'&&<KitchenConfigurator/>}
    {section==='study'&&<StudyWorkspace/>}
    {section==='balcony'&&<BalconyWorkspace/>}
    {section==='dxf'&&<DxfWorkspace/>}
  </>
}
