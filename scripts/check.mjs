// Check that every local asset referenced by the HTML and CSS actually exists.
//
// Broken paths are the failure mode that matters most for a static site: the
// page still renders, just without the image, font, or stylesheet.

import { readdir, readFile, access } from "node:fs/promises";
import { join, dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const appRoot = join(repoRoot, "apps/landing");

/** Every file under `dir`, recursively, as absolute paths. */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return files.flat();
}

const isExternal = (ref) =>
  /^(https?:|mailto:|tel:|data:|#|\/\/)/.test(ref) || ref.trim() === "";

/** Pull local asset references out of one source file. */
function references(source, contents) {
  const found = new Set();
  const patterns = source.endsWith(".css")
    ? [/url\(\s*["']?([^"')]+)["']?\s*\)/g]
    : [/(?:src|href)\s*=\s*["']([^"']+)["']/g];

  for (const pattern of patterns) {
    for (const [, ref] of contents.matchAll(pattern)) {
      if (!isExternal(ref)) found.add(ref.split("#")[0].split("?")[0]);
    }
  }
  return found;
}

const sources = (await walk(appRoot)).filter((file) =>
  /\.(html|css)$/.test(file),
);
const broken = [];

for (const source of sources) {
  const contents = await readFile(source, "utf8");
  for (const ref of references(source, contents)) {
    const target = resolvePath(dirname(source), ref);
    try {
      await access(target);
    } catch {
      broken.push(`${source.slice(repoRoot.length)}: ${ref}`);
    }
  }
}

if (broken.length > 0) {
  console.error(`Found ${broken.length} broken reference(s):`);
  for (const entry of broken) console.error(`  ${entry}`);
  process.exit(1);
}

console.log(`Checked ${sources.length} file(s); all local references resolve.`);
