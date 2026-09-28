"""Dependency-free validation for render-only jobs; coordinates are Blender metres."""
import json
import math
import re
from pathlib import Path

SIZES = {
    'ceramic-vase': (.14, .14, .22),
    'wooden-bowl': (.26, .26, .09),
    'books': (.28, .20, .07),
    'planter': (.24, .24, .38),
}
PRESETS = {'day': (.30, .65), 'evening': (.06, 1.0), 'night': (.015, .70)}
QUALITY = {'draft': (960, 540, 32), 'final': (1920, 1080, 192)}


def validate_job(job):
    if not isinstance(job, dict) or job.get('schema') != 'a501.whole-home-render' or type(job.get('version')) is not int or job['version'] != 1:
        raise ValueError('Unsupported whole-home render job')
    if job.get('units') != 'metres' or job.get('axes') != 'BLENDER_Z_UP':
        raise ValueError('Expected Blender Z-up coordinates in metres')
    if not isinstance(job.get('preset'), str) or not isinstance(job.get('quality'), str) or job['preset'] not in PRESETS or job['quality'] not in QUALITY:
        raise ValueError('Unknown quality or lighting preset')
    rooms = job.get('rooms')
    if not isinstance(rooms, list) or not 1 <= len(rooms) <= 32:
        raise ValueError('Expected 1-32 rooms')
    ids, supports = set(), set()
    for room in rooms:
        if not isinstance(room, dict):
            raise ValueError('Invalid room')
        key = room.get('id')
        if not isinstance(key, str) or not re.fullmatch(r'[a-z][a-z0-9-]{0,63}', key) or key in ids:
            raise ValueError('Invalid or duplicate room ID')
        ids.add(key)
        if not isinstance(room.get('name'), str) or not 1 <= len(room['name']) <= 200:
            raise ValueError('Invalid room name')
        b = room.get('bounds')
        if not isinstance(b, list) or len(b) != 4 or any(type(v) not in (int, float) or not math.isfinite(v) or abs(v) > 1000 for v in b):
            raise ValueError('Invalid room bounds')
        if b[2] - b[0] < .25 or b[3] - b[1] < .25:
            raise ValueError('Room bounds are empty or too narrow')
        artifacts = room.get('artifacts')
        if not isinstance(artifacts, list) or len(artifacts) > 4:
            raise ValueError('Expected at most four artifacts per room')
        for item in artifacts:
            if not isinstance(item, dict) or not isinstance(item.get('kind'), str) or item['kind'] not in SIZES:
                raise ValueError('Unknown artifact')
            support = item.get('support')
            if not isinstance(support, str) or not support.strip() or len(support) > 200 or support in supports:
                raise ValueError('Missing or repeated support surface')
            supports.add(support)
    return job


def load_job(path):
    path = Path(path)
    if path.stat().st_size > 200_000:
        raise ValueError('Render job exceeds 200 KB')
    return validate_job(json.loads(path.read_text(encoding='utf-8-sig')))


def support_fits(bounds, room_bounds, kind, margin=.025):
    """Conservative footprint test; actual mesh support is ray-tested in Blender."""
    lo, hi = bounds
    w, d, _ = SIZES[kind]
    x, y = (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2
    a, b, c, e = room_bounds
    return (hi[0] - lo[0] >= w + 2 * margin and hi[1] - lo[1] >= d + 2 * margin
            and .4 <= hi[2] <= 1.3 and a + w/2 + margin <= x <= c - w/2 - margin
            and b + d/2 + margin <= y <= e - d/2 - margin)
