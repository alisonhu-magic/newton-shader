# Newton Shader

Designer studio for Newton Labs brand fields. Full pattern, color, type, and logo control — then export a PNG, WebP, or MP4 at any canvas size.

The social-post generator is the locked marketing version of this same field. This repo is the unlocked designer tool: every slider is live, custom hex is allowed, image luminance can drive a new pattern, and a Foundation brand slot is reserved for when that pack lands.

## View it

**Live:** https://alisonhu-magic.github.io/newton-shader/

It's a single self-contained HTML file (fonts, shaders, and logo are embedded). Open `index.html` in a modern browser, or:

```bash
npm install
npm run build
npm start          # http://localhost:4173
```

## Quick start

1. Pick a **canvas format** (Banner, Square, Story…) or type a custom width × height.
2. Choose a **Field** — or drop an image so luminance drives the candles.
3. Tune colors, marks, text, and logo. Nothing is locked unless you lock it.
4. **Export** PNG, WebP, or MP4 (SVG is there too). Seamless-loop ping-pongs the clip.

Hover the canvas for **pause** and **reseed**.

## Designer controls

Work top to bottom on the rail: **Canvas → Background → Content → Guides → Setups → Export**.

- **Canvas** — seven marketing presets plus arbitrary W×H up to 8192px / 33 megapixels. Preview **Fit** or **100%**. Fade mask can follow type alignment or be set by hand.
- **Field** — ten procedural motifs with live thumbnails. Frequency, amplitude, speed, and phase are all editable.
- **Colors** — Newton Labs swatches plus any custom hex. Ground + marks, density shares, AA contrast badges.
- **Marks / Response** — density, cell aspect, length, weight, snap, jitter, contrast, threshold, grain.
- **Cursor** — off, spotlight, ripple, or push. Live in the preview and recorded into MP4.
- **Source** — drop a PNG / JPG / WebP; invert luminance; clear to return to a procedural field.
- **Text & Logo** — eyebrow / headline / body with italic, size, color, measure, and stack gap. Logo mark or lockup, 3×3 placement, S–XL size, scrim.
- **Setups** — save in this browser, or export / import JSON to share a composition.
- **Brand** — Labs is active. Foundation is visible and disabled until its palette and logos land (`BRANDS` in `src/app.js`).

What you see is what you get: PNG, WebP, SVG, and MP4 share one layout table with the live preview. Large frames tile so a 33-megapixel export stays identical to a small one.

## Brands

`BRANDS` is a registry. Labs ships with the marketing palette and logo colours. Foundation is a reserved pack (`ready: false`). When you have Foundation tokens and artwork, fill that object, set `ready: true`, and add its logo files under `src/logo/` — the switcher will turn on without rewriting the rest of the tool.

## Development

Edit `src/`, then assemble:

```
src/page.html     markup and CSS
src/app.js        the generator
src/boot.js       query-string boot
src/fonts/        Suisse BP Intl woff2 faces
src/logo/         mark and lockup SVG
```

```bash
npm run build        # write index.html
npm test             # Playwright suite
npm run build:check  # fail if committed index.html is stale
```

Do not hand-edit `index.html`. Suisse is a commercial face — this tool is internal. See the social-post handoff notes if you ever host it publicly.

`window.__NF` is the test surface only. Nothing in the UI reads it.
