"""Dependency-free checks for exact editable-scene exports and published stills."""
import hashlib
import json
import math
from pathlib import Path
import re
import struct
import zipfile

MAX_GLB = 512 * 1024 * 1024
ROOM = re.compile(r'[a-z][a-z0-9-]{0,63}')


def sha256(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def vector(value, count=3):
    return isinstance(value, list) and len(value) == count and all(
        type(x) in (int, float) and math.isfinite(x) and abs(x) <= 10000 for x in value)


def validate_capture(data):
    if not isinstance(data, dict) or data.get('schema') != 'a501.archviz-source' or type(data.get('version')) is not int or data['version'] != 1:
        raise ValueError('Unsupported archviz capture')
    if data.get('units') != 'metres' or data.get('axes') != 'GLTF_Y_UP':
        raise ValueError('Expected glTF Y-up metres')
    if not isinstance(data.get('room'), str) or not ROOM.fullmatch(data['room']):
        raise ValueError('Invalid room')
    if not isinstance(data.get('glbSha256'), str) or not re.fullmatch('[a-f0-9]{64}', data['glbSha256']):
        raise ValueError('Missing model checksum')
    scale = data.get('metresPerSourceUnit')
    if type(scale) not in (int, float) or not math.isfinite(scale) or scale <= 0:
        raise ValueError('Invalid source scale')
    meshes, ids = data.get('meshes'), set()
    if not isinstance(meshes, list) or not 1 <= len(meshes) <= 50000:
        raise ValueError('Expected 1-50,000 meshes')
    for mesh in meshes:
        if not isinstance(mesh, dict) or not isinstance(mesh.get('id'), str) or not mesh['id'] or mesh['id'] in ids:
            raise ValueError('Missing or duplicate mesh ID')
        ids.add(mesh['id'])
        if not vector(mesh.get('min')) or not vector(mesh.get('max')) or any(a > b for a, b in zip(mesh['min'], mesh['max'])):
            raise ValueError('Invalid mesh bounds')
        if type(mesh.get('triangles')) is not int or mesh['triangles'] < 1:
            raise ValueError('Invalid triangle count')
    camera = data.get('camera', {})
    if not vector(camera.get('position')) or not vector(camera.get('quaternion'), 4):
        raise ValueError('Invalid camera pose')
    if abs(sum(x*x for x in camera['quaternion']) - 1) > .001:
        raise ValueError('Camera quaternion must be normalized')
    if type(camera.get('aspect')) not in (int, float) or not .1 <= camera['aspect'] <= 10:
        raise ValueError('Invalid camera aspect')
    if camera.get('type') == 'perspective':
        if type(camera.get('fov')) not in (int, float) or not 0 < camera['fov'] < 175:
            raise ValueError('Invalid field of view')
    elif camera.get('type') == 'orthographic':
        if type(camera.get('verticalSpan')) not in (int, float) or not 0 < camera['verticalSpan'] <= 1000:
            raise ValueError('Invalid orthographic camera')
    else:
        raise ValueError('Unsupported camera')
    return data


def blender_bounds(lo, hi):
    """glTF (x,y,z) -> Blender (x,-z,y), with min/max ordering retained."""
    return [lo[0], -hi[2], lo[1]], [hi[0], -lo[2], hi[1]]


def inspect_glb(path):
    path = Path(path)
    if not 20 <= path.stat().st_size <= MAX_GLB:
        raise ValueError('Invalid GLB size')
    with path.open('rb') as stream:
        magic, version, size, length, kind = struct.unpack('<4sIIII', stream.read(20))
        if magic != b'glTF' or version != 2 or size != path.stat().st_size or kind != 0x4e4f534a or length > min(size-20, 32*1024*1024):
            raise ValueError('Invalid glTF header')
        data = json.loads(stream.read(length))
    for item in data.get('buffers', []) + data.get('images', []):
        if 'uri' in item:
            raise ValueError('Only embedded buffers/textures are accepted; external resources are forbidden')
    if data.get('animations') or data.get('skins'):
        raise ValueError('Capture a static room, not an animation')
    if any('KHR_materials_unlit' in m.get('extensions', {}) and 'baked' in m.get('name', '').lower() for m in data.get('materials', [])):
        raise ValueError('Baked illumination is not a relightable source')
    return data


def load_bundle(source, temporary):
    """Read only fixed filenames; never extract an untrusted archive wholesale."""
    source, temporary = Path(source), Path(temporary)
    if source.is_dir():
        folder = source
    elif source.suffix.lower() == '.zip':
        folder = temporary
        with zipfile.ZipFile(source) as archive:
            for name, limit in [('scene.json', 32*1024*1024), ('scene.glb', MAX_GLB)]:
                matches = [item for item in archive.infolist() if item.filename == name]
                if len(matches) != 1 or matches[0].file_size > limit:
                    raise ValueError(f'Missing, duplicate or oversized {name}')
                # Bound decompressed data independently of the declared ZIP size.
                with archive.open(name) as stream, (folder/name).open('wb') as output:
                    remaining = limit
                    while chunk := stream.read(min(1024*1024, remaining+1)):
                        remaining -= len(chunk)
                        if remaining < 0:
                            raise ValueError('Oversized archive entry')
                        output.write(chunk)
    else:
        raise ValueError('Pass an exported ZIP or its extracted folder')
    manifest_path, glb = folder/'scene.json', folder/'scene.glb'
    if manifest_path.stat().st_size > 32*1024*1024:
        raise ValueError('Oversized capture metadata')
    data = validate_capture(json.loads(manifest_path.read_text(encoding='utf-8-sig')))
    if sha256(glb) != data['glbSha256']:
        raise ValueError('The model and capture checksum disagree. Re-export the room.')
    inspect_glb(glb)
    return data, glb


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.json.tmp')
    temp.write_text(json.dumps(value, indent=2, allow_nan=False)+'\n', encoding='utf-8')
    temp.replace(path)


def png_dimensions(path):
    with Path(path).open('rb') as stream:
        header = stream.read(24)
    if len(header) != 24 or header[:8] != b'\x89PNG\r\n\x1a\n' or header[12:16] != b'IHDR':
        raise ValueError(f'Not a PNG: {path}')
    return list(struct.unpack('>II', header[16:24]))


def validate_outputs(public):
    """Check provenance and every image, without claiming visual acceptance."""
    public = Path(public).resolve()
    gallery = json.loads((public/'renders/archviz/manifest.json').read_text())
    if gallery.get('schema') != 'a501.archviz-gallery' or gallery.get('version') != 1 or not gallery.get('renders'):
        raise ValueError('Invalid/empty gallery')
    checked = 0
    for entry in gallery['renders']:
        job = entry.get('job', '')
        if not re.fullmatch('[a-f0-9]{16}', job):
            raise ValueError('Invalid render job')
        folder = public/'renders/archviz'/job
        provenance = json.loads((folder/'provenance.json').read_text())
        if provenance['room'] != entry['room'] or provenance['job'] != job or provenance['images'] != entry['images']:
            raise ValueError('Gallery refers to inconsistent provenance')
        for image in provenance['images']:
            if not re.fullmatch(r'/renders/archviz/'+job+r'/[a-z0-9-]+\.png', image['url']):
                raise ValueError('Unsafe image path')
            path = public/image['url'].lstrip('/')
            if not path.resolve().is_relative_to(public) or sha256(path) != image['sha256'] or png_dimensions(path) != image['size']:
                raise ValueError(f'Image integrity failure: {path}')
            checked += 1
    return checked
