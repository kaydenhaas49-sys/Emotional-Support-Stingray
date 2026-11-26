import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
