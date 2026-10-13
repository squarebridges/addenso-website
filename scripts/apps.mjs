// The apps/ directory is a mount table: apps/landing owns the site root and
// every other apps/<name> is served from /<name>/. Build, serve, and check all
// go through these helpers so they can never disagree about where a file lands.

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("..", import.meta.url));
export const appsRoot = join(repoRoot, "apps");

/** Names of every app directory, `landing` included. */
export async function appNames() {
  const entries = await readdir(appsRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/**
 * Map a site path like `/design-a/css/x.css` or `/assets/x.jpg` to disk.
 * Returns `[appDir, file]` so callers can also guard against path escapes.
 */
export function toDisk(sitePath, names) {
  const [, first = ""] = sitePath.split("/");
  const app = first !== "landing" && names.includes(first) ? first : "landing";
  const rest = app === "landing" ? sitePath : sitePath.slice(app.length + 1);
  const dir = join(appsRoot, app);
  return [dir, join(dir, rest)];
}

/** The site path an apps/ file is served at: apps/design-a/index.html -> /design-a/index.html. */
export function toSite(file) {
  const parts = file.slice(appsRoot.length + 1).split("/");
  if (parts[0] === "landing") parts.shift();
  return "/" + parts.join("/");
}
