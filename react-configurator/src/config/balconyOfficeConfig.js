// Balcony office dimensions captured from the owner. Millimetres are the working CAD units.
export const BALCONY_DESK_HEIGHT_KEY='balcony-office-desk-height-mm'
export const BALCONY_OFFICE={
  name:'Balcony home office',
  location:'East side of the proposed study (existing Bedroom 2)',
  orientation:{north:'plan up',east:'plan right',south:'plan down',west:'plan left'},
  dimensions:{
    widthMm:1200,
    lengthMm:2623,
    floorToCeilingMm:2642,
    sourceLabels:{width:'3 ft 11 in',length:'8 ft 7 in',floorToCeiling:'8 ft 8 in'},
  },
  envelope:{
    windowWalls:['south','west'],
    lowerBrickParapetMm:991,
    windowBandMm:1346,
    upperBrickBandMm:305,
    sourceLabels:{lowerBrickParapet:'3 ft 3 in',windowBand:'4 ft 5 in',upperBrickBand:'1 ft'},
  },
  access:{from:'study',side:'west'},
  adjacentToilet:{studyDoor:'closed',activeDoor:'drawing-room side'},
  cabinetry:{
    northWall:{
      upper:{startsAt:'ceiling',heightMm:864,depthMm:406,heaterBayWidthMm:500,routerBayWidthMm:414,routerShelfHeightAboveBayBottomMm:750,routerTopServiceClearanceMm:40,routerUnderShelfStorage:{tiers:3,shelfCount:2,shelfCenterHeightsMm:[288,585],bookTiers:2,topAccessoryTier:true,rearCableChaseMm:75,shelfThicknessMm:18,minimumBookClearanceMm:279,adjustable:true},routerAntennaPassThrough:{count:3,slotWidthMm:14,slotHeightMm:20,edge:'high northeast side panel',lining:'rubber edge grommet',orientation:'straight horizontal antennas with adjustable projection'},sourceLabels:{height:'34 in',depth:'16 in'},serviceLayout:'northwest water-heater bay with removable ventilated access; separate northeast router shelf at maximum practical height with internal socket, solid divider, three straight antenna pass-throughs, two book-height tiers and one shallow accessory tier below'},
      lower:{position:'from floor to underside of upper cabinet',heightMm:1778,widthMm:914,depthMm:127,bookStorage:{typicalBookHeightMm:254,minimumClearHeightMm:279,columns:3,tiersBelowTabletop:3,tiersAboveTabletop:2,shelves:'adjustable on pin holes',verticalDividers:'two full-height dividers creating three book columns'},sourceLabels:{height:'5 ft 10 in fitted (approximately 6 ft)',width:'3 ft',depth:'5 in'}},
      doors:{
        upper:{type:'single lift-up flap',openDegrees:25},
        lower:{
          splitHeightMm:991,
          splitAlignment:'tabletop level',
          belowTabletop:{type:'full-width two-panel bypass sliding doors within 3-foot cabinet',cornerFillerMm:0,openState:'left panel shifted right',use:'files and office supplies',reason:'full-width sliding fronts need no swing clearance or corner filler'},
          aboveTabletop:{type:'two-panel bypass sliding doors',openState:'left panel shifted right',reason:'avoids monitor collision'},
        },
      },
    },
  },
  worktop:{
    shape:'single adjustable west workstation running to the south wall',
    depthMm:762,
    depthsMm:{west:762},
    sourceLabels:{depth:'30 in adjustable west',height:'west 29–47.6 in adjustable, 33 in seated preset'},
    start:'after the north-wall cabinet with movement clearance',
    secondLegWall:null,
    legs:{west:'2268 mm custom independent electric sit-stand top'},
    westAdjustable:{frame:'FLEXISPOT electric sit-stand base',widthMm:2268,depthMm:762,topThicknessMm:25,minHeightMm:737,maxHeightMm:1209,defaultHeightMm:838,seatedPresetMm:838,parapetPresetMm:991,standingPresetMm:1041,capacityKg:70,noiseDbMax:50,supportedTopWidthMm:[1000,1600],supportedTopDepthMm:[500,800],frameSpanMm:1290,frameOffsetSouthMm:152,footDepthMm:229,northEndOverhangMm:641,southEndOverhangMm:337,customBeyondRatedWidth:true,southClearanceMm:0,frameConcealment:'both feet align with full-depth cabinet through-slots so the complete desk can slide out and back in'},
    southFixed:{present:false,reason:'removed so the adjustable west tabletop can continue to the south wall'},
    underCounterCabinet:{present:false,walls:[],reason:'south wall remains fully open'},
    rearCabinet:{wall:'west',widthMm:2268,depthMm:305,topHeightMm:680,toeClearanceMm:80,bayCount:3,nominalBayWidthMm:756,northLegPocketWidthMm:229,legRemovalSlotWidthMm:120,centerClampChaseWidthMm:716,centerClampChaseDepthMm:152,centerClampChaseDropMm:140,openBays:['north ventilated PC tower bay with recessed desk-foot through-slot','centre printer pull-out bay below continuous rear monitor-clamp chase','south general-storage bay with desk-foot through-slot'],printerShelf:{widthMm:726,depthMm:280,thicknessMm:25},placement:'uniform 12-inch-deep cabinet aligned with the west desktop from its north edge to the south wall',access:'east-facing fronts toward the seated user; opening the north and south doors exposes aligned full-depth desk-foot slots',reason:'keeps storage while allowing the complete sit-stand desk to slide out for installation or service'},
    pending:[],
  },
  equipment:{
    monitorStand:{type:'dual arm',placement:'west-side worktop above the centre cabinet bay',screensFace:'east toward person',shiftLeftMm:152.4,clampDropMm:140,clampClearanceDepthMm:152,clampTravelWidthMm:716,clearanceNote:'continuous rear channel across the centre bay lets the clamp knob move south while travelling through the full sit-stand range'},
    monitors:[
      {side:'right',make:'Lenovo',model:'D32qc-20 D-Series',diagonalInches:31.5,resolution:'2560 x 1440 QHD',physicalShape:'curved',shape:'flat',widthMm:709.7,depthWithStandMm:237,heightWithStandMm:527.2,vesaMm:'100 x 100',position:'north-most',renderNote:'shown as a simple straight monitor by owner request'},
      {side:'left',make:'BenQ',model:'GW2490',diagonalInches:23.8,marketingSize:'24 inch',resolution:'1920 x 1080 FHD',refreshHz:100,shape:'flat',widthMm:540,depthWithStandMm:182,heightWithStandMm:408,headDepthMm:61,headWeightKg:3.54,vesaMm:'100 x 100',position:'immediately south of Lenovo display'},
    ],
    laptop:{widthMm:356,depthMm:229,sourceLabel:'14 x 9 in',position:'open on the left/south side of the west desktop'},
    inventory:[
      {id:'desk-frame',category:'Desk frame',make:'FLEXISPOT',model:'Electric sit-stand frame',dimensions:'1290 mm frame span; 229 mm foot depth; 737-1209 mm working height range',location:'beneath the west adjustable desktop; both feet align with cabinet through-slots',status:'modelled for slide-out installation; verify actual foot and column envelope before fabrication'},
      {id:'desktop',category:'Desktop',make:'Custom',model:'West adjustable top',dimensions:'2268 W x 762 D x 25 T mm',location:'west wall workstation from north cabinet to south wall',status:'modelled; exceeds frame maker stated 1600 mm top limit'},
      {id:'monitor-lenovo',category:'Monitor',make:'Lenovo',model:'D32qc-20 D-Series curved QHD',dimensions:'31.5 in diagonal; 709.7 W x 527.2 H x 237 D mm with stand; VESA 100 x 100 mm',location:'right / north position on dual arm',status:'modelled'},
      {id:'monitor-benq',category:'Monitor',make:'BenQ',model:'GW2490 FHD IPS 100 Hz',dimensions:'23.8 in panel; 540 W x 408 H x 182 D mm with stand; VESA 100 x 100 mm',location:'left / south position on dual arm',status:'modelled'},
      {id:'monitor-arm',category:'Monitor arm',make:'Not specified',model:'Dual monitor stand',dimensions:'for Lenovo 31.5 in + BenQ 23.8 in displays; 140 mm clamp drop',location:'west desktop above a 152 D x 716 W mm rear clearance channel across the centre bay',status:'modelled with southward adjustment range; verify clamp envelope and per-arm size and weight rating'},
      {id:'pc-tower',category:'PC tower',make:'Ant Esports',model:'711 Air Mesh ARGB E-ATX Mid Tower',dimensions:'410 D x 216 W x 489 H mm',location:'proposed ventilated north bay in rear cabinet, rotated sideways',status:'proposed position modelled'},
      {id:'printer',category:'Printer',make:'HP',model:'DeskJet Ink Advantage 4645 / B4L10B',dimensions:'446 W x 332 D x 189 H mm',location:'centre bay on full-extension pull-out shelf',status:'proposed position modelled'},
      {id:'laptop',category:'Laptop',make:'Not specified',model:'14 x 9 inch laptop',dimensions:'356 W x 229 D mm footprint',location:'open on the left / south side of the west desktop',status:'modelled with display open'},
      {id:'water-heater',category:'Water heater',make:'Existing',model:'Wall-mounted storage heater',dimensions:'provisional 360 diameter x 500 H mm; verify on site',location:'northwest bay of the 16-inch-deep north upper cabinet',status:'existing item modelled provisionally; retain service access, ventilation and plumbing clearances'},
      {id:'router',category:'Wi-Fi router',make:'Not specified',model:'Router with three straight external antennas',dimensions:'provisional 240 W x 180 D x 50 H mm; three 14 W x 20 H mm grommeted slots; verify selected model',location:'raised ventilated shelf in northeast upper bay, with straight antennas projecting through east side panel',status:'proposed position modelled; isolated from heater by solid divider'},
    ],
  },
  electrical:{
    status:'preliminary layout for licensed electrician and site verification',
    existingPoints:[
      {id:'heater-existing',location:'water-heater service area',outlets:1,rating:'verify dedicated 16 A point and accessible double-pole isolator',circuit:'dedicated heater circuit; do not share with office electronics'},
      {id:'router-existing',location:'northeast router bay',outlets:1,rating:'existing earthed socket; verify rating and condition',circuit:'office electronics circuit'},
    ],
    newFixedPoints:[
      {id:'desk-feed',location:'centre cabinet, high rear service zone',outlets:1,rating:'6/16 A three-pin earthed socket',use:'feeds the moving eight-outlet under-desk power rail through a flexible service loop'},
      {id:'pc-ups',location:'north PC/UPS bay',outlets:2,rating:'two 6 A three-pin earthed sockets',use:'PC or UPS plus one service/spare outlet'},
      {id:'printer',location:'centre printer bay',outlets:1,rating:'6 A three-pin earthed socket',use:'printer'},
    ],
    movingDeskPower:{outlets:8,mount:'metal power rail secured beneath the moving desktop',loads:['Lenovo monitor','BenQ monitor','laptop charger','dock','iPhone/Apple Watch charger','sit-stand desk motor'],spares:2,feed:'single flexible service loop from the fixed centre-cabinet desk-feed point'},
    data:{cat6Runs:2,route:'router bay rear chase to desk dock; one active plus one spare',separation:'route separately from mains and cross mains only at right angles'},
    protection:{domesticRcdMaxMa:30,sockets:'three-pin with permanent effective earth; BIS-certified to IS 1293:2019',circuits:'retain a dedicated heater circuit; put office electronics on a separately protected circuit',verification:'licensed electrician to confirm existing wiring, earthing, RCD/RCBO, breaker and conductor sizing, polarity, insulation resistance and earth-fault loop impedance before energising'},
    totals:{existingFixedOutlets:2,newFixedOutlets:4,movingDeskOutlets:8,simultaneousEquipmentPlugs:10,spareEquipmentOutlets:2},
  },
  referenceFigure:{heightMm:1702,sourceLabel:'5 ft 7 in',defaultVisible:false,model:'Khronos RiggedFigure',faces:'west toward monitors'},
}
