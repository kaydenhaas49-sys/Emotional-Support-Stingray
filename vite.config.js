import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // GitHub Pages hosts this repository under /Emotional-Support-Stingray/.
  // Local development keeps the normal root path.
  base: process.env.GITHUB_ACTIONS === 'true' ? '/Emotional-Support-Stingray/' : '/',
  server: {
    open: true,
    middlewareMode: false,
  },
  build: {
    outDir: 'dist',
    copyPublicDir: true,
  },
  publicDir: 'public',
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.png', '**/*.jpg', '**/*.jpeg'],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
