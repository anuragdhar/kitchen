"""Sequential room renderer. No server endpoint executes Blender; no extra .bat file.

python scripts/render_archviz_rooms.py --export-defaults --rooms kitchen,balcony,bedroom3
Export current user-edited layouts through Interior studio instead of --export-defaults.
"""
import argparse
import glob
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "blender"))
from archviz_profiles import load_profiles
from archviz_contract import load_bundle
from archviz_current_room import PARITY_ROOMS, publish_current_room


def find_blender(explicit):
    candidate = explicit or os.environ.get('BLENDER_EXE') or shutil.which('blender')
    if candidate:
        return candidate
    if os.name == 'nt':
        candidates = glob.glob(os.path.join(os.environ.get('ProgramFiles','C:/Program Files'),'Blender Foundation','Blender *','blender.exe'))
        if candidates:
            return max(candidates,key=os.path.getmtime)
    raise FileNotFoundError('Blender not found. Pass --blender "C:/.../blender.exe" or set BLENDER_EXE.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--rooms',default='kitchen,balcony,bedroom3')
    parser.add_argument('--input',type=Path,default=ROOT/'blender/archviz-input')
    parser.add_argument('--quality',choices=['draft','final','portfolio'],default='draft')
    parser.add_argument('--device',choices=['AUTO','CPU','OPTIX','CUDA','HIP','ONEAPI','METAL'],default='AUTO')
    parser.add_argument('--blender')
    parser.add_argument('--public',type=Path,default=ROOT/'react-configurator/public',help='Separate output root for worker runs')
    parser.add_argument('--export-defaults',action='store_true',help='Capture repository defaults, NOT current browser edits')
    args = parser.parse_args()
    profiles = load_profiles(ROOT/'configs/archviz-profiles.json')['rooms']
    rooms = args.rooms.split(',')
    if len(rooms) != len(set(rooms)) or any(room not in profiles for room in rooms):
        parser.error('Unknown or repeated room')
    blender = find_blender(args.blender)
    requires_bundle = lambda room: room in PARITY_ROOMS or not profiles[room].get('native')
    if args.export_defaults:
        defaults = [room for room in rooms if requires_bundle(room)]
        # Never overwrite a user-exported package with a default-state export.
        defaults_folder = args.input/'repository-defaults'
        if defaults:
            node = shutil.which('node')
            if not node:
                raise FileNotFoundError('Install Node 22 first')
            subprocess.run([node,str(ROOT/'react-configurator/scripts/export-archviz-rooms.mjs'),'--rooms',','.join(defaults),'--output',str(defaults_folder)],cwd=ROOT,check=True)
    else:
        defaults_folder = None
    jobs, missing = [], []
    for room in rooms:
        bundle = args.input/f'A501-{room}-archviz.zip'
        if args.export_defaults and requires_bundle(room):
            bundle = defaults_folder/bundle.name
        source = ['--bundle',str(bundle),'--room',room] if bundle.is_file() else ['--room',room] if not requires_bundle(room) else None
        if source is None:
            missing.append(str(bundle))
        else:
            jobs.append((room,source,bundle))
    if missing:
        raise FileNotFoundError('Export these current designs through Interior studio first (or explicitly use --export-defaults):\n'+'\n'.join(missing))
    # Fail before starting any Blender job when a ZIP contains the wrong room.
    for room,source,bundle in jobs:
        if room in PARITY_ROOMS:
            with tempfile.TemporaryDirectory(prefix='a501-room-input-') as temporary:
                capture,_ = load_bundle(bundle,temporary)
                if capture['room'] != room or capture.get('sceneId') != room:
                    raise ValueError(f'{room} requires its own editable workspace export; whole-home and other rooms are not substitutes')
    for index,(room,source,bundle) in enumerate(jobs,1):
        print(f'ROOM {index}/{len(jobs)}: {room}',flush=True)
        subprocess.run([blender,'--background','--python-exit-code','1','--python',str(ROOT/'blender/render_archviz.py'),'--',*source,'--quality',args.quality,'--device',args.device,'--public',str(args.public.resolve())],cwd=ROOT,check=True)
        # Pair the exact audited input model with these completed Cycles stills.
        # The viewer must never fall back to the older clipped whole-home bake.
        publish_current_room(args.public,room,bundle)
    subprocess.run([sys.executable,str(ROOT/'blender/validate_archviz_outputs.py'),'--public',str(args.public.resolve())],cwd=ROOT,check=True)
    print('All requested room jobs completed. Reload the room Blender model/render views or Interior studio > Blender export.',flush=True)


if __name__=='__main__':
    main()
