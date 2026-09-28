import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makePreviewConfig, workspaceId } from './vite.config.mjs';
const config = JSON.parse(readFileSync(new URL('./devcontainer.json', import.meta.url), 'utf8'));

test('Node 22, locked installation, and automatic private-default preview', () => {
  assert.match(config.image, /javascript-node:1-22-bookworm$/);
  assert.equal(config.postCreateCommand, 'cd react-configurator && npm ci');
  assert.deepEqual(config.forwardPorts, [5173]);
  assert.equal(config.portsAttributes['5173'].onAutoForward, 'openBrowser');
  assert.equal(config.waitFor, 'postCreateCommand');
  assert.equal(config.remoteUser, 'node');
});
test('local preview uses a fixed port without globally allowing hostnames', () => {
  const { server } = makePreviewConfig({});
  assert.equal(server.host, '0.0.0.0');
  assert.equal(server.port, 5173);
  assert.equal(server.strictPort, true);
  assert.deepEqual(server.allowedHosts, []);
});
test('only the current Codespace hostname is allowed', () => {
  assert.deepEqual(makePreviewConfig({ CODESPACE_NAME: 'test-workspace-123' }).server.allowedHosts,
    ['test-workspace-123-5173.app.github.dev']);
});
test('the platform forwarding domain is respected', () => {
  assert.deepEqual(makePreviewConfig({ CODESPACE_NAME: 'test-123', GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'preview.example.test' }).server.allowedHosts,
    ['test-123-5173.preview.example.test']);
});
test('malformed forwarding names are rejected', () => {
  for (const name of ['bad/name', 'bad.name', 'bad name', 'bad;command']) {
    assert.throws(() => makePreviewConfig({ CODESPACE_NAME: name }), /Invalid Codespaces/);
  }
  assert.throws(() => makePreviewConfig({ CODESPACE_NAME: 'safe', GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'https://bad' }), /Invalid Codespaces/);
});
test('readiness reports the stable workspace identity', () => {
  assert.match(workspaceId, /^[a-f0-9]{64}$/);
  let registered;
  makePreviewConfig({}).plugins[0].configureServer({ middlewares: { use: (path, handler) => { registered = { path, handler }; } } });
  assert.equal(registered.path, '/__home_interior_ready');
  let body;
  registered.handler({}, { setHeader() {}, end(value) { body = value; } });
  assert.equal(body, workspaceId);
});
