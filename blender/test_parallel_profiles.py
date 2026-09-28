import ast
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from archviz_profiles import load_profiles, resolve_profiles, profile_digest
from archviz_room_details import apply_room_details

ROOT = Path(__file__).resolve().parents[1]
LEGACY = ROOT / 'blender/tests/fixtures/archviz-profiles-v1.json'
MANIFEST = ROOT / 'configs/archviz-profiles.json'


class ProfileTests(unittest.TestCase):
    def test_legacy_compatibility_and_split_parity(self):
        legacy = json.loads(LEGACY.read_text())
        before = copy.deepcopy(legacy)
        v2 = {'version':2, 'quality':legacy['quality'], 'rooms':{r:f'archviz/rooms/{r}.json' for r in legacy['rooms']}}
        documents = {f'archviz/rooms/{r}.json':p for r,p in legacy['rooms'].items()}
        self.assertEqual(resolve_profiles(v2, documents.__getitem__), legacy)
        self.assertEqual(resolve_profiles(legacy, lambda _: self.fail('Legacy needs no files')), legacy)
        self.assertEqual(legacy, before)

    def test_actual_room_registry_and_source_modes(self):
        current = load_profiles(MANIFEST)
        self.assertEqual(set(current['rooms']), set(json.loads(LEGACY.read_text())['rooms']))
        self.assertNotIn('native', current['rooms']['kitchen'])
        self.assertNotIn('native', current['rooms']['balcony'])
        self.assertIn('drawing_room/elegant', current['rooms']['drawing']['native'])
        self.assertIn('bedroom3/daylight', current['rooms']['bedroom3']['native'])

    def test_single_room_edit_isolated_and_hash_changes(self):
        current = load_profiles(MANIFEST)
        changed = copy.deepcopy(current)
        changed['rooms']['kitchen']['lens'] += 1
        self.assertNotEqual(profile_digest(current,'kitchen'), profile_digest(changed,'kitchen'))
        self.assertEqual(profile_digest(current,'balcony'), profile_digest(changed,'balcony'))
        self.assertNotEqual(profile_digest(current,'balcony','a'), profile_digest(current,'balcony','b'))
        changed['quality']['draft']['samples'] += 1
        self.assertNotEqual(profile_digest(current,'balcony'), profile_digest(changed,'balcony'))

    def test_missing_invalid_or_escaping_profile_fails(self):
        manifest = json.loads(MANIFEST.read_text())
        for invalid in ['../secret.json', '/tmp/secret.json', 'archviz/rooms/drawing.json', 'https://x/room.json']:
            bad = copy.deepcopy(manifest);bad['rooms']['kitchen'] = invalid
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                resolve_profiles(bad, lambda _: self.fail('Must reject before reading'))
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'archviz-profiles.json';p.write_text(json.dumps(manifest))
            with self.assertRaises(FileNotFoundError): load_profiles(p)

    def test_malformed_settings_fail(self):
        original = json.loads(LEGACY.read_text())
        for key,value in [('lens', True), ('eyeHeight', float('nan')), ('corner',[0,2]), ('native','blender/../../secret.blend'), ('cameras','Camera'), ('command','run something')]:
            bad=copy.deepcopy(original);bad['rooms']['kitchen'][key]=value
            with self.subTest(key=key), self.assertRaises(ValueError): resolve_profiles(bad, None)
        for key,value in [('version',True), ('version',3), ('rooms',{}), ('quality',{})]:
            bad=copy.deepcopy(original);bad[key]=value
            with self.subTest(key=key), self.assertRaises(ValueError): resolve_profiles(bad, None)

    def test_loader_symlink_escape(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);config=root/'configs';rooms=config/'archviz/rooms';rooms.mkdir(parents=True)
            m=json.loads(MANIFEST.read_text());m['rooms']={'kitchen':m['rooms']['kitchen']}
            (config/'archviz-profiles.json').write_text(json.dumps(m))
            outside=root/'outside.json';outside.write_text(json.dumps(load_profiles(MANIFEST)['rooms']['kitchen']))
            try: (rooms/'kitchen.json').symlink_to(outside)
            except OSError: self.skipTest('Symlink creation is unavailable on this account')
            with self.assertRaises(ValueError): load_profiles(config/'archviz-profiles.json')


class DetailTests(unittest.TestCase):
    def signature(self, scene): return copy.deepcopy(scene)

    def test_shipped_extensions_define_the_contract(self):
        # Do not require shipped hooks to remain empty: specialists must be
        # able to add real bpy-dependent details without rewriting shared tests.
        for room in load_profiles(MANIFEST)['rooms']:
            path = ROOT / 'blender/archviz/rooms' / f'{room}.py'
            tree = ast.parse(path.read_text(encoding='utf-8'))
            functions = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'apply']
            self.assertEqual(len(functions), 1, room)
            self.assertEqual([a.arg for a in functions[0].args.args], ['scene', 'profile'], room)

    def run_extension(self, code, scene=None):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'blender/archviz/rooms';path.mkdir(parents=True)
            (path/'kitchen.py').write_text(code)
            return apply_room_details(scene if scene is not None else {'source':1},'kitchen',{},Path(d),self.signature)

    def test_additive_details_and_missing_optional_module(self):
        result=self.run_extension("def apply(scene, profile):\n scene['ArchvizDetail | kitchen | vase']=2\n return [{'kind':'vase'}]\n")
        self.assertEqual(result['addedMeshes'],['ArchvizDetail | kitchen | vase'])
        with tempfile.TemporaryDirectory() as d:
            result=apply_room_details({'source':1},'kitchen',{},Path(d),self.signature)
            self.assertIsNone(result['moduleSha256'])

    def test_source_mutations_and_untagged_additions_fail(self):
        for statement in ["scene['source']=3", "del scene['source']", "scene['Unowned vase']=2"]:
            with self.subTest(statement=statement), self.assertRaises(AssertionError):
                self.run_extension(f'def apply(scene, profile):\n {statement}\n return []\n')

    def test_invalid_extension_reports_fail(self):
        for code in ['x=1', 'def apply(scene, profile): return None', 'def apply(scene, profile): return [1]', "def apply(scene, profile): return [{'x': float('nan')}]"]:
            with self.subTest(code=code), self.assertRaises(ValueError): self.run_extension(code)

    def test_unsafe_room_fails_before_module_loading(self):
        with self.assertRaises(ValueError): apply_room_details({},'../bad',{},ROOT,self.signature)


if __name__ == '__main__': unittest.main()
