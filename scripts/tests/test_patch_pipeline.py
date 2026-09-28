import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from patch_pipeline import inspect_zip, is_backup_path, room_for_patch


class PatchPipelineTests(unittest.TestCase):
    def test_backup_files_are_rejected_regardless_of_suffix(self):
        for name in ('src/App.jsx.bak', 'src/App.jsx.bak-realism',
                     'src/App.jsx.bak-lobby-realism', 'src/App.jsx.backup.2026'):
            self.assertTrue(is_backup_path(name), name)
        for name in ('src/backupStrategy.js', 'src/lobby.jsx'):
            self.assertFalse(is_backup_path(name), name)

    def test_single_room_from_manifest_or_name(self):
        self.assertEqual(room_for_patch('anything.zip', {'room': 'lobby'}), 'lobby')
        self.assertEqual(room_for_patch('lifeline-lobby-realism.zip', {}), 'lobby')
        self.assertEqual(room_for_patch('bedroom1-balcony-update.zip', {}), 'bedroom1-balcony')
        for name, manifest in [('shared-update.zip', {}), ('kitchen-lobby.zip', {}),
                               ('patch.zip', {'room': 'unknown'})]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                room_for_patch(name, manifest)

    def test_archive_requires_safe_paths_and_one_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / 'lobby-patch.zip'
            with zipfile.ZipFile(archive, 'w') as output:
                output.writestr('patch-manifest.json', json.dumps({'room': 'lobby'}))
                output.writestr('react-configurator/src/Lobby.js', 'export default 1')
            room, members = inspect_zip(archive)
            self.assertEqual(room, 'lobby')
            self.assertEqual(len(members), 2)
            for unsafe in ('../outside.txt', '/absolute.txt', 'C:/absolute.txt',
                           '.github/workflows/check.yml'):
                with self.subTest(unsafe=unsafe):
                    with zipfile.ZipFile(archive, 'w') as output:
                        output.writestr('patch-manifest.json', '{}')
                        output.writestr(unsafe, 'bad')
                    with self.assertRaises(ValueError): inspect_zip(archive)


if __name__ == '__main__': unittest.main()
