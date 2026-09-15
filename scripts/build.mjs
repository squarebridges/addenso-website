// Build: copy the static landing app into dist/.
//
// The site has no compile step, so a build is just a clean copy. Keeping it
// behind a script means `pnpm build` produces the same tree that gets deployed.

import { cp, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const source = join(repoRoot, "apps/landing");
const dist = join(repoRoot, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(source, dist, { recursive: true });

console.log(`Built ${source} -> ${dist}`);
