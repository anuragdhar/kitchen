# Kitchen project format and recovery

## Scope
Schema 1 uses `format: "kitchen-project"`, `schemaVersion: 1`, and `unit: "mm"`.
The canonical saved fields are kitchen dimensions, east/west item arrays, materials,
module lists, grid, upper depths and cutaway preference. `App.jsx` adds derived
validation, layoutModel, dimension reports and an export timestamp to downloads.
Those derived fields are not a second persistence authority. Import ignores saved
validation and recomputes it. Room/opening configuration remains repository-owned;
the loader rejects different supplied room width/length/height rather than resizing
or silently importing a different envelope. Unknown top-level report metadata is
not part of the round-trip contract. Item metadata is retained as bounded JSON.

The legacy kitchen item contract is w along room Y, d along X, h along Z. Explicit
z/hidden/fixed values and zero-sized hidden placeholders survive new-format round
trips. Rich model-only shaft width/depth are mapped explicitly, with short aliases
preferred when present. This is not a generic CAD document importer.

## Supported migrations
Unversioned east/west array documents (including previous autosaves and named
versions) and wrapped layoutModel documents have explicit v0 adapters. Supplied
coordinates never determine a schema version, never trigger a hob move, and never
cause replacement of an entire run with defaults. Required geometry must exist.
Missing optional legacy settings use deterministic project defaults with warnings,
not values from whichever layout was open. Optional item metadata may be filled
from known defaults. Unsupported formats/versions and malformed data are rejected.

New documents must supply their settings. Basic serialization checks reject invalid
JSON types, duplicate IDs, nonfinite coordinates, nonpositive active sizes, malformed
modules/options/colors and unsafe prototype keys. Limits: 2 MiB UTF-8, 1000 items per
wall or module list, 24 metadata levels and finite coordinates bounded to +/-1,000,000
mm. These are software resource limits, not construction allowances.

A well-formed draft may violate the runtime design rules. It remains editable and
savable; the validator reports issues. Loading does not "fix" it by changing geometry.
The whole candidate is checked before replacing project state in one React update.
A delayed file read is discarded if superseded, unmounted, or if the project changed
while the read was pending. Original uploaded files are never modified.

## Storage and user recovery
The original autosave and named-slot keys are read as fallbacks only. New writes use
`<original-key>:schema-1`, leaving legacy bytes available for manual recovery. Each
write keeps one previous valid autosave at `<new-key>:previous`; this is one-step
recovery, not undo/redo or full revision history. Storage is browser- and origin-local.
Keep independent JSON downloads before clearing browser data or moving machines.

The save panel reports saved/unsaved/error state. An unreadable autosave pauses
writes rather than overwriting it with defaults. A changed primary value from another
tab also pauses writes. Conflict detection is optimistic, not a distributed lock;
simultaneous multi-tab transactions are not guaranteed by this storage layer.

- Restore previous autosave loads that valid snapshot into the workspace.
- Resume autosave requires explicit confirmation. It first copies any existing
  primary bytes to `<new-key>:recovery`, then saves the active workspace.
- Backup/quota/security errors are visible. A failed backup prevents replacement;
  the active editable state remains available for JSON download.
- Named-slot saves use the same codec and preserve their previous new-format value.

Export-model consolidation, formal schema tooling, undo/redo and real-time
collaboration remain separate work. Headless browser checks use the plan view;
this change does not certify rendering performance or construction suitability.
