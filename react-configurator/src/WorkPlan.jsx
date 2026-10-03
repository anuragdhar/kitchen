import React,{useEffect,useMemo,useRef,useState} from 'react'
import seedPlan from '../../work-plan/plan.json'
import {validateWorkPlan,orderedTasks,planWarnings,planSummary,readyTasks,newTaskId,STATUSES,STATUS_LABELS} from './home/workPlan.mjs'

// The renovation work plan (work-plan/plan.json): every task, by trade, in the order the work has to happen.
// When the app runs from the local dev server, changes are saved straight back to that file (scripts/work-plan-plugin.mjs)
// so they can be committed. Anywhere else the file cannot be written, so changes are kept in this browser only and said so.
const ENDPOINT='/__work_plan',LOCAL_KEY='home-interior.work-plan.v1'
const STATUS_COLOURS={todo:['#f1f5f9','#334155'],'in-progress':['#dbeafe','#1e40af'],blocked:['#fee2e2','#991b1b'],done:['#dcfce7','#166534']}
const input={padding:'7px 9px',borderRadius:8,border:'1px solid #cbd5e1',font:'inherit',fontSize:13}
const button=active=>({padding:'8px 12px',borderRadius:9,border:'1px solid #cbd5e1',background:active?'#172033':'#fff',color:active?'#fff':'#172033',fontWeight:800,cursor:'pointer'})

export default function WorkPlan(){
  const [plan,setPlan]=useState(()=>validateWorkPlan(structuredClone(seedPlan)))
  const [storage,setStorage]=useState('loading') // 'file' | 'browser' | 'loading'
  const [message,setMessage]=useState('')
  const [group,setGroup]=useState('phase'),[show,setShow]=useState('all')
  const [draft,setDraft]=useState({title:'',trade:'civil',phase:'civil',room:'',detail:''})
  const saveTimer=useRef(0)

  useEffect(()=>{
    let alive=true
    fetch(ENDPOINT,{cache:'no-store'}).then(async response=>{
      if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('no local save')
      const value=validateWorkPlan(await response.json())
      if(alive){setPlan(value);setStorage('file')}
    }).catch(()=>{
      if(!alive)return
      try{const saved=localStorage.getItem(LOCAL_KEY);if(saved)setPlan(validateWorkPlan(JSON.parse(saved)))}catch{}
      setStorage('browser')
    })
    return()=>{alive=false;clearTimeout(saveTimer.current)}
  },[])

  const save=next=>{
    clearTimeout(saveTimer.current)
    saveTimer.current=setTimeout(async()=>{
      try{
        if(storage==='file'){
          const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)})
          if(!response.ok)throw new Error((await response.json().catch(()=>({}))).error||'Save failed')
          setMessage('Saved to work-plan/plan.json')
        }else{localStorage.setItem(LOCAL_KEY,JSON.stringify(next));setMessage('Saved in this browser only')}
      }catch(error){setMessage(`Not saved: ${error.message}`)}
    },500)
  }
  const change=mutate=>{
    const next=structuredClone(plan);mutate(next)
    try{validateWorkPlan(next)}catch(error){setMessage(`Not changed: ${error.message}`);return}
    setPlan(next);save(next)
  }
  const patch=(id,values)=>change(next=>Object.assign(next.tasks.find(task=>task.id===id),values))
  const addTask=event=>{
    event.preventDefault()
    if(!draft.title.trim())return
    change(next=>next.tasks.push({id:newTaskId(next,draft.title),phase:draft.phase,trade:draft.trade,title:draft.title.trim(),room:draft.room.trim(),detail:draft.detail.trim(),dependsOn:[],status:'todo'}))
    setDraft(value=>({...value,title:'',room:'',detail:''}))
  }

  const ordered=useMemo(()=>orderedTasks(plan),[plan])
  const summary=useMemo(()=>planSummary(plan),[plan]),warnings=useMemo(()=>planWarnings(plan),[plan])
  const ready=useMemo(()=>new Set(readyTasks(plan).map(task=>task.id)),[plan])
  const titles=useMemo(()=>new Map(plan.tasks.map(task=>[task.id,task.title])),[plan])
  const number=useMemo(()=>new Map(ordered.map((task,index)=>[task.id,index+1])),[ordered])
  const visible=ordered.filter(task=>show==='all'||(show==='open'?task.status!=='done':show==='ready'?ready.has(task.id):task.status===show))
  const groups=(group==='phase'?plan.phases:plan.trades).map(item=>({...item,tasks:visible.filter(task=>task[group]===item.id)})).filter(item=>item.tasks.length)
  const nameOf=(list,id)=>list.find(item=>item.id===id)?.name

  return <main style={{padding:'24px clamp(18px,3vw,48px) 60px',maxWidth:1500,margin:'0 auto'}}>
    <h1 style={{fontSize:30,margin:'0 0 4px',color:'#172033'}}>Work plan</h1>
    <p style={{fontSize:14,color:'#475569',margin:'0 0 14px',maxWidth:900}}>Every job for the renovation, by trade, in the order it has to happen. A task is <b>ready</b> when everything it depends on is done. Sizes come from the 3D model, not from site measurements.</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>
      <div style={{padding:'10px 14px',borderRadius:12,background:'#172033',color:'#fff'}}><b style={{fontSize:20}}>{summary.all.done}/{summary.all.total}</b><div style={{fontSize:11}}>tasks done</div></div>
      {summary.byTrade.filter(trade=>trade.total).map(trade=><div key={trade.id} style={{padding:'10px 14px',borderRadius:12,background:'#fff',border:'1px solid #e2e8f0'}}><b style={{fontSize:16,color:'#172033'}}>{trade.done}/{trade.total}</b><div style={{fontSize:11,color:'#64748b'}}>{trade.name}</div></div>)}
    </div>
    <div role="status" style={{fontSize:12,color:storage==='browser'?'#9a3412':'#64748b',marginBottom:12}}>
      {storage==='loading'?'Loading the plan…':storage==='file'?'Changes are saved to work-plan/plan.json in the project folder (commit it to keep history).':'This copy cannot write to the project folder: changes stay in this browser only. Run the app locally to save them to work-plan/plan.json.'}
      {message&&<b style={{marginLeft:8}}>{message}</b>}
    </div>
    {warnings.length>0&&<div style={{padding:'10px 14px',borderRadius:12,background:'#fff7ed',border:'1px solid #fed7aa',marginBottom:12,fontSize:13,color:'#7c2d12'}}><b>Check the order:</b><ul style={{margin:'4px 0 0',paddingLeft:18}}>{warnings.map((warning,index)=><li key={index}>{warning.message}</li>)}</ul></div>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>
      <b style={{fontSize:13}}>Group by</b>
      <button aria-pressed={group==='phase'} onClick={()=>setGroup('phase')} style={button(group==='phase')}>Order of work</button>
      <button aria-pressed={group==='trade'} onClick={()=>setGroup('trade')} style={button(group==='trade')}>Trade</button>
      <b style={{fontSize:13,marginLeft:10}}>Show</b>
      {[['all','All'],['open','Not done'],['ready','Ready to start'],['blocked','Blocked']].map(([key,label])=><button key={key} aria-pressed={show===key} onClick={()=>setShow(key)} style={button(show===key)}>{label}</button>)}
    </div>
    {groups.map(item=><section key={item.id} style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:16,marginBottom:14,overflow:'hidden'}}>
      <h2 style={{fontSize:16,margin:0,padding:'11px 16px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',color:'#172033'}}>{item.name} <span style={{fontWeight:400,color:'#64748b',fontSize:13}}>· {item.tasks.filter(task=>task.status==='done').length}/{item.tasks.length} done</span></h2>
      {item.tasks.map(task=>{const [bg,fg]=STATUS_COLOURS[task.status];return <article key={task.id} data-task={task.id} style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:12,opacity:task.status==='done'?.62:1}}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:'#172033'}}><span style={{color:'#94a3b8',fontWeight:700}}>{number.get(task.id)}.</span> {task.title} {ready.has(task.id)&&<span style={{fontSize:11,fontWeight:800,padding:'2px 7px',borderRadius:999,background:'#ecfccb',color:'#3f6212',marginLeft:4}}>ready</span>}</div>
          <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{group==='phase'?nameOf(plan.trades,task.trade):nameOf(plan.phases,task.phase)}{task.room&&` · ${task.room}`}{task.source&&` · ${task.source}`}</div>
          {task.detail&&<div style={{fontSize:13,color:'#334155',marginTop:5,maxWidth:980}}>{task.detail}</div>}
          {task.needs&&<div style={{fontSize:12,fontWeight:800,color:'#9a3412',marginTop:5}}>Needs: {task.needs}</div>}
          {task.dependsOn?.length>0&&<div style={{fontSize:12,color:'#64748b',marginTop:4}}>After: {task.dependsOn.map(dep=>`${number.get(dep)}. ${titles.get(dep)}`).join('; ')}</div>}
          <input aria-label={`Notes for ${task.title}`} value={task.notes??''} onChange={event=>patch(task.id,{notes:event.target.value})} placeholder="Notes: contractor, date, cost, what was agreed…" style={{...input,width:'100%',maxWidth:980,marginTop:7,boxSizing:'border-box'}}/>
        </div>
        <select aria-label={`Status of ${task.title}`} value={task.status} onChange={event=>patch(task.id,{status:event.target.value})} style={{...input,alignSelf:'start',fontWeight:800,background:bg,color:fg}}>{STATUSES.map(status=><option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select>
      </article>})}
    </section>)}
    {groups.length===0&&<p style={{color:'#64748b'}}>No tasks match this filter.</p>}
    <form onSubmit={addTask} style={{background:'#fff',border:'1px solid #dbe3e9',borderRadius:16,padding:16,display:'grid',gap:8,maxWidth:980}}>
      <b style={{color:'#172033'}}>Add a task</b>
      <input aria-label="New task title" required value={draft.title} onChange={event=>setDraft({...draft,title:event.target.value})} placeholder="What needs doing? e.g. Replace the kitchen sink tap" style={input}/>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <select aria-label="New task trade" value={draft.trade} onChange={event=>setDraft({...draft,trade:event.target.value})} style={input}>{plan.trades.map(trade=><option key={trade.id} value={trade.id}>{trade.name}</option>)}</select>
        <select aria-label="New task phase" value={draft.phase} onChange={event=>setDraft({...draft,phase:event.target.value})} style={input}>{plan.phases.map(phase=><option key={phase.id} value={phase.id}>{phase.name}</option>)}</select>
        <input aria-label="New task room" value={draft.room} onChange={event=>setDraft({...draft,room:event.target.value})} placeholder="Room" style={input}/>
      </div>
      <input aria-label="New task detail" value={draft.detail} onChange={event=>setDraft({...draft,detail:event.target.value})} placeholder="Details (size, material, who decides)" style={input}/>
      <div><button type="submit" style={button(true)}>Add task</button></div>
    </form>
  </main>
}
