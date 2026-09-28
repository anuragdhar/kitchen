from pathlib import Path
import hashlib
p = Path('react-configurator/src/App.jsx')
s = p.read_text(encoding='utf-8')
assert hashlib.sha1(b'blob '+str(len(p.read_bytes())).encode()+b'\0'+p.read_bytes()).hexdigest() == '8de23645ec18c7f6cce228337a00d70d6e0599b2', 'App baseline changed'

def replace(old, new):
 global s
 assert s.count(old) == 1, ('Expected one anchor', old[:100], s.count(old))
 s = s.replace(old, new)

s = "import {useKitchenProject} from './hooks/useKitchenProject.js'\nimport {MAX_PROJECT_BYTES, encodeProject} from './persistence/projectCodec.mjs'\nimport {loadNamedProject, saveNamedProject} from './persistence/projectStorage.mjs'\n" + s
replace("const REFERENCE_LINKS=[", """const PROJECT_DEFAULTS={east:EAST_INIT,west:WEST_INIT,grid:0,materials:normalizeKitchenMaterials(),
  eastModules:autoFillModules(KITCHEN.length),westModules:autoFillModules(KITCHEN.length-KITCHEN.westGap.to),
  eastTopUpperDepth:EAST_TOP_UPPER_DEPTH,westTopUpperDepth:WEST_TOP_UPPER_DEPTH,hide3DObstructions:true}

const REFERENCE_LINKS=[""")
start=s.index("  const eastIds=")
end=s.index("  const [view,setView]", start)
s=s[:start]+"""  const persisted=useKitchenProject(PROJECT_DEFAULTS,KITCHEN,LS_KEY)
  const {east,west,grid,materials,eastModules,westModules,eastTopUpperDepth,westTopUpperDepth,hide3DObstructions}=persisted.project
  const {setEast,setWest,setGrid,setMaterials,setEastModules,setWestModules,setEastTopUpperDepth,setWestTopUpperDepth,setHide3DObstructions}=persisted.setters
  const eastRunLength=KITCHEN.length
  const westRunLength=KITCHEN.length-KITCHEN.westGap.to
"""+s[end:]
for old in ["  const [grid,setGrid]=useState(0)\n","  const [hide3DObstructions,setHide3DObstructions]=useState(true)\n","  const [materials,setMaterials]=useState(()=>normalizeKitchenMaterials())\n","  const [eastTopUpperDepth,setEastTopUpperDepth]=useState(EAST_TOP_UPPER_DEPTH)\n","  const [westTopUpperDepth,setWestTopUpperDepth]=useState(WEST_TOP_UPPER_DEPTH)\n","  const [eastModules,setEastModules]=useState(()=>autoFillModules(eastRunLength))\n","  const [westModules,setWestModules]=useState(()=>autoFillModules(westRunLength))\n","  const kitchenHydratedRef=useRef(false)\n"]:
 replace(old,'')
replace("  const fileInputRef=useRef(null)","""  const fileInputRef=useRef(null)
  const loadRequestRef=useRef(0)
  useEffect(()=>()=>{loadRequestRef.current+=1},[])""")
start=s.index('  // autosave\n')
end=s.index('  useEffect(()=>{const api={',start)
s=s[:start]+s[end:]
start=s.index('reset:()=>{setEast(EAST_INIT);')
end=s.index('}, getLayoutModel,',start)
s=s[:start]+"reset:()=>{persisted.resetProject();setImportWarning('')"+s[end:]
# Always export the canonical persistence document alongside the existing derived views.
replace('const buildProjectData=()=>{const layoutModel=getLayoutModel(); return {kitchen:KITCHEN,east,west,eastTopUpperDepth,westTopUpperDepth,',
'const buildProjectData=()=>{const layoutModel=getLayoutModel(); return {...persisted.getDocument(),')
replace("  const exportJSON=()=>{const data=buildProjectData(); const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='Galley_2324x4746_Rule9_Current.json'; a.click()}","""  const exportJSON=()=>{
    try{downloadText('Galley_2324x4746_Rule9_Current.json',JSON.stringify(buildProjectData(),null,2),'application/json')}
    catch(error){setImportWarning('Export failed: '+error.message)}
  }""")
start=s.index('  const saveVersion=(key)=>')
end=s.index('  const applyAiryLayout=', start)
s=s[:start]+"""  const saveVersion=(key)=>{
    try{
      saveNamedProject(window.localStorage,VERSION_KEYS[key],persisted.project,KITCHEN)
      setImportWarning('');setBomNote(`Saved ${key}`)
    }catch(error){setImportWarning('Save failed: '+error.message)}
  }
  const loadVersion=(key)=>{
    try{
      const result=loadNamedProject(window.localStorage,VERSION_KEYS[key],{kitchen:KITCHEN,defaults:PROJECT_DEFAULTS})
      applyLoadedProject(encodeProject(result.state,KITCHEN),result.warnings)
      setBomNote(`Loaded ${key}`)
    }catch(error){setImportWarning('Load failed: '+error.message)}
  }
  const resetRule9=()=>{persisted.resetProject();setImportWarning('');setBomNote('Reset active workspace to configured defaults.')}
"""+s[end:]
start=s.index('  const applyLoadedProject=')
end=s.index('  const export3DScreenshot=',start)
s=s[:start]+"""  const applyLoadedProject=(input,extraWarnings=[],expectedGeneration)=>{
    const result=persisted.loadProject(input,expectedGeneration)
    const rows=buildKitchenValidationRows({east:result.state.east,west:result.state.west,kitchen:KITCHEN,eastDepthMm:EAST_BASE_DEPTH,northHobOptionY:NORTH_HOB_OPTION_Y_MM})
    const warning=summarizeValidation(rows).all?'':'Design checks need attention; imported positions were preserved.'
    setImportWarning([...extraWarnings,...result.warnings,warning].filter(Boolean).join('\\n'))
    setSelectedId(null);setMeasurePoints([]);setDrag(null)
    return result
  }
  const handleLoadFile=async(e)=>{
    const file=e.target.files?.[0]
    e.target.value=''
    if(!file)return
    const request=++loadRequestRef.current
    const generation=persisted.getGeneration()
    try{
      if(file.size>MAX_PROJECT_BYTES)throw new Error('Project file exceeds 2 MiB.')
      const text=await file.text()
      if(request!==loadRequestRef.current)return
      applyLoadedProject(text,[],generation)
      setBomNote('Project loaded. Custom geometry was preserved.')
    }catch(error){if(request===loadRequestRef.current)setImportWarning('Import failed: '+error.message)}
  }

"""+s[end:]
# Provide visible state and explicit recovery; failed reads never silently enable overwrites.
replace('        <h3 style={{margin:\'0 0 8px 0\',fontSize:15}}>Project - Save / Load / Versions</h3>',"""        <h3 style={{margin:'0 0 8px 0',fontSize:15}}>Project - Save / Load / Versions</h3>
        <div role="status" aria-label="Project save status" style={{marginBottom:8,fontSize:12}}>{persisted.status.message}</div>
        {persisted.notice && <div role="note" style={{fontSize:12,whiteSpace:'pre-wrap',marginBottom:8}}>{persisted.notice}</div>}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
          <button onClick={()=>{try{persisted.restorePrevious();setImportWarning('')}catch(error){setImportWarning(error.message)}}}>Restore previous autosave</button>
          {persisted.status.state==='error' && <button onClick={()=>{if(window.confirm('Save this workspace over the stored autosave? Its previous contents will be copied to a recovery key first. Export JSON first to keep an independent copy.'))persisted.resumeAutosave()}}>Resume autosave</button>}
        </div>""")
replace("<input ref={fileInputRef} type=\"file\"", "<input aria-label=\"Project JSON file\" ref={fileInputRef} type=\"file\"")
replace("{importWarning && <div style=", "{importWarning && <div role=\"alert\" style=")
replace('Autosave active (localStorage key {LS_KEY}). Import warns instead of crashing.', 'Versioned autosave: {persisted.storageKey}. Legacy saves are retained. Invalid files leave the workspace unchanged.')
replace('<button onClick={()=>saveVersion(key)}', '<button aria-label={`Save ${key} project`} onClick={()=>saveVersion(key)}')
replace('<button onClick={()=>loadVersion(key)}', '<button aria-label={`Load ${key} project`} onClick={()=>loadVersion(key)}')
p.write_text(s,encoding='utf-8')
print('Patched App; configuration and render implementation unchanged.')
