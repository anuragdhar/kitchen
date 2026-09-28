import test from 'node:test'
import assert from 'node:assert/strict'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const utilitiesDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(utilitiesDir, '../..')
const launcher = path.join(root, 'start-server.bat')
const source = readFileSync(launcher, 'utf8')
const utilities = [
  'Generate-FreeCAD-3D.bat', 'Open-FreeCAD-3D.bat', 'Render-Blender-Kitchen.bat',
  'Run-Kitchen-design.bat', 'Start-Muse-Terminal.bat',
]

test('start-server.bat is the only root Windows command script', () => {
  assert.deepEqual(readdirSync(root).filter(name => /\.(bat|cmd)$/i.test(name)), ['start-server.bat'])
})

test('the five specialist utilities are preserved outside the root', () => {
  assert.deepEqual(readdirSync(utilitiesDir).filter(name => /\.bat$/i.test(name)).sort(), [...utilities].sort())
  for (const name of utilities) {
    assert.match(readFileSync(path.join(utilitiesDir, name), 'utf8'), /%~dp0\.\.\\\.\.\\?/, name)
  }
})

test('the FreeCAD opener calls its relocated generator and returns', () => {
  assert.match(readFileSync(path.join(utilitiesDir, 'Open-FreeCAD-3D.bat'), 'utf8'), /call "%~dp0Generate-FreeCAD-3D\.bat"/i)
})

test('startup uses the lockfile, loopback and Vite browser opening', () => {
  assert.match(source, /call npm ci\s/i)
  assert.doesNotMatch(source, /call npm install\b/i)
  assert.match(source, /call npm run dev -- --host 127\.0\.0\.1 --port 5173 --open/i)
  assert.doesNotMatch(source, /powershell|Start-Sleep|--strictPort/i)
  assert.match(source, /DisableDelayedExpansion/i)
})

test('launcher documentation uses the single root entry point', () => {
  const readme = readFileSync(path.join(root, 'README.md'), 'utf8')
  assert.match(readme, /start-server\.bat/)
  assert.doesNotMatch(readme, /Run-Kitchen-React-App\.bat|Run-Home-Interior\.bat/)
})

const windowsOnly = { skip: process.platform !== 'win32' ? 'Requires Windows cmd.exe' : false }

// Stub npm rather than starting a real server or modifying user dependencies.
function runLauncher(t, { installed = false, installExit = 0, serverExit = 0, missingPackage = false, missingNode = false, missingNpm = false } = {}) {
  const temp = mkdtempSync(path.join(tmpdir(), 'home-launcher-'))
  t.after(() => rmSync(temp, { recursive: true, force: true }))
  const fixture = path.join(temp, 'repo with spaces & bang!')
  const app = path.join(fixture, 'react-configurator')
  const bin = path.join(temp, 'bin')
  mkdirSync(app, { recursive: true })
  mkdirSync(bin)
  copyFileSync(launcher, path.join(fixture, 'start-server.bat'))
  if (!missingPackage) writeFileSync(path.join(app, 'package.json'), '{}')
  if (installed) {
    mkdirSync(path.join(app, 'node_modules', '.bin'), { recursive: true })
    writeFileSync(path.join(app, 'node_modules', '.bin', 'vite.cmd'), '@exit /b 0\r\n')
  }
  if (!missingNode) writeFileSync(path.join(bin, 'node.cmd'), '@exit /b 0\r\n')
  if (!missingNpm) writeFileSync(path.join(bin, 'npm.cmd'), [
    '@echo off',
    'echo %*>> "%LAUNCHER_LOG%"',
    'cd >> "%APP_CWD_LOG%"',
    'if "%~1"=="ci" exit /b %INSTALL_EXIT%',
    'if "%~1"=="run" exit /b %SERVER_EXIT%',
    'exit /b 99',
    '',
  ].join('\r\n'))
  const driver = path.join(temp, 'driver.cmd')
  writeFileSync(driver, [
    '@echo off',
    'call "%FIXTURE%\\start-server.bat"',
    'set "RESULT=%ERRORLEVEL%"',
    'cd > "%CALLER_CWD_LOG%"',
    'exit /b %RESULT%',
    '',
  ].join('\r\n'))
  const env = { ...process.env }
  for (const key of Object.keys(env)) {
    if (['path', 'ci', 'node_options', 'errorlevel'].includes(key.toLowerCase())) delete env[key]
  }
  Object.assign(env, {
    PATH: `${bin};${path.join(process.env.SystemRoot, 'System32')}`,
    PATHEXT: '.COM;.EXE;.BAT;.CMD',
    CI: '1', FIXTURE: fixture,
    LAUNCHER_LOG: path.join(temp, 'npm.log'),
    APP_CWD_LOG: path.join(temp, 'app-cwd.log'),
    CALLER_CWD_LOG: path.join(temp, 'caller-cwd.log'),
    INSTALL_EXIT: String(installExit), SERVER_EXIT: String(serverExit),
  })
  const result = spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'driver.cmd'], {
    cwd: temp, env, encoding: 'utf8', timeout: 15000, windowsHide: true,
  })
  assert.ifError(result.error)
  const diagnostic = `${result.stdout}\n${result.stderr}`
  assert.equal(readFileSync(env.CALLER_CWD_LOG, 'utf8').trim().toLowerCase(), temp.toLowerCase(), diagnostic)
  const calls = existsSync(env.LAUNCHER_LOG) ? readFileSync(env.LAUNCHER_LOG, 'utf8').trim().split(/\r?\n/) : []
  if (existsSync(env.APP_CWD_LOG)) {
    for (const cwd of readFileSync(env.APP_CWD_LOG, 'utf8').trim().split(/\r?\n/)) {
      assert.equal(cwd.toLowerCase(), app.toLowerCase(), diagnostic)
    }
  }
  return { status: result.status, calls, diagnostic }
}

const devCommand = 'run dev -- --host 127.0.0.1 --port 5173 --open'

test('Windows: fresh checkout installs before starting, from a spaced path', windowsOnly, t => {
  const result = runLauncher(t)
  assert.equal(result.status, 0, result.diagnostic)
  assert.deepEqual(result.calls, ['ci', devCommand])
})

test('Windows: existing dependencies are reused', windowsOnly, t => {
  const result = runLauncher(t, { installed: true })
  assert.equal(result.status, 0, result.diagnostic)
  assert.deepEqual(result.calls, [devCommand])
})

test('Windows: failed install stops startup and preserves its exit code', windowsOnly, t => {
  const result = runLauncher(t, { installExit: 23 })
  assert.equal(result.status, 23, result.diagnostic)
  assert.deepEqual(result.calls, ['ci'])
})

test('Windows: failed server preserves its exit code', windowsOnly, t => {
  const result = runLauncher(t, { installed: true, serverExit: 17 })
  assert.equal(result.status, 17, result.diagnostic)
  assert.deepEqual(result.calls, [devCommand])
})

for (const [option, message] of [
  ['missingPackage', 'Could not find'],
  ['missingNode', 'Node.js was not found'],
  ['missingNpm', 'npm was not found'],
]) {
  test(`Windows: ${option} fails before npm is invoked`, windowsOnly, t => {
    const result = runLauncher(t, { [option]: true })
    assert.equal(result.status, 1, result.diagnostic)
    assert.deepEqual(result.calls, [])
    assert.ok(result.diagnostic.includes(message), result.diagnostic)
  })
}
