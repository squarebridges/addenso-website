// Build: copy every app under apps/ into dist/.
//
// The site has no compile step, so a build is just a clean copy. apps/landing
// becomes the dist root and every other app lands at dist/<name>/, mirroring
// the URLs GitHub Pages serves them at.

import { cp, rm, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { repoRoot, appsRoot, appNames } from "./apps.mjs";

const dist = join(repoRoot, "dist");
const names = await appNames();

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(appsRoot, "landing"), dist, { recursive: true });

for (const name of names.filter((name) => name !== "landing")) {
  const target = join(dist, name);
  // Landing is copied first, so anything already at dist/<name> is one of its
  // own folders (assets, css, js) and the app would silently merge into it.
  const collides = await access(target).then(
    () => true,
    () => false,
  );
  if (collides)
    throw new Error(`apps/${name} collides with a path in apps/landing`);
  await cp(join(appsRoot, name), target, { recursive: true });
}

console.log(`Built ${names.length} app(s) -> ${dist}: ${names.join(", ")}`);
