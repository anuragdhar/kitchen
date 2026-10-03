# Renovation work plan

Owner request, 2026-10-03: one tracked list of every job, by type of work, in a logical order.

## Where it lives

- **`work-plan/plan.json`** is the single source of truth: phases, trades and tasks. It is plain text in the repository, so
  every change has a history once committed.
- **Work plan** page in the app (button in the header) shows it, grouped by order of work or by trade, and lets you change a
  task's status, add notes and add tasks. Run locally, the page saves straight to `work-plan/plan.json` (the previous version
  is kept as `plan.backup.json`, not committed). Opened anywhere else it cannot write the file and keeps changes in that
  browser only; the page says which.
- Rules and ordering: `react-configurator/src/home/workPlan.mjs`. Save endpoint: `scripts/work-plan-plugin.mjs`. Tests:
  `tests/work-plan.test.mjs`.

## How a task is recorded

| Field | Meaning |
| --- | --- |
| `phase` | when it happens (the nine phases below) |
| `trade` | who does it: civil/structure, electrical, plumbing, carpentry, steel fabrication, painting, owner/general |
| `title`, `room`, `detail` | what and where; sizes come from the 3D model, not site measurements |
| `dependsOn` | tasks that must be done first |
| `needs` | an approval or decision it waits for |
| `status` | to do, in progress, blocked, done |
| `source`, `notes` | the document with the detail; contractor, date, cost, what was agreed |

A task is **ready** when it is to do and everything it depends on is done. The page warns when a task is started before its
prerequisites are done, or depends on something planned in a later phase.

## Order of work

1. Measure, decide and get approvals
2. Demolition and civil work
3. Plumbing first fix
4. Electrical first fix (conduits and boxes)
5. Plaster and flooring
6. Carpentry
7. Painting
8. Electrical and plumbing fittings
9. Furnish, snag and handover

## What is in it now (29 tasks) and what is not

Seeded from what the project records: the wall openings and their approvals, the new shoe-rack wall and support, the stainless
steel main gate, the 17 Drawing Room electrical points, the west cabinet, the TV console and the Drawing Room furniture.

Placeholders that need the owner: **plumbing** (no plumbing change is recorded yet), electrical points for the other rooms,
and carpentry for the other rooms (one line, to be split per room). The shoe-rack wall is recorded as the owner described it;
the exact wall is not yet marked on the plan or drawn in the 3D model. No costs, dates or contractors are recorded.
