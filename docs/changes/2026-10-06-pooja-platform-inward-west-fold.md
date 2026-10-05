# Pooja platform, inward west fold and north cabinet bay — 2026-10-06

Owner, dictated 2026-10-06: “I think the Pooja room door should be above the platform. That means the platform needs to extend a bit outward. Also now this Pooja room door, can we open it inside, west side, this double foldable. That would give us space, and then we bring this cabinet that we have placed on the east side.”

This implements the **supervisor's reading of the dictation**, pending confirmation of each point below: the frame stands on a projecting platform; two leaves fold inward at the west jamb; the east cabinet grows north while its ironing bay stays put; sockets affected by that change need explicit access arrangements. The inward west fold is the owner-requested default. All new fitting dimensions are **PROPOSALS**, not surveyed or approved fabrication dimensions.

The room, openings, appliances, temple shelf and seated-person position are unchanged. Coordinates below are millimetres: x east from the west wall, z south from the north wall; the alcove is at negative z. Builders convert these values to metres. Saved kitchen formats, storage keys, stable option ids and hidden state are unchanged. The fifth option is added without removing the four older ones.

## Before and after

| Item | Before | Now |
| --- | --- | --- |
| Alcove / opening | 1200 wide, 1000 deep, x 3793–4993 | Unchanged |
| Platform | 1200 × 1000, 190 high, front z 0 | 1200 × 1150, same height, front z 150 |
| Platform edge | Square 25-thick top | Same top with a proposed 12.5-radius rounded front nosing |
| Frame posts | From Lobby floor to 2240 | From platform top 190 to the same 2240 head |
| Leaf bottom / top | 210 / 2140 on Lobby page | Unchanged; 20 above platform |
| Drawer front width / nominal depth | 1060 / 550 | 660 / 700, west side, x 3863–4523 |
| Drawer box back / front | z -550 / 0 | z -550 / 150 |
| Default door | East fixed / west slides east, 520 clear | West inward bi-fold, about 895 clear at doorway |
| Cabinet north / south end | z 650 / 2100 | z 200 / 2100 |
| Cabinet length / depth | 1450 / 400 | 1900 / 400 |
| Lower / upper cabinet | 1000 high / top 2670 | Unchanged |
| Cabinet bays north to south | 425 / 600 / 425 | **450 added** / 425 / 600 / 425 |
| Ironing board | 950 × 300, centre z 1375 | Unchanged, including its lower front and mechanism sketch |
| L-E1 | z 1375, 1250 high, inside upper ironing bay | Unchanged; no recentering with the longer cabinet |
| L-E2 | East wall z 350, 300 high | **Proposed** inside new north lower bay, z 425, same height |

The Whole home view retains its existing 77.5 floor offset: platform top 267.5 and leaf bottom 287.5. This change does not silently reconcile that page's floor with the Lobby page.

## Platform, passage and drawer

I chose **150 mm projection**, the upper end of the requested 100–150 suggestion. The existing frame reaches z 95, leaving 55 mm to the nose tip; the rounded part occupies the last 12.5 mm. The proposed 20 × 20 × 10 bottom guide sits on top of the platform at the doorway. There is no floor track across the drawer. This is still a **190 mm step extending 150 mm into the walkway**; rounding the edge reduces its sharpness, not the trip hazard. The room depth from this new edge to the south wall is 3127 instead of 3277, before other obstructions are considered. The step covers the eastern 1200 of the north edge, not the whole Lobby.

The cabinet starts at z 200: **50 mm beyond the platform**, and it does not stand on the step. Its x 4593–4993 footprint occupies the east 400 of the opening's approach. That leaves **800 mm nominal approach**, or **748 mm past the existing lower handles** (which project 52 beyond the carcass). The door itself clears 894.5 once folded. Those are different measurements: a straight path aligned between both the handles and folded stack is only **522.5 mm** (574.5 ignoring handles). There is room to turn on the platform in the model, but this is not a claim of comfortable or accessible passage. The owner needs to try this arrangement at full size.

Keeping the previous nearly full-width drawer would put its east end through the cabinet when pulled out. I chose a **narrower west drawer** instead of stopping the cabinet short: 660 front width, starting 70 from the alcove's west edge. Its east edge clears the carcass by 70 and the conservative handle envelope by **18 mm**. The remainder below the platform is fixed. This preserves full drawer travel while allowing the requested cabinet extension; it sacrifices 400 mm of drawer-front width.

The nominal drawer box can now be **700 deep**, with its back still z -550. Actual usable internal depth will be smaller after fronts, backs, runners and tolerances are designed. The front face is flush at z 150; the old visual front protruded to z 31, so that visible face moves 119, while the box gains 150 depth. The retained handle projects 31 beyond the new front. Fully pulled out, the handle reaches z **881** (150 + 700 + 31). The drawer clears the cabinet and chairs along the whole pull-out envelope. Door leaves stay 20 above the platform; posts and guide start on top of it, above the drawer. They do not block it open or closed. Drawer animation has not been added; the full travel is checked in the pure model.

## Inward fold and occupied space

Two **485 mm leaves** share a middle hinge. The free end stays along the doorway line as the middle joint folds north. The proposed pivot is at z **-40**, near the back face of the existing frame, rather than the older options' z 95. A **70 mm packing stile** beyond the existing 80 mm west jamb puts the hinge 150 from the alcove west edge. This extra offset avoids the west lining and allows the folded handles to fit; it is not a change to the masonry opening. A 3 mm face offset leaves a nominal 1 mm gap between the folded panel backs. Hardware is schematic and needs a joiner's review, including the small clearance behind the frame.

Including the conservative handle envelope and existing 12-radius hinge sketch, the parked stack is **151 wide × 509 deep**, x **3867.5–4018.5**, z **-537 to -28**. Panel length alone is 485. Nothing parks in the Lobby. The current west lining ends at x 3848, leaving 19.5 to this stack envelope.

The pure check evaluates the complete motion, not just the parked pose. Panel centre lines sweep about **0.231 m²**, compared with **0.739 m²** for a single 970 mm leaf hinged at the same point: about 69% less swept area. Centre-line penetration is **485 rather than 970 mm**. Handles and hinges are included separately in the collision check, sampled every half-degree with an additional **4.62 mm conservative between-sample allowance**. Its overall bounds are approximately x 3863–4918, z -542 to 42; the small positive-z part is over the platform during motion, not a parked leaf in the Lobby.

Through that entire conservative sweep, clearance is about **49 mm to the temple shelf**, **458 mm to the back wall**, and **160 mm to the cabinet envelope**. The shelf's actual existing 720 mm length was extracted from the builder into config so the pure check uses the same geometry; the shelf has not moved or shrunk.

**The current seated position does not clear either the sweep or the parked stack.** Its unchanged centre is 400 from west, with the existing assumed 600 × 600 body envelope. Simply sitting after opening is insufficient at that centre. The minimum east shift to stop overlapping the parked stack is **125.5 mm**, with no comfort allowance. A **PROPOSAL of 150 mm east** (centre 550 from west) leaves 24.5 to the parked stack and 96 to the temple shelf. Even there, fold the doors **before** sitting: the sweep still crosses that position. This suggested shift is tested but **not applied** to the person model, so the remaining conflict stays visible.

L-P1 on the west return, x 3833, z -500, is also covered by the parked stack's plate/access envelope. Its position stays unchanged and its wording now reports this unresolved conflict. A possible relocation farther north along that return needs the owner's and electrician's agreement; it has not been silently moved. The door report therefore correctly says **conflict**, despite clearing the shelf, back wall, cabinet and drawer.

All five styles remain selectable on both pages. The older east bi-fold and half-slider now hit the longer cabinet; the full west slider still meets the north dining chair. Their old kinematics are preserved for comparison, not endorsed for this extended-cabinet layout.

## Electrical, ceiling and estimate

L-E2's old z 350 position is inside the new cabinet footprint. It is now explicitly proposed at the added bay centre, **z 425 and height 300, behind its lower door**. It must be reached with that door open, through an accessible back cut-out with an agreed cable exit. It is intentionally marked hidden; the check does not pretend it is a freely accessible wall socket. The wording no longer suggests putting a heater inside storage. Cabinet door motion, cable routing and convenient plug access are not engineered or verified. L-E1 remains behind the ironing bay's upper door.

The electrical document and its sync script now keep the reviewed L-E2 and L-P1 access wording aligned with config, as well as positions. Circuit ids and loads do not change. AC tall obstacles, electrical blockers and review-plan cabinet dimensions already read the cabinet config and therefore follow its new north end and length; tests freeze the AC obstacle at x 4593–4993, z 200–2100, top 2670.

The retained ceiling/opening checks for the longer unit report:

| Relationship | Result |
| --- | --- |
| East opening beginning z 2177 | 77 clear beyond unchanged cabinet south end |
| L2 rail | 482 plan gap |
| L2 spot and reading-head envelopes | 333 each |
| Domed-light rosette | 603 plan gap using its 220 radius; actual dome size unmeasured |
| Probable fan blade circle | 1388 clear |
| East border moulding | 50 plan gap |
| Northeast corner ring | Plan overlap, but cabinet top 15 below assumed ring underside |

The 30 mm scribe allowance remains **open**, not a solid filler through the ring. The reading head stays at z 1375 above the unchanged ironing board. Its test now uses the actual 300-wide board, instead of incorrectly treating the whole enlarged cabinet as a work surface. Track, dome/rosette, fan and ceiling config positions are unchanged.

The estimator already reads cabinet length, so both lower-run quantity and upper face area now include the added 450 bay. Pooja estimate wording now gives the 1200 × 1150 platform and 660 × 700 drawer. Its existing full-height alcove allowance remains coarse: no invented separate platform or bi-fold-hardware rate was added. A fabrication quote is still needed.

## Checks and supervisor views

Node **22.23.3** was prepended to PATH. Commands ran from `react-configurator/`, using `npm.cmd` to avoid the PowerShell script launcher.

- Final `npm.cmd test`: **510 passed, 7 failed, 517 total; none skipped**. Exactly the seven `Windows: ...` launcher fixtures failed with missing `caller-cwd.log`; no other final failure. An earlier run had the reported intermittent `bed-furniture.test.mjs` process failure; rerunning that file passed **5/5**, and the final full run completed its tests normally.
- The suite includes all **20 combinations** of five door styles, open/closed and the two page floor offsets, plus frame/platform bounds and the unchanged deployed board. Pure tests catch the original wide drawer obstruction, seated-person conflict, shelf/back-wall obstruction and cabinet collision.
- `npm.cmd run lint`: **passed**, `check-imports: no problems`.
- `npm.cmd run build`: **passed**, 962 modules transformed; existing large-chunk warning remains.
- `node scripts/work-plan-estimate.mjs --check`: **failed, exit 1**. `work-plan/plan.json` and `docs/WORK_PLAN_BUDGET.md` are stale; the taller unit already caused drift and this extension adds more. Fresh estimate: **Rs 16,92,000–32,00,500**, 105 of 112 tasks estimated. Protected work-plan files were **not regenerated**.
- `node scripts/electrical-doc-sync.mjs --check`: **passed**, rows up to date.
- `git diff --check`: **passed**.

No dev server or browser was started. Visual appearance, narrow-screen controls and interactive page behavior remain **unverified**, for the supervisor as requested. On **Lobby / Dining**, inspect **Overview**, **Top**, **Door front** (closes doors) and **Pooja view** (opens doors). The **Pooja door** select defaults to **West bi-fold into Pooja**; try **Open Pooja doors / Close Pooja doors** and **Pull out ironing board**. On **Whole home 3D → Editable 3D**, use **Top** and the Pooja door select/open-close control, **Show/Hide seated person**, and **Pull out ironing board**. The on-page note warns that the seated position needs to move east. The pure report retains the L-P1 conflict.

Site measurements, actual hardware/runner capacities, joinery, step comfort, socket/upper-door access, anti-pinch details, structure, AC airflow, saved-layout browser round trips and Blender/CAD exports were not verified. No commit, staging, dependency installation or protected-file edits were performed.

## Files changed

Under `react-configurator/`:

- `src/config/roomShellConfig.js`, `src/config/roomElectricalConfig.js`.
- `src/domain/poojaDoor.mjs`, new `src/domain/poojaPlatform.mjs`, `src/domain/lobbyIroningStorage.mjs`, `src/domain/roomElectricalModels.mjs`.
- `src/rooms/pooja/PoojaDoorAndInterior.js`, `src/rooms/pooja/PoojaPlatform.js`, `src/rooms/lobby/LobbyEastIroningStorage.js`.
- `src/EmptyRoomGallery.jsx`, `src/WholeHome3D.jsx`, `src/home/workPlanEstimate.mjs`, `scripts/electrical-doc-sync.mjs`.
- `tests/pooja-door.test.mjs`, new `tests/pooja-builders.test.mjs`, `tests/lobby-ironing-storage.test.mjs`, `tests/lobby-electrical.test.mjs`, `tests/lobby-lighting.test.mjs`.

Also `docs/ELECTRICAL_PLAN.md` and this note. `acPlanConfig.js` needs no edit: its tall obstacle already derives all changed bounds from config, verified by tests.

## Text for CURRENT_STATE — reserved for this round's owner

2026-10-06: Owner's inward west Pooja bi-fold is now the default, with the earlier four styles retained in Lobby and Whole home Editable 3D. Proposed platform projection 150 (height still 190), rounded nosing, west drawer 660 × 700; cabinet extends north to z 200 (1900 long), leaving 50 to the platform and preserving all original ironing bays/board positions. New fold parks wholly inside, clears shelf/back/cabinet, but overlaps the unchanged seated position and L-P1 access. Nominal approach 800, past handles 748, straight overlap with folded stack only 522.5. L-E2 proposed inside added north bay at z 425/height 300. Budget regeneration and visual review remain with their owners. See `docs/changes/2026-10-06-pooja-platform-inward-west-fold.md`.

## Questions for the owner — not added to OPEN_ITEMS this round

1. Please confirm the supervisor's reading of “door above the platform”: frame standing on the 190-high step, with **150 projection and rounded nosing**. Is this step into the walkway acceptable?
2. Please confirm the reading of “inside, west side, double foldable”: **two equal inward-folding leaves at the west jamb**. Accept the proposed packing stile/pivot and about 895 doorway clearance? May the seated centre move **150 east**, with doors folded before sitting? It has not been moved yet.
3. Please confirm the reading of “bring the cabinet”: **add one north bay**, start z 200, keep south end 2100 and the board where it is. Accept the **660-wide drawer** trade-off and the 748 approach past handles / 522.5 straight alignment past the folded stack, or stop the cabinet short to retain a wider drawer/approach?
4. Please confirm the associated socket proposal: **L-E2 inside the new north lower bay**, z 425, height 300, accessed with its door open. Where should **L-P1** move so the parked doors do not cover it? Confirm reachable back openings/cable exits for L-E2 and the unchanged L-E1.
5. Please have the joiner verify folding hardware, runners and real clearances, and confirm the open 30 mm scribe allowance against the measured ceiling ring before ordering.
