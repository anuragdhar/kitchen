import importlib.util
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SCRIPTS=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(SCRIPTS))
from parallel_rooms import changed_paths, commit, owns, prepare, violations, validate_rooms


class ScopeTests(unittest.TestCase):
    def test_owned_paths_are_narrow(self):
        for p in ['configs/archviz/rooms/kitchen.json','blender/archviz/rooms/kitchen.py','blender/archviz/rooms/kitchen/test_cameras.py','blender/archviz/assets/kitchen/LICENSE.md','docs/room-reviews/kitchen/README.md']:
            self.assertTrue(owns('kitchen',p),p)
        for p in ['configs/archviz/rooms/drawing.json','configs/archviz-profiles.json','scripts/render_worker.py','react-configurator/src/App.jsx','docs/room-reviews/kitchen-other/test.md','docs/room-reviews/kitchen/../secret','docs/room-reviews/kitchen\\test.md','/docs/room-reviews/kitchen/x']:
            self.assertFalse(owns('kitchen',p),p)
    def test_unknown_and_duplicate_rooms(self):
        for rooms in [[],['bad'],['kitchen','kitchen']]:
            with self.assertRaises(ValueError): validate_rooms(rooms,{'kitchen':{}})
    def test_scope_diagnostics(self):
        self.assertEqual(violations('kitchen',['configs/archviz/rooms/kitchen.json','scripts/render_worker.py']),['scripts/render_worker.py'])


@unittest.skipUnless(shutil.which('git'), 'Git executable required')
class WorktreeTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'repo';self.root.mkdir()
        self.git('init','-b','main');self.git('config','user.name','Test');self.git('config','user.email','test@example.invalid')
        (self.root/'baseline.txt').write_text('baseline');self.git('add','.');self.git('commit','-m','baseline')
        self.sha=commit(self.root,'HEAD');self.parent=self.root.parent/'rooms'
    def git(self,*args):
        return subprocess.run(['git','-C',str(self.root),*map(str,args)],check=True,capture_output=True,text=True).stdout
    def test_dry_run_does_not_change_checkout_or_create_branch(self):
        (self.root/'local.txt').write_text('keep my work')
        before=self.git('status','--porcelain');branches=self.git('branch','--list')
        plan=prepare(self.root,['kitchen','balcony'],{'kitchen':{},'balcony':{}},self.parent,'HEAD')
        self.assertEqual(len(plan),2);self.assertFalse(self.parent.exists())
        self.assertEqual(self.git('status','--porcelain'),before);self.assertEqual(self.git('branch','--list'),branches)
    def test_creates_independent_worktrees_at_the_same_commit(self):
        (self.root/'local.txt').write_text('keep');before=self.git('status','--porcelain')
        plan=prepare(self.root,['kitchen','balcony'],{'kitchen':{},'balcony':{}},self.parent,'HEAD',True)
        for item in plan:
            self.assertEqual(commit(item['path'],'HEAD'),self.sha)
            self.assertTrue((Path(item['path'])/'baseline.txt').exists())
            self.assertFalse((Path(item['path'])/'local.txt').exists())
        self.assertEqual(self.git('status','--porcelain'),before)
        self.assertEqual(self.git('branch','--show-current').strip(),'main')
    def test_preflight_stops_all_if_a_later_room_conflicts(self):
        self.git('branch','feat/archviz/balcony')
        with self.assertRaises(ValueError): prepare(self.root,['kitchen','balcony'],{'kitchen':{},'balcony':{}},self.parent,'HEAD',True)
        self.assertFalse(self.parent.exists());self.assertNotIn('feat/archviz/kitchen',self.git('branch','--list'))
    def test_refuses_existing_or_nested_paths(self):
        self.parent.mkdir();(self.parent/'kitchen').mkdir()
        with self.assertRaises(ValueError): prepare(self.root,['kitchen'],{'kitchen':{}},self.parent,'HEAD',True)
        with self.assertRaises(ValueError): prepare(self.root,['kitchen'],{'kitchen':{}},self.root/'nested','HEAD',True)
    def test_detects_committed_staged_unstaged_new_and_renamed_files(self):
        self.git('checkout','-b','feat/archviz/kitchen')
        owned=self.root/'configs/archviz/rooms/kitchen.json';owned.parent.mkdir(parents=True);owned.write_text('{}')
        self.git('add','.');self.git('commit','-m','owned')
        self.git('mv','baseline.txt','moved.txt')
        (self.root/'unstaged.txt').write_text('new');owned.write_text('{"new":true}')
        paths=changed_paths(self.root,self.sha)
        self.assertTrue({'configs/archviz/rooms/kitchen.json','baseline.txt','moved.txt','unstaged.txt'}.issubset(paths))
        self.assertEqual(changed_paths(self.root,self.sha,include_working=False),['configs/archviz/rooms/kitchen.json'])
    def test_invalid_ref_fails_without_execution(self):
        with self.assertRaises(subprocess.CalledProcessError): commit(self.root,'--help')


if __name__=='__main__': unittest.main()
