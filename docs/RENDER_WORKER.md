# Windows local render worker

GitHub is the hand-off: approved main changes trigger local build/render work;
review PRs return selected PNGs and diagnostics. This is not remote desktop or
an arbitrary shell endpoint. Your ordinary checkout is never pulled or reset.

## Trust and privacy

Run as a normal, preferably dedicated Windows user, not Administrator/SYSTEM.
`-TrustMain` authorizes new code merged into this repository's main branch to run
as that user. A separate checkout is **not a security sandbox**. Restrict merge
access to trusted maintainers. Unreviewed PR branches, issue comments and command
fields in job JSON are not executed. There is no installed service, scheduled
task, listener, firewall change, policy bypass or startup persistence.

`-Publish` authorizes PUBLIC uploads to anuragdhar/kitchen: selected room/reference
PNGs, whitelisted provenance, result.json and bounded sanitized stage logs.
Home images can contain private details. Review the first local run before
publication. Redaction is best effort, not a secrecy guarantee; never print
credentials or environment dumps in build scripts. Full logs remain local.
No .env files, credentials, input ZIPs, .blend files, whole checkout or home folder
are packaged. Review-only auto-merge is a separate optional switch.

## Prerequisites and start

Install Git, Node 22 including npm, Python 3.11+, and Blender. Publication also
needs GitHub CLI signed into your own account locally:

```powershell
gh auth login
gh auth setup-git
gh auth status
```

Do not paste tokens into chat, command arguments or the repository. The worker
installs locked npm dependencies and bundled Playwright Chromium in its own run
environment. It discovers existing Blender; it does not install it or elevate.
From the updated repository:

```powershell
# First local test, no publication:
.\scripts\windows\Start-RenderWorker.ps1 -TrustMain -Once
# Continuous operation with review PR uploads:
.\scripts\windows\Start-RenderWorker.ps1 -TrustMain -Publish
# Optional automatic merge of successful evidence-only PRs after local checks:
.\scripts\windows\Start-RenderWorker.ps1 -TrustMain -Publish -AutoMergeEvidence
```

Add `-BlenderExe 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'`
using your real path when needed. Ctrl+C stops the worker. Keep the terminal open,
PC awake and network available. No extra root .bat is added; start-server.bat is
unchanged. Follow organizational PowerShell policy; the Python entry point is:

```powershell
python scripts/render_worker.py --trust-main --publish
```

## Execution and polling

Default folder: `$HOME\A501RenderWorker`, outside the development repository.
Each job gets a detached worktree at its exact source SHA. Normal local changes,
browser saves, branches and the existing app server are not modified by worker
Git operations. Code on trusted main still runs with your user's permissions.

A separate thread fetches main every 60 seconds, including during rendering;
network delays can extend a poll. Active jobs keep their revision. The newest
source is used next and intermediate queued revisions are coalesced. Long stages
print 30-second progress heartbeats and write logs.

The fixed sequence is npm ci, npm run check, JavaScript/Python contracts,
browser fixture/correctness/persistence/interior/material/lighting checks,
and sequential room export/render/output validation. All commands execute on
this Windows machine in the worker's isolated checkout.
Failed stages stop that job. Failure diagnostics may get PRs but do not auto-merge.
Images are always **unreviewed**; process success is not artistic approval.

A source/input fingerprint avoids repeated renders across restarts and ignores
`render-review/` and generated render folders. Evidence merges cannot themselves
start another render. Failed fingerprints are recorded once too. Change the
request ID to intentionally retry. Interrupted jobs can be retried on restart.
Fresh output roots prevent old gallery images being mistaken for new evidence.

## Request configuration

Merge changes to `configs/render-worker-job.json` through normal code review:

```json
{"version":1,"enabled":true,"request":"lighting-review-02",
 "rooms":["kitchen","balcony","drawing"],"quality":"draft","device":"AUTO"}
```

Only these fields are accepted: no command, path or custom remote. Changing
request repeats otherwise unchanged inputs. enabled=false pauses new work, not
an active render. Supported room routes: kitchen, balcony, drawing, bedroom3,
study, bedroom1, lobby, pooja, storage, entry. Terrace/Bedroom 1 balcony need
manual active-scene export. Quality: draft/final/portfolio. Device: AUTO/CPU/
OPTIX/CUDA/HIP/ONEAPI/METAL. The controller does not hot-reload itself: pull and
restart it after controller/launcher changes. Build/render scripts come from
pinned main on each job.

## Current saved designs

Without InputFolder, exports use fresh-browser repository defaults, NOT your
normal browser's saved edits. Native detailed Drawing Room/Bedroom 3 scenes are
used unless packages are supplied. To render saved edits, export every selected
room through Interior studio > Blender export into a dedicated local folder:

```powershell
.\scripts\windows\Start-RenderWorker.ps1 -TrustMain -Publish -InputFolder 'C:\A501-inputs'
```

Use exact filenames A501-kitchen-archviz.zip, A501-balcony-archviz.zip, etc.
This mode requires packages for every selected room. Only those names are copied;
changed checksums trigger another job even without a code change. Finish writing
a ZIP before it is copied. No normal browser profile is read/uploaded.

## Review outputs and retries

Each unique `render-review/<run-id>` branch/PR contains the matching folder with
README image links, PNGs, provenance, result.json, source SHA and stage logs.
These are review artifacts, not a deployment into the normal app gallery/server.

A persistent outbox retries failed publication without re-running Blender. No
force push is used. Optional auto-merge requires a successful local job, artifact
paths only, matching expected head SHA and main base. GitHub is used for Git and
the review PR; it does not run tests or provide a merge check. Repository rules
still apply; no admin bypass is used. Reviews for a superseded main commit stay
open for manual review. Manually closed PRs are respected. A one-shot run does
not wait indefinitely for auto-merge;
remaining publication/merge work resumes on the next worker invocation.

Limits: 20 MiB per published file, 80 MiB per review, 2 MiB published text per
stage log, 5 GiB minimum free disk before starting. Oversized reviews stay local
with an error. Full logs, run folders and caches are retained for manual cleanup;
there is no automatic deletion. Prefer draft reviews to limit disk/Git growth.
Stop the worker before cleaning its old worktrees. Local status is
`$HOME\A501RenderWorker\status.json`; full logs and review files are under runs.

## Checks

```powershell
python -m unittest discover -s scripts/tests -p test_render_worker.py -v
```

The worker repeats contracts and browser checks locally on Windows. The render
stage exercises Blender, but process success is not visual acceptance.
Official references: https://git-scm.com/docs/git-worktree,
https://cli.github.com/manual/gh_auth_setup-git,
https://cli.github.com/manual/gh_pr_merge.
