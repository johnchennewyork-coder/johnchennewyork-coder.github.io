import { defineConfig } from 'vite';
import { resolve } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';

// Simple content type detection
function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    pdf: 'application/pdf',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
  };
  return types[ext] || 'application/octet-stream';
}

// Plugin to copy resources directory to dist after build and serve during dev
const copyResourcesPlugin = (): Plugin => {
  return {
    name: 'copy-resources',
    writeBundle() {
      const resourcesSrc = resolve(__dirname, 'resources');
      if (existsSync(resourcesSrc)) {
        try {
          execSync(`cp -r "${resourcesSrc}" "${resolve(__dirname, 'dist')}/"`);
          console.log('✓ Copied resources directory to dist');
        } catch (error) {
          console.warn('Could not copy resources directory:', error);
        }
      }
    },
    configureServer(server) {
      // Serve resources directory during dev
      server.middlewares.use('/resources', (req, res, next) => {
        if (!req.url) {
          next();
          return;
        }
        const filePath = resolve(__dirname, 'resources', req.url.replace(/^\/resources/, ''));
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const content = readFileSync(filePath);
          const contentType = getContentType(filePath);
          res.setHeader('Content-Type', contentType);
          res.end(content);
        } else {
          next();
        }
      });
    },
  };
};

export default defineConfig({
  root: '.',
  // Resources will be copied by plugin, but we also serve it during dev
  publicDir: false,
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        journalGPT: resolve(__dirname, 'journalGPT.html'),
        cropper: resolve(__dirname, 'cropper.html'),
        experimental: resolve(__dirname, 'experimental.html'),
        adversity: resolve(__dirname, 'adversity.html'),
        radiantai: resolve(__dirname, 'radiantai.html'),
        ulti: resolve(__dirname, 'ulti.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    // Serve resources from root during dev
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [copyResourcesPlugin()],
});

