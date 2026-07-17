import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// base: ตอน build (production) เสิร์ฟใต้ sub-path ของ GitHub Pages = /7KDB/
//        ตอน dev เสิร์ฟที่ราก / ตามปกติ
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/7KDB/' : '/',
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: fileURLToPath(
        new URL('./src/quasar-variables.sass', import.meta.url)
      ),
    }),
    // ⚡ Service Worker: cache รูป remote แบบ CacheFirst (โหลดครั้งเดียว ใช้ซ้ำจาก local)
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // ยังไม่ทำ installable — เอาแค่ cache รูป/ไฟล์แอป
      workbox: {
        // precache ไฟล์แอป (js/css/html) — ไม่รวม data.json (โหลดสดเสมอ)
        globPatterns: ['**/*.{js,css,html,woff,woff2}'],
        runtimeCaching: [
          {
            // RegExp literal (serialize เข้า SW ได้ตรง ๆ) — จับ URL รูปจาก host เหล่านี้
            urlPattern: /^https:\/\/[^/]*(googleusercontent\.com|ggpht\.com|gamewith\.net|placehold\.co|dicebear\.com)\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: '7kdb-images',
              expiration: {
                maxEntries: 1500,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 วัน
              },
              // รับ opaque response (รูป cross-origin ไม่มี CORS) ด้วย status 0
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // ให้มือถือใน Wi‑Fi เดียวกันเข้าได้
    port: 5173,
    open: true,
  },
}))
