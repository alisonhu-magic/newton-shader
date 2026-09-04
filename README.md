# Newton Shader

Designer studio for Newton Labs brand fields. Tune the pattern, colors, and cursor interaction — then export a PNG, WebP, or MP4 at any canvas size.

The social-post generator is the locked marketing version of this same field. This repo is the unlocked designer tool for the field itself: every slider is live, custom hex is allowed, and image luminance can drive a new pattern. A Foundation brand slot is reserved for when that pack lands.

## View it

**Live:** https://alisonhu-magic.github.io/newton-shader/

It's a single self-contained HTML file. Open `index.html` in a modern browser, or:

```bash
npm install
npm run build
npm start          # http://localhost:4173
```

## Quick start

1. Pick a **canvas format** (Banner, Square, Story…) or type a custom width × height.
2. Choose a **Field** — or drop an image so luminance drives the candles.
3. Tune colors, marks, response, and cursor interaction.
4. **Export** PNG, WebP, MP4, or an **Embed** snippet (iframe / React) for a live site banner.

Hover the canvas for **pause** and **reseed**.

## Designer controls

Work top to bottom on the rail: **Canvas → Background → Setups → Export**.

- **Canvas** — seven marketing presets plus arbitrary W×H up to 8192px / 33 megapixels. The stage always fits the frame.
- **Field** — ten procedural motifs with live thumbnails. Frequency, amplitude, speed, and phase are all editable.
- **Colors** — Newton Labs swatches plus any custom hex. Ground + marks, density shares, AA contrast badges.
- **Marks / Response** — density, cell aspect, length, weight, snap, jitter, contrast, threshold, grain.
- **Cursor** — off, spotlight, ripple, or push. Live in the preview and recorded into MP4.
- **Source** — drop a PNG / JPG / WebP; invert luminance; clear to return to a procedural field.
- **Setups** — save in this browser, or export / import JSON to share a composition.
- **Brand** — Labs is active. Foundation is visible and disabled until its palette lands (`BRANDS` in `src/app.js`).

What you see is what you get: PNG, WebP, SVG, and MP4 share the live preview. Large frames tile so a 33-megapixel export stays identical to a small one. **Embed** copies an iframe of this player with the current setup in the URL hash (`?embed=1#s=…`). Drop that on any site — React included. A source image is not packed into the URL.

## Brands

`BRANDS` is a registry. Labs ships with the marketing palette. Foundation is a reserved pack (`ready: false`). When you have Foundation tokens, fill that object and set `ready: true` — the switcher will turn on without rewriting the rest of the tool.

## Development

Edit `src/`, then assemble:

```
src/page.html     markup and CSS
src/app.js        the generator
src/boot.js       query-string boot
```

```bash
npm run build        # write index.html
npm test             # Playwright suite
npm run build:check  # fail if committed index.html is stale
```

Do not hand-edit `index.html`.

`window.__NF` is the test surface only. Nothing in the UI reads it.
