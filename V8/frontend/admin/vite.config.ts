import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "admin",
      filename: "remoteEntry.js",
      exposes: { "./App": "./src/App.tsx" },
      shared: ["react", "react-dom"]
    })
  ],
  build: { target: "esnext" }
});
