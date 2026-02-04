import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      // Your app calls /geoserver/... and Vite forwards it
      "/geoserver": {
        target: "https://download.geoportal.gov.gi",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/geoserver/, "/geoserver")
      }
    }
  }
});
