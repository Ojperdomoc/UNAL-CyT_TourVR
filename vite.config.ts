import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  /**
   * GitHub Pages sirve este proyecto desde un subdirectorio
   * (https://<usuario>.github.io/UNAL-CyT_TourVR/), por lo que todas las rutas
   * del build deben ser relativas. Con base relativa el mismo dist/ funciona en
   * la raíz, en un subdirectorio o incluso abierto desde el disco (file://).
   */
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // El sitio debe funcionar como archivo único autocontenido (sin peticiones
    // externas), así que los assets se incrustan en el bundle.
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 4096,
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    host: true,
    // Permite servir el dev server detrás del proxy de previsualización.
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
