#!/usr/bin/env python3
"""Run the repo's dependency-free Python tests without going through
scripts/render_worker.py. Mirrors the ('python-*', ...) stages in
render_worker.py's stage list; keep the two in sync if either changes.

Usage: python scripts/run_python_tests.py   (from the repository root)
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

STAGES = [
    ('python-archviz', ['-m', 'unittest', 'discover', '-s', 'blender', '-p', 'test_archviz.py']),
    ('python-profiles', ['-m', 'unittest', 'discover', '-s', 'blender', '-p', 'test_parallel_profiles.py']),
    ('python-whole-home', ['-m', 'unittest', 'discover', '-s', 'blender', '-p', 'test_whole_home_render.py']),
    ('python-worker', ['-m', 'unittest', 'discover', '-s', 'scripts/tests', '-p', 'test_render_worker.py']),
    ('python-parallel', ['-m', 'unittest', 'discover', '-s', 'scripts/tests', '-p', 'test_parallel_rooms.py']),
    ('python-patches', ['-m', 'unittest', 'discover', '-s', 'scripts/tests', '-p', 'test_patch_pipeline.py']),
]


def main():
    failed = []
    for name, args in STAGES:
        print(f'--- {name} ---')
        result = subprocess.run([sys.executable, *args], cwd=ROOT)
        if result.returncode != 0:
            failed.append(name)
    if failed:
        print(f'FAILED: {", ".join(failed)}')
        return 1
    print('All Python test stages passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
