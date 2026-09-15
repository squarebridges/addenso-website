// Static file server for local development and for previewing a build.
//
//   node scripts/serve.mjs          -> serves apps/landing
//   node scripts/serve.mjs dist     -> serves dist

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const root = join(repoRoot, process.argv[2] ?? "apps/landing");
const port = Number(process.env.PORT ?? 4173);

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};

/** Resolve a request path to a file inside `root`, or null if it escapes. */
async function resolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const candidate = join(root, normalize(decoded));
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) return resolve(join(decoded, "index.html"));
    return candidate;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  const file = await resolve(request.url ?? "/");

  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": CONTENT_TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": "no-cache",
  });
  createReadStream(file).pipe(response);
});

server.listen(port, () => {
  console.log(`Serving ${root} on http://localhost:${port}`);
});
