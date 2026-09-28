import { defineConfig } from 'vite'
import { localUpdatePlugin } from './scripts/local-update-plugin.mjs'

export default defineConfig({ plugins: [localUpdatePlugin()] })
