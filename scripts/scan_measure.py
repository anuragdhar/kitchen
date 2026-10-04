"""Measure a room from a phone scan (Scaniverse .glb: one textured triangle mesh, metres, y up).

Needs Python 3 with numpy and Pillow. Work in a scratch folder OUT; nothing is written into the repository.

  python scripts/scan_measure.py prepare "C:/Users/me/Downloads/Scaniverse x.glb" OUT
      Rotates the mesh so the walls line up with the axes, samples a coloured point cloud (about 5 mm spacing) and writes
      OUT/info.json (rotation, floor and ceiling heights, extents) and three top-down plans with a 1 m grid in SCAN
      coordinates: plan_walls.png (wall slice 1-2 m high), plan_low.png (looking down, below 1.5 m),
      plan_ceiling.png (looking up at everything above 2 m).
  python scripts/scan_measure.py surfaces OUT --box xa,xb,ya,yb,za,zb [--dirs +x,-x,+y,-y,+z,-z] [--min 300]
      Flat surfaces inside the box, per facing direction: position of each along its normal (5 mm bins) and point count.
      Use it for wall faces, door jambs, sills, door heads and beam soffits.
  python scripts/scan_measure.py elev OUT name --axis x|z --plane P --look 1|-1 --lo A --hi B [--origin O] [--depth -0.25,0.2]
      Textured elevation of the wall on the plane x = P (axis x) or z = P (axis z), seen by a viewer looking toward + or -
      that axis, between A and B along the wall. The ruler is in mm from --origin (default A). 300 px per metre.
  python scripts/scan_measure.py ceil OUT name --box xa,xb,za,zb
      Ceiling seen as a plan (same way up as plan_ceiling.png), 250 px per metre, ruler in mm from the box's (xa, za) corner.

The scan frame after `prepare` is right-handed with y up; which of +x / +z is east or south is NOT known to this tool.
Fix it from the plan (a door, a window, a neighbouring room) and write it down with the measurements.
Phone LiDAR is usually good to 1-2 %: room sizes +/- 30-50 mm, small items +/- 20 mm. Thin or moving things (fan blades,
chandeliers) are usually flattened into the ceiling. Worked example: docs/SITE_SCAN_2026-10-04.md.
"""
import argparse, json, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

Image.MAX_IMAGE_PIXELS = None
YELLOW, GRID = (255, 255, 0), (90, 90, 40)


def read_glb(path):
    data = Path(path).read_bytes()
    length = struct.unpack('<I', data[12:16])[0]
    gltf, binary = json.loads(data[20:20 + length]), data[20 + length + 8:]
    views = gltf['bufferViews']
    def view(i): v = views[i]; return binary[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    prim, acc = gltf['meshes'][0]['primitives'][0], gltf['accessors']
    if len(gltf['meshes']) != 1 or len(gltf['meshes'][0]['primitives']) != 1: sys.exit('expected one mesh with one primitive')
    def array(index, dtype, width):
        a = acc[index]; raw = view(a['bufferView'])[a.get('byteOffset', 0):]
        return np.frombuffer(raw, dtype, a['count'] * width).reshape(-1, width)
    V = array(prim['attributes']['POSITION'], '<f4', 3).astype(np.float64)
    UV = array(prim['attributes']['TEXCOORD_0'], '<f4', 2).astype(np.float64)
    index = acc[prim['indices']]
    F = array(prim['indices'], {5125: '<u4', 5123: '<u2'}[index['componentType']], 1).reshape(-1, 3).astype(np.int64)
    return V, UV, F, view(gltf['images'][0]['bufferView'])


def face_frames(V, F):
    a, b, c = V[F[:, 0]], V[F[:, 1]], V[F[:, 2]]
    n = np.cross(b - a, c - a); area = np.linalg.norm(n, axis=1) / 2
    return a, b, c, n / (2 * area[:, None] + 1e-12), area


def sample(V, UV, F, tex, faces, density, rng):
    a, b, c, _, area = face_frames(V, F[faces])
    idx = np.repeat(np.arange(len(faces)), rng.poisson(area * density))
    r1, r2 = np.sqrt(rng.random(len(idx))), rng.random(len(idx))
    w = np.stack([1 - r1, r1 * (1 - r2), r1 * r2], 1); f = F[faces][idx]
    P = w[:, :1] * a[idx] + w[:, 1:2] * b[idx] + w[:, 2:] * c[idx]
    uv = w[:, :1] * UV[f[:, 0]] + w[:, 1:2] * UV[f[:, 1]] + w[:, 2:] * UV[f[:, 2]]
    H, W = tex.shape[:2]
    colour = tex[np.clip((uv[:, 1] * H).astype(int), 0, H - 1), np.clip((uv[:, 0] * W).astype(int), 0, W - 1)]
    return P, colour, idx


def peaks(values, lo, hi, minimum, step=0.005, top=6):
    h, e = np.histogram(values, bins=np.arange(lo, hi + step, step)); found = []
    for i in np.argsort(h)[::-1]:
        if h[i] < minimum or len(found) >= top: break
        centre = e[i] + step / 2
        if all(abs(centre - f[0]) > 0.025 for f in found): found.append((round(float(centre), 3), int(h[i])))
    return sorted(found)


def load(out):
    out = Path(out); m = np.load(out / 'mesh.npz')
    return out, m['V'], m['UV'], m['F'], np.asarray(Image.open(out / 'texture.jpg').convert('RGB'))


def prepare(args):
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    V, UV, F, jpeg = read_glb(args.glb); (out / 'texture.jpg').write_bytes(jpeg)
    *_, n, area = face_frames(V, F)
    vertical = np.abs(n[:, 1]) < 0.15
    angle = np.degrees(np.arctan2(n[vertical, 2], n[vertical, 0])) % 90
    h, e = np.histogram(angle, bins=np.arange(0, 90.1, 0.1), weights=area[vertical])
    wrapped = np.convolve(np.concatenate([h[-4:], h, h[:4]]), np.ones(9), 'valid')
    theta = np.radians(e[np.argmax(wrapped)] + 0.05)
    R = np.array([[np.cos(theta), 0, np.sin(theta)], [0, 1, 0], [-np.sin(theta), 0, np.cos(theta)]])
    V = V @ R.T; np.savez(out / 'mesh.npz', V=V, UV=UV, F=F)
    tex = np.asarray(Image.open(out / 'texture.jpg').convert('RGB'))
    P, C, idx = sample(V, UV, F, tex, np.arange(len(F)), 40000, np.random.default_rng(0))
    N = face_frames(V, F)[3][idx].astype(np.float32)
    np.savez(out / 'cloud.npz', P=P.astype(np.float32), C=C, N=N)
    y = P[:, 1]
    info = {'source': str(args.glb), 'rotationDegrees': round(float(np.degrees(theta)), 2), 'vertices': len(V), 'faces': len(F),
            'min': [round(float(v), 3) for v in V.min(0)], 'max': [round(float(v), 3) for v in V.max(0)],
            'floorCandidates': peaks(y[(N[:, 1] > 0.9) & (y < 0.5)], -0.5, 0.5, 2000),
            'ceilingCandidates': peaks(y[(N[:, 1] < -0.9) & (y > 1.9)], 1.9, 3.6, 2000)}
    (out / 'info.json').write_text(json.dumps(info, indent=1)); print(json.dumps(info, indent=1))
    S = 100; x0, z0 = np.floor(V[:, 0].min()) - 0.2, np.floor(V[:, 2].min()) - 0.2
    W, H = int((V[:, 0].max() - x0 + 0.4) * S), int((V[:, 2].max() - z0 + 0.4) * S)
    def grid(im, colour):
        d = ImageDraw.Draw(im)
        for g in range(int(np.ceil(x0)), int(x0 + W / S) + 1): X = int((g - x0) * S); d.line([(X, 0), (X, H)], fill=colour); d.text((X + 2, 2), str(g), fill=YELLOW if colour != (255, 180, 180) else (255, 0, 0))
        for g in range(int(np.ceil(z0)), int(z0 + H / S) + 1): Z = int((g - z0) * S); d.line([(0, Z), (W, Z)], fill=colour); d.text((2, Z + 2), str(g), fill=YELLOW if colour != (255, 180, 180) else (255, 0, 0))
        return im
    def splat(mask, lowest_wins, name):
        order = np.argsort(y[mask]); order = order[::-1] if lowest_wins else order
        ix, iz = ((P[mask][order, 0] - x0) * S).astype(int), ((P[mask][order, 2] - z0) * S).astype(int)
        image = np.full((H, W, 3), 30, np.uint8); image[iz, ix] = C[mask][order]
        grid(Image.fromarray(image), (90, 90, 90)).save(out / name)
    splat(y < 1.5, False, 'plan_low.png'); splat(y > 2.0, True, 'plan_ceiling.png')
    wall = (y > 1.0) & (y < 2.0) & (np.abs(N[:, 1]) < 0.3)
    density = np.zeros((H, W)); np.add.at(density, (((P[wall, 2] - z0) * S).astype(int), ((P[wall, 0] - x0) * S).astype(int)), 1)
    grey = (255 - np.clip(density / max(density.max(), 1) * 6, 0, 1) * 255).astype(np.uint8)
    grid(Image.fromarray(grey).convert('RGB'), (255, 180, 180)).save(out / 'plan_walls.png')
    print('wrote', out / 'plan_walls.png', out / 'plan_low.png', out / 'plan_ceiling.png', '(x to the right, z downward, 1 m grid)')


def surfaces(args):
    d = np.load(Path(args.out) / 'cloud.npz'); P, N = d['P'], d['N']
    xa, xb, ya, yb, za, zb = map(float, args.box.split(','))
    inside = (P[:, 0] > xa) & (P[:, 0] < xb) & (P[:, 1] > ya) & (P[:, 1] < yb) & (P[:, 2] > za) & (P[:, 2] < zb)
    for name in args.dirs.split(','):
        axis, sign = 'xyz'.index(name[1]), 1 if name[0] == '+' else -1
        values = P[inside & (N[:, axis] * sign > 0.85), axis]
        lo, hi = [(xa, xb), (ya, yb), (za, zb)][axis]
        print(f'faces {name}: (position m, points)', peaks(values, lo, hi, args.min) or 'none')


def elev(args):
    out, V, UV, F, tex = load(args.out); S = 300
    axis, along = (0, 2) if args.axis == 'x' else (2, 0)
    behind, front = map(float, args.depth.split(',')); origin = args.lo if args.origin is None else args.origin
    centre = (V[F[:, 0]] + V[F[:, 1]] + V[F[:, 2]]) / 3
    distance = (args.plane - centre[:, axis]) * args.look  # positive is toward the viewer
    chosen = np.nonzero((distance > behind) & (distance < front) & (centre[:, along] > args.lo - 0.3) & (centre[:, along] < args.hi + 0.3))[0]
    P, colour, _ = sample(V, UV, F, tex, chosen, 250000, np.random.default_rng(1))
    order = np.argsort((args.plane - P[:, axis]) * args.look)
    right = {(0, 1): 1, (0, -1): -1, (2, 1): -1, (2, -1): 1}[(axis, args.look)]  # which way the wall coordinate grows on screen
    left_edge = args.lo if right > 0 else args.hi; top = 2.9
    px = ((P[:, along] - left_edge) * right * S).astype(int) + 40; py = ((top - P[:, 1]) * S).astype(int) + 20
    W, H = int((args.hi - args.lo) * S) + 80, int((top + 0.25) * S) + 60
    ok = (px >= 0) & (px < W) & (py >= 0) & (py < H); image = np.full((H, W, 3), 25, np.uint8)
    keep = order[ok[order]]; image[py[keep], px[keep]] = colour[keep]
    im = Image.fromarray(image); d = ImageDraw.Draw(im)
    first = int(np.ceil((args.lo - origin) * 4)) * 250
    for t in range(first, int((args.hi - origin) * 1000) + 1, 250):
        X = int((origin + t / 1000 - left_edge) * right * S) + 40
        d.line([(X, H - 40), (X, H - (28 if t % 500 == 0 else 34))], fill=YELLOW)
        if t % 500 == 0: d.line([(X, 20), (X, H - 40)], fill=GRID); d.text((X - 12, H - 26), str(t), fill=YELLOW)
    for t in range(0, 2900, 500):
        Y = int((top - t / 1000) * S) + 20; d.line([(40, Y), (W - 40, Y)], fill=GRID); d.text((2, Y - 5), str(t), fill=YELLOW)
    im.save(out / f'{args.name}.png'); print('wrote', out / f'{args.name}.png', im.size, '(ruler mm; heights are scan y, subtract the floor height from info.json)')


def ceil(args):
    out, V, UV, F, tex = load(args.out); S, pad = 250, 0.15
    xa, xb, za, zb = map(float, args.box.split(','))
    centre = (V[F[:, 0]] + V[F[:, 1]] + V[F[:, 2]]) / 3
    chosen = np.nonzero((centre[:, 0] > xa - 0.4) & (centre[:, 0] < xb + 0.4) & (centre[:, 2] > za - 0.4) & (centre[:, 2] < zb + 0.4) & (centre[:, 1] > 2.0))[0]
    P, colour, _ = sample(V, UV, F, tex, chosen, 180000, np.random.default_rng(2))
    order = np.argsort(P[:, 1])[::-1]  # the lowest point is written last, as seen from below
    px = ((P[:, 0] - xa + pad) * S).astype(int) + 40; pz = ((P[:, 2] - za + pad) * S).astype(int) + 20
    W, H = int((xb - xa + 2 * pad) * S) + 60, int((zb - za + 2 * pad) * S) + 50
    ok = (px >= 0) & (px < W) & (pz >= 0) & (pz < H); image = np.full((H, W, 3), 25, np.uint8)
    keep = order[ok[order]]; image[pz[keep], px[keep]] = colour[keep]
    im = Image.fromarray(image); d = ImageDraw.Draw(im)
    for t in range(0, int((xb - xa) * 1000) + 1, 500): X = int((t / 1000 + pad) * S) + 40; d.line([(X, 20), (X, H - 30)], fill=GRID); d.text((X - 10, H - 22), str(t), fill=YELLOW)
    for t in range(0, int((zb - za) * 1000) + 1, 500): Z = int((t / 1000 + pad) * S) + 20; d.line([(40, Z), (W - 20, Z)], fill=GRID); d.text((2, Z - 5), str(t), fill=YELLOW)
    im.save(out / f'{args.name}.png'); print('wrote', out / f'{args.name}.png', im.size, '(ruler mm from the xa, za corner)')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('prepare'); p.add_argument('glb'); p.add_argument('out'); p.set_defaults(run=prepare)
    p = sub.add_parser('surfaces'); p.add_argument('out'); p.add_argument('--box', required=True); p.add_argument('--dirs', default='+x,-x,+y,-y,+z,-z'); p.add_argument('--min', type=int, default=300); p.set_defaults(run=surfaces)
    p = sub.add_parser('elev'); p.add_argument('out'); p.add_argument('name'); p.add_argument('--axis', choices=['x', 'z'], required=True)
    p.add_argument('--plane', type=float, required=True); p.add_argument('--look', type=int, choices=[1, -1], required=True)
    p.add_argument('--lo', type=float, required=True); p.add_argument('--hi', type=float, required=True); p.add_argument('--origin', type=float); p.add_argument('--depth', default='-0.25,0.2'); p.set_defaults(run=elev)
    p = sub.add_parser('ceil'); p.add_argument('out'); p.add_argument('name'); p.add_argument('--box', required=True); p.set_defaults(run=ceil)
    args = parser.parse_args(); args.run(args)


if __name__ == '__main__':
    main()
