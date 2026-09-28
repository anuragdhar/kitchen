"""Apply one trusted room patch ZIP in an isolated local Git worktree.

The ZIP may contain patch-*.js programs. They run as the current Windows user;
only drop patches from a trusted source into PatchToApply.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ROOMS = ('bedroom1-balcony', 'bedroom3', 'bedroom1', 'balcony', 'drawing',
         'kitchen', 'study', 'lobby', 'pooja', 'storage', 'entry')
MAX_ZIP = 100 * 1024**2
MAX_UNPACKED = 250 * 1024**2


def call(args, cwd, timeout=600, env=None):
    result = subprocess.run([str(arg) for arg in args], cwd=cwd, text=True,
                            encoding='utf-8', errors='replace', capture_output=True,
                            timeout=timeout, env=env)
    if result.returncode:
        raise RuntimeError(f'{Path(str(args[0])).name} exited {result.returncode}: '
                           f'{(result.stdout + result.stderr)[-3000:]}')
    return result.stdout.rstrip('\r\n')


def room_for_patch(filename, manifest):
    room = manifest.get('room')
    if room is not None:
        if room not in ROOMS: raise ValueError('Patch manifest has an unsupported room')
        return room
    name = filename.lower().replace('_', '-')
    matches = [room for room in ROOMS if re.search(r'(?<![a-z0-9])' + re.escape(room) + r'(?![a-z0-9])', name)]
    matches = [room for room in matches if not any(room != other and room in other for other in matches)]
    if len(matches) != 1: raise ValueError('Specify exactly one room in patch-manifest.json as "room"')
    return matches[0]


def inspect_zip(archive):
    if archive.stat().st_size > MAX_ZIP: raise ValueError('Patch ZIP exceeds 100 MiB')
    with zipfile.ZipFile(archive) as zip_file:
        members = [entry for entry in zip_file.infolist() if not entry.is_dir()]
        if not members or len(members) > 1000 or sum(entry.file_size for entry in members) > MAX_UNPACKED:
            raise ValueError('Patch has too many files or exceeds 250 MiB unpacked')
        names = []
        for entry in members:
            path = PurePosixPath(entry.filename)
            if (entry.filename.startswith(('/', '\\')) or '\\' in entry.filename or
                    ':' in entry.filename or '..' in path.parts or
                    (len(path.parts) < 2 and entry.filename != 'patch-manifest.json') or
                    path.parts[0] in ('.git', '.github', 'PatchToApply', 'render-review') or
                    ((entry.external_attr >> 16) & 0o170000) == 0o120000):
                raise ValueError(f'Unsafe patch path: {entry.filename}')
            names.append(entry.filename)
        if len(names) != len(set(names)) or names.count('patch-manifest.json') != 1:
            raise ValueError('Patch needs one root patch-manifest.json and unique paths')
        manifest = json.loads(zip_file.read('patch-manifest.json'))
        room = room_for_patch(archive.name, manifest)
        return room, members


def apply_files(archive, checkout, node):
    room, members = inspect_zip(archive)
    scripts = []
    with zipfile.ZipFile(archive) as zip_file:
        for entry in members:
            name = entry.filename
            if name == 'patch-manifest.json': continue
            target = checkout / name
            if not target.resolve().is_relative_to(checkout.resolve()):
                raise ValueError(f'Patch escaped checkout: {name}')
            is_script = target.name.startswith('patch-') and target.suffix == '.js'
            if is_script and target.exists(): raise ValueError(f'Patch script would overwrite source: {name}')
            target.parent.mkdir(parents=True, exist_ok=True)
            with zip_file.open(entry) as source, target.open('wb') as output:
                shutil.copyfileobj(source, output)
            if is_script: scripts.append(target)
    try:
        for script in scripts:
            print('PATCH_SCRIPT', script.relative_to(checkout), flush=True)
            print(call([node, script], checkout), flush=True)
    finally:
        for script in scripts:
            if script.is_file(): script.unlink()
    return room


def changed_paths(checkout):
    entries = call(['git', 'status', '--porcelain=v1', '-z', '-uall'], checkout).split('\0')
    return [entry[3:] for entry in entries if entry]


def apply_patch(archive, source_repo, workspace, node, check_only=False):
    archive, source_repo, workspace = archive.resolve(), source_repo.resolve(), workspace.resolve()
    if archive.parent != (ROOT / 'PatchToApply').resolve() or archive.suffix.lower() != '.zip':
        raise ValueError('Patch must be a ZIP directly inside PatchToApply')
    workspace.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    run = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + digest[:12]
    checkout = workspace / run / 'checkout'
    if not checkout.resolve().is_relative_to(workspace): raise ValueError('Invalid patch worktree path')
    sha = call(['git', 'rev-parse', 'refs/remotes/origin/main'], source_repo)
    checkout.parent.mkdir(parents=True)
    call(['git', 'worktree', 'add', '--detach', checkout, sha], source_repo)
    try:
        room = apply_files(archive, checkout, node)
        changes = changed_paths(checkout)
        if any(path.startswith(('PatchToApply/', 'render-review/', '.github/')) or path == 'configs/render-worker-job.json' for path in changes):
            raise ValueError('Patch changed worker controls or review files')
        if any(path.endswith(('.bak', '.bak-realism')) for path in changes):
            raise ValueError('Patch left backup files in source; remove them from the ZIP script')
        tracked = [path for path in call(['git', 'diff', '--name-only', '-z'], checkout).split('\0') if path]
        if not tracked:
            raise ValueError('Patch did not change an active tracked source file; new files alone are not connected to a room')
        if not any(path.startswith(('react-configurator/src/', 'blender/', 'configs/archviz/')) for path in tracked):
            raise ValueError('Patch did not modify an active room source')
        call(['git', 'diff', '--check'], checkout)
        if check_only:
            print('PATCH_CHECK_ONLY', room, ', '.join(changes), flush=True)
            return room
        app = checkout / 'react-configurator'
        npm = Path(node).parent / 'node_modules/npm/bin/npm-cli.js'
        if not npm.is_file(): raise FileNotFoundError('Node 22 npm-cli.js not found')
        npm_env = dict(os.environ)
        npm_env['PATH'] = str(Path(node).parent) + os.pathsep + npm_env.get('PATH', '')
        print('PATCH_TEST npm ci', flush=True)
        call([node, npm, 'ci', '--no-audit', '--no-fund'], app, env=npm_env)
        print('PATCH_TEST npm run check', flush=True)
        call([node, npm, 'run', 'check'], app, env=npm_env)
        job_path = checkout / 'configs/render-worker-job.json'
        job = json.loads(job_path.read_text(encoding='utf-8'))
        job['rooms'] = [room]
        job['request'] = 'patch-' + digest[:16]
        job_path.write_text(json.dumps(job, indent=2) + '\n', encoding='utf-8')
        call(['git', 'add', '-A'], checkout)
        call(['git', '-c', 'user.name=A501 Patch Worker', '-c', 'user.email=patch-worker@users.noreply.github.com',
              'commit', '-m', f'Apply {room} patch {archive.name}'], checkout)
        call(['git', 'push', 'origin', 'HEAD:refs/heads/main'], checkout)
        print('PATCH_PUSHED', room, call(['git', 'rev-parse', 'HEAD'], checkout), flush=True)
        if call(['git', 'remote', 'get-url', 'origin'], source_repo) == 'https://github.com/anuragdhar/kitchen.git':
            try:
                if call(['git', 'branch', '--show-current'], ROOT) == 'main':
                    call(['git', 'pull', '--ff-only', 'origin', 'main'], ROOT)
                    print('PATCH_LOCAL_CHECKOUT_UPDATED', flush=True)
            except Exception as error:
                print('PATCH_LOCAL_CHECKOUT_NOT_UPDATED', error, file=sys.stderr, flush=True)
        return room
    finally:
        if checkout.exists() and checkout.resolve().is_relative_to(workspace):
            try: call(['git', 'worktree', 'remove', '--force', checkout], source_repo)
            except Exception as error: print('PATCH_CLEANUP_WARNING', error, file=sys.stderr, flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--zip', required=True, type=Path)
    parser.add_argument('--source-repo', required=True, type=Path)
    parser.add_argument('--workspace', required=True, type=Path)
    parser.add_argument('--node', required=True)
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    archive = args.zip.resolve()
    try:
        room = apply_patch(archive, args.source_repo, args.workspace, args.node, args.check_only)
        if not args.check_only:
            target = ROOT / 'PatchApplied' / (datetime.now().strftime('%Y%m%d_%H%M%S') + '_' + hashlib.sha256(archive.read_bytes()).hexdigest()[:12] + '_' + archive.name)
            target.parent.mkdir(exist_ok=True)
            if target.exists(): raise FileExistsError(target)
            archive.replace(target)
        print('PATCH_APPLIED', room, flush=True)
    except Exception as error:
        print('PATCH_FAILED', error, file=sys.stderr, flush=True)
        if not args.check_only and archive.is_file() and archive.parent == (ROOT / 'PatchToApply').resolve():
            target = ROOT / 'PatchFailed' / archive.name
            target.parent.mkdir(exist_ok=True)
            if target.exists(): target = target.with_name(datetime.now().strftime('%Y%m%d_%H%M%S') + '_' + target.name)
            archive.replace(target)
            target.with_suffix('.log').write_text(str(error) + '\n', encoding='utf-8')
        return 1
    return 0


if __name__ == '__main__': sys.exit(main())
