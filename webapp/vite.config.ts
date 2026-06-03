/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['match-tfe.duckdns.org', 'localhost', '127.0.0.1']
  },
  preview: {
    allowedHosts: ['match-tfe.duckdns.org', 'localhost', '127.0.0.1']
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' }
      ],
      headless: true
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    }
  }
})
