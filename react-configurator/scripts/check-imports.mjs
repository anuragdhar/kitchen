// Dependency-free import check (the repo has no linter and must not add one to the lockfile).
//
//   node scripts/check-imports.mjs            checks src/, scripts/, tests/ and vite.config.mjs; exit 1 on a problem
//
// It reports two things a build does not catch:
//   - an imported name that the file never uses (dead imports hide which modules a file really depends on);
//   - a .jsx file that does not import React. This project uses the classic JSX transform, so such a file fails at run
//     time with "React is not defined" (it happened once, see docs/REFACTOR_PLAN.md Phase 4).
// It reads static `import ... from '...'` statements only; a name that appears only in a comment counts as used.
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const IMPORT = /^[ \t]*import\s+([\w$*{][\s\S]*?)\s+from\s+['"][^'"]+['"];?/gm

/** The local names an import clause binds: `A, {b, c as d}` -> ['A', 'b', 'd'], `* as ns` -> ['ns']. */
export function importedNames(clause) {
  const names = []
  const namespace = clause.match(/\*\s*as\s+([\w$]+)/)
  if (namespace) names.push(namespace[1])
  const first = clause.match(/^([A-Za-z_$][\w$]*)/)
  if (first) names.push(first[1])
  const braces = clause.match(/\{([\s\S]*)\}/)
  if (braces) for (const part of braces[1].split(',')) { const name = part.trim().split(/\s+as\s+/).pop().trim(); if (name) names.push(name) }
  return names
}

/** Problems in one file's text, as messages. `file` decides the .jsx rule. */
export function findImportProblems(text, file) {
  const problems = [], names = [], jsx = file.endsWith('.jsx')
  text = text.replace(/^﻿/, '')
  let body = text
  for (const match of text.matchAll(IMPORT)) { names.push(...importedNames(match[1])); body = body.replace(match[0], '') }
  for (const name of names) {
    if (jsx && name === 'React') continue // used by the compiled JSX, not by name
    const escaped = name.replace(/\$/g, '\\$')
    // Used anywhere outside the import statements; `a.name` is a property, not a use, but `...name` is.
    if (!new RegExp(`(^|[^\\w$.]|\\.\\.\\.)${escaped}(?![\\w$])`).test(body)) problems.push(`'${name}' is imported but never used`)
  }
  if (jsx && !names.includes('React')) problems.push("a .jsx file must import React (classic JSX transform)")
  return problems
}

function filesUnder(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : filesUnder(full)
    return /\.(js|mjs|jsx)$/.test(entry.name) ? [full] : []
  })
}

export function checkImports(root) {
  const files = [...['src', 'scripts', 'tests'].flatMap(dir => filesUnder(path.join(root, dir))), path.join(root, 'vite.config.mjs')]
  return files.flatMap(file => findImportProblems(fs.readFileSync(file, 'utf8'), file).map(problem => `${path.relative(root, file)}: ${problem}`))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const problems = checkImports(root)
  for (const problem of problems) console.log(problem)
  console.log(problems.length ? `check-imports: ${problems.length} problem(s)` : 'check-imports: no problems')
  process.exitCode = problems.length ? 1 : 0
}
