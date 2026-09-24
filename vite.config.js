import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import marbleProxy from "./marble-proxy.js";

export default defineConfig({
  // GitHub Pages serves from /<repo-name>/, everything else from /.
  // The deploy workflow sets VITE_BASE; local dev and Vercel leave it unset.
  base: process.env.VITE_BASE || "/",
  plugins: [react(), tailwindcss(), marbleProxy()],
});
