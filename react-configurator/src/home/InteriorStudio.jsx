import LightingPanel from './LightingPanel.jsx';
import MaterialsPanel from './MaterialsPanel.jsx';
import ArchvizPanel from './ArchvizPanel.jsx';
import React,{useRef,useState} from 'react';
import InspirationLibrary from './InspirationLibrary.jsx';
import './interior.css';
export default function InteriorStudio(){
  const dialog=useRef(null);const [tab,setTab]=useState('inspiration');
  return <><button className="interior-launch" onClick={()=>dialog.current.showModal()}>Interior studio</button><dialog className="interior-dialog" ref={dialog} aria-labelledby="interior-heading"><header className="interior-row"><div><small>WHOLE-HOME DESIGN</small><h2 id="interior-heading">Home Interior</h2></div><button aria-label="Close interior studio" onClick={()=>dialog.current.close()}>Close ✕</button></header><nav className="interior-row" aria-label="Interior tools"><button aria-pressed={tab==='inspiration'} onClick={()=>setTab('inspiration')}>Inspiration</button><button aria-pressed={tab==='materials'} onClick={()=>setTab('materials')}>Materials</button><button aria-pressed={tab==='lighting'} onClick={()=>setTab('lighting')}>Lighting</button><button aria-pressed={tab==='archviz'} onClick={()=>setTab('archviz')}>Blender export</button></nav>{tab==='inspiration'&&<InspirationLibrary/>}{tab==='materials'&&<MaterialsPanel/>}{tab==='lighting'&&<LightingPanel/>}{tab==='archviz'&&<ArchvizPanel/>}</dialog></>;
}
