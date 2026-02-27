import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// Inject VITE_SITE_URL into index.html at build so og/twitter URLs work for crawlers that don't run JS
function injectSiteUrl() {
  return {
    name: 'inject-site-url',
    transformIndexHtml(html: string) {
      const base = process.env.VITE_SITE_URL || 'https://sideline-se.com'
      const origin = base.replace(/\/$/, '')
      return html
        .replace(/\bhttps:\/\/sideline-se\.com\/?/g, origin + '/')
        .replace(/https:\/\/sideline-se\.com\/logo-180\.png/g, origin + '/logo-180.png')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [injectSiteUrl(), inspectAttr(), react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
