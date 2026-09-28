"""Room ownership checks and safe, opt-in parallel Git worktree setup.

python scripts/parallel_rooms.py prepare --rooms kitchen,balcony,drawing
python scripts/parallel_rooms.py prepare --rooms kitchen,balcony,drawing --apply
python scripts/parallel_rooms.py check --room kitchen --base origin/main
"""
import argparse
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'blender'))
from archviz_profiles import load_profiles


def git(root, *args):
    result = subprocess.run(['git', '-C', str(root), *map(str, args)], capture_output=True, check=True)
    return result.stdout.decode('utf-8', errors='strict')


def validate_rooms(rooms, known):
    if not rooms or len(rooms) != len(set(rooms)) or any(r not in known for r in rooms):
        raise ValueError('Choose unique known room IDs')
    return rooms


def owns(room, path):
    # Git reports '/' on Windows too. Refuse ambiguous/path-traversal spellings.
    if not re.fullmatch(r'[a-z][a-z0-9-]{0,63}', room) or not isinstance(path, str):
        return False
    if '\\' in path or any(p in ('', '.', '..') for p in path.split('/')):
        return False
    exact = {f'configs/archviz/rooms/{room}.json', f'blender/archviz/rooms/{room}.py'}
    prefixes = (f'blender/archviz/rooms/{room}/', f'blender/archviz/assets/{room}/',
                f'docs/room-reviews/{room}/')
    return path in exact or any(path.startswith(prefix) for prefix in prefixes)


def violations(room, paths):
    return sorted({p for p in paths if not owns(room, p)})


def commit(root, ref):
    value = git(root, 'rev-parse', '--verify', '--end-of-options', f'{ref}^{{commit}}').strip()
    if not re.fullmatch(r'[a-f0-9]{40,64}', value):
        raise ValueError('Expected an existing Git commit')
    return value


def changed_paths(root, base, head='HEAD', include_working=True):
    base_sha, head_sha = commit(root, base), commit(root, head)
    paths = git(root, 'diff', '--no-renames', '--name-only', '-z', f'{base_sha}...{head_sha}', '--').split('\0')
    if include_working:
        # Includes staged AND unstaged edits plus new files; never resets/stashes.
        paths += git(root, 'diff', '--no-renames', '--name-only', '-z', 'HEAD', '--').split('\0')
        paths += git(root, 'ls-files', '--others', '--exclude-standard', '-z').split('\0')
    return sorted(set(filter(None, paths)))


def prepare(root, rooms, known, parent, base='origin/main', apply=False):
    validate_rooms(rooms, known)
    root, parent = Path(root).resolve(), Path(parent).resolve()
    if parent == root or parent.is_relative_to(root):
        raise ValueError('Worktrees must be outside the development checkout')
    sha = commit(root, base)
    branches = set(git(root, 'for-each-ref', '--format=%(refname)', 'refs/heads/', 'refs/remotes/').splitlines())
    plan = []
    # Preflight ALL rooms before creating any folder or branch.
    for room in rooms:
        branch = f'feat/archviz/{room}'
        path = parent / room
        if path.exists() or path.is_symlink():
            raise ValueError(f'Existing path will not be reused: {path}')
        if f'refs/heads/{branch}' in branches or any(b.endswith('/'+branch) for b in branches):
            raise ValueError(f'Existing branch will not be overwritten: {branch}')
        plan.append({'room': room, 'branch': branch, 'path': str(path), 'base': sha})
    if apply:
        parent.mkdir(parents=True, exist_ok=True)
        for item in plan:
            # -b (never -B/--force) makes races fail rather than overwrite work.
            git(root, 'worktree', 'add', '-b', item['branch'], item['path'], sha)
            print(f"CREATED {item['room']}: {item['path']}", flush=True)
    return plan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('prepare')
    p.add_argument('--rooms', default='kitchen,balcony,drawing')
    p.add_argument('--parent', type=Path, default=ROOT.parent / f'{ROOT.name}-rooms')
    p.add_argument('--base', default='origin/main')
    p.add_argument('--apply', action='store_true')
    c = sub.add_parser('check')
    c.add_argument('--room', required=True)
    c.add_argument('--base', default='origin/main')
    c.add_argument('--head', default='HEAD')
    c.add_argument('--committed-only', action='store_true')
    sub.add_parser('check-event').add_argument('--event', type=Path, required=True)
    args = parser.parse_args()
    try:
        known = load_profiles(ROOT / 'configs/archviz-profiles.json')['rooms']
        if args.command == 'prepare':
            plan = prepare(ROOT, args.rooms.split(','), known, args.parent, args.base, args.apply)
            print(json.dumps({'applied':args.apply, 'worktrees':plan}, indent=2))
            if not args.apply:
                print('Preview only. Run git fetch origin, review the pinned base, then add --apply.')
            return 0
        if args.command == 'check-event':
            event = json.loads(args.event.read_text(encoding='utf-8'))
            pr = event.get('pull_request')
            if not pr:
                print('No pull request to scope-check.'); return 0
            branch = pr['head']['ref']
            if not branch.startswith('feat/archviz/'):
                print('Coordinator/non-specialist branch: ownership review required; no room-only claim.'); return 0
            room = branch.removeprefix('feat/archviz/')
            base, head = pr['base']['sha'], pr['head']['sha']
            if not all(re.fullmatch(r'[a-f0-9]{40,64}', x) for x in (base, head)):
                raise ValueError('Invalid PR commit SHA')
            working = False
        else:
            room, base, head, working = args.room, args.base, args.head, not args.committed_only
        validate_rooms([room], known)
        bad = violations(room, changed_paths(ROOT, base, head, working))
        if bad:
            print('Coordinator-owned or other-room files changed:\n' + '\n'.join(bad), file=sys.stderr)
            return 1
        print(f'ROOM_SCOPE_OK {room}. This is a path check, not approval or a security boundary.')
        return 0
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f'PARALLEL_ROOM_ERROR: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
