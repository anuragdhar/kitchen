import copy
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import threading
import unittest
from types import SimpleNamespace
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from render_worker import (Worker, Lock, atomic, read_json, validate_job, relevant, fingerprint,
                           sanitize, safe_file, publication_paths, merge_ready, control, sha256)


def job():
    return {'version':1,'enabled':True,'request':'review-01','rooms':['kitchen','balcony','drawing'],'quality':'draft','device':'AUTO'}


class WorkerContracts(unittest.TestCase):
    def test_valid_job_not_mutated(self):
        value=job();before=copy.deepcopy(value);self.assertIs(validate_job(value),value);self.assertEqual(value,before)

    def test_reject_commands_paths_duplicate_rooms_bad_types(self):
        for key,value in [('command','powershell anything'),('path','../x'),('version',True),('rooms',['kitchen','kitchen']),('rooms',['../../private']),('enabled','yes'),('quality','unknown'),('device','shell'),('request','; execute')]:
            data=job();data[key]=value
            with self.subTest(key=key),self.assertRaises(ValueError):validate_job(data)

    def test_artifacts_do_not_trigger_render_loop(self):
        tree='100644 blob abc\treact-configurator/src/App.jsx\0'
        expected=fingerprint(tree,job(),{})
        self.assertEqual(fingerprint(tree+'100644 blob def\trender-review/run/result.json\0',job(),{}),expected)
        self.assertEqual(fingerprint(tree+'100644 blob def\treact-configurator/public/renders/x.png\0',job(),{}),expected)
        self.assertEqual(fingerprint(tree+'100644 blob def\tblender/archviz-input/result.zip\0',job(),{}),expected)
        self.assertNotEqual(fingerprint(tree.replace('abc','xyz'),job(),{}),expected)
        changed=job();changed['request']='retry-02'
        self.assertNotEqual(fingerprint(tree,changed,{}),expected)
        self.assertNotEqual(fingerprint(tree,job(),{'kitchen':'changed'}),expected)

    def test_render_sources_trigger(self):
        for name in ['scripts/render_archviz_rooms.py','configs/archviz-profiles.json','react-configurator/package-lock.json','blender/render_archviz.py','blender/drawing_room/elegant/A501-drawing-elegant.blend']:
            self.assertTrue(relevant(name))

    def test_redacts_tokens_paths_signed_queries_and_private_keys(self):
        text='Authorization: Bearer abc123\npassword="secretword"\nghp_abcdefghijklmnopqrstuvwxyz\nC:\\Users\\someone\\private\nhttps://x/?sig=12345&z=1\n-----BEGIN RSA PRIVATE KEY-----\nprivatebytes\n-----END RSA PRIVATE KEY-----\nnormal'
        clean=sanitize(text)
        for word in ['abc123','secretword','ghp_abcdefghijklmnopqrstuvwxyz','someone','12345','privatebytes']:self.assertNotIn(word,clean)
        self.assertIn('normal',clean)
        self.assertNotIn('openprivate',sanitize('-----BEGIN PRIVATE KEY-----\nopenprivate'))
        self.assertNotIn('sensitive-secret',sanitize('sensitive-secret',secrets=['sensitive-secret']))

    def test_safe_files_and_symlinks(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'ok.png').write_bytes(b'png')
            self.assertEqual(safe_file(root,'ok.png'),root.resolve()/'ok.png')
            for name in ['../secret','/secret','C:/secret','dir\\secret','missing.png']:
                with self.assertRaises(ValueError):safe_file(root,name)
            try:(root/'alias').symlink_to(root/'ok.png')
            except OSError:pass
            else:
                with self.assertRaises(ValueError):safe_file(root,'alias')

    def test_allow_only_evidence_publication(self):
        run='20260928T120000Z-abcdef123456-12345678'
        publication_paths([f'render-review/{run}/result.json',f'render-review/{run}/rooms/kitchen/current.png'],run)
        for path in ['src/App.jsx',f'render-review/{run}/.env',f'render-review/{run}/x.blend',f'render-review/{run}/../other.png']:
            with self.assertRaises(ValueError):publication_paths([path],run)

    def test_merge_guards(self):
        pr={'state':'OPEN','isDraft':False,'baseRefName':'main','headRefName':'render-review/x','headRefOid':'a'*40,'statusCheckRollup':[]}
        self.assertTrue(merge_ready(pr,'a'*40,'render-review/x'))
        for field,value in [('state','CLOSED'),('isDraft',True),('baseRefName','other'),('headRefOid','b'*40),('headRefName','code')]:
            self.assertFalse(merge_ready({**pr,field:value},'a'*40,'render-review/x'))
        self.assertTrue(merge_ready({**pr,'statusCheckRollup':[{'__typename':'CheckRun','status':'COMPLETED','conclusion':'FAILURE'}]},'a'*40,'render-review/x'))

    def test_atomic_state_and_lock_release(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);atomic(root/'state.json',{'done':{'abc':{'status':'failed'}},'outbox':[{'phase':'pushed'}]})
            self.assertEqual(read_json(root/'state.json')['outbox'][0]['phase'],'pushed')
            with Lock(root/'lock'):pass
            with Lock(root/'lock'):pass

    def make_worker(self,root):
        worker=Worker.__new__(Worker);worker.home=root;worker.args=SimpleNamespace(timeout=1)
        worker.paths=[root];worker.secrets=['test-secret-123'];worker.state={'done':{},'outbox':[]};worker.state_path=root/'state.json'
        return worker

    def test_real_stage_success_failure_and_sanitized_log(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);(root/'review').mkdir();worker=self.make_worker(root);result={'sourceCommit':'a'*40,'steps':[]}
            worker.stage('success',[sys.executable,'-c',"print('test-secret-123')"],root,root,result)
            self.assertEqual(result['steps'][0]['exitCode'],0)
            self.assertNotIn('test-secret-123',(root/'review/success.log').read_text())
            with self.assertRaises(RuntimeError):worker.stage('failure',[sys.executable,'-c','raise SystemExit(3)'],root,root,result)
            self.assertEqual(result['steps'][-1]['exitCode'],3)

    def test_failed_review_never_auto_merges(self):
        with tempfile.TemporaryDirectory() as directory:
            worker=self.make_worker(Path(directory));worker.args=SimpleNamespace(auto_merge_evidence=True)
            item={'run':'20260928T120000Z-abcdef123456-12345678','phase':'pr','status':'failed'}
            with patch('render_worker.control',side_effect=AssertionError('must not call merge')):
                worker.publish(item)
            self.assertEqual(item['phase'],'done')

    def test_stale_review_never_auto_merges(self):
        with tempfile.TemporaryDirectory() as directory:
            worker=self.make_worker(Path(directory));worker.args=SimpleNamespace(auto_merge_evidence=True)
            worker.guard=threading.Lock();worker.latest='b'*40
            item={'run':'20260928T120000Z-abcdef123456-12345678','phase':'pr','status':'passed','source':'a'*40}
            with patch('render_worker.control',side_effect=AssertionError('must not call merge')):
                worker.publish(item)
            self.assertEqual(item['phase'],'done')

    @unittest.skipUnless(shutil.which('git'),'Git required')
    def test_real_git_pinned_worktree_preserves_user_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);source=root/'user';source.mkdir()
            git=lambda *a,cwd=source:control(['git',*a],cwd)
            git('init','-b','main');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid')
            (source/'app.txt').write_text('one');git('add','app.txt');git('commit','-m','first');first=git('rev-parse','HEAD')
            mirror=root/'worker';git('clone','--no-checkout',str(source),str(mirror),cwd=root)
            pinned=root/'pinned';git('worktree','add','--detach',str(pinned),first,cwd=mirror)
            (source/'app.txt').write_text('two');git('add','app.txt');git('commit','-m','second')
            (source/'personal.txt').write_text('untouched')
            git('fetch','origin','refs/heads/main:refs/remotes/origin/main',cwd=mirror)
            self.assertEqual((pinned/'app.txt').read_text(),'one')
            self.assertEqual((source/'personal.txt').read_text(),'untouched')
            self.assertNotEqual(git('rev-parse','refs/remotes/origin/main',cwd=mirror),first)


if __name__=='__main__':unittest.main()
