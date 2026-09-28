"""Publish matching editable geometry only after its Blender stills pass their audit.

The interactive GLB is the exact render INPUT, not baked Cycles illumination.
Historical bakes and user projects are never overwritten.
"""
import json
import math
from pathlib import Path
import re
import shutil
import tempfile

from archviz_contract import atomic_json, load_bundle, sha256, validate_outputs

PARITY_ROOMS = frozenset(('bedroom3', 'balcony', 'kitchen'))


def publish_current_room(public, room, bundle):
    if room not in PARITY_ROOMS:
        return None
    public = Path(public).resolve()
    # Reject broken/partial render output before switching the current pointer.
    validate_outputs(public)
    gallery = json.loads((public / 'renders/archviz/manifest.json').read_text(encoding='utf-8'))
    entries = [entry for entry in gallery['renders'] if entry['room'] == room]
    if len(entries) != 1 or entries[0].get('sourceKind') != 'editable-snapshot':
        raise ValueError('A unique completed editable-room render is required')
    entry = entries[0]
    job = entry['job']
    if not isinstance(job, str) or not re.fullmatch(r'[a-f0-9]{16}', job):
        raise ValueError('Invalid current-room job')
    folder = public / 'renders/archviz' / job
    if not folder.resolve().is_relative_to(public):
        raise ValueError('Render output escapes the public directory')
    provenance = json.loads((folder / 'provenance.json').read_text(encoding='utf-8'))
    with tempfile.TemporaryDirectory(prefix='a501-current-room-') as temporary:
        capture, source = load_bundle(bundle, temporary)
        if capture['room'] != room or capture.get('sceneId') != room:
            raise ValueError('A cropped whole-home or another room cannot substitute for the editable room')
        if provenance.get('sourceKind') != 'editable-snapshot' or provenance.get('capture') != capture:
            raise ValueError('The render and current editable capture do not match')
        source_hash = capture['glbSha256']
        if provenance.get('sourceSha256') != source_hash:
            raise ValueError('The render and interactive model checksums disagree')
        audit = provenance.get('geometryAudit', {})
        error = audit.get('maximumBoundsErrorMetres')
        if (audit.get('triangleCountsMatch') is not True
                or audit.get('sourceObjects') != len(capture['meshes'])
                or type(error) not in (int, float) or not math.isfinite(error)
                or not 0 <= error <= .0001
                or provenance.get('geometryUnchangedDuringRendering') is not True):
            raise ValueError('The editable geometry audit did not pass')
        model = folder / 'source.glb'
        if model.exists():
            if model.is_symlink() or sha256(model) != source_hash:
                raise ValueError('Refusing to overwrite a different immutable room model')
        else:
            # Same-filesystem temporary file; no reader can see a partial GLB.
            with tempfile.NamedTemporaryFile(dir=folder, prefix='source-', suffix='.tmp', delete=False) as stream:
                temporary_model = Path(stream.name)
            try:
                shutil.copyfile(source, temporary_model)
                if sha256(temporary_model) != source_hash:
                    raise ValueError('Model changed while publishing')
                temporary_model.replace(model)
            finally:
                temporary_model.unlink(missing_ok=True)
        meshes = capture['meshes']
        result = {
            'schema': 'a501.current-room', 'version': 1, 'room': room, 'job': job,
            'sceneId': room, 'sourceKind': 'editable-snapshot', 'sourceSha256': source_hash,
            'capturedAt': capture.get('capturedAt'), 'quality': entry['quality'],
            'model': {'url': f'/renders/archviz/{job}/source.glb', 'sha256': source_hash,
                      'shading': 'studio-unbaked'},
            'camera': capture['camera'],
            # Use all exported vertices, NOT the interior floor-plan rectangle.
            # This retains the full south cabinet, balcony and other projections.
            'bounds': {'min': [min(mesh['min'][axis] for mesh in meshes) for axis in range(3)],
                       'max': [max(mesh['max'][axis] for mesh in meshes) for axis in range(3)]},
            'images': entry['images'], 'geometryAudit': audit,
            'reviewStatus': provenance.get('reviewStatus', 'unreviewed'),
        }
        atomic_json(public / 'renders/current' / f'{room}.json', result)
    print('CURRENT_ROOM_PUBLISHED', room, job, flush=True)
    return result
