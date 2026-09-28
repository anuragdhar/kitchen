# Optional Windows utilities

For the home-design application, use **`start-server.bat` in the repository root**.
It replaces `Run-Home-Interior.bat` and `Run-Kitchen-React-App.bat`; update any old
shortcuts to point to `start-server.bat`.

The following independent utilities were moved here from the root, not deleted:

| File | Purpose |
| --- | --- |
| `Generate-FreeCAD-3D.bat` | Generate the existing FreeCAD kitchen model. |
| `Open-FreeCAD-3D.bat` | Open that model, generating it first when absent. |
| `Render-Blender-Kitchen.bat` | Run the existing offline Blender render script. |
| `Run-Kitchen-design.bat` | Run the legacy PowerShell 2D layout generator. |
| `Start-Muse-Terminal.bat` | Open the existing Ubuntu/WSL Muse terminal at the repository root. |

Double-click a utility here, or call it by its `scripts\windows\...` path.
Its working paths still resolve to the repository root. These are optional tools,
not prerequisites for starting the web application. Existing FreeCAD installation
paths and Blender/WSL requirements are unchanged. Historical documents under
`docs/archive/` retain their original launcher names and are not current run instructions.

## Launcher checks

From the repository root:

```sh
node --test scripts/windows/launchers.test.mjs
```

The same tests are included in `react-configurator`'s `npm test`. Cross-platform
checks enforce the single root launcher and relocated utility paths. Windows-only
checks execute the real launcher with a fake npm command in an isolated temporary
workspace, covering installation, reuse of dependencies, error codes, missing
prerequisites, paths containing spaces, and restoration of the caller's directory.
They do not install dependencies, open a browser, or run FreeCAD/Blender/WSL.
On non-Windows systems these execution checks are explicitly skipped.
