import test from 'node:test'
import assert from 'node:assert/strict'
import { isAllowedUpdateRequest } from '../scripts/local-update-plugin.mjs'

const codespace = {
  CODESPACE_NAME: 'design-space',
  GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: 'app.github.dev',
}

function request(address, host, origin, method = 'POST') {
  return { socket: { remoteAddress: address }, headers: { host, origin }, method }
}

test('update requests require local or exact private Codespaces origin', () => {
  assert.equal(isAllowedUpdateRequest(request('127.0.0.1', '127.0.0.1:5173', 'http://127.0.0.1:5173'), {}), true)
  assert.equal(isAllowedUpdateRequest(request('10.0.0.1', 'design-space-5173.app.github.dev', 'https://design-space-5173.app.github.dev'), codespace), true)
  assert.equal(isAllowedUpdateRequest(request('10.0.0.1', 'other-5173.app.github.dev', 'https://other-5173.app.github.dev'), codespace), false)
  assert.equal(isAllowedUpdateRequest(request('10.0.0.1', 'design-space-5173.app.github.dev', 'https://other-5173.app.github.dev'), codespace), false)
  assert.equal(isAllowedUpdateRequest(request('10.0.0.1', 'design-space-5173.app.github.dev', 'http://design-space-5173.app.github.dev'), codespace), false)
  assert.equal(isAllowedUpdateRequest(request('10.0.0.1', 'design-space-5173.app.github.dev', 'https://design-space-5173.app.github.dev'), {}), false)
})
