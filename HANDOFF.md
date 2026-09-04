# Newton Shader — Designer studio

Unlocked Field Generator for Newton Labs brand fields. The marketing-locked
sibling is `social-post`. This tool keeps that export pipeline (tiled PNG,
WebP, MP4, SVG, image import, canvas presets) and turns the pattern and
interaction controls back on. Overlay type, logo, fade mask, and guides are
out — the studio designs the field itself. Embed export copies an iframe of
`?embed=1#s=` plus the current setup.

## Brands

`BRANDS` in `src/app.js` is the extension point. Labs is `ready: true`.
Foundation is reserved:

```
foundation: { id, name, ready:false, palette:[], defaults }
```

When Foundation tokens exist:

1. Fill `BRANDS.foundation.palette` and `defaults`.
2. Set `ready: true`.
3. The header switcher enables itself — no other UI rewrite.

Saved setups store `S.brand`, so a composition can travel with its pack.

## Invariants

Same as social-post / the Field Generator handoff: GLSL palette lookup stays
loop-form, tiled export for large frames.

## Run

```
npm install
npm run build
npm start          # http://localhost:4173
```

Do not hand-edit `index.html`. Edit `src/`, then `npm run build`.
