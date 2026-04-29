import { defineConfig } from "vite";

export default defineConfig({

  server: {
    proxy: {
      '/geoserver': {
        target: 'https://download.geoportal.gov.gi',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
