import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { previewConfig } from './vite.config.mjs';
const config = JSON.parse(readFileSync(new URL('./devcontainer.json', import.meta.url)));

test('Node 22 image and locked npm installation', () => {
  assert.match(config.image, /javascript-node:1-22-bookworm$/);
  assert.equal(config.remoteUser, 'node');
  assert.equal(config.postCreateCommand, 'npm --prefix react-configurator ci');
  assert.equal(config.postStartCommand, 'bash .devcontainer/start-preview.sh');
  assert.equal(config.waitFor, 'postCreateCommand');
});
test('only the application port is automatically forwarded', () => {
  assert.deepEqual(config.forwardPorts, [5173]);
  assert.equal(config.portsAttributes['5173'].onAutoForward, 'openBrowser');
  assert.equal(config.otherPortsAttributes.onAutoForward, 'ignore');
});
test('local preview remains on a strict fixed port without a wildcard allowlist', () => {
  assert.deepEqual(previewConfig({}).server, {
    host: '0.0.0.0', port: 5173, strictPort: true, allowedHosts: [],
  });
});
test('only the current codespace hostname is added', () => {
  assert.deepEqual(previewConfig({ CODESPACE_NAME: 'happy-home-123' }).server.allowedHosts,
    ['happy-home-123-5173.app.github.dev']);
});
test('forwarding domain from the Codespaces environment is supported', () => {
  assert.deepEqual(previewConfig({ CODESPACE_NAME: 'happy-home-123',
    GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'preview.example.com',
  }).server.allowedHosts, ['happy-home-123-5173.preview.example.com']);
});
test('missing and malformed Codespaces host metadata fail closed', () => {
  assert.throws(() => previewConfig({ CODESPACES: 'true' }));
  for (const name of ['*', '.github.dev', 'good/name', 'good name', 'https://host']) {
    assert.throws(() => previewConfig({ CODESPACE_NAME: name }));
  }
  for (const domain of ['*', '.app.github.dev', 'https://app.github.dev', 'a/b']) {
    assert.throws(() => previewConfig({ CODESPACE_NAME: 'happy-home',
      GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: domain }));
  }
});
