# Renovation work plan

Owner request, 2026-10-03: one tracked list of every job, by type of work, in a logical order. Updated 2026-10-05: brought
up to date with the changes of 2026-10-04 and 2026-10-05, put in a buildable order, and given a rough budget.

## Where it lives

- **`work-plan/plan.json`** is the single source of truth: phases, trades and tasks. It is plain text in the repository, so
  every change has a history once committed.
- **`work-plan/OPEN_ITEMS.md`**: what the owner still has to measure (A), find out (B), decide (C), whom to arrange (D), and
  questions about the plan itself (E).
- **Work plan** page in the app (button in the header) shows it, grouped by order of work or by trade, with the rough budget
  at the top, and lets you change a task's status, add notes and add tasks. Run locally, the page saves straight to
  `work-plan/plan.json` (the previous version is kept as `plan.backup.json`, not committed). Opened anywhere else it cannot
  write the file and keeps changes in that browser only; the page says which.
- **`docs/NEXT_STEPS.md`** (generated): what to measure and decide first, ordered by how many tasks wait on each item.
- **`docs/WORK_PLAN_BUDGET.md`** (generated): the total range, the breakdown, the rate table, what moves the total most,
  what could not be estimated, and the basis of every task's figure.
- Code: rules, ordering, totals and the "what to do first" count in `react-configurator/src/home/workPlan.mjs`; rates and
  quantities in `src/home/workPlanEstimate.mjs`; save endpoint `scripts/work-plan-plugin.mjs`; generator
  `scripts/work-plan-estimate.mjs`; tests `tests/work-plan.test.mjs`. All of the rules are free of React and the DOM.

## How a task is recorded

| Field | Meaning |
| --- | --- |
| `phase` | when it happens (the nine phases below) |
| `trade` | who does it: civil/structure, electrical, plumbing, carpentry, steel fabrication, false ceiling, air conditioning, aluminium windows and mesh, painting, owner/general |
| `title`, `room`, `detail` | what and where; sizes come from the 3D model, not site measurements |
| `dependsOn` | tasks that must be done first |
| `needs` | an approval or decision it waits for, in words |
| `openItems` | the same, as item numbers from `OPEN_ITEMS.md` (for example `A3`, `C15`); used to work out what to do first |
| `status` | to do, in progress, blocked, done |
| `source`, `notes` | the document with the detail; contractor, date, actual cost, what was agreed |
| `estimateLow`, `estimateHigh` | a planning range in rupees (whole numbers); both or neither |
| `estimateBasis` | one line: quantity x rate, or "Not estimated: why" |
| `estimateConfidence` | `low` or `medium`. There is no `high`: nothing here is a quote |

The four estimate fields and `openItems` are optional. A plan saved before 2026-10-05 has none of them and still loads
(the file is still `schemaVersion` 1).

A task is **ready** when it is to do and everything it depends on is done. The page warns when a task is started before its
prerequisites are done, or depends on something planned in a later phase.

## Order of work

1. Measure, decide and get approvals (society, structural engineer)
2. Demolition and civil work (openings, the Bedroom 1 door move, the shoe rack wall, the entry pocket)
3. Plumbing first fix
4. Electrical first fix and AC piping (before plaster)
5. Plaster, making good and flooring
6. Carpentry and steel fabrication
7. Painting and polish
8. Fit-out: lights, switches, AC units, nets, blinds, plumbing fittings
9. Furnish, snag and handover

`checkDependencies(plan)` checks that every dependency exists, that there is no loop, and that no task depends on a task in a
later phase. The tests also hold the plan to the order above: no wall is cut before the engineer and the society agree;
every first-fix task and every AC pipe run is done before plaster (the floor box before flooring); every carpentry and steel
task before paint; every fitting after paint; and every task leads to the snag list. Work that belongs to one trade but has
to happen in another phase is placed by WHEN it happens: moving the Lobby switchboard is electrical work in the civil phase,
because the wall cannot be cut until the board is gone.

## What is in it now (97 tasks) and what is not

Seeded from what the project records. Since 2026-10-05 it also has: the ventilated stainless steel outer door and the four
round entry lights; one feed, driver and dimmer per track run in six rooms, with a buy-and-fit task per room; the three
clashes with existing electrical points (Drawing Room switchboard behind the TV, sockets behind the west sofa, Lobby
switchboard inside the new Bedroom 1 doorway); the Bedroom 1 door move with the old doorway closed and used as a medicine
cabinet; Bedroom 3 cabinets and chest; the Home Office desk split and north cabinet; kitchen cabinets and store; the window
AC on an iron frame in the Bedroom 1 balcony; and the trial of one ready-made outdoor blind on the south window.

Proposals are recorded as proposals, not as decisions: the AC outdoor unit under the shoe rack or on the Drawing Room west
wall, the Bedroom 1 split AC outdoor unit, and what to do about the switchboard behind the TV.

Placeholders, marked PENDING in their detail, hold a place for five notes being written on 2026-10-05: the Bedroom 1
design, the electrical plans for all rooms, the whole-home palette, the whole-home AC plan, and moving the track lights off
the ceiling mouldings. Still missing altogether: plumbing (no change is listed), the Study furniture, dates and contractors.

## Budget: how it is made and how to correct it

Every figure is a quantity from the app's configs multiplied by a rate from one table (`RATES` in `workPlanEstimate.mjs`,
printed in `docs/WORK_PLAN_BUDGET.md`). To correct it, change a rate (or tell the assistant which one is wrong) and run, from
`react-configurator/`:

```
node scripts/work-plan-estimate.mjs           # rewrites the estimate fields in plan.json and the two generated documents
node scripts/work-plan-estimate.mjs --check   # changes nothing; fails if anything is out of date
```

The script writes `plan.json` exactly as the Work plan page does (two-space JSON, one final newline, the file's own line
endings), so a later save from the page changes only what was edited. If a config changes (a longer track, a wider
wardrobe) the stored figures drift from the estimator; the test allows 15 % on the total and then asks for the script to be
re-run. A real quote goes in the task's notes; the range stays as the planning figure until the rates are corrected.
