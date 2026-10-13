// Check that every local asset referenced by the HTML and CSS actually exists.
//
// Broken paths are the failure mode that matters most for a static site: the
// page still renders, just without the image, font, or stylesheet.
//
// References are resolved in site-path space (where the file is served, see
// apps.mjs), so `../assets/x.jpg` in apps/design-a/index.html is checked
// against apps/landing/assets/x.jpg, exactly as it resolves after deploy.

import { readdir, readFile, stat } from "node:fs/promises";
import { join, posix, dirname, basename } from "node:path";
import { repoRoot, appsRoot, appNames, toDisk, toSite } from "./apps.mjs";

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
  // A quoted data: URI can contain its own url(...) (inline SVG filters do),
  // which would otherwise be mistaken for a local reference.
  contents = contents.replace(/url\(\s*(["'])data:[\s\S]*?\1\s*\)/g, "");
  const patterns = source.endsWith(".css")
    ? [/url\(\s*["']?([^"')]+)["']?\s*\)/g]
    : [/(?:src|href|poster)\s*=\s*["']([^"']+)["']/g];

  for (const pattern of patterns) {
    for (const [, ref] of contents.matchAll(pattern)) {
      if (!isExternal(ref)) found.add(ref.split("#")[0].split("?")[0]);
    }
  }
  return found;
}

/**
 * Does `target` exist with exactly this spelling? macOS resolves paths
 * case-insensitively but GitHub Pages does not, so `access()` alone would
 * pass a reference that 404s once deployed.
 */
async function existsExactly(target) {
  try {
    const info = await stat(target);
    if (info.isDirectory()) return true;
  } catch {
    return false;
  }
  const siblings = await readdir(dirname(target));
  return siblings.includes(basename(target));
}

const names = await appNames();
const sources = (await walk(appsRoot)).filter((file) =>
  /\.(html|css)$/.test(file),
);
const broken = [];
const show = (source) => source.slice(repoRoot.length);

for (const source of sources) {
  const contents = await readFile(source, "utf8");
  const base = posix.dirname(toSite(source));
  for (const ref of references(source, contents)) {
    if (ref.startsWith("/")) {
      // The site is deployed under /addenso-website/, so root-relative paths
      // escape the site. Only relative references survive both dev and deploy.
      broken.push(
        `${show(source)}: ${ref} (root-relative; use a relative path)`,
      );
      continue;
    }
    const [, target] = toDisk(posix.resolve(base, ref), names);
    if (!(await existsExactly(target))) broken.push(`${show(source)}: ${ref}`);
  }
}

if (broken.length > 0) {
  console.error(`Found ${broken.length} broken reference(s):`);
  for (const entry of broken) console.error(`  ${entry}`);
  process.exit(1);
}

console.log(`Checked ${sources.length} file(s); all local references resolve.`);
