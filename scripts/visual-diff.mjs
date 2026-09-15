// Compare this replica against the live addenso.com, section by section.
//
//   node scripts/visual-diff.mjs [--out <dir>]
//
// Each section is captured with its top pinned to a fixed viewport offset, so
// both sides produce identically sized images anchored at the same content.
// Drift below the fold of a section shows up in the next section's capture.

import { chromium, devices } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const LIVE = "https://addenso.com/";
const LOCAL = "http://localhost:4173/";

// Anchored on a text landmark both sites share, not on element boundaries:
// the two DOMs wrap their sections differently, so matching on structure
// lines the captures up at different content and reports phantom drift.
const SECTIONS = [
  { name: "hero", anchor: null },
  { name: "team", anchor: "Our Team" },
  { name: "services", anchor: "Our Services" },
  { name: "statistics", anchor: "Data Initiatives" },
  { name: "industries", anchor: "Industry Experience" },
  { name: "case-studies", anchor: "Case Studies" },
  { name: "footer", anchor: "At Addenso Labs, we are driven" },
];

const VIEWPORTS = [
  { name: "desktop", options: { viewport: { width: 1440, height: 900 } } },
  { name: "mobile", options: devices["Pixel 5"] },
];

const outDir = (() => {
  const flag = process.argv.indexOf("--out");
  return flag === -1 ? "visual-diff" : process.argv[flag + 1];
})();

/**
 * Put the page in a deterministic state: no consent modal, no lazy images,
 * every scroll-triggered animation already played out, and video parked on
 * its first frame so the two sides aren't compared mid-playback.
 */
async function settle(page) {
  await page.addStyleTag({
    content:
      ".be-gdpr-popup, .be-gdpr-modal, .mfp-bg, .mfp-wrap { display: none !important; }",
  });

  await page.evaluate(() => {
    document
      .querySelectorAll("img[loading]")
      .forEach((img) => img.removeAttribute("loading"));
  });

  // Walk the page so any scroll-triggered animation reaches its end state.
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo(0, 0);
  });

  await page.evaluate(() => {
    document.querySelectorAll("video").forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });
  });

  await page.waitForTimeout(1200);
}

/**
 * Capture one viewport-sized image per section, pinning each section's text
 * landmark to the same y offset on both sites so the pixels line up.
 */
async function capture(page, label, dir) {
  const shots = {};

  for (const { name, anchor } of SECTIONS) {
    const found = await page.evaluate(
      ({ anchor }) => {
        if (anchor === null) {
          window.scrollTo(0, 0);
          return true;
        }

        // The shallowest visible element whose own text starts with the anchor.
        const candidates = [
          ...document.querySelectorAll("h1, h2, h3, h4, h5, strong, p, span"),
        ]
          .filter((element) => {
            const text = (element.textContent ?? "").trim();
            if (!text.startsWith(anchor) || text.length > anchor.length + 420)
              return false;
            const box = element.getBoundingClientRect();
            return box.width > 0 && box.height > 0;
          })
          .sort(
            (a, b) =>
              a.getBoundingClientRect().top +
              window.scrollY -
              (b.getBoundingClientRect().top + window.scrollY),
          );

        const element = candidates[0];
        if (!element) return false;

        // Pin the landmark 200px down, clear of either site's sticky header.
        const target =
          element.getBoundingClientRect().top + window.scrollY - 200;
        window.scrollTo(0, Math.max(0, target));
        return true;
      },
      { anchor },
    );

    if (!found) {
      console.warn(`  ${label}: no anchor "${anchor}" for ${name}`);
      continue;
    }

    // Scroll again after a beat: the live theme swaps in an animated fixed
    // header clone, and capturing mid-animation shows up as phantom drift.
    await page.waitForTimeout(700);
    await page.evaluate(
      (y) => window.scrollTo(0, y),
      await page.evaluate(() => window.scrollY),
    );
    await page.waitForTimeout(900);

    const path = join(dir, `${name}-${label}.png`);
    await page.screenshot({ path });
    shots[name] = path;
  }

  return shots;
}

async function run() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const report = [];

  for (const { name, options } of VIEWPORTS) {
    const dir = join(outDir, name);
    await mkdir(dir, { recursive: true });

    const shots = {};
    for (const [label, url] of [
      ["mine", LOCAL],
      ["live", LIVE],
    ]) {
      const page = await browser.newPage(options);
      console.log(`${name}/${label}: loading ${url}`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      await settle(page);
      shots[label] = await capture(page, label, dir);
      await page.close();
    }

    for (const { name: section } of SECTIONS) {
      if (!shots.mine[section] || !shots.live[section]) continue;

      const mine = PNG.sync.read(await readFileBuffer(shots.mine[section]));
      const live = PNG.sync.read(await readFileBuffer(shots.live[section]));

      const width = Math.min(mine.width, live.width);
      const height = Math.min(mine.height, live.height);
      const diff = new PNG({ width, height });

      const mismatched = pixelmatch(
        crop(mine, width, height),
        crop(live, width, height),
        diff.data,
        width,
        height,
        { threshold: 0.12 },
      );

      const path = join(dir, `${section}-diff.png`);
      await writeFile(path, PNG.sync.write(diff));

      report.push({
        viewport: name,
        section,
        percent: (mismatched / (width * height)) * 100,
        mismatched,
        sizeMatch: mine.width === live.width && mine.height === live.height,
        diff: path,
      });
    }
  }

  await browser.close();

  console.log(
    "\nsection                      viewport   differing   diff image",
  );
  for (const row of report.sort((a, b) => b.percent - a.percent)) {
    console.log(
      `${row.section.padEnd(28)} ${row.viewport.padEnd(10)} ${row.percent.toFixed(2).padStart(6)}%     ${row.diff}`,
    );
  }

  await writeFile(
    join(outDir, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}

/** pixelmatch needs both images at identical dimensions. */
function crop(png, width, height) {
  if (png.width === width && png.height === height) return png.data;
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, 0, 0, width, height, 0, 0);
  return out.data;
}

async function readFileBuffer(path) {
  const { readFile } = await import("node:fs/promises");
  return readFile(path);
}

await run();
