from pathlib import Path
import json
# Configuration, dependency versions, lockfile, renderer and reference assets are not edited.
p=Path('react-configurator/package.json')
d=json.loads(p.read_text())
d['scripts']['test'] += ' tests/project-codec.test.mjs tests/project-storage.test.mjs tests/current-project.test.mjs'
d['scripts']['test:persistence']='node scripts/persistence-browser.cjs'
p.write_text(json.dumps(d,indent=2)+'\n')
p=Path('.github/workflows/check.yml');s=p.read_text()
s=s.replace('      - uses: actions/upload-artifact@v4', '      - name: Project persistence browser checks\n        run: npm run test:persistence\n      - uses: actions/upload-artifact@v4',1)
s += '''      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: persistence-verification
          path: react-configurator/test-results/persistence/
          if-no-files-found: ignore
          retention-days: 7
'''
p.write_text(s)
p=Path('docs/ARCHITECTURE.md');s=p.read_text().replace('| Kitchen state, persistence and views | src/App.jsx |','| Kitchen views and controls | src/App.jsx |\n| Atomic project state and autosave status | src/hooks/useKitchenProject.js |\n| Versioned project codecs and recovery storage | src/persistence/projectCodec.mjs; projectStorage.mjs |')
s+='\n## Project persistence boundary\n\nThe kitchen now holds serializable project state in one object. Imports prepare a\ncomplete schema-checked replacement before committing it; view selection remains\nseparate. v0 adapters preserve supplied coordinates rather than infer a version\nfrom appliance positions. See PROJECT_FORMAT.md for formats, limits, storage keys\nand recovery. Geometry-validation failures are not data-format failures: editable\ndrafts retain their measurements and the runtime validator still reports issues.\n'
p.write_text(s)
p=Path('docs/CURRENT_STATE.md');s=p.read_text().replace('with state/migrations in App.jsx.', 'with versioned state/persistence in useKitchenProject.js and src/persistence/.').replace('These fixes do not unify all export metadata or change save/load migrations.', 'The shared export metadata is not fully unified. Project saves now use the\n  versioned codec documented in PROJECT_FORMAT.md; the live east/west arrays are\n  authoritative when a document also carries a derived layoutModel.')
s+='\n## Persistence update\n\nUnversioned array and layoutModel projects are migrated without moving supplied\nitems. New autosaves and named versions use :schema-1 keys, retaining their original\nlegacy keys. Imports reject malformed data and mismatched room dimensions before\nchanging active state. Original unreadable autosaves are protected until explicit\nrecovery. Existing project rules still flag non-preset designs; loading does not\nconvert those designs to defaults. Undo/redo and export-model unification remain\nseparate work.\n'
p.write_text(s)
p=Path('docs/TESTING.md');s=p.read_text().replace('Saving/migration formats are unchanged.', 'Project saving/loading is now versioned; see PROJECT_FORMAT.md.')
s+='\n## Save/load regression checks\n\nThe Node suite covers v1 round trips, explicit v0 adapters, unknown versions,\nfinite dimensions, visibility/metadata, malformed late-stage modules, room mismatch,\nsize/depth limits, quota failures, backups, and observed cross-tab conflicts.\n`npm run test:persistence` starts a loopback Vite server on port 4176 (or uses\nKITCHEN_APP_URL) and exercises actual JSON upload/download, named versions, reload,\nlegacy migration, stale file reads, corrupt autosaves, and injected quota failures.\nBrowser contexts are isolated from user data; all runs use kitchenView=top and do\nnot establish 3D performance. Artifacts go to test-results/persistence/.\n'
p.write_text(s)
