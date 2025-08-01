import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['quill'],
          utils: ['lucide']
        }
      }
    }
  },
  preview: {
    port: 4173,
    host: true,
    open: true
  }
});