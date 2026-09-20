export const STUDY_ROOM={
  name:'Study',
  sourceRoom:'Existing Bed Room-2',
  dimensions:{widthMm:3239,lengthMm:4908,heightMm:2700,heightStatus:'provisional; verify on site'},
  orientation:{north:'toward lobby side in the current 3D view',east:'balcony-office side',south:'double-height terrace side',west:'internal wall side'},
  openings:{
    mainDoor:{wall:'north',widthMm:900,heightMm:2100,offsetFromWestMm:420,label:'Main study entry from lobby'},
    terraceDoor:{wall:'south',widthMm:1000,heightMm:2200,offsetFromWestMm:500,label:'Glazed opening to double-height terrace'},
    balconyOffice:{wall:'east',widthMm:900,heightMm:2200,offsetFromNorthMm:900,label:'Connection to balcony office'},
    formerToiletDoor:{wall:'east',widthMm:760,heightMm:2100,offsetFromNorthMm:3650,status:'closed and infilled',label:'Former toilet doorway closed'},
  },
  designStatus:'existing room shell only; furniture layout to be developed with the owner',
}
