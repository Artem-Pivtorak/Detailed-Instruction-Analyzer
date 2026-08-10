import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  // CRITICAL: relative base so built HTML works from local filesystem (file://)
  base: "./",

  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },

  build: {
    // ФІКС: інтерфейс тепер живе ВСЕРЕДИНІ ядра M.A.R.T.I.N. 2.0 (запускається
    // з main.py через pywebview / martin_gui.py), а не як окремий exe.
    // Білд летить напряму в D:\martin 2.0\gui\ui.
    outDir: "D:\\martin 2.0\\gui\\ui",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Keep chunk filenames stable so PyInstaller can bundle them
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
