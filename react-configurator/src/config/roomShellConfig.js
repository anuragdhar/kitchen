export const EMPTY_ROOM_SHELLS={
  bedroom1:{
    name:'Bedroom 1',widthMm:3353,lengthMm:3240,heightMm:2700,color:'#9f7aea',source:'A501 floor plan',
    wallOpenings:{east:{fromMm:0,toMm:2200}},
    balconyExtension:{
      wall:'east',depthMm:1200,lengthMm:2200,railingHeightMm:1000,frameStyle:'aluminium',
      // doors:'sliding' (2026-10-05, src/domain/bedroom1Layout.mjs): hinged 600 mm leaves were assumed until the window AC below
      // was placed 217 mm in front of the east half; the east leaf then opened only 41 degrees. Two sliding panels need no swing.
      // The body is drawn 208 mm deeper than the balcony (into the Pooja wall): not verified on site.
      poojaWallWardrobe:{widthMm:1200,depthMm:508,heightMm:2700,northShiftMm:300,doorCount:2,doors:'sliding',opensTo:'Bedroom 1 balcony'},
      furniture:{
        table:{centerFromBedroomWallMm:1000,centerFromNorthMm:500,widthMm:700,depthMm:350,heightMm:740},
        chair:{centerFromBedroomWallMm:540,centerFromNorthMm:500,widthMm:440,depthMm:400,seatHeightMm:450,backHeightMm:860,facing:'east'},
      },
      // Owner 2026-10-05: the 1.5 ton WINDOW AC the owner already has goes in the balcony's east side, on an iron frame fixed
      // to the wall, at the owner's plan mark (plan x 261-282, y 703-733). Millimetres; the balcony frame is the room's: z from
      // the north wall, heights above the floor. It sits on top of the 1 m parapet, in the glazing, its front `insideMm` into
      // the balcony and the rest outside, where its side louvres must be. centerFromNorthMm comes from the mark (y 718 of
      // 612-794 over the 3240 mm room length). The casing size is TYPICAL for a 1.5 ton window AC: measure the real one.
      windowAc:{status:'unit owned by the owner; position proposed 2026-10-05, not measured',tons:1.5,
        widthMm:660,heightMm:430,depthMm:700,insideMm:250,centerFromNorthMm:1353,bottomMm:1000,weightKg:50,
        mark:{x1:261,y1:703,x2:282,y2:733},support:'welded iron angle frame fixed to the wall, sloping slightly outward so water drains out'},
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
    // The plan labels the two adjacent south projections as 1925 and 2383 mm. Phone scan 2026-10-04
    // (docs/SITE_SCAN_2026-10-04_BEDROOM3.md; room scanned 3915 x 3665, ceiling 2770; the box above is NOT changed):
    //  cabinet   the existing olive-green wardrobe that fills the bay, its doors flush with the south wall line:
    //            x 365-1905, about 2450 high with lofts (was 0-1771 x 2400, scaled from the plan). Its depth is hidden.
    //  balcony   door 2005-2705 (700 clear) with a top light above a transom at 2040; window 2785-3705 (920), sill 920,
    //            mid rail 1350, transom 1910, head 2360 (was door 1771 + 1000 x 2200, window 2771 + 1192, sill 900 / 2200).
    //            The wall east of the window (3705-3963) is solid. Balcony depth beyond the glass was not scanned.
    //            doorTransomMm / windowTransomMm / windowRailsMm are read by src/domain/windowDesign.mjs.
    southExtension:{
      cabinet:{fromWestMm:365,widthMm:1540,depthMm:610,heightMm:2450,floorClearanceMm:100,source:'phone scan 2026-10-04'},
      balcony:{fromWestMm:1905,widthMm:2058,depthMm:1200,railingHeightMm:1050,
        doorFromWestMm:2005,doorWidthMm:700,doorHeightMm:2360,doorTransomMm:2040,
        windowFromWestMm:2785,windowWidthMm:920,windowSillMm:920,windowTopMm:2360,windowTransomMm:1910,windowRailsMm:[1350],
        source:'phone scan 2026-10-04'},
    },
    // Existing items seen in the phone scan (2026-10-04), recorded for the design check; NOT drawn, because the owner's
    // east cabinetry replaces the corner cupboard and encloses the AC. Same frame: x east, z south, mm.
    existing:{
      northEastCupboard:{fromWestMm:3273,widthMm:690,fromNorthMm:0,lengthMm:970,heightMm:1990,doorsFace:'west'},
      acUnit:{wall:'east',fromNorthMm:1348,widthMm:930,bottomMm:2280,topMm:2600,depthMm:200},
    },
    furniture:{
      bed:{lengthMm:1829,widthMm:1829,headWall:'east',centerFromNorthMm:1863},
      // Owner 2026-10-04: low honey-oak chest opposite the bed; width runs along z.
      westChest:{wall:'west',fromNorthMm:1163,widthMm:1400,depthMm:450,heightMm:800,panelMm:18,plinthMm:80,drawerRows:3,drawerColumns:2,
        // The room shell straddles x=0 by 50 mm; mount the frame on its inner face.
        artwork:{widthMm:1100,heightMm:700,depthMm:30,bottomMm:1050,frameMm:20,wallOffsetMm:50}},
      // Owner 2026-10-03: replace west run with east bedside cabinetry, existing honey oak.
      // All mm; x east from west wall, z south from north wall, y up. Depth includes fronts.
      // 18 inches = 457.2 mm. North/south setbacks keep cabinetry off the opening wall planes.
      eastCabinet:{wall:'east',depthMm:457.2,panelMm:18,
        north:{fromNorthMm:150,widthMm:750,heightMm:2200,mirrorBottomMm:580,mirrorTopMm:2130},
        south:{fromNorthMm:2826,widthMm:750,heightMm:600,drawerCount:2},
        bridge:{fromNorthMm:150,widthMm:3426,bottomMm:2200,heightMm:450,doorCount:4},
        ac:{centerFromNorthMm:1863,bayWidthMm:1200,slatHeightMm:18,slatGapMm:18,
          unitWidthMm:1000,unitHeightMm:280,unitDepthMm:230,bottomMm:2280,wallGapMm:25},
        shelf:{fromNorthMm:900,widthMm:1926,depthMm:250,heightMm:1650},
      },
    },
    doors:[
      // Phone scan 2026-10-04: frame against the west wall, clear opening about 125-895; the head could not be read
      // (clothes hang on the leaf), so this entry is unchanged. The leaf sits 90 mm back in its reveal.
      {wall:'north',fromMm:0,widthMm:900,heightMm:2100,leadsTo:'Bedroom 3'},
      // Phone scan 2026-10-04: jambs 2525 and 3305 (780 clear), head 2000; was 2850 + 700 x 2100 from the plan.
      // The existing corner cupboard (existing.northEastCupboard) stands immediately east of the frame.
      {wall:'north',fromMm:2525,widthMm:780,heightMm:2000,leadsTo:'Bedroom 3 toilet',opensIntoToilet:true,source:'phone scan 2026-10-04'},
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
      // Phone scan 2026-10-04: the toilet door is 605 mm clear between its jambs, 1060-1665 from the west (was 1000 + 900).
      {wall:'south',fromMm:1060,widthMm:605,heightMm:2100,leadsTo:'Toilet',source:'phone scan 2026-10-04'},
      // PLANNED position (owner 2026-10-04): civil work moves this door here. Today's door is about 2580-3530 from the west
      // (phone scan), and the lobby switchboard (415-615 from the west, 1215-1495 high) is on this stretch and has to move.
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
      // Wall-hung again (2026-10-03): the wall behind it now backs the closed east cabinet of the entry pocket. Moved east from
      // x 500 so it clears the west cabinet's door (room.wallStorage, x 80-680) by 120 mm.
      routerCabinet:{fromWestMm:800,widthMm:1100,bottomMm:1450,heightMm:650,depthMm:250,panelMm:18,
        router:{widthMm:260,heightMm:45,depthMm:190,antennaMm:230},
        landline:{widthMm:140,heightMm:110,depthMm:140},intercom:{widthMm:130,heightMm:230,depthMm:35}},
    },
    // Layout "C" (owner, 2026-10-03; the default): the former north-wall sofa moves to the SOUTH wall, back against the wall under
    // the window, facing north; the west sofa slides south to meet it in an L in the south-west corner; the coffee table sits
    // inside the L; the TV is wall-mounted on the NORTH wall, on the free stretch between the west cabinet door (wallStorage,
    // x 80-680) and the entry door (x 2150). Nothing stands in front of the west cabinet door any more. Sofas keep 880 x 2250.
    // Owner, later 2026-10-03: the south sofa moves 450 mm east and a small lamp table stands at its west end, in the corner
    // (cornerTable); the east-wall router cabinet is removed and the router, landline and intercom go in the TV console.
    southLayout:{
      furniture:{
        southSofa:{centerXmm:1605,centerZmm:4835,widthMm:880,lengthMm:2250},
        westSofa:{centerXmm:580,centerZmm:3220,widthMm:880,lengthMm:2250},
        coffeeTable:{centerXmm:1745,centerZmm:3425,widthMm:600,lengthMm:1100},
        rug:{centerXmm:1500,centerZmm:3585,widthMm:2100,lengthMm:2500},
        // Round lamp table in the south-west corner, between the west wall and the south sofa's west arm.
        cornerTable:{centerXmm:255,centerZmm:4835,diameterMm:400,heightMm:550},
      },
      // Flat on the wall, centred on the free stretch (x 680-2150). The TV centre is at seated eye height; both sizes are listed
      // as in B2 (the owner has a 55-inch now and may fit a 65-inch later). 65 inches is the widest that fits the stretch: it
      // leaves only about 10 mm to each door opening (the 55-inch leaves 120 mm).
      tv:{centerFromWestMm:1415,centerHeightMm:1150,mountMm:35,installedTv:'55',
        tvs:{'55':{diagonalInches:55,widthMm:1230,heightMm:710,depthMm:45},'65':{diagonalInches:65,widthMm:1450,heightMm:830,depthMm:55}}},
      // TV cabinet below the TV (owner, 2026-10-03): a wall-hung low console, centred under the TV, clear of the west cabinet
      // door and the entry door frame by 85 mm each. It holds everything that used to be in the east-wall cabinet:
      //  west bay   the Wi-Fi router behind an open lattice (the signal and its heat get out), routerBayMm wide;
      //  middle     storage behind a lattice door: set-top box, remotes, media;
      //  east bay   the Bass Module 500 behind an open lattice (a closed door would muffle it), moduleBayMm wide;
      //  top        Soundbar 300 centred under the TV, the landline at the west end, a desk intercom at the east end.
      // The device sizes are cornerLayout.routerCabinet's router, landline and intercom.
      // Owner, later 2026-10-03 (third change that day): ONE piece again, shorter than wall to wall, not reaching the west wall,
      // and allowed to overlap the hidden west cabinet door a little (wall to wall with a loose end module was tried and
      // dropped: "no need to break the lower cabinet"). It is free-standing on legs with glides, against the wall panelling, so
      // the whole console can be dragged straight out (dragOutMm) before the door is opened outward; the cables behind it need
      // that much slack. Used rarely, so this is acceptable to the owner.
      console:{fromWestMm:500,lengthMm:1600,depthMm:400,heightMm:400,bottomMm:200,panelMm:18,backMm:12,routerBayMm:420,moduleBayMm:420,dragOutMm:600,legMm:35},
      // Fluted wall panelling behind the TV (owner, later 2026-10-03: "apply the same cabinet, same colour as the door, in the
      // door height, and maybe some design"). It runs from the west wall to the entry door frame, from the floor up
      // to the door head, with a vertical groove every grooveMm. The grooves are set out from the hidden door's west edge, so
      // both door edges fall on a groove and the door is just five more slats. A slim cap with a warm light strip closes the
      // top. The door leaf takes this colour, thickness and groove spacing (DrawingRoomWallStorage.js). Colour is a proposal.
      wallPanel:{fromWestMm:40,toMm:2100,bottomMm:0,thicknessMm:18,grooveMm:100,grooveWidthMm:5,color:'#a47a52',grooveColor:'#5b3d27',cap:{heightMm:25,projectionMm:45}},
      soundbar:{model:'Bose Smart Soundbar 300',widthMm:699,heightMm:58,depthMm:102,frontSetbackMm:60},
      bassModule:{model:'Bose Bass Module 500',widthMm:254,heightMm:254,depthMm:241},
    },
    // The northeast corner of this wall backs Bedroom 1's northEastRecessWardrobe
    // (roomShellConfig.js bedroom1.furniture), not a door into Drawing Room -
    // confirmed against the owner's own floor-plan mark (owner feedback 2026-09-29).
    // The owner says this door opens INTO the Drawing Room (2026-09-30), although the floor-plan drawing shows the swing on the
    // entry side. The owner also confirmed (2026-09-30) that the north-wall sofa does not touch the door. Working backwards from
    // that: the sofa (x 30-2280, z 60-940) clears the swing only if the hinge is on the EAST jamb (as the plan draws it) and the
    // leaf is about 855 mm wide or less, so those are recorded here. hingeKnown means the hinge side is settled (inferred, not
    // measured); leafMm is a working value: measure the real leaf on site. With hingeKnown false every check tests both sides.
    doors:[{wall:'north',fromMm:2150,widthMm:1000,heightMm:2100,leadsTo:'Main entry',opensInto:'Drawing Room',hinge:'east',hingeKnown:true,leafMm:850}],
    // The WEST cabinet of the entry-side pocket behind this wall (owner 2026-10-03, matching the Blender model; ENTRY.wallCavity
    // and docs/ENTRY_WALL_CAVITY.md). The pocket is two separate cabinets: the east one opens onto the Entry gallery, this one is
    // reached from the Drawing Room through a two-leaf door at the extreme west end of the north wall. It replaces the
    // 2026-09-30 wide opening above the north sofa (x 200-2050), which would have opened into the east cabinet too.
    // fromWestMm/widthMm/bottomMm/heightMm: the door opening through the wall (Blender plan x 653-684, 2100 high).
    // cabinet: the closet behind it, from the outer wall to the partition (plan x 688-650) less the drawn wall faces.
    // depthMm: from the Drawing Room face to the back of the pocket (the 221 mm wall plus the 925 mm pocket less a 40 mm skin).
    // shelves: Blender shelf board heights, 380 mm deep against the back (plan y 754-773). Same in every layout (it is part of
    // the building), but the north sofa (layouts B, B2, B3) and the TV cabinet (layout A) stand in front of the doors: see
    // checkWallStorage().blockedBy. Not confirmed on site: that the pocket is hollow and the 9-inch wall may be opened.
    // opens:'inward' (owner 2026-10-03): opened about twice a year for winter clothes and the like, so the two leaves swing INTO
    // the closet and never sweep the room.
    // Owner, later 2026-10-03: HIDDEN and as narrow as a person can just walk through (the owner: 5 ft 7 in, 80 kg); the closet
    // behind stays full size. One flush leaf with no handle or visible frame (`concealed`: painted as the wall, push latch),
    // 500 x 1800, inside the Blender door position (was two leaves, 600 x 2100 at x 80-680). It now opens OUTWARD into the
    // room (owner, later still: the console module is moved first anyway), hinged on the west edge, so the leaf leaves the
    // opening and the clear way through is widthMm - stopMm = 490 mm. `access` holds the person it is sized
    // for; shoulderMm and bodyDepthMm are typical figures for that height and weight, not measured. In layout C the door
    // hides in the fluted wall panelling and the TV console overlaps its east edge a little; the console is dragged out first.
    wallStorage:{fromWestMm:100,widthMm:500,bottomMm:0,heightMm:1800,doorCount:1,opens:'outward',concealed:true,leafThicknessMm:40,stopMm:10,
      access:{personHeightMm:1702,personKg:80,shoulderMm:470,bodyDepthMm:300,headroomMm:50},
      cabinet:{fromWestMm:40,widthMm:650},depthMm:1105,panelMm:18,
      shelves:{depthMm:380,heightsMm:[120,550,1000,1450,1900,2350]}},
    // Phone scan 2026-10-04 (docs/SITE_SCAN_2026-10-04.md): the frame runs 233-2933 from the west wall, sill 935, head 2430,
    // in three bays (mullions at 1167 and 2067) with a row of top lights above about 2040. Was 471 + 2298, sill 550, head 2100,
    // from a screenshot. The scanned room is 3150 wide, not 3353 (widthMm is NOT changed until taped), so in this model the
    // window stands 420 mm off the east wall where the real one stands 217 mm off it.
    // Design (work-plan tasks carp-window-centre, window-wood-finish, window-mosquito-net, window-outside-chick; open items
    // A10, B6, C19, C20; docs/changes/2026-10-04-bedroom3-windows.md). Read by src/domain/windowDesign.mjs:
    //  transomMm      the fixed top band starts here (scan: about 2040; the owner says the band is about 1 ft = 305 high)
    //  bays           west to east; the centre bay was fixed and gets two outward shutters like the side bays (B5)
    //  rollerNet      roller mosquito net per section on the room side, cassette under the transom (decided; C19 proposal: top)
    //  outsideScreen  roll-up bamboo chick 85 mm off the wall, the roll parked in front of the top band (docs/drawings/south-window-chick-cord.png)
    //  frameStyle     'wood' with frameColor = the TV panel wall colour (C19 proposal; the shade is not decided)
    windows:[{wall:'south',fromMm:233,widthMm:2700,bottomMm:935,topMm:2430,frameStyle:'wood',frameColor:'#a47a52',mullionFractions:[.346,.679],source:'phone scan 2026-10-04',
      transomMm:2040,bays:[{shutters:2},{shutters:2,wasFixed:true},{shutters:2}],shutters:{opens:'outward'},
      rollerNet:{perBay:true,cassette:'top',cassetteMm:45,side:'room'},
      outsideScreen:{kind:'bamboo chick',rollDiameterMm:100,offsetMm:85,widthMm:2500,dropMm:1700}}],
  },
  kitchenShell:{name:'Kitchen shell',widthMm:2324,lengthMm:3070,heightMm:2700,color:'#b45309',source:'A501 floor plan'},
}
