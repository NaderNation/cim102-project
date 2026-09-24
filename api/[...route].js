// Vercel serverless entry: every /api/* request runs the shared backend.
import { createHandler } from "../server/handlers.js";

export const config = { api: { bodyParser: false } };

const handle = createHandler();
export default function handler(req, res) {
  return handle(req, res, () => { res.statusCode = 404; res.end("Not found"); });
}
