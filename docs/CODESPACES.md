# Home Interior in GitHub Codespaces

## Launch

Create a Codespace from the branch containing `.devcontainer/devcontainer.json`.
Use **Code -> Codespaces -> New with options** and choose a **2-core** machine.
Review the billing account and remaining included usage before creation. This
configuration does not change spending limits, billing, or port visibility.

The container uses Node 22, runs `npm ci` with the existing lockfile, then starts
Home Interior on **port 5173**. Click **Open in Browser** in the notification,
or open the **PORTS** panel and use the globe icon beside **Home Interior**.
Keep **Port Visibility = Private** (the default for new forwarded ports).
The local service uses HTTP; the GitHub browser link uses its HTTPS gateway.

This opens the whole-home entry page, not just the kitchen. Existing room,
material, lighting and save/load code is unchanged. Browser saves belong to the
browser origin: export a project JSON before changing Codespaces or deleting one.
A new Codespace URL will not automatically contain saves from a different URL.

The home page's **Update from GitHub** button fetches the current branch and
restarts the preview when the checkout is clean. After receiving an update to
the preview server itself, restart the Codespace from its menu once so the new
server configuration loads.

## Restart / diagnose

From the repository root:

```bash
bash .devcontainer/start-preview.sh
cat .devcontainer/.runtime/preview.log
```

The startup script is safe to rerun: it detects this workspace's running preview,
serializes simultaneous starts, uses a fixed port, and does not kill another
service using that port. It reports failure instead of claiming readiness.
If dependencies are missing, run `cd react-configurator && npm ci` from the
repository root, return to the root, and rerun the startup script. After a lockfile
or container configuration change use **Codespaces: Rebuild Container** to
reinstall dependencies and restart the server.

## Validation

```bash
node --test .devcontainer/config.test.mjs
cd react-configurator
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:browser
npm run test:persistence
cd ..
node .devcontainer/smoke.cjs
```

The Codespaces preview workflow tests configuration, startup, repeated startup,
locked dependency installation, the production build, and a real Chromium home
page. It also runs the existing correctness and persistence browser suites
against port 5173. Logs/screenshots are CI evidence, not approved visual baselines.
Passing CI does **not** prove GitHub's Codespaces provisioning, authenticated
forwarded URL, browser GPU behavior, or Blender rendering. Those require their
own checks in a live Codespace. Blender is not installed by this configuration.

## Access and costs

Do not paste GitHub tokens, SSH keys, or passwords into chat or commit them.
Creating a Codespace does not grant a chat assistant terminal access.

Stop the Codespace from its menu when finished. Closing the browser tab is not a
reliable way to stop compute immediately. Storage still counts while a stopped
Codespace exists. Export your project files and push your work before deleting it.
This is a development preview, not a permanent production deployment.

References:
- https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace
- https://docs.github.com/en/codespaces/developing-in-a-codespace/creating-a-codespace-for-a-repository
- https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
