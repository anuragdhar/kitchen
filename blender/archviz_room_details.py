"""Fixed-path, trusted repository extensions. This is NOT a Python sandbox."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
from archviz_profiles import ROOM_ID


def apply_room_details(scene, room, profile, root, signature):
    """Extensions may add named meshes and shade originals, not move/delete them.

    signature is supplied by the renderer; checks use its authored mesh contract.
    Arbitrary extension code is reviewed source code, never a path from a bundle.
    """
    if not isinstance(room, str) or not ROOM_ID.fullmatch(room):
        raise ValueError('Invalid detail room')
    folder = (Path(root) / 'blender/archviz/rooms').resolve()
    path = folder / f'{room}.py'
    before = signature(scene)
    report = {'moduleSha256': None, 'changes': [], 'addedMeshes': []}
    if not path.exists():
        return report
    if path.resolve().parent != folder:
        raise ValueError('Detail module must stay in its canonical folder')
    source = path.read_bytes()
    report['moduleSha256'] = hashlib.sha256(source).hexdigest()
    spec = importlib.util.spec_from_file_location(f'a501_detail_{room.replace("-", "_")}', path)
    module = importlib.util.module_from_spec(spec)
    # Execute source bytes rather than a timestamp-based .pyc: the hash must
    # describe the code actually executed even during rapid same-size edits.
    exec(compile(source, str(path), 'exec'), module.__dict__)
    callback = getattr(module, 'apply', None)
    if not callable(callback):
        raise ValueError('Detail module must define apply(scene, profile)')
    changes = callback(scene, copy.deepcopy(profile))
    if not isinstance(changes, list) or len(changes) > 1000 or any(not isinstance(c, dict) for c in changes):
        raise ValueError('Detail changes must be a list of JSON objects')
    if len(json.dumps(changes, allow_nan=False)) > 256 * 1024:
        raise ValueError('Detail report too large')
    # Blender world matrices must be evaluated before checking transforms.
    update = getattr(scene, 'view_layers', None)
    if update is not None:
        for layer in update:
            layer.update()
    after = signature(scene)
    if any(after.get(name) != old for name, old in before.items()):
        raise AssertionError('Room details changed authored mesh geometry, visibility or transforms')
    added = sorted(set(after) - set(before))
    if any(not name.startswith(f'ArchvizDetail | {room} | ') for name in added):
        raise AssertionError('Added meshes must use the room-specific ArchvizDetail prefix')
    report.update(changes=changes, addedMeshes=added)
    return report
