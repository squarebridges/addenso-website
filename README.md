# addenso-website

A hand-written static replica of [addenso.com](https://addenso.com/), structured like
`apps/landing` in the `mention` repo: plain HTML, a small layered stylesheet, and one
vanilla JS module. No framework, no compile step.

The original is a WordPress site (Oshin theme + Tatsu page builder). This repo reproduces
the rendered page, not the WordPress installation — the markup here is written from
scratch and the assets were downloaded from the live site.

Alongside the replica, `apps/design-a`, `apps/design-b`, and `apps/design-c` are three
complete redesign concepts (same updated copy, different direction) for the Addenso team
to choose between, with `apps/designs` as a small index page linking them. See
"Multiple apps" below for how they are served and deployed.

## Layout

```
apps/
  landing/              the replica of the current site; served at /
    index.html          the whole site; every nav item is an anchor into this page
    css/
      main.css          entry point, @imports the rest in cascade order
      variables.css     design tokens (brand colors, font stack, container width)
      reset.css         normalize + base typography
      components.css    buttons, cards, carousel, section headings
      layout.css        page sections, grids, and the responsive breakpoints
    js/main.js          mobile nav, service-card flip, industry carousel, back-to-top
    assets/             images, icons, fonts, and the hero video (shared by every app)
  design-a/             redesign concept: editorial consulting; served at /design-a/
  design-b/             redesign concept: dark technical; served at /design-b/
  design-c/             redesign concept: evidence-first, human; served at /design-c/
    index.html, css/design.css, js/main.js, assets/fonts/   (same shape for each)
  designs/index.html    index page linking the concepts; served at /designs/
docs/asset-sources.json where each downloaded asset and font came from
scripts/                dev server, build, link checker, screenshots, visual diff
tests/                  Playwright specs (desktop + mobile projects)
```

## Multiple apps

`apps/` is a mount table: `apps/landing` is the site root and every other
`apps/<name>` is served at `/<name>/`. `scripts/apps.mjs` holds that rule and the build,
dev server, and link checker all use it, so a new directory under `apps/` is live on the
next deploy with no other wiring.

Two conventions follow from the site living under `/addenso-website/` on GitHub Pages:

- Reference shared assets relatively (`../assets/...` from a design's `index.html`,
  `../../assets/...` from its CSS), never root-relative. `pnpm check` rejects `/assets`.
- Directory URLs need the trailing slash (`/design-a/`). Pages redirects the bare form
  and so does the dev server, so a page's relative paths resolve the same way in both.

## Commands

```sh
pnpm install
pnpm dev          # serve apps/ at http://localhost:4173 (landing at /, others at /<name>/)
pnpm build        # copy apps/landing to dist/ and every other app to dist/<name>/
pnpm preview      # serve dist/
pnpm check        # verify every local href/src/url() resolves on disk, case-sensitively
pnpm test         # Playwright, starts the dev server itself
pnpm screenshots  # full-page desktop + mobile PNGs of every app into screenshots/
pnpm diff         # pixel-diff each section against the live addenso.com
pnpm format       # prettier --write .
```

`pnpm test` needs browsers once: `pnpm exec playwright install chromium`.

## Deploying

Pushes to `main` publish `dist/` to GitHub Pages via `.github/workflows/pages.yml`.
Nothing to do by hand; the Actions run takes about a minute.

## Reviewing the design concepts

With `pnpm dev` running, `pnpm screenshots` writes a desktop (1440px) and phone (390px)
full-page capture of every app to `screenshots/` (gitignored). `BASE_URL=https://...`
points it at a deployed copy instead. The concepts share all copy with the replica plus
the handoff requirements: the fourth AI Implementations service, the 2026 Gartner/IDC
figures, a leadership section (portraits and bios are placeholders until supplied), and
a More Information form. The form is intercepted in each design's `main.js` and tells
the visitor to email instead; wiring it to an Addenso inbox is a follow-up.

## Comparing against the live site

`pnpm diff` (dev server must be running) loads this replica and addenso.com side by
side at desktop and mobile widths, pins each section to a shared text landmark, and
writes per-section diff images plus `visual-diff/report.json`.

Read the percentages as a change detector, not a fidelity score. They count differing
pixels, so anti-aliased text edges and a one-pixel offset light up every glyph: a
section that looks identical still reports a few percent. When a number moves, open the
diff image and then measure the elements directly — `getBoundingClientRect` on both
sides is what actually tells you whether the layout drifted.

Two things in the harness exist because they burned us: the live theme swaps in an
animated fixed header clone on scroll (capture it mid-animation and the whole page
appears shifted), and the live page ships hidden mobile duplicates of every section
(match one by accident and you measure a zero-size element).

## Notes

- Fonts are self-hosted (Open Sans 400/600/700 TTFs under `assets/fonts/`) rather than
  loaded from Google Fonts as the original does.
- The hero video ships as both WebM and MP4; the original serves the same two files.
- Contact routes are mailto/tel links, matching the original — there is no form and no
  backend.
- The copyright line still reads 2022, as the live site does.
- Desktop layout is measured against the live site and tracks it within ~4px through
  the main content. Mobile has had one pass (container gutter) and is less verified —
  its total document height is still ~9% shorter than the original's.
- Not reproduced: the original's scroll-triggered fade-in animations, its cookie
  consent banner, and its MasterSlider industry carousel (replaced with a native
  scroll-snap row).
