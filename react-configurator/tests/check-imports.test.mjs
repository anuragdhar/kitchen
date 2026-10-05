import test from 'node:test'
import assert from 'node:assert/strict'
import {fileURLToPath} from 'node:url'
import {checkImports, findImportProblems, importedNames} from '../scripts/check-imports.mjs'

test('import clauses: default, named, renamed and namespace bindings', () => {
  assert.deepEqual(importedNames('React,{useEffect,useRef as ref}'), ['React', 'useEffect', 'ref'])
  assert.deepEqual(importedNames('* as THREE'), ['THREE'])
  assert.deepEqual(importedNames('{\n  a,\n  b,\n}'), ['a', 'b'])
})

test('an unused import is reported; uses by call, spread, JSX and shorthand are not', () => {
  const text = "import {a, b, c, d, unused} from './x.js'\nimport E from './e.js'\nconst list = [...b]\na()\nconst o = {c}\nconsole.log(d.length, <E/>)\nconsole.log(o.unused)\n"
  assert.deepEqual(findImportProblems(text, 'file.js'), ["'unused' is imported but never used"])
})

test('a .jsx file must import React; React itself is not reported unused there', () => {
  assert.deepEqual(findImportProblems("import Thing from './t.jsx'\nexport default () => <Thing/>\n", 'a.jsx'), ['a .jsx file must import React (classic JSX transform)'])
  assert.deepEqual(findImportProblems("﻿import React from 'react'\nexport default () => <div/>\n", 'b.jsx'), [])
  assert.deepEqual(findImportProblems("import React from 'react'\n", 'c.js'), ["'React' is imported but never used"])
})

test('the app, scripts and tests have no import problems', () => {
  assert.deepEqual(checkImports(fileURLToPath(new URL('..', import.meta.url))), [])
})
