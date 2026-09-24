export const STUDY_ROOM={
  name:'Study',
  sourceRoom:'Existing Bed Room-2',
  dimensions:{widthMm:3239,lengthMm:4908,heightMm:2700,heightStatus:'provisional; verify on site'},
  orientation:{north:'toward lobby side in the current 3D view',east:'former toilet-door side',south:'double-height terrace side',west:'balcony-office side'},
  openings:{
    mainDoor:{wall:'east',widthMm:900,heightMm:2100,offsetFromNorthMm:0,label:'Main study entry from the northeast corner, extending south along the east wall'},
    terraceDoor:{wall:'south',widthMm:1000,heightMm:2200,offsetFromWestMm:2039,label:'Glazed opening at the southeast side to the double-height terrace'},
    balconyOffice:{wall:'west',widthMm:1829,heightMm:2370,offsetFromSouthMm:533,headWallMm:330,label:'Six-foot opening to the balcony office after a 21-inch southwest return'},
    formerToiletDoor:{wall:'east',widthMm:760,heightMm:2100,offsetFromNorthMm:3650,status:'closed and infilled',label:'Former toilet doorway closed'},
  },
  cabinetry:{
    southBuiltIn:{wall:'south',offsetFromWestMm:254,widthMm:1372,heightMm:2337,floorClearanceMm:102,depthMm:610,depthStatus:'provisional 24-inch depth inferred from the DXF balcony projection; verify on site',projection:'outside the study envelope into the balcony/terrace footprint',label:'Raised south-wall cabinet'},
    northBookshelf:{wall:'north',offsetFromWestMm:0,widthMm:2235,depthMm:457,heightMm:2395,topGapMm:305,label:'Existing three-bay glazed bookshelf from the northwest corner toward the northeast',styleReference:'three modular bays; glazed upper and middle double doors; twin drawers; solid lower cupboards; pale laminate with dark timber trim; short raised feet'},
  },
  designStatus:'existing room shell only; furniture layout to be developed with the owner',
}
