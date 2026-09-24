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
  bedroom3:{name:'Bedroom 3',widthMm:3963,lengthMm:3726,heightMm:2700,color:'#db8b47',source:'A501 floor plan'},
  lobby:{
    name:'Lobby / Dining',widthMm:4993,lengthMm:3277,heightMm:2700,color:'#4b93a7',source:'A501 floor plan',openSide:'west',
    hangingBeams:[{wall:'west',fromMm:0,toMm:3277,dropMm:305,widthMm:180}],
    wallOpenings:{east:{fromMm:2177,toMm:3277},north:{fromMm:3793,toMm:4993}},
    poojaAlcove:{wall:'north',fromMm:3793,widthMm:1200,depthMm:1000,altarVisible:false,templeDepthMm:254,seatedPersonFromWestMm:400,platformHeightMm:190,drawerDepthMm:550},
    furniture:{diningTable:{centerXmm:3450,centerZmm:1650,widthMm:700,lengthMm:1200,heightMm:745},chairRowsZmm:[1320,1980],chairOffsetXmm:620},
    doors:[
      {wall:'south',fromMm:1000,widthMm:900,heightMm:2100,leadsTo:'Toilet'},
      {wall:'north',fromMm:100,widthMm:900,heightMm:2100,leadsTo:'Bedroom 1'},
    ],
  },
  drawing:{
    name:'Drawing Room',widthMm:3353,lengthMm:5335,heightMm:2700,color:'#6b8e63',source:'A501 floor plan',
    wallOpenings:{east:{fromMm:2058,toMm:5335}},
    hangingBeams:[{wall:'east',fromMm:2058,toMm:5335,dropMm:305,widthMm:180}],
    furniture:{sofa:{centerXmm:580,centerZmm:2420,widthMm:880,lengthMm:2250},coffeeTable:{centerXmm:1910,centerZmm:2420,widthMm:980,lengthMm:1360},windowSeat:{centerXmm:1650,centerZmm:5045,widthMm:2150,depthMm:510,heightMm:450}},
    doors:[{wall:'north',fromMm:2150,widthMm:1000,heightMm:2100,leadsTo:'Main entry'}],
    windows:[{wall:'south',fromMm:471,widthMm:2298,bottomMm:550,topMm:2100,frameStyle:'dark',mullionFractions:[.62],source:'clipboard screenshot'}],
  },
  kitchenShell:{name:'Kitchen shell',widthMm:2324,lengthMm:3070,heightMm:2700,color:'#b45309',source:'A501 floor plan'},
}
