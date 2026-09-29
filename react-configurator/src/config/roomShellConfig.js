export const EMPTY_ROOM_SHELLS={
  bedroom1:{
    name:'Bedroom 1',widthMm:3353,lengthMm:3240,heightMm:2700,color:'#9f7aea',source:'A501 floor plan',
    wallOpenings:{east:{fromMm:0,toMm:2200}},
    balconyExtension:{
      wall:'east',depthMm:1200,lengthMm:2200,railingHeightMm:1000,frameStyle:'aluminium',
      poojaWallWardrobe:{widthMm:1200,depthMm:508,heightMm:2700,northShiftMm:300,doorCount:2,opensTo:'Bedroom 1 balcony'},
      furniture:{
        table:{centerFromBedroomWallMm:1000,centerFromNorthMm:500,widthMm:700,depthMm:350,heightMm:740},
        chair:{centerFromBedroomWallMm:540,centerFromNorthMm:500,widthMm:440,depthMm:400,seatHeightMm:450,backHeightMm:860,facing:'east'},
      },
    },
    // The south door shares its opening with the lobby's north door (leadsTo 'Bedroom 1').
    // Both sit 100 mm off the common west wall (south-west corner) - keep the two fromMm values in sync.
    // The bed's 6 ft length runs west along the south wall; its head is near the southeast/east end.
    furniture:{
      bed:{lengthMm:1829,widthMm:1524,fromWestMm:1524,fromSouthMm:0},
      wardrobe:{wall:'west',fromNorthMm:0,lengthMm:1800,depthMm:508,heightMm:2400,doorCount:3},
      northEastRecessWardrobe:{wall:'north',fromEastMm:0,widthMm:850,depthMm:400,heightMm:2700,doorCount:2,opensTo:'Bedroom 1'},
    },
    doors:[
      {wall:'north',fromMm:766,widthMm:650,heightMm:2100,leadsTo:'Bedroom 1 washroom'},
      {wall:'south',fromMm:100,widthMm:900,heightMm:2100,leadsTo:'Lobby / Dining'},
    ],
  },
  bedroom3:{
    name:'Bedroom 3',widthMm:3963,lengthMm:3726,heightMm:2700,color:'#db8b47',source:'A501 floor plan',
    // The plan labels the two adjacent south projections as 1925 and 2383 mm;
    // scale their drawn proportions to the 3963 mm room width until surveyed.
    southExtension:{
      cabinet:{fromWestMm:0,widthMm:1771,depthMm:610,heightMm:2400,floorClearanceMm:100},
      balcony:{fromWestMm:1771,widthMm:2192,depthMm:1200,railingHeightMm:1050,doorFromWestMm:1771,doorWidthMm:1000,doorHeightMm:2200,windowFromWestMm:2771,windowWidthMm:1192,windowSillMm:900,windowTopMm:2200},
    },
    furniture:{
      bed:{lengthMm:1829,widthMm:1829,headWall:'east',centerFromNorthMm:1863},
      dressingTable:{wall:'west',integratedWithWardrobe:true,fromNorthMm:1050,widthMm:600,depthMm:580,heightMm:2500,doorBottomMm:500,doorTopMm:2350,doorConstruction:'lightweight framed',mirrorWidthMm:420,mirrorHeightMm:1550,mirrorBottomMm:600},
      // Continue the west run to the projecting south cabinet to form an L.
      westWardrobe:{fromNorthMm:1050,lengthMm:2676,depthMm:580,heightMm:2500,doorType:'sliding',doorCount:3,vanityBayWidthMm:600},
    },
    doors:[
      {wall:'north',fromMm:0,widthMm:900,heightMm:2100,leadsTo:'Bedroom 3'},
      // Located within the plan's northeast toilet frontage; opening size is provisional.
      {wall:'north',fromMm:2850,widthMm:700,heightMm:2100,leadsTo:'Bedroom 3 toilet',opensIntoToilet:true},
    ],
  },
  lobby:{
    name:'Lobby / Dining',widthMm:4993,lengthMm:3277,heightMm:2700,color:'#4b93a7',source:'A501 floor plan',openSide:'west',
    hangingBeams:[{wall:'west',fromMm:0,toMm:3277,dropMm:305,widthMm:180}],
    wallOpenings:{east:{fromMm:2177,toMm:3277},north:{fromMm:3793,toMm:4993}},
    poojaAlcove:{wall:'north',fromMm:3793,widthMm:1200,depthMm:1000,altarVisible:false,templeDepthMm:254,seatedPersonFromWestMm:400,platformHeightMm:190,drawerDepthMm:550},
    furniture:{
      diningTable:{centerXmm:2200,centerZmm:620,widthMm:700,lengthMm:1200,heightMm:745},chairRowsZmm:[290,950],chairOffsetXmm:620,
      eastIroningStorage:{fromNorthMm:650,lengthMm:1450,depthMm:400,heightMm:1000,doorCount:3,centerBayWidthMm:600,boardLengthMm:950,boardWidthMm:300},
    },
    doors:[
      {wall:'south',fromMm:1000,widthMm:900,heightMm:2100,leadsTo:'Toilet'},
      {wall:'north',fromMm:100,widthMm:900,heightMm:2100,leadsTo:'Bedroom 1'},
    ],
  },
  drawing:{
    name:'Drawing Room',widthMm:3353,lengthMm:5335,heightMm:2700,color:'#6b8e63',source:'A501 floor plan',
    // TV wall (owner, 2026-09-29): a 305 mm deep cabinet on the north wall, west of the entry door,
    // with a centre bay for a 65-inch TV. Plan and rationale: docs/DRAWING_ROOM_TV_WALL.md.
    // Millimetres in the room frame: x from the west wall, z from the north wall, y up.
    // Device sizes are manufacturer figures rounded up (Soundbar 300 698.5x57.1x101.6; a 65-inch
    // 16:9 screen is about 1439x809 mm); Home Speaker 500 is sized for either orientation.
    tvWall:{
      fromWestMm:0,widthMm:2100,depthMm:305,heightMm:2400,plinthMm:80,panelMm:18,backMm:12,columnWidthMm:280,
      bay:{floorMm:650,topMm:1700},
      tv:{diagonalInches:65,widthMm:1450,heightMm:830,depthMm:55,bottomMm:730,setbackMm:60},
      soundbar:{model:'Bose Smart Soundbar 300',widthMm:699,heightMm:58,depthMm:102,frontSetbackMm:30},
      speaker:{model:'Bose Home Speaker 500',column:'west',widthMm:216,heightMm:170,depthMm:110,shelfMm:1000,nicheTopMm:1300},
      phones:{column:'east',shelfMm:900,nicheTopMm:1500,landline:{widthMm:140,heightMm:110,depthMm:140},intercom:{widthMm:130,heightMm:230,depthMm:35,bottomMm:1150}},
      router:{shelfMm:1740,topMm:2050,widthMm:260,heightMm:45,depthMm:190,antennaMm:230},
    },
    wallOpenings:{east:{fromMm:2058,toMm:5335}},
    hangingBeams:[{wall:'east',fromMm:2058,toMm:5335,dropMm:305,widthMm:180}],
    // Two identical 3-seaters (owner, 2026-09-29): the west sofa is unchanged and the south sofa replaces the
    // former window seat (was centerX 1650, centerZ 5045, 2150x510x450). Sofa footprint is widthMm deep by lengthMm
    // long; the coffee table moved from (1745, 2420) to sit between them, and the chandelier moved with it.
    furniture:{sofa:{centerXmm:580,centerZmm:2420,widthMm:880,lengthMm:2250},southSofa:{centerXmm:1140,centerZmm:4810,widthMm:880,lengthMm:2250},coffeeTable:{centerXmm:1750,centerZmm:3300,widthMm:650,lengthMm:1100},rug:{centerXmm:1500,centerZmm:3150,widthMm:2100,lengthMm:2900}},
    // The northeast corner of this wall backs Bedroom 1's northEastRecessWardrobe
    // (roomShellConfig.js bedroom1.furniture), not a door into Drawing Room -
    // confirmed against the owner's own floor-plan mark (owner feedback 2026-09-29).
    doors:[{wall:'north',fromMm:2150,widthMm:1000,heightMm:2100,leadsTo:'Main entry'}],
    windows:[{wall:'south',fromMm:471,widthMm:2298,bottomMm:550,topMm:2100,frameStyle:'dark',mullionFractions:[.62],source:'clipboard screenshot'}],
  },
  kitchenShell:{name:'Kitchen shell',widthMm:2324,lengthMm:3070,heightMm:2700,color:'#b45309',source:'A501 floor plan'},
}
