// Static file server for local development and for previewing a build.
//
//   node scripts/serve.mjs          -> serves apps/ as deployed: landing at /,
//                                      every other app at /<name>/
//   node scripts/serve.mjs dist     -> serves dist as a plain root
//
// Directories are only served with a trailing slash (301 otherwise), matching
// GitHub Pages; without that, a page's relative asset paths resolve one level
// too high in dev and look broken for no real reason.

import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, extname, normalize, sep } from "node:path";
import { repoRoot, appNames, toDisk } from "./apps.mjs";

const explicitRoot = process.argv[2] ? join(repoRoot, process.argv[2]) : null;
const names = explicitRoot ? [] : await appNames();
const port = Number(process.env.PORT ?? 4173);

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/** Resolve a request path to `{ file }`, `{ redirect }`, or null if missing or escaping. */
async function resolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const sitePath = normalize(decoded);
  const [root, candidate] = explicitRoot
    ? [explicitRoot, join(explicitRoot, sitePath)]
    : toDisk(sitePath, names);
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) {
      if (!decoded.endsWith("/")) return { redirect: decoded + "/" };
      return resolve(join(decoded, "index.html"));
    }
    return { file: candidate };
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  const result = await resolve(request.url ?? "/");

  if (!result) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  if (result.redirect) {
    response.writeHead(301, { location: result.redirect });
    response.end();
    return;
  }

  response.writeHead(200, {
    "content-type":
      CONTENT_TYPES[extname(result.file)] ?? "application/octet-stream",
    "cache-control": "no-cache",
  });
  createReadStream(result.file).pipe(response);
});

server.listen(port, () => {
  const what = explicitRoot
    ? explicitRoot
    : `apps/ (${names.map((n) => (n === "landing" ? "/" : `/${n}/`)).join(", ")})`;
  console.log(`Serving ${what} on http://localhost:${port}`);
});
