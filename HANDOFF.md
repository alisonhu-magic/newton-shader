# Newton Shader — Designer studio

Unlocked Field Generator for Newton Labs brand assets. The marketing-locked
sibling is `social-post`. This tool keeps that export pipeline (tiled PNG,
WebP, MP4, SVG, image import, canvas presets) and turns every control back on.

## Brands

`BRANDS` in `src/app.js` is the extension point. Labs is `ready: true`.
Foundation is reserved:

```
foundation: { id, name, ready:false, palette:[], logoColors, defaults }
```

When Foundation tokens and artwork exist:

1. Add logo SVGs under `src/logo/` and entries in `src/logo.json` if the
   lockup/mark differ from Labs.
2. Fill `BRANDS.foundation.palette` and `defaults`.
3. Set `ready: true`.
4. The header switcher enables itself — no other UI rewrite.

Saved setups store `S.brand`, so a composition can travel with its pack.

## Invariants

Same as social-post / the Field Generator handoff: `container-type: size`,
preview == export via `cqw`/`cqmin` + `spanPx`, GLSL palette lookup stays
loop-form, tiled export for large frames, Suisse is a licensed face.

## Run

```
npm install
npm run build
npm start          # http://localhost:4173
```

Do not hand-edit `index.html`. Edit `src/`, then `npm run build`.
