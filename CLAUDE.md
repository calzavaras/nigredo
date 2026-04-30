# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Astro dev server
npm run build     # Minify src/scripts/main.js → static/main.min.js, then build static site to public/
npm run preview   # Preview the production build
```

No linting or test commands are configured.

**Important:** The dev server (`npm run dev`) loads `/main.min.js` directly. If you modify `src/scripts/main.js` during development, re-run the esbuild step manually to keep `main.min.js` in sync:
```bash
npx esbuild src/scripts/main.js --minify --target=es2017 --outfile=static/main.min.js
```

## Versioning policy

- Version numbers are never increased automatically by a plain commit or push.
- Small internal fixes, content tweaks, copy changes, metadata updates, and low-risk technical adjustments do not require a version bump by default.
- Medium changes with visible behavior changes, meaningful bug fixes, or deploy-relevant technical adjustments should receive a patch bump (`1.3.7` → `1.3.8`).
- Larger feature work, structural frontend changes, new user-facing capabilities, or broader architectural changes should receive a minor bump (`1.3.7` → `1.4.0`).
- Before creating a release commit or tag, explicitly decide whether the change is `no bump`, `patch`, or `minor` and update `package.json` only when that decision is intentional.

## Architecture

### Static site (Astro v5)
- Output: fully static (`output: 'static'`, `build.format: 'directory'`)
- Deploy folder: `public/`
- Production URL: `https://www.nigredo.ch`
- Language: German (Swiss), `lang="de-CH"`, `og:locale="de_CH"`
- No trailing slashes (`trailingSlash: 'never'`)

### Layout & SEO
`src/layouts/Layout.astro` is the single shared layout. It handles all SEO meta tags, Open Graph, Twitter cards, JSON-LD schema.org markup, font loading, Umami analytics, and shared page chrome. Every page passes `title`, `description`, and `canonical` as required props, plus optional `schema` (JSON string) for page-specific structured data.

### JavaScript
`src/scripts/main.js` is a single vanilla JS source file. It initialises on `DOMContentLoaded`: navigation/mobile menu, scroll animations, contact modal, accordions, lightbox gallery, and spam protection. It is minified to `static/main.min.js` by esbuild before the Astro build; the final deploy artifact lands in `public/main.min.js`.

### Contact form
The contact modal UI is in `src/components/ContactModal.astro`. Form submissions POST to `static/send-mail.php` during development and end up in `public/send-mail.php` after the build (PHP, runs server-side on the host). Spam protection layers: honeypot field, CSRF double-submit cookie, IP-based + session-based rate limiting (60s cooldown).

### CSS
Single file: `src/styles/global.css` ("Nigredo Design System v9.9"). Dark theme (`--bg-body: #050505`). Brand gradient: yellow `#FFC700` → pink `#FF4D80` → purple `#A64DFF` → cyan `#00D2FF`. Key variables: `--container-width: 1100px`, `--header-height: 80px`.

### Sitemap
`/404` is filtered out from the sitemap. `impressum` and `datenschutz` are included with low priority (0.3, `changefreq: yearly`) and are marked `noindex` via meta robots tag. Priority and `lastmod` for all pages are set manually in `astro.config.mjs`.

### Pages
- `/referenzen/*` — individual case study pages, each using `Breadcrumb.astro`
- `/llms.txt`, `/llms-full.txt` — static files sourced from `static/` and emitted to `public/` for LLM crawlers
