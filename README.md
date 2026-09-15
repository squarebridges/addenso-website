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
pnpm format     # prettier --write .
```

`pnpm test` needs browsers once: `pnpm exec playwright install chromium`.

## Notes

- Fonts are self-hosted (Open Sans 400/600/700 TTFs under `assets/fonts/`) rather than
  loaded from Google Fonts as the original does.
- The hero video ships as both WebM and MP4; the original serves the same two files.
- Contact routes are mailto/tel links, matching the original — there is no form and no
  backend.
- The copyright line still reads 2022, as the live site does.
