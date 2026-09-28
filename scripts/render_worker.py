"""Opt-in local Windows-friendly worker; execute only this repository's approved main.

No remote shell/listener, source-branch merge, service installation or force push.
See docs/RENDER_WORKER.md before using --trust-main and --publish.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import sys
import threading
import time
import uuid
import zipfile

REPO = 'anuragdhar/kitchen'
REMOTE = f'https://github.com/{REPO}.git'
ROOT = Path(__file__).resolve().parents[1]
JOB = 'configs/render-worker-job.json'
ROOMS = {'kitchen','balcony','drawing','bedroom3','study','bedroom1','lobby','pooja','storage','entry'}
MAX_FILE, MAX_TOTAL = 20*1024**2, 80*1024**2


def read_json(path, limit=32*1024**2):
    path = Path(path)
    if path.stat().st_size > limit: raise ValueError('JSON file exceeds size limit')
    return json.loads(path.read_text(encoding='utf-8-sig'))


def atomic(path, data):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(data, indent=2, allow_nan=False)+'\n', encoding='utf-8')
    tmp.replace(path)


def sha256(path):
    with Path(path).open('rb') as stream: return hashlib.file_digest(stream,'sha256').hexdigest()


def validate_job(job):
    if not isinstance(job,dict) or set(job) != {'version','enabled','request','rooms','quality','device'}:
        raise ValueError('Job accepts only version/enabled/request/rooms/quality/device; no commands or paths')
    if type(job['version']) is not int or job['version'] != 1 or type(job['enabled']) is not bool:
        raise ValueError('Invalid job format')
    if not isinstance(job['request'],str) or not re.fullmatch(r'[A-Za-z0-9._-]{1,80}',job['request']):
        raise ValueError('Invalid request ID')
    rooms = job['rooms']
    if not isinstance(rooms,list) or not rooms or any(not isinstance(r,str) or r not in ROOMS for r in rooms) or len(rooms)!=len(set(rooms)):
        raise ValueError('Invalid, duplicate or unsupported rooms')
    if job['quality'] not in ('draft','final','portfolio') or job['device'] not in ('AUTO','CPU','OPTIX','CUDA','HIP','ONEAPI','METAL'):
        raise ValueError('Invalid quality/device')
    return job


def relevant(path):
    if path.startswith(('render-review/','react-configurator/public/renders/')): return False
    if path in ('scripts/render_worker.py','scripts/patch_pipeline.py') or path.startswith(('scripts/tests/','react-configurator/tests/','PatchToApply/')): return False
    if path.startswith('react-configurator/scripts/') and path!='react-configurator/scripts/export-archviz-rooms.mjs': return False
    if path.startswith('blender/'):
        return path.endswith('.py') or path in ('blender/drawing_room/elegant/A501-drawing-elegant.blend','blender/bedroom3/daylight/A501-bedroom3-realistic.blend')
    return path.startswith(('react-configurator/src/','react-configurator/scripts/','react-configurator/tests/',
                           'react-configurator/public/models/','react-configurator/public/materials/',
                           'react-configurator/public/textures/','configs/','scripts/','Interior/')) or path in (
                           '.nvmrc','react-configurator/package.json','react-configurator/package-lock.json','react-configurator/vite.config.mjs')


def fingerprint(tree, job, inputs):
    rows = []
    for entry in tree.split('\0'):
        if not entry: continue
        info,path = entry.split('\t',1)
        if relevant(path): rows.append((info,path))
    return hashlib.sha256(json.dumps([sorted(rows),validate_job(job),inputs],sort_keys=True).encode()).hexdigest()


def dependency_key(app, node_version):
    digest=hashlib.sha256(node_version.encode())
    for name in ('package.json','package-lock.json'):
        digest.update(name.encode());digest.update((Path(app)/name).read_bytes())
    return digest.hexdigest()


def sanitize(text, paths=(), secrets=()):
    text = re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]','',text)
    text = re.sub(r'-----BEGIN [^-]*PRIVATE KEY-----.*?(?:-----END [^-]*PRIVATE KEY-----|\Z)','[PRIVATE KEY REDACTED]',text,flags=re.S)
    for value in sorted((s for s in secrets if len(s)>=8),key=len,reverse=True): text=text.replace(value,'[SECRET]')
    for path in sorted((str(p) for p in paths if p),key=len,reverse=True):
        for form in (path,path.replace('\\','/')): text=re.sub(re.escape(form),'<LOCAL_PATH>',text,flags=re.I)
    text = re.sub(r'(?i)(?:github_pat_|gh[pousr]_)[a-z0-9_]{12,}','[GITHUB_TOKEN]',text)
    text = re.sub(r'(?i)(authorization\s*[:=]\s*(?:bearer|basic)\s+)\S+',r'\1[REDACTED]',text)
    text = re.sub(r'(?i)(\b(?:password|secret|api_key|access_token|refresh_token|token|sig)\b[\s"\x27]*[:=][\s"\x27]*)[^\s,;&"\x27]+',r'\1[REDACTED]',text)
    text = re.sub(r'https?://[^\s/@]+:[^\s/@]+@','https://[REDACTED]@',text)
    text = re.sub(r'(?i)[a-z]:[\\/]Users[\\/][^\\/\s]+','<USERPROFILE>',text)
    text = re.sub(r'/(?:home|Users)/[^/\s]+','<HOME>',text)
    return text


def safe_file(root, relative):
    root=Path(root).resolve()
    if not isinstance(relative,str) or '\\' in relative or ':' in relative or relative.startswith('/') or '..' in Path(relative).parts:
        raise ValueError('Invalid relative artifact path')
    file=root/relative
    if file.is_symlink() or not file.resolve().is_relative_to(root) or not file.is_file():
        raise ValueError('Missing/outside/symlink artifact')
    return file


def publication_paths(paths, run):
    if not re.fullmatch(r'\d{8}T\d{6}Z-[a-f0-9]{12}-[a-f0-9]{8}',run): raise ValueError('Invalid run ID')
    if not paths or any(not p.startswith(f'render-review/{run}/') or '..' in Path(p).parts or '\\' in p or Path(p).suffix not in ('.png','.json','.log','.md') for p in paths):
        raise ValueError('Refusing to publish unrelated files or source changes')


def merge_ready(pr, head, branch):
    if pr.get('state')!='OPEN' or pr.get('isDraft') or pr.get('baseRefName')!='main' or pr.get('headRefName')!=branch or pr.get('headRefOid')!=head: return False
    return True


def control(args, cwd, timeout=120):
    env={**os.environ,'GIT_TERMINAL_PROMPT':'0','GH_PROMPT_DISABLED':'1','GIT_PAGER':'cat'}
    result=subprocess.run([str(a) for a in args],cwd=cwd,env=env,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=timeout)
    if result.returncode: raise RuntimeError(f'{Path(str(args[0])).name}: exit {result.returncode}: {result.stderr[-2000:]}')
    return result.stdout.strip()


class Lock:
    def __init__(self,path): self.path=path
    def __enter__(self):
        self.file=self.path.open('a+b');self.file.seek(0);self.file.write(b'0');self.file.flush();self.file.seek(0)
        try:
            if os.name=='nt':
                import msvcrt
                msvcrt.locking(self.file.fileno(),msvcrt.LK_NBLCK,1)
            else:
                import fcntl
                fcntl.flock(self.file,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except OSError:
            self.file.close();raise RuntimeError('Another worker is using this folder')
        return self
    def __exit__(self,*_): self.file.close()


class Worker:
    def __init__(self,args):
        self.args=args; self.home=Path(args.workspace).expanduser().resolve()
        if self.home==Path.home().resolve() or ROOT.is_relative_to(self.home) or self.home.is_relative_to(ROOT):
            raise ValueError('Choose a dedicated folder outside your development checkout and home root')
        marker=self.home/'worker-owner.json'
        if self.home.exists() and any(self.home.iterdir()) and not marker.exists(): raise ValueError('Workspace is not an A501 worker folder; no files changed')
        self.home.mkdir(parents=True,exist_ok=True)
        if marker.exists() and read_json(marker)!={'repository':REPO,'version':1}: raise ValueError('Worker ownership mismatch')
        atomic(marker,{'repository':REPO,'version':1})
        self.repo=self.home/'source'; self.stop=threading.Event();self.latest=None;self.guard=threading.Lock()
        self.patch_seen={}
        self.state_path=self.home/'state.json'
        self.state=read_json(self.state_path) if self.state_path.exists() else {'done':{},'outbox':[]}
        self.inputs=Path(args.inputs).expanduser().resolve() if args.inputs else None
        self.secrets=[v for k,v in os.environ.items() if re.search('TOKEN|SECRET|PASSWORD|API_KEY',k)]
        self.paths=[self.home,Path.home(),ROOT,self.inputs]
        self.node=shutil.which('node');self.git=shutil.which('git');self.gh=shutil.which('gh')
        if not self.git or not self.node: raise RuntimeError('Install Git and Node 22 first')
        self.node_version=control([self.node,'--version'],self.home)
        if not self.node_version.startswith('v22.'): raise RuntimeError('Node 22 is required')
        # Invoke npm through Node, not a Windows .cmd command string.
        candidates=[Path(self.node).parent/'node_modules/npm/bin/npm-cli.js']
        npm=shutil.which('npm')
        if npm: candidates += [Path(npm).resolve(),Path(npm).parent/'node_modules/npm/bin/npm-cli.js']
        self.npm=next((p for p in candidates if p.is_file() and p.suffix=='.js'),None)
        if not self.npm: raise RuntimeError('npm-cli.js not found; install the full Node 22 distribution')
        if args.publish and not self.gh: raise RuntimeError('Install GitHub CLI and run gh auth login first')

    def clean(self,text): return sanitize(str(text),self.paths,self.secrets)
    def save(self): atomic(self.state_path,self.state)
    def gitrun(self,*args,cwd=None): return control([self.git,*args],cwd or self.repo)

    def build_checkout(self, sha):
        work=self.home/'build-checkout'
        if work.is_symlink() or not work.resolve().is_relative_to(self.home):
            raise ValueError('Invalid worker build checkout')
        if not work.exists(): self.gitrun('worktree','add','--detach',work,sha)
        else:
            if Path(self.gitrun('rev-parse','--show-toplevel',cwd=work)).resolve()!=work.resolve():
                raise ValueError('Worker build checkout ownership mismatch')
            self.gitrun('reset','--hard','HEAD',cwd=work)
            self.gitrun('clean','-fd',cwd=work)
            self.gitrun('checkout','--detach',sha,cwd=work)
        return work

    def dependencies(self, app, folder, result):
        marker=self.home/'dependencies.json'
        key=dependency_key(app,self.node_version)
        try: cached=read_json(marker).get('key')==key
        except (FileNotFoundError,ValueError,KeyError,TypeError): cached=False
        if cached and (app/'node_modules').is_dir():
            print('WORKER_DEPENDENCIES_REUSED',flush=True)
            message='Reused local node_modules; package files and Node version match.\n'
            (folder/'dependencies.local.log').write_text(message,encoding='utf-8')
            (folder/'review/dependencies.log').write_text(message,encoding='utf-8')
            result['steps'].append({'name':'dependencies','exitCode':0,'seconds':0,'cached':True})
            return
        self.stage('dependencies',[self.node,self.npm,'ci','--no-audit','--no-fund'],app,folder,result)
        atomic(marker,{'key':key,'nodeVersion':self.node_version})

    def fetch(self):
        self.gitrun('fetch','--no-tags','origin','refs/heads/main:refs/remotes/origin/main')
        sha=self.gitrun('rev-parse','refs/remotes/origin/main')
        if not re.fullmatch('[a-f0-9]{40}',sha): raise ValueError('Invalid main SHA')
        with self.guard: self.latest=sha
        print('WORKER_POLL main',sha[:12],flush=True)

    def poll(self):
        while not self.stop.wait(self.args.interval):
            try: self.fetch()
            except Exception as e: print('WORKER_FETCH_ERROR',self.clean(e),flush=True)

    def process_patch(self):
        patch_dir=ROOT/'PatchToApply'
        if not patch_dir.is_dir(): return
        current={}
        for archive in sorted(patch_dir.glob('*.zip')):
            if not archive.is_file() or archive.is_symlink(): continue
            stat=archive.stat();signature=(stat.st_size,stat.st_mtime_ns)
            current[archive.name]=signature
            # See the same complete file on two polls before opening it.
            if self.patch_seen.get(archive.name)!=signature: continue
            powershell=shutil.which('powershell') or shutil.which('pwsh')
            if not powershell: raise RuntimeError('PowerShell is required for PatchToApply')
            command=[powershell,'-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',str(patch_dir/'permanent-patch-runner.ps1'),
                     '-ZipPath',str(archive),'-SourceRepo',str(self.repo),
                     '-Workspace',str(self.home/'patches'),'-NodePath',str(self.node),'-PythonPath',sys.executable]
            print('WORKER_PATCH_START',archive.name,flush=True)
            result=subprocess.run(command,cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=self.args.timeout*60)
            print(self.clean((result.stdout+'\n'+result.stderr)[-4000:]),flush=True)
            if result.returncode: print('WORKER_PATCH_FAILED',archive.name,flush=True)
            else:
                print('WORKER_PATCH_APPLIED',archive.name,flush=True)
                self.fetch()
            break
        self.patch_seen=current

    def stage(self,name,argv,cwd,folder,result):
        print('WORKER_STAGE',name,flush=True)
        atomic(self.home/'status.json',{'run':folder.name,'source':result['sourceCommit'],'stage':name})
        raw=folder/f'{name}.local.log';start=last=time.monotonic()
        env=dict(os.environ)
        # This is not a security sandbox; trusted main code executes as your Windows user.
        for key in list(env):
            if re.search('TOKEN|SECRET|PASSWORD|API_KEY',key): env.pop(key)
        env.update(PYTHONUNBUFFERED='1',PLAYWRIGHT_BROWSERS_PATH=str(self.home/'browsers'))
        if os.name=='nt' and 'PLAYWRIGHT_CHROMIUM_EXECUTABLE' not in env:
            chrome=Path(env.get('PROGRAMFILES',r'C:\Program Files'))/'Google/Chrome/Application/chrome.exe'
            if chrome.is_file(): env['PLAYWRIGHT_CHROMIUM_EXECUTABLE']=str(chrome)
        kwargs={'creationflags':subprocess.CREATE_NEW_PROCESS_GROUP} if os.name=='nt' else {'start_new_session':True}
        with raw.open('w',encoding='utf-8') as log:
            p=subprocess.Popen([str(a) for a in argv],cwd=cwd,env=env,stdin=subprocess.DEVNULL,stdout=log,stderr=subprocess.STDOUT,**kwargs)
            try:
                while p.poll() is None:
                    if time.monotonic()-start>self.args.timeout*60: raise TimeoutError(f'{name} exceeded the stage timeout')
                    if time.monotonic()-last>=30:
                        print(f'WORKER_PROGRESS {name}: {time.monotonic()-start:.0f}s; main polling continues',flush=True);last=time.monotonic()
                    time.sleep(.5)
                result['steps'].append({'name':name,'exitCode':p.returncode,'seconds':round(time.monotonic()-start,2)})
                if p.returncode: raise RuntimeError(f'{name} failed with exit {p.returncode}')
            finally:
                if p.poll() is None:
                    if os.name=='nt': subprocess.run(['taskkill','/PID',str(p.pid),'/T','/F'],capture_output=True,timeout=20)
                    else: os.killpg(p.pid,signal.SIGTERM)
                    try: p.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        if os.name!='nt': os.killpg(p.pid,signal.SIGKILL)
                        else: p.kill()
                # Publish only the bounded beginning, so a truncated private-key block is redacted.
                with raw.open('r',encoding='utf-8',errors='replace') as stream: text=stream.read(2*1024**2)
                if raw.stat().st_size>2*1024**2: text+='\n[TRUNCATED: full log remains local]\n'
                (folder/'review'/f'{name}.log').write_text(self.clean(text),encoding='utf-8')

    def job(self,sha):
        text=self.gitrun('show',f'{sha}:{JOB}')
        if len(text)>8192: raise ValueError('Oversized worker job')
        job=validate_job(json.loads(text));inputs={}
        if self.inputs:
            for room in job['rooms']:
                file=safe_file(self.inputs,f'A501-{room}-archviz.zip')
                if file.stat().st_size>550*1024**2: raise ValueError('Input bundle exceeds limit')
                inputs[room]=sha256(file)
        key=fingerprint(self.gitrun('ls-tree','-rz',sha),job,inputs)
        return job,key,inputs

    def reuse_unchanged_render(self,sha,job,key):
        if self.inputs: return False
        prior=sorted((entry for entry in self.state['done'].values() if entry['status']=='passed'),
                     key=lambda entry:entry['run'],reverse=True)
        if not prior: return False
        result_file=self.home/'runs'/prior[0]['run']/'review/result.json'
        try: previous=read_json(result_file)
        except (FileNotFoundError,ValueError,KeyError,TypeError): return False
        if previous.get('job')!=job or previous.get('inputMode')!='repository-defaults': return False
        source=previous.get('sourceCommit')
        if not isinstance(source,str) or not re.fullmatch('[a-f0-9]{40}',source): return False
        try:
            self.gitrun('merge-base','--is-ancestor',source,sha)
            changed=[path for path in self.gitrun('diff','--name-only','-z',source,sha).split('\0') if path]
        except RuntimeError: return False
        if any(relevant(path) for path in changed): return False
        self.state['done'][key]={'run':prior[0]['run'],'status':'passed','reusedFor':sha}
        self.save();print('WORKER_RENDER_UNCHANGED',sha[:12],flush=True)
        return True

    def collect(self,folder,result):
        public=folder/'public';review=folder/'review';index=public/'renders/archviz/manifest.json'
        if not index.exists(): return
        for entry in read_json(index).get('renders',[]):
            room,job=entry.get('room'),entry.get('job','')
            if room not in result['job']['rooms'] or not re.fullmatch('[a-f0-9]{16}',job): raise ValueError('Unexpected rendered room/job')
            source=safe_file(public,f'renders/archviz/{job}/provenance.json');data=read_json(source)
            if data.get('images')!=entry['images'] or data.get('room')!=room or data.get('job')!=job: raise ValueError('Provenance mismatch')
            target=review/'rooms'/room;target.mkdir(parents=True,exist_ok=True)
            images=[]
            for image in entry['images']:
                if not re.fullmatch(r'/renders/archviz/'+job+r'/[a-z0-9-]+\.png',image['url']): raise ValueError('Unsafe image URL')
                file=safe_file(public,image['url'][1:])
                if file.stat().st_size>MAX_FILE or sha256(file)!=image['sha256']: raise ValueError('Oversized or corrupt image')
                shutil.copyfile(file,target/file.name)
                images.append({'file':f'rooms/{room}/{file.name}','sha256':image['sha256']})
            metadata={k:data.get(k) for k in ('room','job','sourceKind','sourceSha256','generatorSha256','contractSha256','profileSha256','blender','device','quality','geometryAudit','geometryUnchangedDuringRendering','limitations')}
            metadata['images']=images
            # Keep original path-free values; only known structured provenance fields are included.
            atomic(target/'provenance.json',metadata)
            result['rooms'].append({'room':room,'images':images})
        # Reference screenshot from only the selected room ZIP, never arbitrary archive extraction.
        for room in result['job']['rooms']:
            for source in (folder/'inputs'/f'A501-{room}-archviz.zip',folder/'inputs/repository-defaults'/f'A501-{room}-archviz.zip'):
                if not source.is_file(): continue
                with zipfile.ZipFile(source) as archive:
                    refs=[i for i in archive.infolist() if i.filename=='reference.png']
                    if len(refs)==1 and refs[0].file_size<=MAX_FILE:
                        with archive.open(refs[0]) as stream: image=stream.read(MAX_FILE+1)
                        if len(image)<=MAX_FILE and image.startswith(b'\x89PNG\r\n\x1a\n'):
                            dest=review/'rooms'/room/'editable-reference.png';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(image)

    def execute(self,sha,job,key,inputs):
        run=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+f'-{sha[:12]}-{uuid.uuid4().hex[:8]}'
        folder=self.home/'runs'/run;review=folder/'review';review.mkdir(parents=True)
        work=self.home/'build-checkout'
        result={'run':run,'sourceCommit':sha,'job':job,'inputMode':'saved-exports' if self.inputs else 'repository-defaults',
                'status':'failed','visualReview':'unreviewed','steps':[],'rooms':[]}
        try:
            if shutil.disk_usage(self.home).free<5*1024**3: raise RuntimeError('Less than 5 GiB free; clean old worker runs manually')
            work=self.build_checkout(sha)
            (folder/'inputs').mkdir()
            for room,expected in inputs.items():
                target=folder/'inputs'/f'A501-{room}-archviz.zip';shutil.copyfile(safe_file(self.inputs,target.name),target)
                if sha256(target)!=expected: raise ValueError('Input changed during copy; retry after saving it completely')
            app=work/'react-configurator';npm=[self.node,self.npm]
            self.dependencies(app,folder,result)
            stages=[('build-tests',npm+['run','check'],app),
                    ('archviz-tests',[self.node,'--test','tests/archviz.test.mjs','tests/parallel-profiles.test.mjs','tests/whole-home-render.test.mjs'],app),
                    ('python-archviz',[sys.executable,'-m','unittest','discover','-s','blender','-p','test_archviz.py'],work),
                    ('python-profiles',[sys.executable,'-m','unittest','discover','-s','blender','-p','test_parallel_profiles.py'],work),
                    ('python-whole-home',[sys.executable,'-m','unittest','discover','-s','blender','-p','test_whole_home_render.py'],work),
                    ('python-worker',[sys.executable,'-m','unittest','discover','-s','scripts/tests','-p','test_render_worker.py'],work),
                    ('python-parallel',[sys.executable,'-m','unittest','discover','-s','scripts/tests','-p','test_parallel_rooms.py'],work),
                    ('python-patches',[sys.executable,'-m','unittest','discover','-s','scripts/tests','-p','test_patch_pipeline.py'],work),
                    ('python-compile',[sys.executable,'-m','compileall','-q','blender','scripts'],work),
                    ('chromium',[self.node,'node_modules/playwright/cli.js','install','chromium'],app),
                    ('browser-fixture',[self.node,'scripts/archviz-fixture-browser.mjs'],app),
                    ('browser-correctness',npm+['run','test:browser'],app),
                    ('browser-persistence',npm+['run','test:persistence'],app),
                    ('browser-interior',[self.node,'scripts/interior-browser.cjs'],app),
                    ('browser-materials',npm+['run','test:materials'],app),
                    ('browser-lighting',npm+['run','test:lighting'],app),
                    ('devcontainer-config',[self.node,'--test','.devcontainer/config.test.mjs'],work)]
            render=[sys.executable,'scripts/render_archviz_rooms.py','--rooms',','.join(job['rooms']),'--quality',job['quality'],
                    '--device',job['device'],'--input',str(folder/'inputs'),'--public',str(folder/'public')]
            if self.args.blender: render+=['--blender',self.args.blender]
            if not self.inputs: render+=['--export-defaults']
            for name,argv,cwd in stages+[('render',render,work)]: self.stage(name,argv,cwd,folder,result)
            result['status']='passed'
        except Exception as e:
            result['error']=self.clean(e);print('WORKER_JOB_FAILED',result['error'],flush=True)
        try:
            self.collect(folder,result)
            if result['status']=='passed' and {r['room'] for r in result['rooms']}!=set(job['rooms']): raise ValueError('Missing completed room outputs')
        except Exception as e: result['status']='failed';result['error']=self.clean(e)
        atomic(review/'result.json',result)
        lines=[f'# Render review {run}','',f'Source `{sha}`; automated result **{result["status"]}**; visual review **unreviewed**.',
               f'Input mode: `{result["inputMode"]}`. Stage logs are sanitized best-effort, not a secrecy guarantee.','']
        for room in result['rooms']:
            lines += [f'## {room["room"]}']+[f'![{room["room"]}]({image["file"]})' for image in room['images']]
            ref=f'rooms/{room["room"]}/editable-reference.png'
            if (review/ref).exists(): lines.append(f'![Editable reference]({ref})')
        (review/'README.md').write_text('\n\n'.join(lines)+'\n',encoding='utf-8')
        self.state['done'][key]={'run':run,'status':result['status']}
        if self.args.publish: self.state['outbox'].append({'run':run,'source':sha,'phase':'new','status':result['status']})
        self.save();print('WORKER_COMPLETE',run,result['status'],flush=True)
        return result

    def publish(self,item):
        run=item['run'];folder=self.home/'runs'/run;review=folder/'review';branch=f'render-review/{run}';work=folder/'publication'
        if item['phase']=='new':
            files=[p for p in review.rglob('*') if p.is_file()]
            paths=[f'render-review/{run}/{p.relative_to(review).as_posix()}' for p in files];publication_paths(paths,run)
            if any(p.is_symlink() or not p.resolve().is_relative_to(review.resolve()) or p.stat().st_size>MAX_FILE for p in files) or sum(p.stat().st_size for p in files)>MAX_TOTAL: raise ValueError('Review exceeds safe publication limits')
            if not work.exists(): self.gitrun('worktree','add','--detach',work,item['source'])
            target=work/'render-review'/run
            if not target.exists(): shutil.copytree(review,target)
            for path in paths: self.gitrun('add','--',path,cwd=work)
            staged=self.gitrun('diff','--cached','--name-only',cwd=work).splitlines()
            if staged:
                publication_paths(staged,run)
                self.gitrun('-c','user.name=A501 Render Worker','-c','user.email=render-worker@users.noreply.github.com','commit','-m',f'Render evidence for {item["source"][:12]} ({item["status"]})',cwd=work)
            head=self.gitrun('rev-parse','HEAD',cwd=work)
            changed=self.gitrun('diff','--name-only',item['source'],head,cwd=work).splitlines();publication_paths(changed,run)
            self.gitrun('push','origin',f'{head}:refs/heads/{branch}',cwd=work)
            item.update(phase='pushed',head=head);self.save()
        if item['phase']=='pushed':
            prs=json.loads(control([self.gh,'pr','list','--repo',REPO,'--head',branch,'--state','all','--json','number,url'],self.home))
            if not prs:
                body=folder/'pr-body.md';body.write_text(f'Automated evidence for `{item["source"]}`. Build/render: **{item["status"]}**. Images are **unreviewed**.\n\nSee `render-review/{run}/README.md`, PNGs, provenance, result.json and sanitized stage logs. No source code changes or input models are included.',encoding='utf-8')
                control([self.gh,'pr','create','--repo',REPO,'--head',branch,'--base','main','--title',f'Render review {item["source"][:12]}: {item["status"]}','--body-file',body],self.home)
                prs=json.loads(control([self.gh,'pr','list','--repo',REPO,'--head',branch,'--state','all','--json','number,url'],self.home))
            if len(prs)!=1: raise ValueError('Expected exactly one evidence PR')
            item.update(phase='pr',pr=prs[0]['number'],url=prs[0]['url']);self.save();print('WORKER_REVIEW',item['url'],flush=True)
        if item['phase']=='pr':
            # Only locally passed jobs can reach this merge path.
            if not self.args.auto_merge_evidence or item['status']!='passed': item['phase']='done';return
            with self.guard: latest=self.latest
            if item['source']!=latest: item['phase']='done';return
            pr=json.loads(control([self.gh,'pr','view',str(item['pr']),'--repo',REPO,'--json','state,isDraft,baseRefName,headRefName,headRefOid,files'],self.home))
            if pr['state'] in ('MERGED','CLOSED'): item['phase']='done';return
            if not merge_ready(pr,item['head'],branch): return
            publication_paths([f['path'] for f in pr['files']],run)
            control([self.gh,'pr','merge',str(item['pr']),'--repo',REPO,'--squash','--match-head-commit',item['head']],self.home)
            state=control([self.gh,'pr','view',str(item['pr']),'--repo',REPO,'--json','state','--jq','.state'],self.home)
            if state=='MERGED': item['phase']='done';print('WORKER_EVIDENCE_MERGED',item['url'],flush=True)

    def loop(self):
        with Lock(self.home/'worker.lock'):
            if not self.repo.exists(): control([self.git,'clone','--no-checkout',REMOTE,self.repo],self.home,600)
            if self.gitrun('remote','get-url','origin')!=REMOTE: raise ValueError('Worker origin mismatch')
            if self.args.publish: control([self.gh,'auth','status','--hostname','github.com'],self.home)
            self.fetch();thread=threading.Thread(target=self.poll,daemon=True);thread.start()
            try:
                while True:
                    with self.guard: sha=self.latest
                    try: self.process_patch()
                    except Exception as e: print('WORKER_PATCH_ERROR',self.clean(e),flush=True)
                    with self.guard: sha=self.latest
                    try:
                        job,key,inputs=self.job(sha)
                        if job['enabled'] and key not in self.state['done'] and not self.reuse_unchanged_render(sha,job,key):
                            self.execute(sha,job,key,inputs)
                    except Exception as e: print('WORKER_ERROR',self.clean(e),flush=True)
                    for item in self.state['outbox']:
                        if item['phase']=='done': continue
                        try: self.publish(item)
                        except Exception as e: print('WORKER_PUBLISH_RETRY',self.clean(e),flush=True)
                        self.save()
                    if self.args.once: return
                    self.stop.wait(self.args.interval)
            finally:
                self.stop.set();thread.join(timeout=2)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--workspace',default=str(Path.home()/'A501RenderWorker'))
    p.add_argument('--blender');p.add_argument('--inputs')
    p.add_argument('--interval',type=int,default=60);p.add_argument('--timeout',type=int,default=240)
    p.add_argument('--publish',action='store_true');p.add_argument('--auto-merge-evidence',action='store_true')
    p.add_argument('--trust-main',action='store_true');p.add_argument('--once',action='store_true')
    args=p.parse_args()
    if not args.trust_main: p.error('Read docs/RENDER_WORKER.md, then explicitly use --trust-main')
    if not 60<=args.interval<=3600 or not 1<=args.timeout<=1440: p.error('Interval 60–3600 seconds; timeout 1–1440 minutes')
    if args.auto_merge_evidence and not args.publish: p.error('--auto-merge-evidence requires --publish')
    if sys.version_info<(3,11): p.error('Python 3.11 or later is required')
    try: Worker(args).loop()
    except KeyboardInterrupt: print('WORKER_STOPPED. No background service was installed.',flush=True)
    except Exception as e: print('WORKER_STOPPED',sanitize(str(e),[Path.home()]),file=sys.stderr);return 1
    return 0


if __name__=='__main__': raise SystemExit(main())
