import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
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
  },
});

