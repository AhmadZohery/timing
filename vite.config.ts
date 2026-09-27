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
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/dexie/')) {
            return 'vendor-db';
          }
          if (id.includes('node_modules/recharts/')) {
            return 'vendor-charts';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
