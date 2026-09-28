// Used only by the Codespaces launcher; normal npm run dev/build stay unchanged.
export function previewConfig(env = process.env) {
  const name = env.CODESPACE_NAME;
  const domain = env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
  if (env.CODESPACES === 'true' && !name) {
    throw new Error('Codespaces did not supply CODESPACE_NAME. Restart the codespace.');
  }
  if (name && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ||
      !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(domain))) {
    throw new Error('Invalid Codespaces preview hostname.');
  }
  return {
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      // Never allow all hosts or all app.github.dev subdomains.
      allowedHosts: name ? [`${name}-5173.${domain}`] : [],
    },
  };
}
export default previewConfig();
