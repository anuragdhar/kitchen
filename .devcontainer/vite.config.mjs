import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { localUpdatePlugin } from '../react-configurator/scripts/local-update-plugin.mjs';

const root = fileURLToPath(new URL('../react-configurator/', import.meta.url));
export const workspaceId = createHash('sha256').update(root).digest('hex');

// Permit only this Codespace, never every *.app.github.dev host.
export function makePreviewConfig(env = process.env) {
  const name = env.CODESPACE_NAME;
  const domain = env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
  if (name && (!/^[a-z0-9-]+$/i.test(name) || !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/i.test(domain))) {
    throw new Error('Invalid Codespaces forwarding hostname');
  }
  return {
    root,
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: name ? [`${name}-5173.${domain}`] : [],
    },
    plugins: [{
      name: 'home-interior-preview-readiness',
      configureServer(server) {
        server.middlewares.use('/__home_interior_ready', (_request, response) => {
          response.setHeader('Content-Type', 'text/plain');
          response.end(workspaceId);
        });
      },
    }, localUpdatePlugin()],
  };
}

export default makePreviewConfig();
