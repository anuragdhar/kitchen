import { defineConfig } from 'vite'
import { localUpdatePlugin } from './scripts/local-update-plugin.mjs'
import { inspirationSyncPlugin } from './scripts/inspiration-sync-plugin.mjs'

export default defineConfig({ plugins: [localUpdatePlugin(), inspirationSyncPlugin()] })
