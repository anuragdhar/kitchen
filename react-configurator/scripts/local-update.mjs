import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'

const execFileAsync = promisify(execFile)

async function command(file, args, cwd) {
  const { stdout } = await execFileAsync(file, args, {
    cwd,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
    shell: process.platform === 'win32' && file === 'npm.cmd',
  })
  return stdout.trim()
}

export async function updateFromGitHub(repoDir, run = command) {
  const branch = await run('git', ['branch', '--show-current'], repoDir)
  if (!branch) throw new Error('Cannot update a detached Git checkout.')

  const changes = await run('git', ['status', '--porcelain', '--untracked-files=normal'], repoDir)
  if (changes) throw new Error('Local files have changes. Commit or stash them before updating.')

  const before = await run('git', ['rev-parse', 'HEAD'], repoDir)
  await run('git', ['fetch', 'origin', branch], repoDir)
  const remote = await run('git', ['rev-parse', 'FETCH_HEAD'], repoDir)
  await run('git', ['merge', '--ff-only', 'FETCH_HEAD'], repoDir)

  if (before !== remote) {
    const dependencyChanges = await run('git', [
      'diff', '--name-only', before, remote, '--',
      'react-configurator/package.json', 'react-configurator/package-lock.json',
    ], repoDir)
    if (dependencyChanges) {
      await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci'], path.join(repoDir, 'react-configurator'))
    }
  }

  return { updated: before !== remote, commit: remote.slice(0, 12) }
}
