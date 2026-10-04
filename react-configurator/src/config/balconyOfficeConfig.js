// Balcony office dimensions captured from the owner. Millimetres are the working CAD units.
export const BALCONY_DESK_HEIGHT_KEY='balcony-office-desk-height-mm'
export const BALCONY_OFFICE={
  name:'Balcony home office',
  // The balcony is on the WEST side of the Study (A501 plan: Study x 255-424, balcony x 424-496, east is plan-left) and
  // opens into it through its east side; the phone scan of 2026-10-04 agrees. The earlier 'east side' label was wrong.
  location:'West side of the proposed study (existing Bedroom 2); opens into it through the balcony\'s east side',
  orientation:{north:'plan up',east:'plan right',south:'plan down',west:'plan left'},
  dimensions:{
    widthMm:1200,
    lengthMm:2623,
    floorToCeilingMm:2642,
    sourceLabels:{width:'3 ft 11 in',length:'8 ft 7 in',floorToCeiling:'8 ft 8 in'},
  },
  // Phone scan of 2026-10-04 (docs/SITE_SCAN_2026-10-04_HOME_OFFICE.md), recorded only: the room box above stays on the
  // A501 plan figures until it is taped (work-plan/OPEN_ITEMS.md A15). Clear sizes between finished wall faces.
  survey:{source:'phone scan 2026-10-04, +/- 30-50 mm on room sizes',lengthMm:2460,clearWidthToBeamMm:1065,widthToOpeningEastFaceMm:1320,ceilingMm:2680,
    studyOpening:{fromNorthMm:0,widthMm:1830,headMm:2440,beamWidthMm:250},southEastColumn:{fromWestMm:785,fromNorthMm:2190,toWestMm:1060,toNorthMm:2460},
    existingDesk:{fromNorthMm:250,toNorthMm:1430,depthMm:790,topHeightMm:840}},
  envelope:{
    windowWalls:['south','west'],
    lowerBrickParapetMm:991,
    windowBandMm:1346,
    upperBrickBandMm:305,
    sourceLabels:{lowerBrickParapet:'3 ft 3 in',windowBand:'4 ft 5 in',upperBrickBand:'1 ft'},
  },
  access:{from:'study',side:'east'},
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
  // West workstation (owner, 2026-10-04: "we can't have this much long table ... let's fix some of the south corner of
  // this table as fixed ... keep [a gap of] one inch"). Positions are computed in src/domain/balconyDesk.mjs: the fixed
  // section sits in the south corner, the sit-stand top north of it, both set `wallClearanceMm` out from the west wall.
  // Everything marked "owner default" was chosen without asking and can be changed here; the layout and the clearance
  // check (checkBalconyDesk) follow.
  worktop:{
    shape:'west workstation: fixed section in the south corner, shorter sit-stand top north of it, one-inch gap between',
    depthMm:762,
    depthsMm:{west:762},
    sourceLabels:{depth:'30 in, both sections',height:'sit-stand 29–47.6 in with a 33 in seated preset; fixed section 33 in'},
    start:'after the north-wall cabinet with movement clearance',
    // One inch between the moving top and everything it passes: the fixed section and the west wall (owner, 2026-10-04).
    movingGapMm:25,
    secondLegWall:null,
    legs:{west:'1500 mm electric sit-stand top, 25 mm gap, 743 mm fixed south section'},
    westAdjustable:{frame:'FLEXISPOT electric sit-stand base',
      // Owner default: 1500 mm is inside the frame maker's 1000-1600 mm top range and still takes both monitors on the one
      // arm (about 1300 mm together) with a hand's width beside them. The fixed section takes the rest of the run.
      widthMm:1500,depthMm:762,topThicknessMm:25,minHeightMm:737,maxHeightMm:1209,defaultHeightMm:838,seatedPresetMm:838,parapetPresetMm:991,standingPresetMm:1041,capacityKg:70,noiseDbMax:50,supportedTopWidthMm:[1000,1600],supportedTopDepthMm:[500,800],
      // Frame centred on the top: 105 mm overhang at each end, so the foot pocket and slot stay inside the cabinet end panels.
      frameSpanMm:1290,frameOffsetSouthMm:0,frameBeamDepthMm:75,footDepthMm:229,northEndOverhangMm:105,southEndOverhangMm:105,customBeyondRatedWidth:false,
      southClearanceMm:25,wallClearanceMm:25,
      frameConcealment:'both feet align with full-depth cabinet through-slots so the complete desk can slide out and back in'},
    southFixed:{present:true,
      // Owner defaults: length = the run left after the sit-stand top and the gap (2623 - 355 - 1500 - 25); top level with
      // the seated preset so the two read as one surface when seated; a full-depth cabinet below for the printer and files.
      lengthMm:743,depthMm:762,topThicknessMm:25,topHeightMm:838,levelWith:'seatedPreset',gapToAdjustableMm:25,
      // Bypass sliders, not a hinged door: the scan puts a wall about 1060 from the west wall south of the opening and a column
      // at 785 in the corner, so there is only about 270 mm of floor in front of this cabinet (OPEN_ITEMS A17).
      under:{type:'full-depth cabinet with two-panel bypass sliding doors, east-facing',toeClearanceMm:80,doors:{type:'two-panel bypass sliding doors',openState:'north panel shifted south'},
        printerShelf:{widthMm:700,depthMm:450,thicknessMm:25,heightAboveBottomMm:10,runners:'fixed shelf by default; full-extension runners only if the taped clearance in front allows'},
        shelfHeightsMm:[460]},
      use:'laptop and papers on top at seated height; printer on a pull-out shelf and general storage below',
      reason:'the single 2268 mm top was too long (owner 2026-10-04); the south corner becomes fixed. Its length absorbs the room-length question in the site scan: cut on site'},
    underCounterCabinet:{present:true,walls:['west'],location:'below the fixed south section only; the sit-stand run keeps its low rear cabinet',reason:'storage under the part of the desk that no longer moves'},
    // Two bays (owner default): the north one takes the PC tower beside the foot pocket, the south one the clamp chase
    // and the south foot slot. The divider sits at 720 so the monitor clamp pad keeps its inch from it at the lowest height.
    rearCabinet:{wall:'west',widthMm:1500,depthMm:305,topHeightMm:680,toeClearanceMm:80,bayCount:2,bayLengthsMm:[720,780],nominalBayWidthMm:750,clampChaseBay:1,northLegPocketWidthMm:150,legRemovalSlotWidthMm:120,centerClampChaseWidthMm:740,centerClampChaseDepthMm:152,centerClampChaseDropMm:140,
      openBays:['north ventilated PC tower bay with the north desk-foot through-slot','south bay with the continuous rear monitor-clamp chase, the south desk-foot through-slot and general storage'],
      topRail:'open between the two desk-foot slots (the frame beam travels there at low desk heights); the 40 mm front tie and the bay divider carry the top, and the divider stops 25 mm under the beam at the lowest height',
      placement:'uniform 12-inch-deep cabinet under the sit-stand top, aligned with its north edge',access:'east-facing fronts toward the seated user; opening the doors exposes aligned full-depth desk-foot slots',reason:'keeps storage while allowing the complete sit-stand desk to slide out for installation or service'},
    pending:[],
  },
  equipment:{
    monitorStand:{type:'dual arm',placement:'sit-stand top, clamp over the south cabinet bay',screensFace:'east toward person',shiftLeftMm:152.4,clampDropMm:140,clampClearanceDepthMm:152,clampTravelWidthMm:740,clearanceNote:'continuous rear channel across the south bay lets the clamp knob move south while travelling through the full sit-stand range'},
    monitors:[
      {side:'right',make:'Lenovo',model:'D32qc-20 D-Series',diagonalInches:31.5,resolution:'2560 x 1440 QHD',physicalShape:'curved',shape:'flat',widthMm:709.7,depthWithStandMm:237,heightWithStandMm:527.2,vesaMm:'100 x 100',position:'north-most',renderNote:'shown as a simple straight monitor by owner request'},
      {side:'left',make:'BenQ',model:'GW2490',diagonalInches:23.8,marketingSize:'24 inch',resolution:'1920 x 1080 FHD',refreshHz:100,shape:'flat',widthMm:540,depthWithStandMm:182,heightWithStandMm:408,headDepthMm:61,headWeightKg:3.54,vesaMm:'100 x 100',position:'immediately south of Lenovo display'},
    ],
    laptop:{widthMm:356,depthMm:229,sourceLabel:'14 x 9 in',position:'open on the fixed south section, beside the sit-stand top'},
    pcTower:{widthMm:216,heightMm:489,depthMm:410},
    printer:{widthMm:446,depthMm:332,heightMm:189},
    inventory:[
      {id:'desk-frame',category:'Desk frame',make:'FLEXISPOT',model:'Electric sit-stand frame',dimensions:'1290 mm frame span; 229 mm foot depth; 737-1209 mm working height range',location:'beneath the sit-stand top; both feet align with cabinet through-slots',status:'modelled for slide-out installation; verify actual foot and column envelope before fabrication'},
      {id:'desktop',category:'Desktop',make:'Custom',model:'West sit-stand top',dimensions:'1500 W x 762 D x 25 T mm',location:'west wall, north of the fixed section with a 25 mm gap',status:'modelled; inside the frame maker stated 1000-1600 mm top range'},
      {id:'fixed-top',category:'Desktop',make:'Custom',model:'Fixed south section with cabinet',dimensions:'743 W x 762 D x 25 T mm top at 838 mm; cabinet below to the floor',location:'south corner of the west wall',status:'modelled; length to be cut on site (scan says the room is about 160 mm shorter than the plan)'},
      {id:'monitor-lenovo',category:'Monitor',make:'Lenovo',model:'D32qc-20 D-Series curved QHD',dimensions:'31.5 in diagonal; 709.7 W x 527.2 H x 237 D mm with stand; VESA 100 x 100 mm',location:'right / north position on dual arm',status:'modelled'},
      {id:'monitor-benq',category:'Monitor',make:'BenQ',model:'GW2490 FHD IPS 100 Hz',dimensions:'23.8 in panel; 540 W x 408 H x 182 D mm with stand; VESA 100 x 100 mm',location:'left / south position on dual arm',status:'modelled'},
      {id:'monitor-arm',category:'Monitor arm',make:'Not specified',model:'Dual monitor stand',dimensions:'for Lenovo 31.5 in + BenQ 23.8 in displays; 140 mm clamp drop',location:'sit-stand top above a 152 D x 740 W mm rear clearance channel across the south bay',status:'modelled with southward adjustment range; verify clamp envelope and per-arm size and weight rating'},
      {id:'pc-tower',category:'PC tower',make:'Ant Esports',model:'711 Air Mesh ARGB E-ATX Mid Tower',dimensions:'410 D x 216 W x 489 H mm',location:'proposed ventilated north bay in rear cabinet, rotated sideways',status:'proposed position modelled'},
      {id:'printer',category:'Printer',make:'HP',model:'DeskJet Ink Advantage 4645 / B4L10B',dimensions:'446 W x 332 D x 189 H mm',location:'full-extension pull-out shelf in the fixed south-section cabinet',status:'proposed position modelled'},
      {id:'laptop',category:'Laptop',make:'Not specified',model:'14 x 9 inch laptop',dimensions:'356 W x 229 D mm footprint',location:'open on the fixed south section at seated height',status:'modelled with display open'},
      {id:'water-heater',category:'Water heater',make:'Existing',model:'Wall-mounted storage heater',dimensions:'phone scan 2026-10-04: about 350 diameter x 450-500 H mm, 350 mm proud of the north wall, bottom about 2040 mm above the floor, centre about 425 mm from the west wall; tape before fabrication',location:'northwest bay of the 16-inch-deep north upper cabinet (the scan puts its west edge about 35 mm west of the bay side panel at 286 mm: see OPEN_ITEMS A16)',status:'existing item modelled provisionally; retain service access, ventilation and plumbing clearances'},
      {id:'router',category:'Wi-Fi router',make:'Not specified',model:'Router with three straight external antennas',dimensions:'provisional 240 W x 180 D x 50 H mm; three 14 W x 20 H mm grommeted slots; verify selected model',location:'raised ventilated shelf in northeast upper bay, with straight antennas projecting through east side panel',status:'proposed position modelled; isolated from heater by solid divider'},
    ],
  },
  electrical:{
    status:'preliminary layout for licensed electrician and site verification',
    existingPoints:[
      {id:'heater-existing',location:'water-heater service area',outlets:1,rating:'verify dedicated 16 A point and accessible double-pole isolator',circuit:'dedicated heater circuit; do not share with office electronics'},
      {id:'router-existing',location:'northeast router bay',outlets:1,rating:'existing earthed socket; verify rating and condition',circuit:'office electronics circuit'},
    ],
    // What the phone scan of 2026-10-04 shows on the walls today (+/- 20 mm; which plate is the heater's and which the
    // router's is not readable from the scan). Positions along the wall are from the west wall face; heights above the floor.
    scannedWallPoints:[
      {id:'X1',wall:'north',fromWestMm:[515,615],heightMm:[1730,1810],kind:'small plate, about 100 x 80 mm (switch or socket), near the heater'},
      {id:'X2',wall:'north',fromWestMm:[665,780],heightMm:[1730,1810],kind:'small plate, about 115 x 80 mm, beside X1'},
      {id:'X3',wall:'north',fromWestMm:[880,1100],heightMm:[1470,1560],kind:'larger plate, about 220 x 90 mm, two plugs in use, cables run down to the existing desk'},
    ],
    newFixedPoints:[
      {id:'desk-feed',location:'south bay of the rear cabinet, high rear service zone',outlets:1,rating:'6/16 A three-pin earthed socket',use:'feeds the moving eight-outlet under-desk power rail through a flexible service loop'},
      {id:'pc-ups',location:'north PC/UPS bay',outlets:2,rating:'two 6 A three-pin earthed sockets',use:'PC or UPS plus one service/spare outlet'},
      {id:'printer',location:'fixed south-section cabinet, behind the printer shelf',outlets:1,rating:'6 A three-pin earthed socket',use:'printer'},
    ],
    movingDeskPower:{outlets:8,mount:'metal power rail secured beneath the moving desktop',loads:['Lenovo monitor','BenQ monitor','laptop charger','dock','iPhone/Apple Watch charger','sit-stand desk motor'],spares:2,feed:'single flexible service loop from the fixed centre-cabinet desk-feed point'},
    data:{cat6Runs:2,route:'router bay rear chase to the south-bay service zone and the desk dock; one active plus one spare',separation:'route separately from mains and cross mains only at right angles'},
    protection:{domesticRcdMaxMa:30,sockets:'three-pin with permanent effective earth; BIS-certified to IS 1293:2019',circuits:'retain a dedicated heater circuit; put office electronics on a separately protected circuit',verification:'licensed electrician to confirm existing wiring, earthing, RCD/RCBO, breaker and conductor sizing, polarity, insulation resistance and earth-fault loop impedance before energising'},
    totals:{existingFixedOutlets:2,newFixedOutlets:4,movingDeskOutlets:8,simultaneousEquipmentPlugs:10,spareEquipmentOutlets:2},
  },
  referenceFigure:{heightMm:1702,sourceLabel:'5 ft 7 in',defaultVisible:false,model:'Khronos RiggedFigure',faces:'west toward monitors'},
}
