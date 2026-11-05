import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend runs on port 8000 (see server.js). The dev/preview proxy makes the
// browser treat the API as same-origin, so cookies work and no CORS is needed.
const API = process.env.VITE_API_TARGET || 'http://localhost:8000'
const proxy = { '/api': { target: API, changeOrigin: false } }

// Strict CSP only for production builds (dev needs inline scripts for HMR).
const csp = {
  name: 'inject-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '</head>',
      `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" /></head>`
    ),
}

export default defineConfig({
  plugins: [react(), csp],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
})
