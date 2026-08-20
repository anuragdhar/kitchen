# Muse Spark Delegation Guide

Use Muse Spark for heavy implementation work, but keep Codex as reviewer/supervisor for repo safety, build verification, and design consistency.

## Will This Work?

Yes. The Windows command is not on PATH, but the WSL Muse Code CLI works through Ubuntu:

```powershell
wsl.exe -d Ubuntu -- /root/.local/bin/muse --version
```

Latest smoke test result:

```text
Muse Code 0.2.1 (0.2.1-R1215.1)
```

A no-edit Meta provider smoke test also succeeded:

```powershell
wsl.exe -d Ubuntu -- /root/.local/bin/muse exec --json --provider meta --model muse-spark-1.2-contributor --reasoning-effort minimal --max-model-steps 1 --disable-write --disable-shell --workspace /mnt/c/source/Github/kitchen "Reply exactly: MUSE_OK"
```

The model returned:

```text
MUSE_OK
```

Do not give it broad external permissions. It only needs access to this repository folder:

```text
C:\source\Github\kitchen
```

## Supervision Workflow

Run one phase at a time:

1. Codex prepares a scoped prompt from this guide.
2. Muse Spark edits the repo.
3. Codex reviews the diff.
4. Codex runs verification:
   - `npm run build` in `react-configurator`.
   - screenshots if visual UI changed.
   - `Generate-FreeCAD-3D.bat` if FreeCAD files changed.
5. Codex fixes integration issues.
6. Commit only after the phase is stable.

## Repo Rules For Muse Spark

- React is primary for implementation.
- Shared JSON is the layout data source.
- FreeCAD is construction/export target.
- Blender is final render target only.
- Coohom is optional/background-only.
- Preserve Rule #9 defaults.
- Preserve exact dimensions:
  - room width: 2324 mm.
  - room length: 4746 mm.
  - room height: 2700 mm.
  - west clear zone: y0-y1220.
  - north clear zone: 300 mm.
  - east base: 600D.
  - east lower upper: 320D.
  - east top upper: 550D.
  - west counter: 400D.
  - west lower upper: 320D.
  - west top upper: 450D.
- Do not put cabinets, counters, or LED in the west y0-y1220 door clear zone.
- Do not model gas/chimney as one tall box.
- Keep East wall elevation as North left to South right.
- Keep West wall elevation as South left to North right.

## Phase Prompt Template

Use this template for each Muse Spark run:

```text
You are working in C:\source\Github\kitchen.

Implement only Phase <N> from docs/KITCHEN_APP_IMPLEMENTATION_PLAN.md.

Constraints:
- Keep React as the primary implementation surface.
- Preserve current Rule #9 layout.
- Preserve all exact millimeter dimensions.
- Keep changes scoped to this phase.
- Do not refactor unrelated files.
- Do not add heavy dependencies unless necessary.
- Update README only if user-facing behavior changes.
- After edits, report files changed, key decisions, and verification commands to run.

Acceptance checks for this phase:
<paste the phase acceptance checks here>
```

## First Delegation Prompt

Start with Phase 1 only:

```text
You are working in C:\source\Github\kitchen.

Implement Phase 1: React Shared Layout Model from docs/KITCHEN_APP_IMPLEMENTATION_PLAN.md.

Goal:
Make React the primary implementation surface while creating a layout model that FreeCAD and Blender can consume later.

Constraints:
- Keep current UI working.
- Keep current EAST_INIT and WEST_INIT compatibility while adding the richer model.
- Preserve Rule #9 defaults.
- Preserve west y0-y1220 clear zone.
- Preserve north 300 mm clear zone.
- Preserve East/West wall orientation.
- Do not change FreeCAD yet.
- Do not add new dependencies.

Expected result:
- A richer shared layout schema exists in React config.
- App.jsx consumes it without losing current views.
- Export JSON includes the richer shared model.
- npm run build passes.

After edits, summarize:
- files changed.
- schema shape.
- compatibility approach.
- verification results.
```

## Recommended Phase Order

1. React shared layout model.
2. React dimension and ruler overlay.
3. React validation panel.
4. React cabinet module system.
5. Improved React 3D preview.
6. React wall elevation designer.
7. React material and finish selector.
8. React BOM and quote export.
9. Save/load/versioning.
10. FreeCAD BIM export from React JSON.
11. FreeCAD drawings and dimensions.
12. Blender photoreal render pipeline.
13. ZIP package export.

## Access Notes

If Muse Spark needs an API key, set it outside the repo as an environment variable. Do not commit API keys or credentials.

Example pattern:

```powershell
$env:MUSE_SPARK_API_KEY = "<your key>"
```

Then run the CLI from:

```powershell
cd C:\source\Github\kitchen
```

For this repo, call Muse through WSL:

```powershell
wsl.exe -d Ubuntu -- /root/.local/bin/muse exec --json --workspace /mnt/c/source/Github/kitchen --model muse-spark-1.2-contributor --reasoning-effort high --max-model-steps 50 --enable-shell-tool --prompt-file /mnt/c/source/Github/kitchen/docs/muse-phase-prompt.txt
```

Give the CLI only the specific phase prompt, not broad instructions to rewrite the whole project.
