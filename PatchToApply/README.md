# Supplying a room patch ZIP

Place **one completed ZIP at a time** directly in `C:\source\kitchen\PatchToApply\`.
The Windows worker checks this folder about once a minute and waits until it has
seen the same stable file twice before applying it. The ZIP must come from a
trusted source: optional JavaScript patch scripts run as your Windows user.

## Required contents

The ZIP contains files at **repository-relative paths**, with no extra enclosing
folder. For example, `lobby-v2.zip` can contain:

```text
patch-manifest.json
react-configurator/src/LobbyEastIroningStorage.js
```

`patch-manifest.json` must be at the ZIP root and should specify exactly one room:

```json
{"room":"lobby"}
```

Supported room keys are `kitchen`, `balcony`, `drawing`, `bedroom3`, `study`,
`bedroom1`, `bedroom1-balcony`, `lobby`, `pooja`, `storage`, and `entry`.
Always set `room` explicitly, even though an unambiguous room name in the ZIP
filename can be used as a fallback. Use a separate ZIP for each room.

Include the **complete revised files**, not a text diff. At least one file
already tracked by Git must actually change under `react-configurator/src/`,
`blender/`, or `configs/archviz/`. New files are allowed when a change to an
existing source file connects them to the room. For example, adding a new React
component without importing or rendering it from the active room will be
rejected. Keep the room's dimensions, openings, stable IDs, and saved layout
behavior unless the patch is deliberately changing them.

The ZIP may also include `patch-*.js` files under a repository-relative folder.
They run after the files are copied and are removed before commit. Prefer
complete source files when possible. A script must not leave `.bak` or
`.bak-realism` files in the checkout.

Do not include `.git/`, `.github/`, `PatchToApply/`, `render-review/`, or
`configs/render-worker-job.json`. The worker updates the job file itself for
the selected room. ZIP entries must use `/` separators and cannot contain
absolute paths, `..`, symlinks, or duplicate names. The limits are 100 MiB for
the ZIP, 250 MiB unpacked, and 1,000 files.

## Create and submit one on Windows

Prepare a staging folder outside `PatchToApply`. Its top level must contain
`patch-manifest.json` and the repository-relative folders shown above. In
PowerShell, from that folder:

```powershell
Set-Location C:\patch-staging\lobby-v2
Compress-Archive -Path .\* -DestinationPath C:\patch-staging\lobby-v2.zip
python -m zipfile -l C:\patch-staging\lobby-v2.zip
Move-Item -LiteralPath C:\patch-staging\lobby-v2.zip -Destination C:\source\kitchen\PatchToApply\
```

Check the listing before moving the ZIP: it should show `patch-manifest.json`
at the root, then paths such as `react-configurator/src/...`. Creating the ZIP
outside the inbox and moving it in when complete prevents the worker from
reading a partially written file. Do not put several room ZIPs in the inbox
at once.

The worker applies the patch in a separate local Git worktree, runs `npm ci`
and `npm run check` **on this PC**, commits and pushes successful source changes,
then requests local checks and a render of that room. The ZIP moves to
`PatchApplied/` after its source commit is pushed; this does **not** mean the
render has finished. A rejected ZIP moves to `PatchFailed/` with a `.log` file
explaining why. A failed patch does not change `main` or start a render.

If you are correcting a rejected ZIP, read its `.log`, rebuild a new ZIP with
the corrected complete files, and place that new ZIP in `PatchToApply/`.
