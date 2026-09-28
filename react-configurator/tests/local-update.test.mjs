import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { updateFromGitHub } from '../scripts/local-update.mjs'

const exec = promisify(execFile)
async function git(cwd, ...args) {
  const { stdout } = await exec('git', args, { cwd, encoding: 'utf8' })
  return stdout.trim()
}

test('updates a clean checkout by fast forward and preserves local edits', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'kitchen-update-'))
  const remote = path.join(root, 'remote.git')
  const author = path.join(root, 'author')
  const checkout = path.join(root, 'checkout')
  try {
    await git(root, 'init', '--bare', remote)
    await mkdir(author)
    await git(author, 'init', '-b', 'main')
    await git(author, 'config', 'user.email', 'test@example.com')
    await git(author, 'config', 'user.name', 'Test')
    await writeFile(path.join(author, 'design.txt'), 'first\n')
    await git(author, 'add', '.')
    await git(author, 'commit', '-m', 'Initial')
    await git(author, 'remote', 'add', 'origin', remote)
    await git(author, 'push', '-u', 'origin', 'main')
    await git(root, 'clone', '--branch', 'main', remote, checkout)

    await writeFile(path.join(author, 'design.txt'), 'second\n')
    await git(author, 'commit', '-am', 'Update')
    await git(author, 'push')

    const result = await updateFromGitHub(checkout)
    assert.equal(result.updated, true)
    assert.equal(result.commit, (await git(checkout, 'rev-parse', 'HEAD')).slice(0, 12))
    assert.equal((await updateFromGitHub(checkout)).updated, false)

    await writeFile(path.join(checkout, 'design.txt'), 'my edit\n')
    await assert.rejects(updateFromGitHub(checkout), /Local files have changes/)
    assert.equal(await git(checkout, 'status', '--porcelain'), 'M design.txt')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
