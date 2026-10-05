# Pooja doors and the taller Lobby cabinet — 2026-10-06

Owner's dictated request: “I'm thinking to make the cabinet that is on the east wall go to the top of the ceiling.” Door alternatives included “a single slider door which slides to left” and “fix the half door on the east”. Also: “Remember the platform below in the Pooja Ghar has storage space.”

The model now adds an upper cabinet and offers all four door options. The starting option is **east half fixed, west half sliding east in front of it** (`fixedEastSlideWest`). This is a proposal, not a recorded owner selection: the full-width west slider hits the north dining chair in the current layout. No room, opening, furniture or appliance position was moved.

## Before and after, in millimetres

The cabinet remains at z 650–2100 on the east wall, x 4593–4993: 1450 long and 400 deep. Its original 1000-high lower unit, three door bays, 600-wide centre bay, 950 × 300 pull-out ironing board, materials and toggle are unchanged. The new upper section runs from 1000 to **2670**, adding **1670** of height. Its three bays align with the lower 425 / 600 / 425 bays. The room ceiling remains 2700.

I chose a **PROPOSED 30 mm open scribe allowance** below the ceiling. It is not drawn as a solid filler: a solid filler would need a cut-out at the existing corner ring. The upper panel/door/handle details are proposals in config, using the lower unit's materials. `heightMm: 1000` still means the lower unit; the shared height helper gives 2670 for the full cabinet. AC tall-obstacle checks, the electrical model (through its shared `plannedBlockers` reader), review-plan label and budget estimate now use the full height. The estimate adds the upper cabinet's face area at the existing tall-cabinet rate; work-plan files were not regenerated.

L-E1 stays on the east wall at z 1375 and height 1250. It is now **proposed inside the centre upper bay, behind its door**. Its intentional hidden status and wording say this explicitly; the electrical check does not pretend it remains above a low cabinet. The centre door must be opened for access; cable routing and a reachable socket opening in the cabinet back still need agreement. L-E2 stays at z 350 and height 300; its wording now distinguishes the original bi-fold obstruction from the proposed half-slider.

The Pooja opening remains 1200 wide at x 3793–4993, 1000 deep, with its 190-high platform and 550-deep Lobby-facing storage drawer. The original door frame is 2240 high; the actual leaf panels run from 210 to 2140 above the Lobby page floor. Each option preserves that 20 mm clearance above the platform. Whole home retains its existing 77.5 mm floor offset, with leaf bottoms at 287.5 and platform top at 267.5. Sliding options have a top rail and **no floor track**. The fixed half also stops above the drawer. The drawer is checked for its full 550 mm pull-out toward the Lobby; no drawer animation was added.

## Door comparison

Rectangles below are the parked moving leaf's conservative outer bounds, including handles, in the room frame: x east from the west wall, z south from the north wall. Negative z is inside the Pooja Ghar. Clear widths account for the existing 80 mm frame jambs and, for inward swing, the parked handle envelope. Values are rounded to the nearest millimetre; these are model checks, not surveyed fitting tolerances.

| Option | Clear width | Parked rectangle x; z | Cabinet gap | Dining-chair gap | AC casing gap | Covered points / verdict |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| `bifoldEast` — original east bi-fold | 907 | 4780–4990; 95–624 | 26 | 1740 | 1140 | L-E2 access covered; kept unchanged for comparison |
| `slideWest` — one full-width leaf sliding west | 1040 | 2593–3793; 93–168 | 934 | **0** | 90 | No proposed point covered, but hits north dining chair |
| `fixedEastSlideWest` — east fixed, west sliding east | **520** | 4393–4993; 183–258 | 393 | 1353 | 755 | No point covered; clear in this model; proposed default |
| `fixedEastSwingIn` — east fixed, west hinged at west jamb | 448 | 3871–3946; −425–95 | 853 | 831 | 245 | No parked point covered; inward sweep enters seated-person envelope |

All four leave the platform drawer usable. The inward swing clears the east temple shelf, but does not clear the assumed seated body. Its west leaf is 520 wide between the west jamb and fixed half; its handle further reduces the passage when open. The half-slider leaves only 520 mm passage: please judge that width before choosing it.

The default rule is tested: choose `slideWest` only when its parked leaf has no detected obstruction or covered electrical point; otherwise choose `fixedEastSlideWest`. The configured default matches that result. Moving the chairs out of its path in a synthetic test switches the recommendation to `slideWest`; lowering the AC or adding a covered switch switches it back. This does not move any real furniture automatically.

## Ceiling and opening checks

| Cabinet relationship | Result |
| --- | --- |
| East ceiling border | 50 mm plan gap to the nominal cabinet footprint |
| Northeast corner ring | Overlaps its conservative plan envelope, but cabinet top is 15 mm below the assumed underside with the open 30 mm scribe gap |
| L2 track | 482 mm plan clearance to the rail edge |
| L2 spot and reading heads | 333 mm each using an assumed conservative 160 mm reach from each head centre |
| Probable fan | 1388 mm outside the assumed 1200 mm blade circle |
| East opening, z 2177–3277 | Cabinet ends at 2100: 77 mm clear |

The ring is checked as its outer rectangle. Its relief is assumed 15 mm in the lighting config; scan errors are larger than the remaining 15 mm clearance, so this needs a site measurement before any scribe/filler is made. A test removing the top gap correctly reports the ring collision.

## Defaults and limits

Additional proposals/assumptions are recorded beside the config: a 90 mm offset between the two sliding lanes, a 600 × 600 seated-person plan envelope, the existing model's 440 × 440 × 860 dining-chair bounds, and a 100 mm electrical plate with a 100 mm access allowance. L-E2 has only 42.5 mm separation from that assumed plate/access envelope with the half-slider. The model reports a 25 mm gap to L-P1 for the parked inward leaf; this is not an assurance of comfortable access.

The checks use proposed electrical points, including the hidden alcove point. Existing scan points remain available through the existing overlay; this is not a new reconciliation of those points. Cabinet/door checks use conservative rectangles and the inward sweep uses a conservative quarter-disc. AC clearance is to its casing, not a service or airflow certification. Top-hung hardware, structural fixings, anti-sway guides, travel stops, door weight, moving-leaf hand clearance, upper cabinet door opening, cable routing, and fabrication tolerances are not detailed. Upper doors are drawn closed; their usable opening and the iron cable route still need design. No site measurement, Blender/CAD export, persistence browser test or visual inspection was performed.

## Where the supervisor can inspect it

On **Lobby / Dining**, use **Overview** and **Top** for the cabinet and clearances; use **Door front** (closes the doors) and **Pooja view** for leaf appearance and the platform. The new **Pooja door** select sits beside **Open Pooja doors / Close Pooja doors**. Try each option both open and closed, and use **Pull out ironing board** to check the preserved lower unit. In **Whole home 3D → Editable 3D**, the shared builders use the configured half-slider by default; use the existing Pooja door and seated-person controls. No server or browser was started, as requested. Screenshots and narrow-screen control layout await the supervisor.

## Checks

Node **22.23.3** was prepended to PATH. PowerShell blocks `npm.ps1`, so npm scripts were invoked with `npm.cmd`.

- `npm.cmd test`: **479 passed, 7 failed, 486 total**, no skipped tests. The failures are exactly the seven named `Windows: ...` launcher fixtures; no other test failed. Log: `tmp/pooja-tools/unit.log`.
- `node --test tests/pooja-door.test.mjs tests/lobby-ironing-storage.test.mjs tests/lobby-electrical.test.mjs`: **11/11 passed**.
- `npm.cmd run lint`: **passed**, `check-imports: no problems`.
- `npm.cmd run build`: initial launch failed because the shared `node_modules` junction has no `.bin` directory. Retried successfully using a worktree-local `tmp/pooja-tools/vite.cmd` on PATH, forwarding to the already-installed Vite entry point. **Build passed**, 955 modules transformed; large-chunk warning remains. No packages were installed and shared dependencies were not edited.
- `node scripts/work-plan-estimate.mjs --check`: **failed, exit 1**, because the taller cabinet changes `work-plan/plan.json` and `docs/WORK_PLAN_BUDGET.md` estimates. Reported fresh total: Rs 16,54,000–31,41,000. These files were left untouched for this round's owner.
- `node scripts/electrical-doc-sync.mjs` and `node scripts/electrical-doc-sync.mjs --check`: **passed**. The script maintains positions and circuit figures, which did not change; L-E1/L-E2 prose was updated separately from the config wording.
- Additional no-browser Three.js check: both builders instantiated; **16 door states** (four styles × open/closed × two floor offsets) selected exactly one assembly and kept leaves above the platform. Cabinet top checked at 2670; ironing-board open/close control exercised.
- `git diff --check`: **passed**. Visual/UI inspection: **not run**, per this run's instruction.

## Files changed

- `react-configurator/src/config/roomShellConfig.js`, `roomElectricalConfig.js`, `acPlanConfig.js`.
- `react-configurator/src/domain/poojaDoor.mjs`, `lobbyIroningStorage.mjs`, `existingElectrical.mjs`, `roomReview.mjs`.
- `react-configurator/src/rooms/pooja/PoojaDoorAndInterior.js`, `src/rooms/lobby/LobbyEastIroningStorage.js`.
- `react-configurator/src/EmptyRoomGallery.jsx`, `src/home/workPlanEstimate.mjs`.
- `react-configurator/tests/pooja-door.test.mjs`, `lobby-ironing-storage.test.mjs`, `lobby-electrical.test.mjs`.
- `docs/ELECTRICAL_PLAN.md` and this note.

## Text for CURRENT_STATE (left for this round's owner)

2026-10-06: Lobby east ironing cabinet gains three aligned upper bays to 2670 under the unchanged 2700 ceiling, with a proposed 30 mm open scribe allowance; its original 1000 mm lower unit is preserved. Lobby now offers four Pooja door options. Default is fixed east half / west half sliding east, because the full west slider hits a dining chair. All leaves clear the platform drawer. L-E1 is proposed inside the centre upper bay. Pure checks report door, socket, seated-person and ceiling conflicts; budget figures need regeneration by their owner. See `docs/changes/2026-10-06-pooja-doors-tall-ironing-storage.md`; visual inspection remains with the supervisor.

## Questions for the owner (not added to OPEN_ITEMS this round)

1. Is the proposed half-slider's 520 mm clear passage acceptable, or should we revisit the dining arrangement to allow the full west slider?
2. May L-E1 remain inside the centre upper bay? How should the door, socket access and cable route work while ironing?
3. Can the cabinet finish with an open 30 mm scribe allowance, or should a fitted filler be designed around the measured corner moulding?
4. Please confirm the real door opening/frame sizes, required hardware and plate sizes, seated space and whether the probable fan is actually present. Is the small L-E2 access gap comfortable?
