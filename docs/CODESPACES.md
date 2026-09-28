# Home Interior in GitHub Codespaces

This configuration prepares a Node 22 development environment for the current
Home Interior web application. It does not create a VM, modify billing, rename the
repository, or install Blender. Layouts, assets, and browser saves are unchanged.

## Create and view

1. On the branch containing `.devcontainer/devcontainer.json`, choose
   **Code -> Codespaces -> New with options**. Select **2 cores / 8 GB** and review
   the billing account before choosing **Create codespace**. The minimum in the
   devcontainer does not enforce a maximum machine size or a spending limit.
2. Setup installs the committed dependency lockfile using `npm ci`. On each
   codespace start the launcher starts Vite, checks readiness, and returns.
3. The **Ports** panel forwards **5173**, labeled **Home Interior**. Use its globe
   icon (**Open in Browser**) if the app tab does not open automatically.
4. Keep **Port Visibility -> Private**. GitHub defaults new forwarded ports to
   private; this config does not request public access or change existing choices.

The browser preview is the running application, not a rendered screenshot.
Its address is assigned by GitHub after creation; do not substitute an invented
codespace name into a URL. The browser must be signed into the codespace owner's
GitHub account for the private preview. A public repository does not make its
private forwarded port public.

The web app's 3D preview runs in the visiting browser. This setup does not validate
Blender, Cycles, cloud GPU rendering, or unattended access from an AI chat. A
connected repository alone does not provide an interactive Codespaces terminal.

## Restart, logs and tests

From the repository root:

```bash
bash .devcontainer/start-preview.sh
node --test .devcontainer/config.test.mjs
npm --prefix react-configurator run check
```

The launcher reports its PID and log path. Repeating the command reuses its own
healthy server, does not create duplicate servers, and never kills unrelated
processes. A conflicting port fails explicitly rather than silently selecting a
new port. Dependency/install errors are not reported as a working preview.

Application edits are handled by Vite's development server. Changing the container
configuration requires **Codespaces: Rebuild Container**. After changing dependency
files, stop the preview PID shown by the launcher, run `npm --prefix
react-configurator ci`, and rerun the launcher. No broad process-kill command is
required. The normal local `npm run dev` and production build are unchanged.

Browser tests remain opt-in in the workspace to avoid downloading Chromium on
every workspace creation. From `react-configurator/` run:

```bash
npx playwright install --with-deps chromium
npm run test:browser
npm run test:persistence
```

CI also checks launcher syntax, configuration, a real HTTP startup, repeat startup,
and allowed/rejected Host headers. These CI checks are not a real Codespaces
provisioning test or a verification of GitHub's authentication/forwarding proxy.

## Storage, privacy and cost

Stop the codespace when finished; do not use it as an always-on production server.
Stopped codespaces retain storage. Review usage/budgets in GitHub before creating
one; no free allowance or remaining balance is assumed by this setup.

Browser autosaves belong to the preview's origin. A different codespace URL has a
different browser storage origin: export project JSON before deleting/recreating
a codespace, and import it into the new preview. No existing saves are copied or
migrated automatically. Do not paste passwords, SSH keys, or access tokens into
chat or commit them to the repository.

References:
- https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace
- https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers
- https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
