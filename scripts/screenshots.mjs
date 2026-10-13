// Full-page screenshots of every page at desktop and phone widths, for review.
//
//   node scripts/screenshots.mjs [--out <dir>]        (dev server must be running)
//   BASE_URL=https://host/addenso-website node scripts/screenshots.mjs
//
// Lazy images are forced and the page is scrolled end to end before capture,
// otherwise lazy loading and scroll-reveal animations leave blank bands.

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { appNames } from "./apps.mjs";

const BASE = (process.env.BASE_URL ?? "http://localhost:4173").replace(
  /\/$/,
  "",
);
const PAGES = (await appNames()).map((name) =>
  name === "landing" ? "/" : `/${name}/`,
);
const VIEWPORTS = [
  { name: "desktop", options: { viewport: { width: 1440, height: 900 } } },
  {
    name: "mobile",
    options: {
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
  },
];

const flag = process.argv.indexOf("--out");
const outDir = flag === -1 ? "screenshots" : process.argv[flag + 1];
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
for (const { name, options } of VIEWPORTS) {
  const context = await browser.newContext({
    ...options,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      document
        .querySelectorAll("img[loading]")
        .forEach((img) => img.removeAttribute("loading"));
      await document.fonts.ready;
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    const slug = path === "/" ? "landing" : path.replaceAll("/", "");
    const file = join(outDir, `${slug}-${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
  }
  await context.close();
}
await browser.close();
