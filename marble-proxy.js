// Vite plugin: serves the shared backend (server/handlers.js) during `npm run dev` and `npm run preview`.
import { loadEnv } from "vite";
import { createHandler } from "./server/handlers.js";

export default function marbleProxy() {
  let env = {};
  const handle = createHandler(() => env);
  return {
    name: "marble-proxy",
    configResolved(cfg) { env = loadEnv(cfg.mode, process.cwd(), ""); },
    configureServer(server) { server.middlewares.use(handle); },
    configurePreviewServer(server) { server.middlewares.use(handle); },
  };
}
