# Parallel room work: one specialist per room, one integration coordinator

## Foundation and scope

This change splits the existing profiles without changing their values. It adds
optional room detailing hooks, ownership checks, isolated Git worktree setup and
copy-paste room prompts. It does **not** claim new designer-quality renders,
a completed Windows/GPU trial, or visual approval. All shipped detailing hooks
are deliberately no-op; specialists implement and review actual enhancements.
No furniture measurements, saved projects, authored scenes or existing images
are changed. Continue using the current-design exporter and one render queue.

## Ownership

A specialist for `<room>` owns ONLY:

- `configs/archviz/rooms/<room>.json`
- `blender/archviz/rooms/<room>.py` and `blender/archviz/rooms/<room>/`
- `blender/archviz/assets/<room>/` (include provenance and redistribution license)
- `docs/room-reviews/<room>/`

The coordinator owns the shared manifest/quality presets, both profile loaders,
renderer, hook contract, exporter/importer, worker, UI, dependency files, workflows,
layout configuration and prompts. Shared-wall/opening changes require coordination.
Use `feat/archviz/<room>` branches for specialists; the coordinator reviews/merges
one PR at a time. Do not independently edit common files or rename a branch to
avoid scope checks. Branch-name checks are collaboration checks, not access control.
No automated review approval or repository protection setting is installed here.

Read AGENTS.md, CURRENT_STATE.md, ROOM_ARCHVIZ.md and TESTING.md first. Geometry and
selected source/visibility take precedence over appearance. Live exports are not
interchangeable with historical whole-home or detailed native snapshots.

## Start on Windows

From the updated repository using Python 3.11+ and Git:

```powershell
git fetch origin
# Preview only: creates no branch or working directory.
py -3 scripts/parallel_rooms.py prepare --rooms kitchen,balcony,drawing
# After checking the printed base SHA and paths:
py -3 scripts/parallel_rooms.py prepare --rooms kitchen,balcony,drawing --apply
```

Defaults are sibling worktrees `<repository>-rooms/kitchen`, `balcony`, `drawing`.
`--parent 'C:\A501-room-work'` chooses another outside folder. All requested
worktrees start from the same resolved `origin/main` SHA. No pull, stash, reset,
force, deletion, checkout switch, publish or merge is performed. Existing local
or fetched remote specialist branches and existing destination paths are refused.
A failed creation may leave earlier successfully created worktrees; the tool
reports them and never deletes them. Reconcile them manually before retrying.

Open a separate editor/agent window in each printed directory. Merely opening
multiple windows on one checkout is not isolation. For cloud chats, use the same
branch and ownership rule; room prompts are under `docs/room-prompts/`.
The helper does not fetch automatically: fetch first to avoid a stale base.
Do not run it with Administrator privileges or bypass Windows execution policy.

## Check a specialist's changes

From the specialist worktree:

```powershell
py -3 scripts/parallel_rooms.py check --room kitchen --base origin/main
py -3 -m unittest discover -s blender -p test_parallel_profiles.py -v
node --test react-configurator/tests/archviz.test.mjs react-configurator/tests/parallel-profiles.test.mjs
```

The scope check includes committed differences since merge-base, staged changes,
unstaged changes and non-ignored new files. Rename detection is disabled so moving
a file out of an owned path cannot conceal a shared-file deletion. Use
`--committed-only` for a specific CI revision. Scope checks are not render checks.
The parallel-room workflow repeats contracts on Linux and Windows and checks
specialist PR paths. Coordinator branches still require normal review and CI.
The normal app build and existing archviz workflow remain separate gates.

## Profile format and compatibility

`configs/archviz-profiles.json` now uses version 2. It retains shared quality
settings and the ordered room registry, but each registry value is the fixed
path `archviz/rooms/<room>.json`. Each room file contains its existing camera and
source preferences, NOT dimensions copied from the editable layout.

Python `blender/archviz_profiles.py` and JavaScript
`react-configurator/src/render/archvizProfiles.mjs` both resolve this manifest
into the original version-1 in-memory shape. Legacy inline version-1 manifests
are still supported by the loaders. All existing consumers have been migrated;
external scripts that read the raw JSON must use a loader for version 2.
Missing/invalid profiles fail; there is no silent fallback to the obsolete scene.
The browser statically bundles room JSON through Vite, not a remote fetch.

The fixture `blender/tests/fixtures/archviz-profiles-v1.json` records the initial
settings for migration tests. It is not another live configuration. Specialists
may change their profile's photographic settings within the validated contract
without editing that fixture. Native sources remain explicitly labeled snapshots.

`profileSha256` in new provenance hashes the resolved room + shared quality +
its detailing-module bytes. It is no longer the hash of the manifest file alone.
Other-room edits do not change this per-room hash. Loader hashes and a detail
report are included in the full renderer provenance. The current worker's
whitelist retains `profileSha256`, but does not yet upload the new detailed
report/loader fields; full provenance remains local. This does not implement
per-room worker invalidation: the worker still uses its source/input fingerprint.

## Optional detailing contract

`blender/archviz/rooms/<room>.py` defines `apply(scene, profile) -> list[dict]`.
The fixed filename is selected only after the room profile is validated; no
module paths or shell commands are accepted from capture ZIPs or job JSON.
These hooks are trusted, reviewed repository Python, **not a security sandbox**.
The worker's existing TrustMain boundary applies. Do not put subprocess calls,
network downloads or credential access into room detailing hooks.

The hook receives the loaded scene and a copied profile. It may improve materials
or add explicitly documented room-local detail. New mesh names must start with
`ArchvizDetail | <room> | `. Preserve every original mesh, position, transform,
visibility and geometry. Return concise JSON-safe change records. The framework
checks the existing authored geometry signature immediately after the hook and
checks original + added meshes again after rendering. A hook failure aborts that
run before publishing a new gallery entry. It is not a full evaluated-modifier,
collision, clearance, external-data or all-object-type audit. Add room tests and
source-based placement checks before adding real props or modifiers.

The source camera and generated framing use the original room bounds; added
props cannot enlarge/reposition the room. The base source is never saved over.
Keep additions reversible by removing the hook's proposed detail code; never
bake a revised layout into a historical model to conceal a source mismatch.

## Rendering and coordination

Keep the current Windows worker on approved main with one heavy render queue.
Do not start one GPU worker per room. Pre-merge visual checks use a local worktree
at an explicitly reviewed specialist revision, not an arbitrary remote command.
Use `--input` for saved-design exports and `--public` for an isolated result root:

```powershell
py -3 scripts/render_archviz_rooms.py --rooms kitchen --input 'C:\A501-inputs' --public 'C:\A501-room-review\kitchen' --quality draft
```

Do not share output roots between simultaneous processes; the gallery is a
read/modify/write file, not a multi-process database. Heavy jobs stay sequential.
The worker fetches main and will see merged profile/hook changes, but **does not
hot-reload its controller** and does not update the normal app gallery/server.
Do not have room specialists edit `configs/render-worker-job.json` independently.

Automatic routes: kitchen, balcony, drawing, bedroom3, study, bedroom1, lobby,
pooja, storage, entry. Terrace and bedroom1-balcony still need manual active-scene
exports and are not valid automatic worker routes. They are distinct from the
balcony office beside Study. Do not silently substitute another room.

## Acceptance and next work

Start with Kitchen, balcony office beside Study, and Drawing Room. For each, record
source commit/input hash, input mode, current-camera comparison, overview/detail
images, tests, defects and unverified items in its review folder. Never label a
successful checksum/build as an artistic pass. Public uploads require inspection
for private details; artifact auto-merge is not visual acceptance.

Room specialists push PRs, the coordinator integrates, the local queue renders,
and the images return for review. Chat windows do not automatically communicate
or monitor PRs; explicit GitHub handoffs are required. Changed-room scheduling,
parallel GPU execution and service installation are NOT part of this foundation.
