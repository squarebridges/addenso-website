# addenso-website

A hand-written static replica of [addenso.com](https://addenso.com/), structured like
`apps/landing` in the `mention` repo: plain HTML, a small layered stylesheet, and one
vanilla JS module. No framework, no compile step.

The original is a WordPress site (Oshin theme + Tatsu page builder). This repo reproduces
the rendered page, not the WordPress installation — the markup here is written from
scratch and the assets were downloaded from the live site.

## Layout

```
apps/landing/
  index.html            the whole site; every nav item is an anchor into this page
  css/
    main.css            entry point, @imports the rest in cascade order
    variables.css       design tokens (brand colors, font stack, container width)
    reset.css           normalize + base typography
    components.css      buttons, cards, carousel, section headings
    layout.css          page sections, grids, and the responsive breakpoints
  js/main.js            mobile nav, service-card flip, industry carousel, back-to-top
  assets/               images, icons, fonts, and the hero video
docs/asset-sources.json where each downloaded asset came from
scripts/                dev server, build, and a link checker
tests/                  Playwright specs (desktop + mobile projects)
```

## Commands

```sh
pnpm install
pnpm dev        # serve apps/landing at http://localhost:4173
pnpm build      # copy apps/landing to dist/
pnpm preview    # serve dist/
pnpm check      # verify every local href/src/url() resolves on disk
pnpm test       # Playwright, starts the dev server itself
pnpm diff       # pixel-diff each section against the live addenso.com
pnpm format     # prettier --write .
```

`pnpm test` needs browsers once: `pnpm exec playwright install chromium`.

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
