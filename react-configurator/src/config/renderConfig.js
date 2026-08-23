import { KITCHEN, PLINTH_HEIGHT } from './kitchenConfig.js'

export const DEFAULT_MATERIALS={
  cabinetBody:'#efe9df',
  shutters:'#b99673',
  counter:'#e7ded2',
  backsplash:'#faf6f1',
  floor:'#ded6cc',
  wall:'#f6efe6',
  applianceFinish:'stainless',
  handleFinish:'#9a8c7a'
}

export const VIEW_STYLE={
  baseCabinet:'#efe9df',
  tallCabinet:'#efe9df',
  topCabinet:'#efe9df',
  middleCabinet:'#b99673',
  counter:'#e7ded2',
  plinth:'#211f1d',
  reveal:'#211b17',
  led:'#ffc46d'
}

export const HEIGHT_GUIDES=[
  {id:'top',from:1850,to:KITCHEN.height,label:'Top cabinet'},
  {id:'middle',from:1350,to:1850,label:'Medium cabinet'},
  {id:'backsplash',from:900,to:1350,label:'Counter to upper'},
  {id:'base',from:PLINTH_HEIGHT,to:900,label:'Base cabinet'},
  {id:'plinth',from:0,to:PLINTH_HEIGHT,label:'Plinth'}
]

export const RENDER_CONFIG={
  scene:{
    background:'#f3eee7',
    fog:{color:'#f3eee7',near:950,far:1900}
  },
  camera:{
    fov:42,
    near:1,
    far:2000,
    orbitTarget:[0,92,25],
    initialPosition:[0,145,-360],
    presets:{
      top:{pos:[0,720,0.1],target:[0,0,0]},
      eastWall:{pos:[-330,170,80],target:[-62,96,70]},
      westWall:{pos:[330,170,80],target:[58,96,72]},
      north:{pos:[0,165,430],target:[0,110,185]},
      south:{pos:[0,150,-360],target:[0,95,25]},
      walkthrough:{pos:[0,145,-360],target:[0,92,25]},
      sink:{pos:[210,148,86],target:[38,88,82]},
      exhaust:{pos:[12,165,420],target:[8,145,238]}
    }
  },
  renderer:{
    pixelRatioMax:2.5,
    outputColorSpace:'SRGBColorSpace',
    toneMapping:'ACESFilmicToneMapping',
    toneMappingExposure:1.08,
    shadowMapEnabled:true,
    shadowMapType:'PCFSoftShadowMap',
    roomEnvironmentBlur:0.04
  },
  textures:{
    maxAnisotropy:16,
    generatedSize:1024,
    tile:{
      path:'Tile2_600_12200.png',
      physicalWidthMm:1200,
      physicalHeightMm:600,
      anisotropy:16,
      bumpScale:.06,
      roughnessBias:.54
    },
    woodCabinet:{
      color:'textures/wood095/color.jpg',
      roughness:'textures/wood095/roughness.jpg',
      normal:'textures/wood095/normal-gl.jpg',
      displacement:'textures/wood095/displacement.jpg',
      repeat:[1.35,.55],
      normalScale:.34,
      displacementScale:.004
    }
  },
  lighting:{
    ambient:{color:'#fff7ed',intensity:.86},
    hemisphere:{skyColor:'#eef6ff',groundColor:'#bfa891',intensity:.76},
    key:{
      color:'#fff4df',
      intensity:2.55,
      position:[-180,360,230],
      shadowMapSize:4096,
      shadowCamera:{near:10,far:900,left:-260,right:260,top:360,bottom:-360},
      shadowBias:-0.00035
    },
    fill:{color:'#e9f1ff',intensity:.55,position:[180,160,220]},
    windowGlow:{color:'#d8ecff',intensity:2.4,distanceMm:2600,decay:1.45,positionMm:[0,1700,'roomMidMinus80']},
    ceilingGlow:{color:'#ffe2b8',intensity:1.25,distanceMm:2200,decay:1.7,positionMm:[0,2450,0]},
    ledPoint:{color:'#ffd8a0',intensity:1.15,distanceMm:1100}
  },
  grid:{sizeFromRoomMax:true,divisions:20,colorCenter:'#9a9084',colorGrid:'#ddd3c8',opacity:.26},
  pbr:{
    cabinet:{roughness:.5,metalness:.01,clearcoat:.28,clearcoatRoughness:.42,bumpScale:.018},
    tallCabinet:{roughness:.5,metalness:.01,clearcoat:.28,clearcoatRoughness:.42,bumpScale:.018},
    topCabinet:{roughness:.42,metalness:.01,clearcoat:.48,clearcoatRoughness:.28,bumpScale:.014},
    middleCabinet:{roughness:.64,metalness:.01,sheen:.35,bumpScale:.035},
    counter:{roughness:.2,metalness:.02,clearcoat:.72,clearcoatRoughness:.12,bumpScale:.018},
    floor:{roughness:.76,metalness:.01},
    wall:{roughness:.9,metalness:0},
    tile:{roughness:.48,metalness:.01,clearcoat:.22,clearcoatRoughness:.36},
    glass:{roughness:.08,metalness:0},
    blackGlass:{roughness:.18,metalness:.18,clearcoat:.5,clearcoatRoughness:.2},
    metal:{roughness:.22,metalness:.65},
    dark:{roughness:.5,metalness:.08},
    plinth:{roughness:.58,metalness:.04},
    led:{color:'#ffb45d',emissive:'#ff9f2f',emissiveIntensity:2.8,roughness:.3,metalness:0}
  }
}
