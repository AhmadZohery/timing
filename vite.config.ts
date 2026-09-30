import dns from 'node:dns'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Force IPv4 first to eliminate 5-10s Windows IPv6 DNS stall
dns.setDefaultResultOrder('ipv4first')

function devApiFallbackPlugin() {
  return {
    name: 'dev-api-fallback',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/api/status' || req.url?.startsWith('/api/status?')) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, localOnly: true, uptimeSeconds: 0, aiConfigured: false }));
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    devApiFallbackPlugin(),
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'lucide-react',
      'dexie',
      'dexie-react-hooks',
      'canvas-confetti',
      'clsx',
      'tailwind-merge',
    ],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    cors: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (/node_modules[\/\\](react|react-dom)[\/\\]/i.test(id)) {
            return 'vendor-react';
          }
          if (/node_modules[\/\\]framer-motion[\/\\]/i.test(id)) {
            return 'vendor-motion';
          }
          if (/node_modules[\/\\]lucide-react[\/\\]/i.test(id)) {
            return 'vendor-icons';
          }
          if (/node_modules[\/\\](dexie|dexie-react-hooks)[\/\\]/i.test(id)) {
            return 'vendor-db';
          }
          if (/node_modules[\/\\]canvas-confetti[\/\\]/i.test(id)) {
            return 'vendor-confetti';
          }
          if (/node_modules[\/\\]dompurify[\/\\]/i.test(id)) {
            return 'vendor-sanitizer';
          }
          if (/data[\/\\]languages[\/\\]/i.test(id)) {
            return 'data-languages';
          }
          if (/gymfaithaudio/i.test(id)) {
            return 'data-audio';
          }
          if (/(quransurahdata|dailytadabburdata|surahkahfdata)/i.test(id)) {
            return 'data-quran';
          }
          if (/(arabicpoetrydata|lifewisdomdata)/i.test(id)) {
            return 'data-cultural';
          }
          if (/components[\/\\]stations[\/\\]/i.test(id)) {
            return 'stations-bundle';
          }
          if (/components[\/\\]spiritual[\/\\]/i.test(id)) {
            return 'spiritual-bundle';
          }
          if (/components[\/\\]work[\/\\]/i.test(id)) {
            return 'work-bundle';
          }
          if (/components[\/\\]learning[\/\\]/i.test(id)) {
            return 'learning-bundle';
          }
          if (/components[\/\\]dashboard[\/\\]/i.test(id)) {
            return 'dashboard-bundle';
          }
        },
      },
    },
    chunkSizeWarningLimit: 2000,
  },
})
