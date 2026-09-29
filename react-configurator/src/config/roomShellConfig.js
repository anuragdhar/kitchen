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
    // 16:9 screen is about 1439x809 mm); the Bass Module 500 is about 10 x 10 x 9.5 in.
    tvWall:{
      fromWestMm:0,widthMm:2100,depthMm:305,heightMm:2400,plinthMm:80,panelMm:18,backMm:12,columnWidthMm:280,
      bay:{floorMm:650,topMm:1700},
      tv:{diagonalInches:65,widthMm:1450,heightMm:830,depthMm:55,bottomMm:730,setbackMm:60},
      soundbar:{model:'Bose Smart Soundbar 300',widthMm:699,heightMm:58,depthMm:102,frontSetbackMm:30},
      // Bass Module 500 stands on the base deck in the west half of the centre base, behind an open lattice front:
      // front of the room, beside the soundbar, off the corner. Cube about 10 x 10 x 9.5 in per Bose specifications.
      bassModule:{model:'Bose Bass Module 500',widthMm:254,heightMm:254,depthMm:241,centerFromBayWestFraction:.25,frontGapMm:30},
      phones:{column:'east',shelfMm:900,nicheTopMm:1500,landline:{widthMm:140,heightMm:110,depthMm:140},intercom:{widthMm:130,heightMm:230,depthMm:35,bottomMm:1150}},
      router:{shelfMm:1740,topMm:2050,widthMm:260,heightMm:45,depthMm:190,antennaMm:230},
    },
    wallOpenings:{east:{fromMm:2058,toMm:5335}},
    hangingBeams:[{wall:'east',fromMm:2058,toMm:5335,dropMm:305,widthMm:180}],
    // Two identical 3-seaters (owner, 2026-09-29): the west sofa is unchanged and the south sofa replaces the
    // former window seat (was centerX 1650, centerZ 5045, 2150x510x450). Sofa footprint is widthMm deep by lengthMm
    // long; the coffee table moved from (1745, 2420) to sit between them, and the chandelier moved with it.
    furniture:{sofa:{centerXmm:580,centerZmm:2420,widthMm:880,lengthMm:2250},southSofa:{centerXmm:1140,centerZmm:4810,widthMm:880,lengthMm:2250},coffeeTable:{centerXmm:1750,centerZmm:3300,widthMm:650,lengthMm:1100},rug:{centerXmm:1500,centerZmm:3150,widthMm:2100,lengthMm:2900}},
    // Alternative "B" (owner, 2026-09-29): the two sofas form an L in the north-west corner (north-wall sofa faces south,
    // west-wall sofa faces east), the TV is wall-mounted on the solid stretch of the east wall (z 0-2058, north of the
    // lobby opening) and a small cabinet for the router and phones hangs above the north-wall sofa. Shown next to the
    // default layout "A" (tvWall + furniture above) via the Layout toggle; analysis in docs/DRAWING_ROOM_TV_WALL.md.
    // Sofa footprints keep the 880 x 2250 size; the north sofa's east end passes the entry-door jamb line (x 2150) by 130 mm.
    cornerLayout:{
      furniture:{
        northSofa:{centerXmm:1155,centerZmm:500,widthMm:880,lengthMm:2250},
        westSofa:{centerXmm:580,centerZmm:2165,widthMm:880,lengthMm:2250},
        coffeeTable:{centerXmm:1745,centerZmm:1900,widthMm:600,lengthMm:1100},
        rug:{centerXmm:1500,centerZmm:1750,widthMm:2100,lengthMm:2500},
      },
      // Wall-mounted flat: TV thickness + a slim bracket protrude only 90 mm from the east wall face.
      tv:{diagonalInches:65,widthMm:1450,heightMm:830,depthMm:55,mountMm:35,centerFromNorthMm:1080,bottomMm:730},
      soundbar:{model:'Bose Smart Soundbar 300',widthMm:699,heightMm:58,depthMm:102,gapBelowTvMm:20},
      bassModule:{model:'Bose Bass Module 500',widthMm:254,heightMm:254,depthMm:241,centerFromNorthMm:1560,fromWallMm:100},
      // Option "B2" (owner, 2026-09-30): an 18-inch (457 mm) deep LOW console on the east wall under a full-motion arm TV.
      // A full-height 18-inch unit was tested and rejected: beside the north sofa it leaves 576 mm of walkway, and the only
      // stretch clear of the sofa (z 960-2040) is too narrow for a TV bay. The console holds the Bass Module 500 (open lattice
      // bay) and storage; the Soundbar 300 stands on top; the router and phones stay in the north-wall cabinet.
      // Both TV sizes are listed: the owner has a 55-inch now and may fit a 65-inch later.
      console:{
        depthMm:457,heightMm:500,fromNorthMm:960,lengthMm:1080,panelMm:18,backMm:12,moduleBayMm:420,
        soundbarCenterFromNorthMm:1320,
        tvCenterFromNorthMm:1300,tvBottomMm:650,installedTv:'55',
        tvs:{
          '55':{diagonalInches:55,widthMm:1230,heightMm:710,depthMm:45},
          '65':{diagonalInches:65,widthMm:1450,heightMm:830,depthMm:55},
        },
        // Full-motion wall arm: maxExtendMm is the hardware reach; watch* is the pose drawn by the toggle.
        arm:{plateMm:35,maxExtendMm:450,watchExtendMm:200,watchSwivelDeg:10},
      },
      // Option "B3" (future): the TV is replaced by a ceiling projector and a drop-down screen; the console, soundbar and
      // north cabinet stay. An 80-inch 16:9 screen (1771 x 996) is the widest that leaves 140 mm either side on the solid wall.
      projector:{
        screenDiagonalInches:80,widthMm:1771,heightMm:996,centerFromNorthMm:1029,bottomMm:700,
        throwRatio:1.2,ceilingDropMm:200,body:{widthMm:330,heightMm:120,depthMm:250},
      },
      routerCabinet:{fromWestMm:500,widthMm:1100,bottomMm:1450,heightMm:650,depthMm:250,panelMm:18,
        router:{widthMm:260,heightMm:45,depthMm:190,antennaMm:230},
        landline:{widthMm:140,heightMm:110,depthMm:140},intercom:{widthMm:130,heightMm:230,depthMm:35}},
    },
    // The northeast corner of this wall backs Bedroom 1's northEastRecessWardrobe
    // (roomShellConfig.js bedroom1.furniture), not a door into Drawing Room -
    // confirmed against the owner's own floor-plan mark (owner feedback 2026-09-29).
    doors:[{wall:'north',fromMm:2150,widthMm:1000,heightMm:2100,leadsTo:'Main entry'}],
    windows:[{wall:'south',fromMm:471,widthMm:2298,bottomMm:550,topMm:2100,frameStyle:'dark',mullionFractions:[.62],source:'clipboard screenshot'}],
  },
  kitchenShell:{name:'Kitchen shell',widthMm:2324,lengthMm:3070,heightMm:2700,color:'#b45309',source:'A501 floor plan'},
}
