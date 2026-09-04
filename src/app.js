/* ---------- layout tokens ----------
   The approved 3:1 banner is the visual baseline. Every layout size lives here
   as a share of one reference length, so the design is tuned in one place
   instead of through numbers scattered across the renderers.

   `basis` names the reference length a share is measured against. Each basis
   has an exact CSS container-unit twin, which is what lets the live preview
   stay declarative while the PNG/SVG/MP4 export mirrors it in pixels from this
   same table:

     w     canvas width     100cqw
     h     canvas height    100cqh
     min   short side       100cqmin
     fitw  \  the largest baseline-ratio box that fits inside the canvas,
     fith  /  measured on its width and on its height respectively

   `fitw`/`fith` carry the scaling system. Both equal their baseline dimension
   times min(W/1920, H/640), so a share written against them holds its baseline
   proportion at every ratio. Type sits on `fitw` and the logo on `fith`, which
   is what keeps the headline-to-logo relationship steady from ultra-wide
   through to story.

   Off 3:1, type, logo, and stack gap take a per-format scale from
   `FORMAT_LAYOUT` so the composition reads larger away from the banner. Grid
   whitespace does not: margins stay on `min` so the measure is not pinched.
   4:3 and portrait formats also span more columns. Tune live in Ratio lab;
   3:1 is locked — do not retune `BASELINE` or the type steps.

   Changing a group's basis moves preview and export together, so the two can
   never drift apart. */
/* ---- scale tokens ---- */
const BASELINE = Object.freeze({ w: 1920, h: 640 });
const BASE_AR  = BASELINE.w / BASELINE.h;
const FORMATS = [
  { id:'3:1',  name:'Banner',     w:1920, h:640  },
  { id:'2:1',  name:'Wide',       w:1920, h:960  },
  { id:'16:9', name:'Widescreen', w:1920, h:1080 },
  { id:'4:3',  name:'Classic',    w:1440, h:1080 },
  { id:'1:1',  name:'Square',     w:1080, h:1080 },
  { id:'4:5',  name:'Portrait',   w:1080, h:1350 },
  { id:'9:16', name:'Story',      w:1080, h:1920 }
];
/* Mutable on purpose — Ratio lab writes these. TOKENS stay frozen. */
const FORMAT_LAYOUT = {
  '3:1':  { scale:1,     spanCols:7,  locked:true },
  '2:1':  { scale:1.26,  spanCols:7 },
  '16:9': { scale:1.26,  spanCols:7 },
  '4:3':  { scale:1.512, spanCols:9 },
  '1:1':  { scale:1.56,  spanCols:10 },
  '4:5':  { scale:1.80,  spanCols:10 },
  '9:16': { scale:1.80,  spanCols:10 }
};
const formatBySize = (W, H) => {
  const w = Math.round(W), h = Math.round(H);
  return FORMATS.find(f => f.w === w && f.h === h) || null;
};
const layoutFor = (W, H) => {
  const f = formatBySize(W, H);
  return f ? FORMAT_LAYOUT[f.id] : null;
};
const isLockedBaseline = (W, H) => Math.abs(W / H - BASE_AR) < 1e-3;
/* Named presets use FORMAT_LAYOUT. Odd sizes (tests, huge exports) keep the
   old aspect-ratio bands so they do not go unscaled. */
function bandScale(W, H){
  if (isLockedBaseline(W, H)) return FORMAT_LAYOUT['3:1'].scale;
  const ar = W / H;
  if (Math.abs(ar - 1) < 1e-3) return FORMAT_LAYOUT['1:1'].scale;
  if (ar < 1) return FORMAT_LAYOUT['9:16'].scale;
  if (ar >= 2) return FORMAT_LAYOUT['2:1'].scale;
  if (ar >= 1.5) return FORMAT_LAYOUT['16:9'].scale;
  return FORMAT_LAYOUT['4:3'].scale;
}
const ratioScale = (W, H) => {
  if (isLockedBaseline(W, H)) return FORMAT_LAYOUT['3:1'].scale;
  const L = layoutFor(W, H);
  return L ? L.scale : bandScale(W, H);
};

const REF_PX = {
  w:    (W,H) => W,
  h:    (W,H) => H,
  min:  (W,H) => Math.min(W, H),
  fitw: (W,H) => Math.min(W, H * BASE_AR),
  fith: (W,H) => Math.min(W / BASE_AR, H)
};
const REF_CSS = {
  w:    '100cqw',
  h:    '100cqh',
  min:  '100cqmin',
  fitw: `min(100cqw, ${+(100 * BASE_AR).toFixed(4)}cqh)`,
  fith: `min(${+(100 / BASE_AR).toFixed(4)}cqw, 100cqh)`
};
/* one share, resolved either to pixels (export) or to a CSS length (preview).
   Grid tokens stay unscaled so margins do not eat the measure when type grows. */
const refPx      = (basis, W, H) => REF_PX[basis](W, H);
const tokenPx    = (pct, basis, W, H) => pct/100 * refPx(basis, W, H);
const tokenCss   = (pct, basis) => `calc(${pct/100} * ${REF_CSS[basis]})`;
const contentPx  = (pct, basis, W, H) => tokenPx(pct, basis, W, H) * ratioScale(W, H);
const contentCss = (pct, basis) => `calc(${pct/100} * ${REF_CSS[basis]} * var(--ratio-scale, 1))`;

const TOKENS = Object.freeze({
  /* 3:1 type and logo tokens stay locked. Other ratios bump via FORMAT_LAYOUT. */
  type: Object.freeze({ basis:'fitw', labels:Object.freeze(['S','M','L','XL']), steps:Object.freeze([1.2, 1.9, 3.1, 5.0]) }),
  logo: Object.freeze({ basis:'fith', height:5.76 }),
  grid: Object.freeze({ basis:'min', cols:12, margin:6, gutter:1.5 }),
  text: Object.freeze({ basis:'fitw', gap:1.4, spanCols:7 })
});

const TYPE_STEPS = TOKENS.type.labels;
const TYPE_PCT   = TOKENS.type.steps;
/* tolerate step indices from older setups that used the 8-step ladder */
const stepPct = i => TYPE_PCT[Math.min(Math.max(i|0, 0), TYPE_PCT.length - 1)];
/* `scale` trims a role off its step without moving the ladder: uppercase copy
   reads smaller than its point size, so the eyebrow rides a touch above S. */
const ROLES = {
  eyebrow:{weight:500, lead:1.30, track:0.10, upper:true,  scale:1.10, faceN:'500n', faceI:'500n', ckey:'cEyebrow'},
  head:   {weight:300, lead:1.06, track:-0.02, upper:false, scale:1, faceN:'300n', faceI:'300i', ckey:'cHead'},
  body:   {weight:400, lead:1.50, track:0.00,  upper:false, scale:1, faceN:'400n', faceI:'400i', ckey:'cBody'}
};
const roleSize = (step, role) => stepPct(step) * role.scale;
const typePx  = (step, role, W, H) => contentPx(roleSize(step, role), TOKENS.type.basis, W, H);
const typeCss = (step, role) => contentCss(roleSize(step, role), TOKENS.type.basis);
/* logo scrim keeps the mark legible over dense pattern — a soft elliptical
   wash of the background colour, centred on the mark and extended by a halo.
   One geometry helper drives the preview, PNG, HTML and React output. */
const SCRIM_PAD  = 1.6;   // halo thickness as a share of logo height
const SCRIM_CORE = 45;    // % of the radius that stays fully opaque before the fade
const scrimPad = h => h * SCRIM_PAD;
function scrimRadii(w, h){ const pad = scrimPad(h); return [w/2 + pad, h/2 + pad]; }
function scrimBg(pc){ return `radial-gradient(closest-side, ${pc} 0%, ${pc} ${SCRIM_CORE}%, ${hexA(pc,0)} 100%)`; }
/* Padding grows the box so closest-side yields radii (w/2+pad, h/2+pad), and an
   equal negative margin cancels it for layout so the mark itself stays on the
   grid margin. A background paints behind the glyph, so no z-index is needed. */
/* `len` is the logo height as a CSS length, so the halo follows whatever
   reference the logo token scales against. */
function scrimStyle(pc, len){
  const p = `calc(${SCRIM_PAD} * ${len})`;
  return `padding:${p};margin:calc(-1 * ${p});background:${scrimBg(pc)}`;
}

/* Logo artwork lives at the end of this file. */

/* Brands are a registry so Foundation (or any later house) can land as a
   second pack — palette, logo colours, defaults — without rewriting the tool.
   `ready:false` keeps the switcher visible but inert until that pack exists. */
const BRANDS = {
  labs: {
    id:'labs', name:'Newton Labs', ready:true,
    palette:[
      { name:'Navy',       hex:'#203C7F', use:'Deep grounds, high-contrast marks' },
      { name:'Cornflower', hex:'#3D6FE8', use:'Primary marketing blue' },
      { name:'Periwinkle', hex:'#BACCF8', use:'Light accents, gradients' },
      { name:'Sky',        hex:'#EEF3FF', use:'Subtle light grounds' },
      { name:'Ink',        hex:'#0E0E0F', use:'Near-black grounds and marks' },
      { name:'Slate',      hex:'#71727A', use:'Muted neutral marks' },
      { name:'Mist',       hex:'#E4E4E7', use:'Soft neutral grounds' },
      { name:'Paper',      hex:'#FBFCFE', use:'Bright white grounds' },
      { name:'Gold',       hex:'#CBC28F', use:'Editorial headline blocks, card grounds' },
      { name:'Cream',      hex:'#E7E4DB', use:'Large backgrounds, paper-tone grounds' }
    ],
    logoColors:{black:'#0E0E0F', white:'#FEFDF9', blue:'#5B83E4'},
    defaults:{ colors:['#3D6FE8', '#E7E4DB', '#BACCF8'], weights:[0, 50, 50] }
  },
  foundation: {
    id:'foundation', name:'Newton Foundation', ready:false,
    palette:[],
    logoColors:{black:'#0E0E0F', white:'#FEFDF9', blue:'#5B83E4'},
    defaults:{ colors:['#0E0E0F', '#FBFCFE'], weights:[0, 100] }
  }
};
const brandOf = id => BRANDS[id] || BRANDS.labs;
let BRAND = brandOf('labs').palette;
let LOGO_COLORS = brandOf('labs').logoColors;

/* logo height as a share of its reference length; size steps scale that token */
const LOGO_SIZE = TOKENS.logo.height;
const LOGO_SCALE = { S:0.62, M:1, L:1.28, XL:1.6 };
const logoScale = () => LOGO_SCALE[S.logo.size] || 1;
const logoHeightPx  = (W,H) => contentPx(LOGO_SIZE, TOKENS.logo.basis, W, H) * logoScale();
const logoHeightCss = () => `calc(${LOGO_SIZE/100} * ${REF_CSS[TOKENS.logo.basis]} * var(--ratio-scale, 1) * ${logoScale()})`;

/* ---------- state ---------- */
const S = {
  field:6, useImg:0, invert:0,
  freq:7, amp:1, speed:.28, phase:0,
  cols:72, rowScale:3.25, len:.83, weight:.37, jitter:.18, quant:9,
  contrast:1.9, bias:.18, grain:.012,
  colors:['#3D6FE8', '#E7E4DB', '#BACCF8'],   // [0] ground, rest marks — brand palette only
  weights:[0, 50, 50],                        // per-mark appearance density %, aligned to colors indices
  maskDir:'to right', maskOn:true, maskSolid:30, maskFade:70,   // maskDir follows text align via syncMaskToAlign()
  canvasW:1920, canvasH:640,
  grid:{ show:false, cols:TOKENS.grid.cols, margin:TOKENS.grid.margin, gutter:TOKENS.grid.gutter },
  zoom:'fit',                                 // preview only: 'fit' to the stage, or '1' for 1:1

  brand:'labs',
  mouseMode:0, mouseRadius:0.16, mouseStrength:1,
  mx:0.5, my:0.5, mon:0, mtx:0.5, mty:0.5, mtOn:0,
  maskFollow:true,
  logo:{ type:'lockup', pos:'tr', color:'white', size:'M', scrim:'none', plateIdx:0 },   // plateIdx 0 = ground/bg; backing always uses bg
  text:{
    on:true,
    eyebrow:'Authorization layer',
    head:'Policy, enforced *before* the transaction exists.',
    body:'',
    eyebrowStep:0, headStep:3, bodyStep:1,
    align:'left', vAlign:'middle',
    cEyebrow:1, cHead:1, cBody:1, spanCols:TOKENS.text.spanCols, gap:TOKENS.text.gap
  },
  seed:Math.random()*100, paused:false
};
Object.defineProperty(S, 'ratio', { get(){ return S.canvasW / S.canvasH; } });

/* ---------- WebGL renderer ---------- */
const canvas = document.getElementById('gl');
const gl = canvas.getContext('webgl2', {antialias:true, preserveDrawingBuffer:true});
if(!gl) document.body.innerHTML = '<p style="padding:32px;font-family:monospace">WebGL2 unavailable.</p>';

const VS = `#version 300 es
void main(){
  vec2 p = vec2((gl_VertexID<<1)&2, gl_VertexID&2);
  gl_Position = vec4(p*2.0-1.0, 0.0, 1.0);
}`;

const FS = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uColors[8];    // [0] = ground, [1..] = mark colours
uniform int   uColorCount;
uniform float uColorWeight[8]; // [1..] = per-mark appearance density (relative weight)
uniform float uCols, uRowScale, uLen, uWeight, uJitter;
uniform float uFreq, uAmp, uContrast, uBias, uGrain, uSeed, uQuant;
uniform int   uField;
uniform int   uUseImg, uInvert;   // image source drives the field
uniform sampler2D uImg;
uniform float uImgAspect;
// Tiled export: fragment coords are offset by uOrigin while uRes stays the full
// output size, so a large frame can be rendered in GPU-sized pieces that align
// seamlessly. Zero for the live preview.
uniform vec2  uOrigin;
uniform vec2  uMouse;        // x:[0,1], y:[0,H] — eased cursor in field space
uniform float uMouseOn;      // 0..1 presence (fades on leave)
uniform int   uMouseMode;    // 0 off · 1 ripple · 2 spotlight · 3 push
uniform float uMouseRadius, uMouseStrength;

// image luminance, cover-fit — p is x:[0,1], y:[0,H]
float imgVal(vec2 p, float H){
  vec2 uv = vec2(p.x, p.y/H);
  float canvasAsp = 1.0/H;
  if(uImgAspect > canvasAsp){ uv.x = (uv.x-0.5)*(canvasAsp/uImgAspect) + 0.5; }
  else                      { uv.y = (uv.y-0.5)*(uImgAspect/canvasAsp) + 0.5; }
  uv.y = 1.0 - uv.y;
  vec3 c = texture(uImg, clamp(uv, 0.0, 1.0)).rgb;
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

float hash21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1,0)), c=hash21(i+vec2(0,1)), d=hash21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5;} return s; }

// scalar field in normalized space: x in [0,1], y in [0,H]
float field(vec2 p, float H, float t){
  float f = uFreq;
  if(uField==0){                                   // Ribbon — flowing bands
    float v = 0.0;
    for(int i=0;i<3;i++){
      float fi = float(i);
      float ph = uSeed + fi*2.4;
      float y  = H*0.5 + H*0.22*uAmp*sin(p.x*f*(0.6+fi*0.28) + t + ph)
                       + (fi-1.0)*H*0.17;
      v = max(v, 1.0 - smoothstep(0.0, H*0.30, abs(p.y-y)));
    }
    return v;
  }
  if(uField==1){                                   // Interference — layered sinusoids
    float a = sin(p.x*f + sin(p.y*f*0.8 + t)*1.6*uAmp + t);
    float b = sin(p.y*f*1.3 - t*0.7 + uSeed);
    return 0.5 + 0.25*a + 0.25*b;
  }
  if(uField==2){                                   // Flow — advected fbm
    vec2 q = p*f*0.35 + vec2(uSeed);
    vec2 w = vec2(fbm(q + t*0.10), fbm(q + vec2(5.2,1.3) - t*0.08));
    return fbm(q + w*1.6*uAmp);
  }
  if(uField==3){                                   // Signal — radial emission
    vec2 c = vec2(0.5, H*0.5);
    float d = length((p-c)*vec2(1.0,1.15));
    float r = 0.5 + 0.5*sin(d*f*2.2 - t*1.8 + uSeed);
    return r * (1.0 - smoothstep(0.15, 0.75*uAmp+0.25, d));
  }
  if(uField==4){                                   // Gate — quantized modules
    vec2 q = floor(p*f*1.2 + uSeed) / (f*1.2);
    float n = fbm(q*3.0 + t*0.15);
    return smoothstep(0.35, 0.65, n)*uAmp;
  }
  if(uField==5){                                   // Ledger — stepped columns
    float col = floor(p.x*f*2.0 + uSeed);
    float n = vnoise(vec2(col*0.31, t*0.25));
    return smoothstep(0.0, 1.0, 1.0 - abs(p.y/H - (0.15 + 0.7*n))*3.2*(2.0-uAmp));
  }
  if(uField==6){                                   // Market — price walk + volatility
    float price = H*0.5 + H*0.30*uAmp*(fbm(vec2(p.x*f*0.30 + uSeed, t*0.12))*2.0 - 1.0);
    float vol   = 0.05 + 0.26*fbm(vec2(p.x*f*0.85 + 11.0, t*0.10));
    return 1.0 - smoothstep(0.0, H*vol, abs(p.y - price));
  }
  if(uField==7){                                   // Volatility — expanding envelope
    float band = H*0.5*uAmp*(0.18 + 0.52*(0.5 + 0.5*sin(p.x*f*0.35 + t + uSeed)));
    float d = abs(p.y - H*0.5);
    return smoothstep(band, band*0.55, d);
  }
  if(uField==8){                                   // Order book — depth ladder at mid
    float mid = H*0.5;
    float d = abs(p.y - mid) / (H*0.5);
    float depth = 1.0 - smoothstep(0.0, uAmp, d);
    float side = sign(p.y - mid);
    float lad = 0.5 + 0.5*sin(p.x*f*1.4 + side*t*1.2 + uSeed);
    return depth * mix(0.45, 1.0, lad);
  }
  // 9 — Lanes — horizontal throughput streams
  float lane = 0.5 + 0.5*sin(p.y*f*1.1 + uSeed);
  float pass = fbm(vec2(p.x*f*0.30 - t*0.9, floor(p.y*f*1.1)*0.7));
  return smoothstep(0.42, 0.95, lane) * smoothstep(0.30, 0.70, pass) * uAmp;
}

float sdBox(vec2 q, vec2 b){ vec2 d = abs(q) - b; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }

float sdMark(vec2 q, float halfLen, float r){
  // Newton candle — body + wick. The brand mark. No variants.
  float body = sdBox(q, vec2(r, halfLen));
  float wick = sdBox(q, vec2(r*0.15, halfLen*1.85 + 0.05));
  return min(body, wick);
}

void main(){
  vec2 frag = gl_FragCoord.xy + uOrigin;
  float H = uRes.y / uRes.x;
  vec2 p = frag / uRes.x;                      // x:[0,1], y:[0,H]
  float t = uTime;

  vec2 cells = vec2(uCols, uCols/uRowScale * (uRes.y/uRes.x) / H);
  cells.y = uCols * H / uRowScale;             // square-ish cells scaled by aspect
  vec2 g  = vec2(p.x*uCols, p.y*uCols/uRowScale);
  vec2 id = floor(g);
  vec2 fq = fract(g) - 0.5;

  vec2 cp = vec2((id.x+0.5)/uCols, (id.y+0.5)*uRowScale/uCols);

  // ---- cursor: distance from this cell centre to the eased pointer ----
  float mAmt = uMouseOn * uMouseStrength;
  float mDist = distance(cp, uMouse);
  float mFall = exp(-mDist / max(uMouseRadius, 0.001));   // 1 at pointer → 0 away

  // Push (mode 3) warps the sample point outward before the field is read
  if(uMouseMode==3){
    vec2 dir = cp - uMouse;
    cp += (mDist > 1e-4 ? dir/mDist : vec2(0.0)) * mFall * 0.10 * mAmt;
  }

  float v = (uUseImg==1) ? imgVal(cp, H) : field(cp, H, t);
  if(uInvert==1) v = 1.0 - v;

  // Ripple (mode 1) sends a concentric wave out from the pointer
  if(uMouseMode==1){
    v += sin(mDist*38.0 - t*5.0) * mFall * 0.9 * mAmt;
  }

  float amt = clamp((v - uBias) * uContrast, 0.0, 1.0);
  amt = pow(amt, 1.15);
  amt *= 0.55 + 0.45*hash21(id*1.7 + 3.1);     // organic variance

  // Spotlight (mode 2) reveals marks under the pointer
  if(uMouseMode==2){
    amt = max(amt, mFall * mAmt);
  }

  float halfLen = 0.5 * uLen * amt;
  if(uQuant > 0.5) halfLen = floor(halfLen*uQuant + 0.5) / uQuant;
  float r       = 0.5 * uWeight * mix(0.35, 1.0, amt);

  fq.y += (hash21(id + 7.7) - 0.5) * uJitter;

  float d  = sdMark(fq, halfLen, r);
  float aa = 1.2 / (uRes.x / uCols);
  float a  = 1.0 - smoothstep(-aa, aa, d);
  a *= step(0.02, amt);

  int marks = max(uColorCount - 1, 1);
  float rnd = hash21(id + uSeed*3.0);
  // weighted pick over mark colours by per-colour density; falls back to uniform
  float total = 0.0;
  for(int j=1;j<8;j++){ if(j < uColorCount) total += max(uColorWeight[j], 0.0); }
  int mi;
  if(total <= 1e-5){
    mi = 1 + int(rnd * float(marks));
    if(mi >= uColorCount) mi = uColorCount - 1;
  } else {
    float h = rnd * total;
    float acc = 0.0;
    mi = uColorCount - 1;
    for(int j=1;j<8;j++){
      if(j < uColorCount){
        acc += max(uColorWeight[j], 0.0);
        if(h < acc){ mi = j; break; }
      }
    }
  }
  vec3 markCol = uColors[1];
  for(int j=1;j<8;j++){ if(j==mi) markCol = uColors[j]; }
  vec3 col = mix(uColors[0], markCol, a);

  col += (hash21(frag + fract(t)) - 0.5) * uGrain;
  outColor = vec4(col, 1.0);
}`;

function sh(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s)); return s; }
const prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
gl.linkProgram(prog); gl.useProgram(prog);
const U = n => gl.getUniformLocation(prog, n);
const u = {
  res:U('uRes'), time:U('uTime'), colors:U('uColors'), colorCount:U('uColorCount'), colorWeight:U('uColorWeight'),
  cols:U('uCols'), rowScale:U('uRowScale'), len:U('uLen'), weight:U('uWeight'), jitter:U('uJitter'),
  freq:U('uFreq'), amp:U('uAmp'), contrast:U('uContrast'), bias:U('uBias'),
  grain:U('uGrain'), seed:U('uSeed'), field:U('uField'),
  quant:U('uQuant'), useImg:U('uUseImg'), invert:U('uInvert'), img:U('uImg'), imgAspect:U('uImgAspect'),
  origin:U('uOrigin'),
  mouse:U('uMouse'), mouseOn:U('uMouseOn'), mouseMode:U('uMouseMode'),
  mouseRadius:U('uMouseRadius'), mouseStrength:U('uMouseStrength')
};
const hex2rgb = h => [parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255];
const palToFloats = () => { const a=[]; S.colors.slice(0,8).forEach(c=>a.push(...hex2rgb(c))); while(a.length<24) a.push(0); return new Float32Array(a); };
// per-mark density weights aligned to S.colors indices ([0] ground = unused)
const weightsToFloats = () => { const a = new Float32Array(8); for(let k=1;k<S.colors.length && k<8;k++){ a[k] = (S.weights && S.weights[k]!=null) ? S.weights[k] : 50; } return a; };

// image texture (1x1 white until an image is dropped)
const tex = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.useProgram(prog); gl.uniform1i(u.img, 0);
let imgAspect = 1;

/* ---------- render ---------- */
let clock = 0, last = performance.now(), started = false, exporting = false;
let contextLost = false;

/* Without a handler a lost context just renders black forever with no clue why.
   Chrome only attempts restoration if the default action is prevented. */
canvas.addEventListener('webglcontextlost', e=>{
  e.preventDefault();
  contextLost = true;
  toast('GPU context lost — trying to recover');
}, false);
canvas.addEventListener('webglcontextrestored', ()=>{
  contextLost = false;
  toast('GPU context restored — reload if the preview looks wrong');
}, false);

/* Renders the region [ox,oy]..[ox+vpW,oy+vpH] of a w×h frame into the bottom-left
   of the drawing buffer. Defaults render the whole frame in one pass; exports at
   sizes the GPU can't allocate in one go pass tiles instead. */
function draw(w, h, ox = 0, oy = 0, vpW = w, vpH = h){
  gl.viewport(0, 0, vpW, vpH);
  gl.uniform2f(u.res, w, h);
  gl.uniform2f(u.origin, ox, oy);
  gl.uniform1f(u.time, clock + S.phase);
  gl.uniform3fv(u.colors, palToFloats());
  gl.uniform1i(u.colorCount, Math.max(2, Math.min(8, S.colors.length)));
  gl.uniform1fv(u.colorWeight, weightsToFloats());
  gl.uniform1f(u.cols, S.cols);
  gl.uniform1f(u.rowScale, S.rowScale);
  gl.uniform1f(u.len, S.len);
  gl.uniform1f(u.weight, S.weight);
  gl.uniform1f(u.jitter, S.jitter);
  gl.uniform1f(u.freq, S.freq);
  gl.uniform1f(u.amp, S.amp);
  gl.uniform1f(u.contrast, S.contrast);
  gl.uniform1f(u.bias, S.bias);
  gl.uniform1f(u.grain, S.grain);
  gl.uniform1f(u.quant, S.quant);
  gl.uniform1f(u.seed, S.seed);
  gl.uniform1i(u.field, S.field);
  gl.uniform1i(u.useImg, S.useImg);
  gl.uniform1i(u.invert, S.invert);
  gl.uniform1f(u.imgAspect, imgAspect);
  gl.uniform2f(u.mouse, S.mx, S.my * (h/w));   // y into [0,H] space
  gl.uniform1f(u.mouseOn, S.mon);
  gl.uniform1i(u.mouseMode, S.mouseMode);
  gl.uniform1f(u.mouseRadius, S.mouseRadius);
  gl.uniform1f(u.mouseStrength, S.mouseStrength);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/* ---------- canvas sizing & zoom ---------- */
/* Largest width whose ratio-derived height still fits availH, capped by availW
   and maxW. Pure so the fit can be unit-tested without a layout. */
function fitFrameWidth(availW, availH, maxW, ratio){
  return Math.max(1, Math.floor(Math.min(availW, maxW, availH * ratio)));
}

const FRAME_MAX_W = 1100;          // mirrors .frame max-width
const frameEl = document.getElementById('frame');
const zoomEl  = document.getElementById('zoomOut');
const stacked = window.matchMedia('(max-width:960px)');
let wrapPad = null;
window.addEventListener('resize', ()=>{ wrapPad = null; });

/* The frame takes its height from `aspect-ratio`, so it can only be constrained
   by width. Sizing it against the stage's height budget keeps portrait formats
   fully visible instead of pushing the canvas and footer off screen.
   At zoom '1' the fit is bypassed: the frame takes the export width outright,
   one CSS pixel per export pixel, and the stage scrolls. */
function fitFrame(){
  const wrap = frameEl.parentElement;
  if(!wrapPad){
    const cs = getComputedStyle(wrap);
    wrapPad = {
      x: parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight),
      y: parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    };
  }
  // stacked layout scrolls, so only the desktop split view has a height budget
  const availH = stacked.matches ? Infinity : wrap.clientHeight - wrapPad.y;
  const w = S.zoom === '1'
    ? Math.round(S.canvasW)
    : fitFrameWidth(wrap.clientWidth - wrapPad.x, availH, FRAME_MAX_W, S.ratio);
  const px = w + 'px';
  if(frameEl.style.width !== px) frameEl.style.width = px;
  const ar = String(S.ratio);
  if(frameEl.dataset.ar !== ar){ frameEl.dataset.ar = ar; frameEl.style.aspectRatio = ar; }
  showZoom(w);
}

let zoomShown = '';
function showZoom(frameW){
  const pct = Math.round(frameW / S.canvasW * 100) + '%';
  if(pct === zoomShown || !zoomEl) return;
  zoomShown = pct;
  zoomEl.textContent = pct;
}

/* Fit keeps the frame under 1100 CSS px, but at 1:1 the frame alone can be
   larger than the driver's buffer limits — back the pixel ratio off until the
   drawing buffer fits, rather than letting the context fail to a black frame. */
function previewDpr(cssW, cssH, dpr, maxDim, maxArea){
  const fit = Math.min(dpr, maxDim / Math.max(cssW, cssH), Math.sqrt(maxArea / (cssW * cssH)));
  return Math.max(Math.min(fit, dpr), 0.05);
}

let previewMaxDim = 0;
function applyRatioScale(){
  const v = String(ratioScale(S.canvasW, S.canvasH));
  if(frameEl.style.getPropertyValue('--ratio-scale') !== v) frameEl.style.setProperty('--ratio-scale', v);
}

function sizeCanvas(){
  fitFrame();
  applyRatioScale();
  const cssW = canvas.clientWidth || 900;
  const cssH = Math.round(cssW / S.ratio);
  if(!previewMaxDim) previewMaxDim = gl ? tileLimit() : FRAME_MAX_W;
  const dpr = previewDpr(cssW, cssH, Math.min(window.devicePixelRatio||1, 2), previewMaxDim, TILE_AREA_BUDGET);
  canvas.style.aspectRatio = S.ratio;
  canvas.width  = Math.round(cssW*dpr);
  canvas.height = Math.round(cssH*dpr);
}

/* Recentre so the middle of the frame — where the copy usually sits — is what
   the user lands on after switching to 1:1. */
function setZoom(v){
  S.zoom = v;
  const wrap = frameEl.parentElement;
  wrap.classList.toggle('zoomed', v === '1');
  wrapPad = null;
  sizeCanvas();
  wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2;
  wrap.scrollTop  = (wrap.scrollHeight - wrap.clientHeight) / 2;
}

function loop(now){
  // during an export we drive the clock and canvas size ourselves — skip the
  // live pass so sizeCanvas()/draw() don't fight the recorder.
  if(exporting || contextLost){ last = now; requestAnimationFrame(loop); return; }
  const dt = Math.min((now-last)/1000, .05); last = now;
  if(!S.paused) clock += dt * S.speed * 2.0;
  const k = 1 - Math.pow(0.001, dt);            // frame-rate independent smoothing
  S.mx  += (S.mtx - S.mx) * k;
  S.my  += (S.mty - S.my) * k;
  S.mon += (S.mtOn - S.mon) * k;
  sizeCanvas();
  draw(canvas.width, canvas.height);
  if(!started){ started = true; requestAnimationFrame(()=>canvas.classList.add('ready')); }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

canvas.addEventListener('pointermove', e=>{
  const r = canvas.getBoundingClientRect();
  S.mtx = (e.clientX - r.left) / r.width;
  S.mty = 1 - (e.clientY - r.top) / r.height;
  S.mtOn = 1;
});
canvas.addEventListener('pointerleave', ()=>{ S.mtOn = 0; });
canvas.style.touchAction = 'none';

/* ---------- UI utilities ---------- */
const $ = id => document.getElementById(id);
const toast = msg => { const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1400); };
const setSwitch = (id, on) => { const el=$(id); if(el) el.setAttribute('aria-checked', String(!!on)); };

const SLIDERS = ['freq','amp','speed','phase','cols','rowScale','len','weight','quant','jitter','contrast','bias','grain','maskSolid','maskFade','mouseRadius','mouseStrength'];

// write a value into either a display span or an editable input
function putDisp(id, str){ const el=$(id); if(!el) return; if(el.tagName==='INPUT') el.value=str; else el.textContent=str; }
// format a number using its slider's step (int if step>=1, else matching decimals)
function fmtNum(v, range){
  const st = range ? parseFloat(range.step) : 1;
  if(!st || st>=1) return String(Math.round(v));
  const d = (String(st).split('.')[1]||'').length;
  return (+v).toFixed(d);
}
// turn a value display span into a click-to-type numeric input
function makeEditable(vid){
  const el = $(vid); if(!el || el.tagName==='INPUT') return;
  const inp = document.createElement('input');
  inp.className = el.className; inp.id = vid;
  inp.type='text'; inp.setAttribute('inputmode','decimal'); inp.spellcheck=false;
  // the sibling <label for> points at the range, so name this field explicitly
  const name = document.querySelector('label[for="' + vid.replace(/_v$/,'') + '"]');
  inp.setAttribute('aria-label', (name ? name.textContent.trim() : vid) + ' value');
  el.replaceWith(inp);
}
// two-way bind an editable value field to its paired range slider
function bindEditable(vid){
  makeEditable(vid);
  const field = $(vid), range = $(vid.replace(/_v$/,''));
  if(!field || !range) return;
  const commit = ()=>{
    let v = parseFloat(field.value);
    if(isNaN(v)){ field.value = range.value; return; }
    v = Math.min(parseFloat(range.max), Math.max(parseFloat(range.min), v));
    range.value = v;
    range.dispatchEvent(new Event('input', { bubbles:true }));  // reuse the slider's own wiring
  };
  field.addEventListener('change', commit);
  field.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); commit(); field.blur(); } });
  field.addEventListener('focus', ()=> field.select());
}

function syncSliders(){
  SLIDERS.forEach(k=>{
    const el=$(k); if(!el) return;
    el.value = S[k];
    const vf = $(k+'_v');
    if(vf && document.activeElement===vf) return;   // don't clobber while typing
    putDisp(k+'_v', fmtNum(S[k], el));
  });
}
/* Fade end has to sit past the solid stop or the gradient inverts. maskStops()
   corrects that at render time, which on its own would leave the slider showing
   a number the output never used — so move the paired slider with it. */
function coupleMaskStops(changed){
  if(changed === 'maskSolid' && S.maskFade <= S.maskSolid) S.maskFade = Math.min(100, S.maskSolid + 1);
  if(changed === 'maskFade'  && S.maskSolid >= S.maskFade) S.maskSolid = Math.max(0, S.maskFade - 1);
}
SLIDERS.forEach(k=>{
  $(k).addEventListener('input', e=>{
    S[k] = parseFloat(e.target.value);
    if(k === 'maskSolid' || k === 'maskFade') coupleMaskStops(k);
    syncSliders(); applyMask(); meta();
  });
});
[...SLIDERS.map(k=>k+'_v'), 'gMargin_v', 'gGutter_v', 'tMeasure_v', 'tGap_v'].forEach(bindEditable);

function seg(id, obj, key, cast=v=>v, after){
  const el = $(id);
  el.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b) return;
    [...el.querySelectorAll('button')].forEach(x=>x.setAttribute('aria-pressed', String(x===b)));
    obj[key] = cast(b.dataset.v);
    if(after) after();
  });
}
/* ---------- field picker ---------- */
// field type picker — thumbnails are real shader micro-renders (baked at startup),
// with these CSS gradients as a graceful fallback until/if baking runs.
const FIELDS = [
  { v:6, name:'Market',       pat:'repeating-linear-gradient(90deg,#BACCF8 0 2px,transparent 2px 7px), #203C7F' },
  { v:7, name:'Volatility',   pat:'repeating-linear-gradient(90deg,#BACCF8 0 1px,transparent 1px 4px), #203C7F' },
  { v:8, name:'Order book',   pat:'repeating-linear-gradient(0deg,#BACCF8 0 2px,transparent 2px 7px), #203C7F' },
  { v:9, name:'Lanes',        pat:'repeating-linear-gradient(60deg,#BACCF8 0 4px,transparent 4px 12px), #203C7F' },
  { v:0, name:'Ribbon',       pat:'linear-gradient(180deg,#BACCF8,#3D6FE8 55%,#203C7F)' },
  { v:1, name:'Interference', pat:'repeating-linear-gradient(45deg,#BACCF8 0 1px,transparent 1px 6px), repeating-linear-gradient(-45deg,#BACCF8 0 1px,transparent 1px 6px), #203C7F' },
  { v:2, name:'Flow',         pat:'conic-gradient(from 45deg at 50% 50%,#203C7F,#3D6FE8,#BACCF8,#3D6FE8,#203C7F)' },
  { v:3, name:'Signal',       pat:'repeating-linear-gradient(90deg,#BACCF8 0 6px,transparent 6px 12px), #203C7F' },
  { v:4, name:'Gate',         pat:'repeating-linear-gradient(0deg,#BACCF8 0 1px,transparent 1px 9px), repeating-linear-gradient(90deg,#BACCF8 0 1px,transparent 1px 9px), #203C7F' },
  { v:5, name:'Ledger',       pat:'repeating-linear-gradient(0deg,#BACCF8 0 1px,transparent 1px 6px), #203C7F' }
];
(function renderFieldPicker(){
  const box = $('field'); if(!box) return;
  box.innerHTML = FIELDS.map(f =>
    '<button type="button" data-v="'+f.v+'" aria-pressed="'+(S.field===f.v)+'" title="'+f.name+'">'
    + '<span class="thumb" style="background:'+f.pat+'"></span>'
    + '<span class="cap">'+f.name+'</span></button>'
  ).join('');
})();
seg('field', S, 'field', v=>parseInt(v), ()=>{ applyMask(); meta(); });
seg('mouseMode', S, 'mouseMode', v=>parseInt(v));

// per-field tuning so each motif reads clearly at thumbnail scale
const FIELD_THUMB = {
  6:{freq:8,  amp:1.0, cols:52, rowScale:2.6},   // Market — price line
  7:{freq:6,  amp:1.1, cols:52, rowScale:2.6},   // Volatility — envelope
  8:{freq:9,  amp:0.95,cols:56, rowScale:2.4},   // Order book — mid ladder
  9:{freq:7,  amp:1.1, cols:60, rowScale:1.5},   // Lanes — streams
  0:{freq:6,  amp:1.0, cols:50, rowScale:2.4},   // Ribbon — bands
  1:{freq:8,  amp:1.0, cols:54, rowScale:2.0},   // Interference — weave
  2:{freq:6,  amp:1.0, cols:52, rowScale:2.2},   // Flow — fbm
  3:{freq:5,  amp:1.0, cols:56, rowScale:2.0},   // Signal — rings
  4:{freq:5,  amp:1.0, cols:30, rowScale:1.6},   // Gate — modules
  5:{freq:6,  amp:1.0, cols:48, rowScale:2.6}    // Ledger — columns
};
// render each field once through the real shader, snapshot to a data URL, and
// paint it onto the picker thumbnails. Runs synchronously before the first rAF
// so the WebGL drawing buffer is still readable via toDataURL().
function bakeFieldThumbs(){
  const box = $('field'); if(!box || !gl || !prog) return;
  const TW = 300, TH = 96, GROUND = '#203C7F', MARK = '#BACCF8';
  const swW = canvas.width, swH = canvas.height;
  try {
    gl.useProgram(prog);
    canvas.width = TW; canvas.height = TH;
    gl.uniform2f(u.res, TW, TH);
    gl.uniform1f(u.time, 1.6);
    gl.uniform3fv(u.colors, new Float32Array([...hex2rgb(GROUND), ...hex2rgb(MARK), ...new Array(18).fill(0)]));
    gl.uniform1i(u.colorCount, 2);
    gl.uniform1fv(u.colorWeight, new Float32Array([0,100,0,0,0,0,0,0]));
    gl.uniform1f(u.len, 0.82); gl.uniform1f(u.weight, 0.42); gl.uniform1f(u.jitter, 0.12);
    gl.uniform1f(u.contrast, 2.2); gl.uniform1f(u.bias, 0.20); gl.uniform1f(u.grain, 0);
    gl.uniform1f(u.quant, 0); gl.uniform1f(u.seed, 3.0);
    gl.uniform1i(u.useImg, 0); gl.uniform1i(u.invert, 0);
    gl.uniform2f(u.origin, 0, 0);
    gl.uniform1i(u.mouseMode, 0); gl.uniform1f(u.mouseOn, 0);
    FIELDS.forEach(f=>{
      const P = FIELD_THUMB[f.v] || {};
      gl.uniform1f(u.freq, P.freq ?? 7); gl.uniform1f(u.amp, P.amp ?? 1);
      gl.uniform1f(u.cols, P.cols ?? 50); gl.uniform1f(u.rowScale, P.rowScale ?? 2.4);
      gl.uniform1i(u.field, f.v);
      gl.viewport(0,0,TW,TH);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const url = canvas.toDataURL('image/png');
      const thumb = box.querySelector('button[data-v="'+f.v+'"] .thumb');
      if(thumb){ thumb.style.backgroundImage = 'url('+url+')'; thumb.style.backgroundSize = 'cover'; thumb.style.backgroundPosition = 'center'; }
    });
  } catch(e){ /* keep CSS-gradient fallbacks */ }
  finally { canvas.width = swW; canvas.height = swH; }
}

/* ---------- canvas format ---------- */
const DIM_MIN = 16, DIM_MAX = 8192;
/* Past roughly 33 megapixels the GPU runs out of room even with tiled rendering,
   so the frame is capped by total area as well as by each side. */
const AREA_MAX = 8192 * 4096;
function clampDim(raw, fallback){
  const n = parseInt(raw, 10);
  if(!Number.isFinite(n)) return fallback;
  return Math.max(DIM_MIN, Math.min(DIM_MAX, n));
}
const axisMax = other => Math.max(DIM_MIN, Math.min(DIM_MAX, Math.floor(AREA_MAX / Math.max(other, 1))));
/* Programmatic setter for Ratio lab, query params, and tests. The editor only
   exposes the seven presets — there is no custom W×H field. */
function setCanvasSize(w, h, edited){
  S.canvasW = clampDim(w, S.canvasW);
  S.canvasH = clampDim(h, S.canvasH);
  if(S.canvasW * S.canvasH > AREA_MAX){
    if(edited === 'h') S.canvasH = axisMax(S.canvasW);
    else               S.canvasW = axisMax(S.canvasH);
    toast('Capped at ' + Math.round(AREA_MAX / 1e6) + ' megapixels — the largest frame that exports reliably');
  }
  applyMask(); meta(); applyRatioScale();
  renderText();
  renderLogo();
}
function setFormatLayout(id, patch){
  const row = FORMAT_LAYOUT[id];
  if (!row) return null;
  if (row.locked) return row;
  patch = patch || {};
  if (patch.scale != null){
    const s = Number(patch.scale);
    if (Number.isFinite(s) && s > 0) row.scale = s;
  }
  if (patch.spanCols != null){
    const n = parseInt(patch.spanCols, 10);
    if (Number.isFinite(n)) row.spanCols = Math.max(1, Math.min(S.grid.cols, n));
  }
  applyRatioScale();
  renderText();
  renderLogo();
  return row;
}
function layoutStats(){
  const W = S.canvasW, H = S.canvasH;
  const f = formatBySize(W, H);
  const L = f ? FORMAT_LAYOUT[f.id] : null;
  const frameEl = document.getElementById('frame');
  const frame = frameEl ? frameEl.getBoundingClientRect() : { width:0, height:0, left:0, top:0 };
  const pct = (n, den) => den ? n / den * 100 : 0;
  const origin = el => {
    if (!el) return { x:null, y:null };
    const b = el.getBoundingClientRect();
    return { x: pct(b.left - frame.left, frame.width), y: pct(b.top - frame.top, frame.height) };
  };
  const scrimEl = document.querySelector('#logoLayer .scrim');
  const inner = document.getElementById('txtInner');
  const head = document.getElementById('tHead');
  const headSize = head ? parseFloat(getComputedStyle(head).fontSize) || 0 : 0;
  const logoBox = scrimEl ? scrimEl.getBoundingClientRect() : null;
  const innerBox = inner ? inner.getBoundingClientRect() : null;
  return {
    id: f ? f.id : null,
    scale: ratioScale(W, H),
    cols: measureCols(W, H),
    locked: !!(L && L.locked) || isLockedBaseline(W, H),
    headPctW: pct(headSize, frame.width),
    headPctH: pct(headSize, frame.height),
    logoPctW: logoBox ? pct(logoBox.width, frame.width) : null,
    logoPctH: logoBox ? pct(logoBox.height, frame.height) : null,
    measurePctW: innerBox ? pct(innerBox.width, frame.width) : null,
    logo: origin(scrimEl),
    text: origin(inner)
  };
}
(function initFormat(){
  const sel = $('format'); if(!sel) return;
  sel.innerHTML = FORMATS.map(f => '<option value="'+f.id+'">'+f.name+' · '+f.id+' · '+f.w+'×'+f.h+'</option>').join('')
    + '<option value="custom">Custom</option>';
  sel.addEventListener('change', ()=>{
    const f = FORMATS.find(x => x.id === sel.value);
    if(!f) return;
    setCanvasSize(f.w, f.h);
  });
  const onDim = edited =>{
    const w = clampDim($('cw').value, S.canvasW);
    const h = clampDim($('ch').value, S.canvasH);
    setCanvasSize(w, h, edited);
  };
  $('cw').addEventListener('change', ()=> onDim('w'));
  $('ch').addEventListener('change', ()=> onDim('h'));
})();
function syncFormatSelect(){
  const sel = $('format'); if(!sel) return;
  const f = FORMATS.find(x => x.w === Math.round(S.canvasW) && x.h === Math.round(S.canvasH));
  sel.value = f ? f.id : 'custom';
  const wEl=$('cw'), hEl=$('ch');
  if(wEl && document.activeElement!==wEl) wEl.value = Math.round(S.canvasW);
  if(hEl && document.activeElement!==hEl) hEl.value = Math.round(S.canvasH);
}

/* ---------- brand palette ---------- */
const MAX_COLORS = 8;   // shader supports up to 8 active colors
const MIN_COLORS = 2;   // ground + at least one mark
const brandIndexOf = hex => BRAND.findIndex(b => b.hex.toLowerCase() === String(hex).toLowerCase());
// brand name where we have one, otherwise the hex itself
const colorName = hex => { const i = brandIndexOf(hex); return i >= 0 ? BRAND[i].name : String(hex); };
const inColors = hex => S.colors.findIndex(c => c.toLowerCase() === hex.toLowerCase());

/* ---- WCAG contrast helpers (ground vs mark) ---- */
const _lin = c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
const relLum = hex => { const [r,g,b] = hex2rgb(hex); return 0.2126*_lin(r) + 0.7152*_lin(g) + 0.0722*_lin(b); };
const contrastRatio = (a,b) => { const L1=relLum(a), L2=relLum(b), hi=Math.max(L1,L2), lo=Math.min(L1,L2); return (hi+0.05)/(lo+0.05); };
function aaBadge(ratio){
  const r = ratio.toFixed(1) + ':1';
  let cls='fail', tip='Below 3:1 — marks may not read against the ground.';
  if(ratio >= 4.5){ cls='pass'; tip='Passes WCAG AA (4.5:1) — reads at any size.'; }
  else if(ratio >= 3){ cls='warn'; tip='Passes AA for large / graphical elements (3:1) only.'; }
  return '<span class="aa '+cls+'" title="'+tip+'"><span class="aa-dot"></span>'+r+'</span>';
}

function refreshColorConsumers(){
  applyMask();
  if(window.syncTextColor){ syncTextColor(); renderText(); renderLogo(); }
  meta();
}

/* ---- mark density as shares of 100 ----
   The shader picks a mark colour by weighted lottery, normalising the weights it
   is given, so only their ratio has ever mattered. Holding them to a total of
   100 makes the sliders mean what the label says: the share of marks that get
   this colour. Moving one takes its share from the others. */
const markIndices = () => { const a = []; for(let k=1;k<S.colors.length;k++) a.push(k); return a; };

// scale a set of raw shares to whole numbers totalling exactly 100
function toShares(raw){
  const idx = markIndices();
  const out = S.colors.map(()=> 0);
  if(!idx.length) return out;
  const clean = k => Math.max(Number(raw[k]) || 0, 0);
  const sum = idx.reduce((a,k)=> a + clean(k), 0);
  const exact = {};
  idx.forEach(k=> exact[k] = sum > 0 ? clean(k) * 100 / sum : 100 / idx.length);
  // largest remainder, so rounding still lands on 100 rather than 99 or 101
  idx.forEach(k=> out[k] = Math.floor(exact[k]));
  let left = 100 - idx.reduce((a,k)=> a + out[k], 0);
  idx.slice()
     .sort((a,b)=> (exact[b] - out[b]) - (exact[a] - out[a]))
     .forEach(k=>{ if(left > 0){ out[k]++; left--; } });
  return out;
}
function normaliseWeights(){ S.weights = toShares(S.weights); }

// set one mark's share and take the remainder from the others, in proportion
function setWeight(idx, value){
  const idxs = markIndices();
  if(idxs.length <= 1){ normaliseWeights(); return; }   // a lone mark is always the whole pattern
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const others = idxs.filter(k=> k !== idx);
  const pool = others.reduce((a,k)=> a + Math.max(S.weights[k] || 0, 0), 0);
  const rest = 100 - v;
  const raw = S.colors.map(()=> 0);
  raw[idx] = v;
  others.forEach(k=>{
    raw[k] = pool > 0 ? Math.max(S.weights[k] || 0, 0) / pool * rest : rest / others.length;
  });
  S.weights = toShares(raw);
}

function toggleBrand(bi){
  const hex = BRAND[bi].hex;
  const at = inColors(hex);
  if(at === -1){
    if(S.colors.length >= MAX_COLORS){ toast('Up to '+MAX_COLORS+' colors'); return; }
    S.colors.push(hex); S.weights.push(0);
    // a new mark takes an even share, the rest give way in proportion
    setWeight(S.colors.length - 1, Math.round(100 / markIndices().length));
  } else {
    // always keep a ground + one mark; say so rather than ignoring the click
    if(S.colors.length <= MIN_COLORS){ toast('Keep at least '+MIN_COLORS+' colors — a ground and one mark'); return; }
    // if the ground is being removed, the next color becomes ground automatically
    S.colors.splice(at, 1); S.weights.splice(at, 1);
    normaliseWeights();                     // survivors grow to fill the gap
  }
  renderPalette();
  refreshColorConsumers();
}

// promote any active color to ground (index 0); always exactly one ground
function setGround(hex){
  const at = inColors(hex);
  if(at <= 0) return;                       // not found, or already ground
  // the outgoing ground becomes a mark, so start it on an even share
  const marks = markIndices().length;
  S.weights[0] = marks > 1 ? 100 / (marks - 1) : 100;
  const [c] = S.colors.splice(at, 1);
  const [w] = S.weights.splice(at, 1);
  S.colors.unshift(c); S.weights.unshift(w);
  S.weights[0] = 0;                         // ground density is unused
  normaliseWeights();
  renderPalette();
  refreshColorConsumers();
}

function renderSwatches(){
  const box = $('brandSwatches'); box.innerHTML = '';
  BRAND.forEach((b, bi)=>{
    const active = inColors(b.hex) !== -1;
    const isGround = active && S.colors[0].toLowerCase() === b.hex.toLowerCase();
    const sw = document.createElement('div');
    sw.className = 'swatch' + (active ? ' on' : '');

    const main = document.createElement('button');
    main.type = 'button'; main.className = 'sw-main';
    main.setAttribute('aria-pressed', String(active));
    main.title = active ? 'Remove from palette' : b.use;
    main.innerHTML =
      '<span class="dot" style="background:'+b.hex+'"></span>'
      + '<span class="sw-meta"><span class="sw-name">'+b.name+'</span>'
      + '<span class="sw-hex">'+b.hex+'</span></span>';
    main.addEventListener('click', ()=>toggleBrand(bi));
    sw.appendChild(main);

    if(active){
      const g = document.createElement('button');
      g.type = 'button'; g.className = 'sw-ground';
      // a plain toggle, not role=radio: the radios would need one radiogroup
      // parent, and the swatch list interleaves them with the add/remove buttons
      g.setAttribute('aria-pressed', String(isGround));
      g.setAttribute('aria-label', b.name + (isGround ? ' is the ground color' : ' — use as ground color'));
      g.title = isGround ? 'This is the ground (background) color' : 'Use as ground (background) color';
      g.innerHTML = '<span class="radio"></span>Ground';
      g.addEventListener('click', e=>{ e.stopPropagation(); setGround(b.hex); });
      sw.appendChild(g);
    }
    box.appendChild(sw);
  });
}

/* Rows are rebuilt only when the palette itself changes. While a slider is being
   dragged the others are updated in place, because replacing the DOM mid-drag
   would drop the pointer capture and stop the drag dead. */
let roleRows = [];
function syncRoleInputs(){
  roleRows.forEach(({ idx, range, val })=>{
    const share = Math.round(S.weights[idx] || 0);
    if(document.activeElement !== range) range.value = share;
    if(document.activeElement !== val) val.value = share;
  });
}

function renderRoles(){
  const box = $('palRoles'); box.innerHTML = '';
  roleRows = [];
  if(S.colors.length <= 1) return;
  normaliseWeights();
  const single = markIndices().length === 1;

  const head = document.createElement('p');
  head.className = 'note'; head.style.margin = 'var(--s4) 0 var(--s2)';
  head.textContent = single
    ? 'Mark density — one mark colour, so it fills the whole pattern'
    : 'Mark density — share of marks per color, always totalling 100%';
  box.appendChild(head);

  for(let k=1;k<S.colors.length;k++){
    const name = colorName(S.colors[k]);
    const wrap = document.createElement('div'); wrap.className = 'slider';
    const row = document.createElement('div'); row.className = 'row';
    const lbl = document.createElement('label'); lbl.className = 'lbl';
    lbl.innerHTML = '<span class="dot sm" style="background:'+S.colors[k]+'"></span>'+name
      + aaBadge(contrastRatio(S.colors[k], S.colors[0]));
    const val = document.createElement('input'); val.className = 'val';
    val.type = 'text'; val.setAttribute('inputmode','decimal'); val.spellcheck = false;
    val.setAttribute('aria-label', name + ' share of marks, percent');
    val.value = Math.round(S.weights[k]);
    val.disabled = single;
    row.append(lbl, val);

    const inp = document.createElement('input');
    inp.type = 'range'; inp.min = '0'; inp.max = '100'; inp.step = '1';
    inp.value = Math.round(S.weights[k]);
    inp.disabled = single;
    inp.setAttribute('aria-label', name + ' share of marks');
    inp.setAttribute('aria-valuetext', Math.round(S.weights[k]) + '%');

    const idx = k;
    const commit = v =>{
      setWeight(idx, v);
      syncRoleInputs();
      roleRows.forEach(r=> r.range.setAttribute('aria-valuetext', Math.round(S.weights[r.idx] || 0) + '%'));
    };
    inp.addEventListener('input', ()=> commit(inp.value));
    val.addEventListener('change', ()=>{
      const v = parseFloat(val.value);
      if(isNaN(v)){ syncRoleInputs(); return; }
      commit(v);
      val.value = Math.round(S.weights[idx] || 0);
    });
    val.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); val.blur(); } });
    val.addEventListener('focus', ()=> val.select());

    wrap.append(row, inp);
    box.appendChild(wrap);
    roleRows.push({ idx, range: inp, val });
  }
}

function renderActiveColors(){
  const box = $('paletteList'); if(!box) return;
  box.innerHTML = '';
  S.colors.forEach((hex, i)=>{
    const row = document.createElement('div'); row.className = 'prow';
    const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = i===0 ? 'Ground' : 'Mark '+i;
    const pick = document.createElement('input'); pick.type = 'color'; pick.value = hex;
    const val = document.createElement('span'); val.className = 'hexval'; val.textContent = hex;
    const del = document.createElement('button'); del.className = 'del'; del.textContent = '✕';
    del.title = 'Remove'; del.disabled = S.colors.length <= MIN_COLORS;
    pick.addEventListener('input', ()=>{
      S.colors[i] = pick.value;
      val.textContent = pick.value;
      renderSwatches();
      refreshColorConsumers();
    });
    del.addEventListener('click', ()=>{
      if(S.colors.length <= MIN_COLORS){ toast('Keep at least '+MIN_COLORS+' colors — a ground and one mark'); return; }
      S.colors.splice(i, 1); S.weights.splice(i, 1);
      normaliseWeights();
      renderPalette();
      refreshColorConsumers();
    });
    row.append(tag, pick, val, del);
    box.appendChild(row);
  });
  const add = $('addColor');
  if(add) add.disabled = S.colors.length >= MAX_COLORS;
}

// keep the old name so existing init/restore calls keep working
function renderPalette(){
  const cleaned = [], cw = [];
  S.colors.forEach((c, i)=>{
    const hex = String(c || '').toUpperCase();
    if(!/^#[0-9A-F]{6}$/.test(hex)) return;
    if(cleaned.some(x => x.toLowerCase() === hex.toLowerCase())) return;
    const bi = brandIndexOf(hex);
    cleaned.push(bi >= 0 ? BRAND[bi].hex : hex);
    cw.push(S.weights && S.weights[i] != null ? S.weights[i] : 50);
  });
  if(cleaned.length < MIN_COLORS){
    const d = brandOf(S.brand).defaults;
    S.colors = [...d.colors]; S.weights = [...d.weights];
  } else {
    S.colors = cleaned; S.weights = cw; S.weights[0] = 0;
  }
  normaliseWeights();
  renderSwatches();
  renderActiveColors();
  renderRoles();
}

$('addColor').onclick = ()=>{
  if(S.colors.length >= MAX_COLORS){ toast('Up to '+MAX_COLORS+' colors'); return; }
  S.colors.push('#A2BDE9'); S.weights.push(0);
  setWeight(S.colors.length - 1, Math.round(100 / markIndices().length));
  renderPalette();
  refreshColorConsumers();
};

function applyBrand(id, { resetColors=true } = {}){
  const b = BRANDS[id];
  if(!b || !b.ready){
    toast((b && b.name || 'That brand') + ' branding is coming soon');
    return;
  }
  S.brand = id;
  BRAND = b.palette;
  LOGO_COLORS = b.logoColors;
  if(resetColors){
    S.colors = [...b.defaults.colors];
    S.weights = [...b.defaults.weights];
  }
  const sub = $('brandSub');
  if(sub) sub.textContent = 'Designer studio · ' + b.name;
  const sel = $('brandSel');
  if(sel) [...sel.querySelectorAll('button')].forEach(x=> x.setAttribute('aria-pressed', String(x.dataset.v === id)));
  renderPalette();
  refreshColorConsumers();
}

(function initBrand(){
  const sel = $('brandSel'); if(!sel) return;
  sel.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b || b.disabled) return;
    applyBrand(b.dataset.v);
  });
})();

/* ---------- image & fade mask ---------- */
function loadImage(file){
  if(!file || !file.type.startsWith('image/')) return;
  const img = new Image();
  img.onload = ()=>{
    imgAspect = img.width / img.height;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    S.useImg = 1;
    S.imgData = img.src.startsWith('data:') ? img.src : null;  // for HTML export bake
    $('dropLabel').textContent = file.name.slice(0,26);
    $('drop').classList.add('on');
    $('fieldNote').style.display = 'block';
    meta();
  };
  // read as data URL so it can be baked into an exported standalone
  const rd = new FileReader();
  rd.onload = ()=>{ img.src = rd.result; };
  rd.readAsDataURL(file);
}
$('file').addEventListener('change', e=> loadImage(e.target.files[0]));
['dragenter','dragover'].forEach(ev=>$('drop').addEventListener(ev, e=>{ e.preventDefault(); $('drop').classList.add('on'); }));
$('drop').addEventListener('dragleave', ()=>{ if(!S.useImg) $('drop').classList.remove('on'); });
$('drop').addEventListener('drop', e=>{ e.preventDefault(); loadImage(e.dataTransfer.files[0]); });
$('clearImg').onclick = ()=>{
  S.useImg = 0; S.imgData = null; $('drop').classList.remove('on');
  $('dropLabel').textContent = 'Drop an image'; $('file').value = '';
  $('fieldNote').style.display = 'none';
};
$('invert').onclick = ()=>{ S.invert = S.invert ? 0 : 1; setSwitch('invert', !!S.invert); };

/* One gradient definition for the preview, HTML and React output.
   'center' is symmetric — solid through the middle and fading out to both
   edges — so centred copy is protected while the pattern still reads at the
   sides. Fade end is forced past the solid stop so the stops never invert. */
function maskStops(){
  const s = S.maskSolid, f = Math.max(S.maskFade, s + 1);
  return S.maskDir === 'center'
    ? [[50 - f/2, 0], [50 - s/2, 1], [50 + s/2, 1], [50 + f/2, 0]]
    : [[0, 1], [s, 1], [f, 0], [100, 0]];
}
function maskGradient(){
  if(S.maskDir === 'none') return '';
  const dir = S.maskDir === 'center' ? 'to right' : S.maskDir;
  const stops = maskStops().map(([p,a]) => `${hexA(S.colors[0], a)} ${+p.toFixed(2)}%`);
  return `linear-gradient(${dir}, ${stops.join(', ')})`;
}
function applyMask(){
  $('mask').style.background = maskGradient() || 'none';
}
function meta(){
  $('exportSize').textContent = `${Math.round(S.canvasW)} × ${Math.round(S.canvasH)}`;
  $('cellCount').textContent = `${Math.round(S.cols)} × ${Math.round(S.cols*(1/S.ratio)/S.rowScale)}`;
  $('seedOut').textContent = S.seed.toFixed(2);
  const ps=$('pngSize'); if(ps) ps.textContent = `${Math.round(S.canvasW)}×${Math.round(S.canvasH)}`;
  syncFormatSelect();
}

$('reseed').onclick = ()=>{ S.seed = Math.random()*100; meta(); };
function setPaused(v){
  S.paused = v;
  $('pause').setAttribute('aria-pressed', String(v));
}
$('pause').onclick = ()=> setPaused(!S.paused);


/* ---------- grid & logo ---------- */
/* Grid reference is the SHORT side, so whitespace keeps its optical weight
   as the canvas ratio changes. CSS gets this free via cqmin. */
const marginPx  = (W,H) => tokenPx(S.grid.margin, TOKENS.grid.basis, W, H);
const gutterPx  = (W,H) => tokenPx(S.grid.gutter, TOKENS.grid.basis, W, H);
const marginCss = () => tokenCss(S.grid.margin, TOKENS.grid.basis);
const gutterCss = () => tokenCss(S.grid.gutter, TOKENS.grid.basis);
function colWidthPx(W,H){
  const content = W - 2*marginPx(W,H);
  return (content - (S.grid.cols-1)*gutterPx(W,H)) / S.grid.cols;
}
function spanPx(W,H,n){
  n = Math.max(1, Math.min(S.grid.cols, n));
  return n*colWidthPx(W,H) + (n-1)*gutterPx(W,H);
}
/* Named presets use FORMAT_LAYOUT. Odd sizes fall back to the old AR bands. */
function measureCols(W, H){
  const cap = S.grid.cols;
  const L = layoutFor(W, H);
  if (L) return Math.min(cap, Math.max(1, L.spanCols));
  const n = Math.min(cap, S.text.spanCols);
  const ar = W / H;
  if (Math.abs(ar - 1) < 1e-3) return Math.min(cap, Math.max(n, FORMAT_LAYOUT['1:1'].spanCols));
  if (ar < 1) return Math.min(cap, Math.max(n, FORMAT_LAYOUT['9:16'].spanCols));
  if (ar < 1.5) return Math.min(cap, Math.max(n, FORMAT_LAYOUT['4:3'].spanCols));
  return n;
}
/* CSS equivalent of spanPx, in container-query units. Columns divide the full
   canvas width, so the content box is 100cqw less the margins. */
const cssSpan = n => {
  n = Math.max(1, Math.min(S.grid.cols, n));
  const m = marginCss(), g = gutterCss();
  const content = `(100cqw - 2 * ${m} - ${S.grid.cols - 1} * ${g})`;
  return `calc(${n} * (${content} / ${S.grid.cols}) + ${n - 1} * ${g})`;
};

function renderGrid(){
  const f = $('frame'), ov = $('gridOv');
  f.style.setProperty('--m', marginCss());
  f.style.setProperty('--g', gutterCss());
  ov.classList.toggle('on', S.grid.show);
  const inner = $('gCols');
  if(inner.childElementCount !== S.grid.cols){
    inner.innerHTML = '';
    for(let i=0;i<S.grid.cols;i++) inner.appendChild(document.createElement('i'));
  }
}

/* ---- logo ---- */
const POS_FLEX = {
  tl:['flex-start','flex-start'], tc:['center','flex-start'], tr:['flex-end','flex-start'],
  bl:['flex-start','flex-end'],   bc:['center','flex-end'],   br:['flex-end','flex-end']
};
function logoSvg(){ return S.logo.type==='mark' ? LOGO.mark.svg : LOGO.lockup.svg; }
function logoAR(){  return S.logo.type==='mark' ? LOGO.mark.ar  : LOGO.lockup.ar; }

function renderLogo(){
  const L = $('logoLayer');
  if(S.logo.type === 'none'){ L.classList.remove('on'); L.innerHTML=''; return; }
  L.classList.add('on');
  const [j,a] = POS_FLEX[S.logo.pos];
  L.style.justifyContent = j;
  L.style.alignItems = a;
  L.style.color = LOGO_COLORS[S.logo.color];
  const len = logoHeightCss();
  const pc = palAt(S.logo.plateIdx);
  let style = `height:${len}`;
  if(S.logo.scrim === 'scrim') style += ';' + scrimStyle(pc, len);
  L.innerHTML = `<span class="scrim ${S.logo.scrim}" style="${style}">${logoSvg()}</span>`;
}
/* hex + alpha → rgba(), so the scrim fades to fully transparent
   (a plain `transparent` keyword fades through black in some engines) */
function hexA(hex, a){
  const c = hex2rgb(hex).map(v=>Math.round(v*255));
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/* ---- logo into a 2D canvas for PNG export ---- */
function logoDataUrl(){
  const svg = logoSvg().replace(/currentColor/g, LOGO_COLORS[S.logo.color]);
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function drawLogo(ctx, W, H){
  if(S.logo.type === 'none') return Promise.resolve();
  const m = marginPx(W,H);
  const h = logoHeightPx(W,H);
  const w = h * logoAR();
  const p = S.logo.pos;
  const x = p[1]==='l' ? m : p[1]==='r' ? W - m - w : (W - w)/2;
  const y = p[0]==='t' ? m : H - m - h;
  const pc = palAt(S.logo.plateIdx);
  if(S.logo.scrim === 'scrim'){
    const cx = x + w/2, cy = y + h/2;
    const [rx, ry] = scrimRadii(w, h);
    // createRadialGradient is circular, so squash the space to get the ellipse
    const g = ctx.createRadialGradient(0,0,0,0,0,ry);
    g.addColorStop(0, pc); g.addColorStop(SCRIM_CORE/100, pc); g.addColorStop(1, hexA(pc,0));
    ctx.save(); ctx.translate(cx,cy); ctx.scale(rx/ry, 1);
    ctx.fillStyle = g; ctx.fillRect(-ry, -ry, ry*2, ry*2); ctx.restore();
  }
  return new Promise(res=>{
    const im = new Image();
    im.onload  = ()=>{ ctx.drawImage(im, x, y, w, h); res(); };
    im.onerror = ()=> res();
    im.src = logoDataUrl();
  });
}

/* ---- controls ---- */
seg('gCols_seg', S.grid, 'cols', v=>parseInt(v), ()=>{
  if(S.text.spanCols > S.grid.cols) S.text.spanCols = S.grid.cols;
  renderGrid(); renderText();
});
seg('zoomSeg', S, 'zoom', v=>v, ()=>setZoom(S.zoom));
seg('lType',  S.logo, 'type',  v=>v, renderLogo);
seg('lPos',   S.logo, 'pos',   v=>v, renderLogo);
seg('lSize',  S.logo, 'size',  v=>v, renderLogo);
seg('lColor', S.logo, 'color', v=>v, renderLogo);
seg('lScrim', S.logo, 'scrim', v=>v, renderLogo);
// backing color is always the background (ground) color — plateIdx stays 0, no selector

['gMargin','gGutter'].forEach(id=>{
  const key = id==='gMargin' ? 'margin' : 'gutter';
  $(id).addEventListener('input', e=>{
    S.grid[key] = parseFloat(e.target.value);
    putDisp(id+'_v', S.grid[key]);
    renderGrid(); renderText(); renderLogo();
  });
});
$('tMeasure').addEventListener('input', e=>{
  S.text.spanCols = parseInt(e.target.value, 10);
  const f = formatBySize(S.canvasW, S.canvasH);
  if(f && FORMAT_LAYOUT[f.id] && !FORMAT_LAYOUT[f.id].locked){
    FORMAT_LAYOUT[f.id].spanCols = S.text.spanCols;
  }
  putDisp('tMeasure_v', S.text.spanCols);
  renderText();
});
$('tGap').addEventListener('input', e=>{
  S.text.gap = parseFloat(e.target.value);
  putDisp('tGap_v', S.text.gap);
  renderText();
});
$('gShow').onclick = ()=>{
  S.grid.show = !S.grid.show;
  setSwitch('gShow', S.grid.show);
  renderGrid();
};

function initGridLogo(){
  $('gMargin').value = S.grid.margin; putDisp('gMargin_v', S.grid.margin);
  $('gGutter').value = S.grid.gutter; putDisp('gGutter_v', S.grid.gutter);
  if($('tMeasure')){ $('tMeasure').value = S.text.spanCols; putDisp('tMeasure_v', S.text.spanCols); }
  if($('tGap')){ $('tGap').value = S.text.gap; putDisp('tGap_v', S.text.gap); }
  renderGrid(); renderLogo();
}

/* ---------- text layout ---------- */
const escHtml = s => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
/* Internal storage still uses *italic* markers so tokenize/export stay simple.
   The editor shows real italics — never the asterisks. */
const markupToHtml = s => escHtml(s).replace(/\*([^*\n]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const palAt = i => S.colors[Math.max(0, Math.min(i|0, S.colors.length - 1))];
const roleColor = role => palAt(S.text[role.ckey]);

/* Walk a contenteditable and rebuild the *italic* markup the renderers expect. */
function htmlToMarkup(root){
  const inline = node => {
    let s = '';
    const walk = n => {
      if(n.nodeType === 3){ s += n.nodeValue.replace(/\u00a0/g, ' ').replace(/\*/g, ''); return; }
      if(n.nodeType !== 1) return;
      const tag = n.tagName;
      if(tag === 'BR'){ s += '\n'; return; }
      const ital = tag === 'EM' || tag === 'I';
      if(ital) s += '*';
      [...n.childNodes].forEach(walk);
      if(ital) s += '*';
    };
    [...node.childNodes].forEach(walk);
    return s;
  };
  const kids = [...root.childNodes];
  const blocks = kids.filter(n => n.nodeType === 1 && (n.tagName === 'DIV' || n.tagName === 'P'));
  if(blocks.length){
    return kids.map(n => {
      if(n.nodeType === 3) return n.nodeValue.replace(/\u00a0/g, ' ').replace(/\*/g, '');
      if(n.nodeType === 1 && n.tagName === 'BR') return '';
      if(n.nodeType === 1) return inline(n);
      return '';
    }).join('\n').replace(/\n+$/,'');
  }
  return inline(root);
}

function setTextField(id, markup){
  const el = $(id); if(!el) return;
  el.innerHTML = markupToHtml(markup || '');
}

function readTextField(id){
  const el = $(id); if(!el) return '';
  return htmlToMarkup(el);
}

function selectionItalic(){
  try{ return document.queryCommandState('italic'); }catch(e){ return false; }
}

function syncItalicBtn(editId){
  const map = { tiEyebrow:'itEyebrow', tiHead:'itHead', tiBody:'itBody' };
  const btn = $(map[editId]); if(!btn) return;
  const on = document.activeElement === $(editId) && selectionItalic();
  btn.setAttribute('aria-pressed', String(!!on));
}

function toggleItalic(editId){
  const el = $(editId); if(!el) return;
  el.focus();
  document.execCommand('italic');
  const key = { tiEyebrow:'eyebrow', tiHead:'head', tiBody:'body' }[editId];
  S.text[key] = htmlToMarkup(el);
  renderText();
  syncItalicBtn(editId);
}

// split into words carrying an italic flag; '\n' becomes an explicit break
function tokenize(txt, upper){
  const out = [];
  txt.split(/(\*[^*\n]+\*)/g).forEach(part=>{
    if(!part) return;
    const ital = part.length > 2 && part.startsWith('*') && part.endsWith('*');
    const body = ital ? part.slice(1,-1) : part;
    body.split(/(\n)/).forEach(seg=>{
      if(seg === '\n'){ out.push({br:true}); return; }
      seg.split(/\s+/).forEach(w=>{ if(w) out.push({text: upper ? w.toUpperCase() : w, italic: ital}); });
    });
  });
  return out;
}

function activeBlocks(){
  const T = S.text, out = [];
  if(T.eyebrow.trim()) out.push({txt:T.eyebrow, step:T.eyebrowStep, role:ROLES.eyebrow, col:roleColor(ROLES.eyebrow)});
  if(T.head.trim())    out.push({txt:T.head,    step:T.headStep,    role:ROLES.head,    col:roleColor(ROLES.head)});
  if(T.body.trim())    out.push({txt:T.body,    step:T.bodyStep,    role:ROLES.body,    col:roleColor(ROLES.body)});
  return out;
}

/* ---- live preview (DOM, container-query units) ---- */
function renderText(){
  const T = S.text, box = $('txt');
  if(!T.on || !activeBlocks().length){ box.style.display = 'none'; return; }
  box.style.display = 'flex';
  box.style.padding = marginCss();
  box.style.justifyContent = {left:'flex-start', center:'center', right:'flex-end'}[T.align];
  box.style.alignItems = {top:'flex-start', middle:'center', bottom:'flex-end'}[T.vAlign];

  const inner = $('txtInner');
  inner.style.maxWidth  = cssSpan(measureCols(S.canvasW, S.canvasH));
  inner.style.textAlign = T.align;
  inner.style.gap       = contentCss(T.gap, TOKENS.text.basis);

  const set = (id, txt, step, role)=>{
    const el = $(id), has = txt.trim().length > 0;
    el.style.display = has ? 'block' : 'none';
    if(!has) return;
    el.innerHTML = markupToHtml(role.upper ? txt.toUpperCase() : txt);
    el.style.color         = roleColor(role);
    el.style.fontSize      = typeCss(step, role);
    el.style.lineHeight    = role.lead;
    el.style.letterSpacing = role.track + 'em';
  };
  set('tEyebrow', T.eyebrow, T.eyebrowStep, ROLES.eyebrow);
  set('tHead',    T.head,    T.headStep,    ROLES.head);
  set('tBody',    T.body,    T.bodyStep,    ROLES.body);
}

/* ---- canvas layout, shared by PNG export ---- */
const fontStr = (w, ital, size) => `${ital?'italic ':''}${w} ${size}px "Suisse BP Intl", sans-serif`;

function wrapBlock(ctx, b, maxW){
  const toks = tokenize(b.txt, b.role.upper);
  const track = b.role.track * b.size;
  const setFont = ital => {
    ctx.font = fontStr(b.role.weight, ital, b.size);
    if('letterSpacing' in ctx) ctx.letterSpacing = track + 'px';
  };
  const lines = [];
  let cur = [], curW = 0;
  const flush = ()=>{ lines.push(cur); cur = []; curW = 0; };
  setFont(false);
  const spaceW = ctx.measureText(' ').width + track;

  toks.forEach(t=>{
    if(t.br){ flush(); return; }
    setFont(t.italic);
    const w = ctx.measureText(t.text).width;
    const sp = cur.length ? spaceW : 0;
    if(cur.length && curW + sp + w > maxW) flush();
    const prev = cur[cur.length - 1];
    const lead = cur.length ? ' ' : '';
    if(prev && prev.italic === t.italic) prev.text += lead + t.text;
    else cur.push({text: lead + t.text, italic: t.italic});
    curW += (cur.length > 1 || lead ? sp : 0) + w;
  });
  flush();

  // re-measure each run so alignment is exact
  return lines.filter(L=>L.length).map(runs=>{
    let width = 0;
    runs.forEach(r=>{ setFont(r.italic); r.w = ctx.measureText(r.text).width; width += r.w; });
    return {runs, width};
  });
}

function drawText(ctx, W, H){
  const T = S.text;
  if(!T.on) return;
  const blocks = activeBlocks();
  if(!blocks.length) return;

  const pad  = marginPx(W,H);
  const maxW = spanPx(W,H,measureCols(W,H));
  const gap  = contentPx(T.gap, TOKENS.text.basis, W, H);

  let total = 0;
  blocks.forEach(b=>{
    b.size  = typePx(b.step, b.role, W, H);
    b.lines = wrapBlock(ctx, b, maxW);
    b.lineH = b.size * b.role.lead;
    b.h     = b.lines.length * b.lineH;
    total  += b.h;
  });
  total += gap * (blocks.length - 1);

  let y = T.vAlign === 'top' ? pad
        : T.vAlign === 'bottom' ? H - pad - total
        : (H - total) / 2;

  ctx.textBaseline = 'alphabetic';

  blocks.forEach((b, i)=>{
    ctx.fillStyle = b.col;
    const track = b.role.track * b.size;
    b.lines.forEach(line=>{
      // centred copy centres the measure box in the canvas (as the preview's
      // flex layout does), not inside a box pinned to the left margin
      let x = T.align === 'left'  ? pad
            : T.align === 'right' ? W - pad - line.width
            : (W - line.width) / 2;
      const baseline = y + b.size * 0.76 + (b.lineH - b.size) / 2;
      line.runs.forEach(r=>{
        ctx.font = fontStr(b.role.weight, r.italic, b.size);
        if('letterSpacing' in ctx) ctx.letterSpacing = track + 'px';
        ctx.fillText(r.text, x, baseline);
        x += r.w;
      });
      y += b.lineH;
    });
    if(i < blocks.length - 1) y += gap;
  });
  if('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

/* ---- controls ---- */
TYPE_STEPS.forEach((label, i)=>{
  ['szEyebrow','szHead','szBody'].forEach(id=>{
    const o = document.createElement('option');
    o.value = i; o.textContent = label;
    $(id).appendChild(o);
  });
});
const SZ = [['szEyebrow','eyebrowStep'], ['szHead','headStep'], ['szBody','bodyStep']];
SZ.forEach(([id, key])=>{
  $(id).addEventListener('change', e=>{ S.text[key] = parseInt(e.target.value); renderText(); });
});
const TI = [['tiEyebrow','eyebrow','itEyebrow'], ['tiHead','head','itHead'], ['tiBody','body','itBody']];
TI.forEach(([id, key, btnId])=>{
  const el = $(id), btn = $(btnId);
  if(!el) return;
  el.addEventListener('input', ()=>{
    S.text[key] = htmlToMarkup(el);
    renderText();
    syncItalicBtn(id);
  });
  el.addEventListener('keyup', ()=> syncItalicBtn(id));
  el.addEventListener('mouseup', ()=> syncItalicBtn(id));
  el.addEventListener('focus', ()=> syncItalicBtn(id));
  el.addEventListener('blur', ()=>{
    // collapse empty editor so the placeholder shows again
    if(!el.textContent.replace(/\u00a0/g, '').trim()) el.innerHTML = '';
    if(btn) btn.setAttribute('aria-pressed', 'false');
  });
  el.addEventListener('keydown', e=>{
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i'){
      e.preventDefault();
      toggleItalic(id);
      return;
    }
    // eyebrow is a single line; headline/body insert a soft break
    if(e.key === 'Enter'){
      if(id === 'tiEyebrow'){ e.preventDefault(); return; }
      e.preventDefault();
      document.execCommand('insertLineBreak');
      S.text[key] = htmlToMarkup(el);
      renderText();
    }
  });
  if(btn) btn.addEventListener('mousedown', e=>{
    // keep selection in the editor — a click would otherwise steal focus first
    e.preventDefault();
    toggleItalic(id);
  });
});

document.addEventListener('selectionchange', ()=>{
  const id = ['tiEyebrow','tiHead','tiBody'].find(i => $(i) && $(i).contains(document.getSelection()?.anchorNode));
  if(id) syncItalicBtn(id);
});

seg('tAlign', S.text, 'align', v=>v, ()=>{ renderText(); syncMaskToAlign(); });
seg('tVAlign', S.text, 'vAlign', v=>v, renderText);

// mask is a single on/off toggle; Auto follows text alignment, otherwise the
// direction seg is an explicit override.
const ALIGN_MASK = { left:'to right', center:'center', right:'to left' };
function syncMaskDirPress(){
  const el = $('maskDir'); if(!el) return;
  const v = !S.maskOn ? 'none' : (S.maskFollow ? 'auto' : S.maskDir);
  [...el.querySelectorAll('button')].forEach(x=> x.setAttribute('aria-pressed', String(x.dataset.v === v)));
}
function syncMaskToAlign(){
  if(S.maskFollow) S.maskDir = S.maskOn ? (ALIGN_MASK[S.text.align] || 'to right') : 'none';
  else if(!S.maskOn) S.maskDir = 'none';
  syncMaskDirPress();
  applyMask(); meta();
}
(function(){
  const btn = $('maskToggle');
  if(!btn) return;
  setSwitch('maskToggle', S.maskOn);
  btn.addEventListener('click', ()=>{ S.maskOn = !S.maskOn; setSwitch('maskToggle', S.maskOn); syncMaskToAlign(); });
})();
(function(){
  const el = $('maskDir'); if(!el) return;
  el.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b) return;
    const v = b.dataset.v;
    if(v === 'auto'){
      S.maskFollow = true; S.maskOn = true;
    } else if(v === 'none'){
      S.maskFollow = false; S.maskOn = false; S.maskDir = 'none';
    } else {
      S.maskFollow = false; S.maskOn = true; S.maskDir = v;
    }
    setSwitch('maskToggle', S.maskOn);
    syncMaskToAlign();
  });
})();

$('textOn').onclick = ()=>{
  S.text.on = !S.text.on;
  setSwitch('textOn', S.text.on);
  renderText();
};

// every colour dropdown tracks the live palette
const COLOR_SELECTS = [
  ['cEyebrow', o=>S.text, 'cEyebrow'],
  ['cHead',    o=>S.text, 'cHead'],
  ['cBody',    o=>S.text, 'cBody']
];
function syncTextColor(){
  COLOR_SELECTS.forEach(([id, get, key])=>{
    const sel = $(id); if(!sel) return;
    const obj = get();
    sel.innerHTML = '';
    S.colors.forEach((hex, i)=>{
      const o = document.createElement('option');
      o.value = i;
      /* Name the colour rather than its slot — "Mark 2" told you nothing about
         what you were picking. The ground is flagged because copy set to it
         disappears into the background. */
      o.textContent = colorName(hex) + (i === 0 ? ' (bg)' : '');
      sel.appendChild(o);
    });
    if(obj[key] > S.colors.length - 1) obj[key] = S.colors.length - 1;
    sel.value = obj[key];
  });
  // backing always tracks the background (ground) color
  S.logo.plateIdx = 0;
}
COLOR_SELECTS.forEach(([id, get, key])=>{
  $(id).addEventListener('change', e=>{ S.text[key] = parseInt(e.target.value); renderText(); });
});

function initText(){
  setTextField('tiEyebrow', S.text.eyebrow);
  setTextField('tiHead', S.text.head);
  setTextField('tiBody', S.text.body);
  $('szEyebrow').value = S.text.eyebrowStep;
  $('szHead').value    = S.text.headStep;
  $('szBody').value    = S.text.bodyStep;
  syncTextColor();
  renderText();
}

/* ---------- accordion ---------- */
const ICONS = {
  'Source':      '<rect x="2.5" y="3.5" width="11" height="9" rx="1.5"/><path d="M2.5 10.5 6 7.5l3 2.5 2-1.5 2.5 2"/><circle cx="10.5" cy="6" r="1"/>',
  'Field':       '<path d="M2 8c1.5-3 3-3 4.5 0S9.5 11 11 8s2.5-3 3 0"/><path d="M2 12c1.5-2.5 3-2.5 4.5 0"/>',
  'Marks':       '<path d="M4 3v10M8 5v8M12 2v11"/><rect x="2.8" y="5.5" width="2.4" height="5" rx=".6"/><rect x="6.8" y="7" width="2.4" height="4" rx=".6"/><rect x="10.8" y="4.5" width="2.4" height="6" rx=".6"/>',
  'Response':    '<path d="M3 4.5h10M3 8h10M3 11.5h10"/><circle cx="6" cy="4.5" r="1.6"/><circle cx="10" cy="8" r="1.6"/><circle cx="5" cy="11.5" r="1.6"/>',
  'Colors':      '<circle cx="6" cy="6" r="3.2"/><circle cx="10" cy="6" r="3.2"/><circle cx="8" cy="10" r="3.2"/>',
  'Guides':      '<rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M6.2 2.5v11M9.8 2.5v11"/>',
  'Logo':        '<path d="M8 2.2 13 5v6l-5 2.8L3 11V5l5-2.8Z"/><rect x="6.4" y="6.4" width="3.2" height="3.2" rx=".6"/>',
  'Text':        '<path d="M3 4V3h10v1M8 3v10M6 13h4"/>',
  'Canvas':      '<path d="M5.5 2v9.5H15M2 4.5h9.5V14"/>',
  'Export':      '<path d="M8 2.5v8M5 7.5l3 3 3-3"/><path d="M2.5 12.5v1h11v-1"/>',
  'Cursor':      '<path d="M4 2.5 12.5 9.2 8.6 9.7 7.4 13.5 4 2.5Z"/>',
  'Setups':      '<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M5 6.2h6M5 8.5h6M5 10.8h4"/>'
};
(function(){
  document.querySelectorAll('.rail .group > h2').forEach(h=>{
    const name = Object.keys(ICONS).find(k => h.textContent.trim().startsWith(k));
    const d = name ? ICONS[name] : null;
    if(!d) return;
    h.insertAdjacentHTML('afterbegin',
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" '
      + 'stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>');
  });
})();

/* ---- accordion: every rail section collapses from its header ---- */
(function(){
  document.querySelectorAll('.rail .group > h2').forEach(h=>{
    const sec = h.parentElement;
    /* The heading stays a heading and an inner wrapper carries the button role,
       so the Marks lock button isn't a button nested inside another button. */
    const head = document.createElement('span');
    head.className = 'ghead';
    [...h.childNodes].forEach(n=>{
      if(n.nodeType === 1 && n.classList.contains('lockBtn')) return;
      head.appendChild(n);
    });
    h.insertBefore(head, h.firstChild);
    head.setAttribute('role','button');
    head.setAttribute('tabindex','0');
    const sync = ()=> head.setAttribute('aria-expanded', String(!sec.classList.contains('collapsed')));
    const toggle = ()=>{ sec.classList.toggle('collapsed'); sync(); };
    sync();
    h.addEventListener('click', e=>{ if(e.target.closest('.lockBtn')) return; toggle(); });
    head.addEventListener('keydown', e=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(); }
    });
  });
})();

/* ---- Marks lock: designer default, locked until the user unlocks ---- */
(function(){
  const MARK_SLIDERS = ['cols','rowScale','len','weight','quant','jitter'];
  const btn = $('marksLock');
  const group = $('marksGroup');
  if(!btn || !group) return;
  function setLocked(locked){
    btn.classList.toggle('unlocked', !locked);
    btn.setAttribute('aria-pressed', String(locked));
    btn.setAttribute('aria-label', locked
      ? 'Marks are locked to the designer default. Click to unlock.'
      : 'Marks are unlocked. Click to lock back to the designer default.');
    btn.setAttribute('data-tip', locked
      ? 'Default setup pattern by the designer. Ask before you change any of these values.'
      : 'Unlocked — you are editing the designer default. Lock again to protect it.');
    group.classList.toggle('locked', locked);
    MARK_SLIDERS.forEach(id=>{ const el=$(id); if(el) el.disabled = locked; const vf=$(id+'_v'); if(vf) vf.disabled = locked; });
  }
  let locked = false;
  setLocked(false);
  btn.addEventListener('click', ()=>{ locked = !locked; setLocked(locked); });
})();

/* ---- Fade lock: designer default solid/fade stops ---- */
(function(){
  const FADE_CONTROLS = ['maskSolid','maskFade','maskToggle'];
  const btn = $('fadeLock');
  const group = $('fadeGroup');
  if(!btn || !group) return;
  function setLocked(locked){
    btn.classList.toggle('unlocked', !locked);
    btn.setAttribute('aria-pressed', String(locked));
    btn.setAttribute('aria-label', locked
      ? 'Fade is locked to the designer default. Click to unlock.'
      : 'Fade is unlocked. Click to lock back to the designer default.');
    btn.setAttribute('data-tip', locked
      ? 'Default fade by the designer. Ask before you change these values.'
      : 'Unlocked — you are editing the designer default. Lock again to protect it.');
    group.classList.toggle('locked', locked);
    FADE_CONTROLS.forEach(id=>{
      const el = $(id); if(!el) return;
      if(el.tagName === 'INPUT') el.disabled = locked;
      const vf = $(id+'_v'); if(vf) vf.disabled = locked;
    });
    const dir = $('maskDir');
    if(dir) dir.querySelectorAll('button').forEach(b=> b.disabled = locked);
  }
  let locked = false;
  setLocked(false);
  btn.addEventListener('click', e=>{ e.stopPropagation(); locked = !locked; setLocked(locked); });
})();

/* ---------- setups ---------- */
const SETUP_KEY = 'newton-shader-setups-v1';
let SETUPS = {};
const setupsAvailable = (()=>{ try{ localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return true; }catch(e){ return false; } })();

function snapshot(){
  return {
    brand:S.brand,
    field:S.field, useImg:S.useImg, invert:S.invert, imgData:S.imgData || null,
    freq:S.freq, amp:S.amp, speed:S.speed, phase:S.phase,
    cols:S.cols, rowScale:S.rowScale, len:S.len, weight:S.weight, jitter:S.jitter, quant:S.quant,
    contrast:S.contrast, bias:S.bias, grain:S.grain,
    colors:[...S.colors], weights:[...(S.weights || [])],
    maskDir:S.maskDir, maskOn:S.maskOn, maskFollow:S.maskFollow, maskSolid:S.maskSolid, maskFade:S.maskFade,
    canvasW:S.canvasW, canvasH:S.canvasH,
    mouseMode:S.mouseMode, mouseRadius:S.mouseRadius, mouseStrength:S.mouseStrength,
    grid:{...S.grid}, logo:{...S.logo}, text:{...S.text}, seed:S.seed, zoom:S.zoom
  };
}
function restore(d){
  const skip = new Set(['grid','logo','text','colors','weights','imgData']);
  Object.keys(d).forEach(k=>{ if(!skip.has(k) && k in S) S[k] = d[k]; });
  S.colors = [...(d.colors || S.colors)];
  S.weights = [...(d.weights || S.weights || [])];
  Object.assign(S.grid, d.grid || {});
  Object.assign(S.logo, d.logo || {});
  Object.assign(S.text, d.text || {});
  S.imgData = d.imgData || null;
  if(d.brand) applyBrand(d.brand, { resetColors:false });

  if(d.imgData){
    const im = new Image();
    im.onload = ()=>{
      imgAspect = im.width/im.height;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      S.useImg = 1;
      $('drop').classList.add('on'); $('dropLabel').textContent = 'Saved image';
      $('fieldNote').style.display = 'block';
    };
    im.src = d.imgData;
  } else {
    S.useImg = 0; $('drop').classList.remove('on');
    $('dropLabel').textContent = 'Drop an image'; $('fieldNote').style.display = 'none';
  }
  syncAll();
}
function pressSeg(id, val){
  const el = $(id); if(!el) return;
  [...el.querySelectorAll('button')].forEach(x=> x.setAttribute('aria-pressed', String(String(x.dataset.v) === String(val))));
}
function syncAll(){
  syncSliders(); renderPalette(); applyMask(); meta();
  pressSeg('field', S.field);
  pressSeg('mouseMode', S.mouseMode);
  pressSeg('gCols_seg', S.grid.cols);
  pressSeg('lType', S.logo.type); pressSeg('lPos', S.logo.pos);
  pressSeg('lSize', S.logo.size); pressSeg('lColor', S.logo.color); pressSeg('lScrim', S.logo.scrim);
  pressSeg('tAlign', S.text.align); pressSeg('tVAlign', S.text.vAlign);
  pressSeg('zoomSeg', S.zoom);
  syncMaskToAlign();
  setSwitch('invert', !!S.invert);
  setSwitch('textOn', S.text.on);
  setSwitch('gShow', S.grid.show);
  setSwitch('maskToggle', S.maskOn);
  initGridLogo(); initText(); renderSetups(); renderLogo(); renderGrid();
}
function loadSetups(){
  if(!setupsAvailable) return;
  try{ SETUPS = JSON.parse(localStorage.getItem(SETUP_KEY) || '{}'); }catch(e){ SETUPS = {}; }
}
function persistSetups(){
  if(!setupsAvailable) return true;
  try{ localStorage.setItem(SETUP_KEY, JSON.stringify(SETUPS)); return true; }
  catch(e){ return false; }
}
function renderSetups(){
  const box = $('setupList'); if(!box) return;
  box.innerHTML = '';
  Object.keys(SETUPS).sort().forEach(name=>{
    const row = document.createElement('div'); row.className='srow';
    const b = document.createElement('button'); b.className='load'; b.textContent = name;
    b.onclick = ()=>{ restore(SETUPS[name]); toast(name + ' loaded'); };
    const x = document.createElement('button'); x.className='rm'; x.textContent='✕'; x.title='Delete';
    x.onclick = ()=>{ delete SETUPS[name]; persistSetups(); renderSetups(); };
    row.append(b, x); box.appendChild(row);
  });
}
if($('setupSave')){
  loadSetups(); renderSetups();
  $('setupSave').onclick = ()=>{
    const name = ($('setupName').value || '').trim();
    if(!name){ $('setupName').focus(); toast('Name it first'); return; }
    SETUPS[name] = snapshot();
    let ok = persistSetups();
    if(!ok){
      const lite = {...SETUPS[name], imgData:null};
      SETUPS[name] = lite; ok = persistSetups();
      toast(ok ? 'Saved without image (too large)' : 'Saved for this session only');
    } else {
      toast(setupsAvailable ? name + ' saved' : 'Saved for this session only');
    }
    $('setupName').value = '';
    renderSetups();
  };
  $('setupExport').onclick = ()=>{
    const name = ($('setupName').value || '').trim() || 'newton-setup';
    const blob = new Blob([JSON.stringify({name, setup:snapshot()}, null, 2)], {type:'application/json'});
    dl(blob, name + '.json');
    toast('Setup exported');
  };
  $('setupImport').onclick = ()=> $('setupFile').click();
  $('setupFile').addEventListener('change', e=>{
    const f = e.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = ()=>{
      try{
        const j = JSON.parse(rd.result);
        const data = j.setup || j;
        const name = j.name || f.name.replace(/\.json$/,'');
        SETUPS[name] = data; persistSetups(); renderSetups(); restore(data);
        toast(name + ' imported');
      }catch(err){ toast('Could not read that file'); }
    };
    rd.readAsText(f);
    e.target.value = '';
  });
}

/* ---------- export ---------- */
/* ---- export helpers ---- */
function dl(blob, name){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function stamp(ext){ return `newton-field-${S.field}-${Math.round(S.seed*100)}.${ext}`; }

// paint the mask gradient (ground color fading out) onto a 2d context
function paintMask(ctx, w, h){
  if(S.maskDir==='none') return;
  const dirs = {'to right':[0,0,w,0], 'to left':[w,0,0,0], 'to top':[0,h,0,0], 'center':[0,0,w,0]};
  const [x0,y0,x1,y1] = dirs[S.maskDir];
  const grad = ctx.createLinearGradient(x0,y0,x1,y1);
  maskStops().forEach(([p,a]) => grad.addColorStop(Math.min(Math.max(p,0),100)/100, hexA(S.colors[0], a)));
  ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
}

/* A drawing buffer the GPU can't back is silently rendered as black (and can
   cost the whole context), so a frame larger than this budget is rendered in
   tiles instead. Dimensions come from the driver; the area cap is empirical —
   8192×8192 fails on hardware that reports 8192 as its max dimension. */
const TILE_AREA_BUDGET = 16 * 1024 * 1024;
function tileLimit(){
  const dims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  return Math.min(dims[0], dims[1], gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
}
/* Tile grid for a w×h frame: as few tiles as possible within both caps. */
function tilePlan(w, h, maxDim = tileLimit(), maxArea = TILE_AREA_BUDGET){
  let tw = Math.min(w, maxDim), th = Math.min(h, maxDim);
  while(tw * th > maxArea){
    if(tw >= th) tw = Math.ceil(tw / 2); else th = Math.ceil(th / 2);
  }
  return { tw: Math.max(1, tw), th: Math.max(1, th),
           cols: Math.ceil(w / tw), rows: Math.ceil(h / th) };
}

/* Paints the shader frame into ctx at full size, tiling when needed. uOrigin
   shifts gl_FragCoord while uRes stays the full frame, so tiles are seamless
   and identical to a single-pass render. */
function paintField(ctx, w, h, plan = tilePlan(w, h)){
  const { tw, th, cols, rows } = plan;
  canvas.width = tw; canvas.height = th;
  for(let r = 0; r < rows; r++){
    for(let c = 0; c < cols; c++){
      const ox = c * tw, oy = r * th;
      const vpW = Math.min(tw, w - ox), vpH = Math.min(th, h - oy);
      // gl_FragCoord is bottom-left origin; flip the row into 2d canvas space
      draw(w, h, ox, h - oy - vpH, vpW, vpH);
      ctx.drawImage(canvas, 0, th - vpH, vpW, vpH, ox, oy, vpW, vpH);
    }
  }
}

// shader frame + mask + text + logo, baked into a fresh 2d canvas at export size
async function composite(w,h){
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  paintField(ctx, w, h);
  paintMask(ctx, w, h);
  drawText(ctx, w, h);
  await drawLogo(ctx, w, h);
  return out;
}

// mask + text + logo only, on a transparent canvas — the static overlay we
// stamp on top of every recorded shader frame
async function buildOverlay(w,h){
  const ov = document.createElement('canvas');
  ov.width = w; ov.height = h;
  const ctx = ov.getContext('2d');
  paintMask(ctx, w, h);
  drawText(ctx, w, h);
  await drawLogo(ctx, w, h);
  return ov;
}

/* Every export takes over the canvas size and the clock, so the live loop has to
   stand down for the duration. Restoring in `finally` matters: an export that
   throws used to leave `exporting` set, freezing the preview until reload. */
async function runExport(label, job){
  if(exporting) return;
  exporting = true;
  const btn = $('exportBtn');
  btn.disabled = true; btn.textContent = label + '…';
  const pw = canvas.width, ph = canvas.height;
  try{
    try{ await document.fonts.ready; }catch(e){}
    await job();
  } catch(err){
    console.error(err);
    toast('Export failed — ' + (err && err.message ? err.message : 'unknown error'));
  } finally {
    canvas.width = pw; canvas.height = ph;
    btn.disabled = false;
    exporting = false;
    setExportLabel();
    last = performance.now();
  }
}

const exportSize = () => [Math.round(S.canvasW), Math.round(S.canvasH)];

/* A lost or over-budget context renders pure black. Sampling a few pixels turns
   that into a visible failure instead of a silently broken download. */
function assertRendered(cv){
  if(contextLost) throw new Error('WebGL context lost');
  const ctx = cv.getContext('2d');
  const pts = [[1,1], [cv.width-1, 1], [cv.width>>1, cv.height>>1], [1, cv.height-1]];
  const blank = pts.every(([x,y])=>{
    const d = ctx.getImageData(Math.max(0,x-1), Math.max(0,y-1), 1, 1).data;
    return d[0]===0 && d[1]===0 && d[2]===0;
  });
  if(blank) throw new Error('renderer produced an empty frame at this size');
}

function exportPNG(){
  return runExport('Rendering', async ()=>{
    const [w,h] = exportSize();
    const out = await composite(w,h);
    assertRendered(out);
    const blob = await new Promise(res=> out.toBlob(res, 'image/png'));
    if(!blob) throw new Error('could not encode PNG at this size');
    dl(blob, stamp('png'));
    toast('PNG exported');
  });
}

function exportWEBP(){
  return runExport('Rendering', async ()=>{
    const [w,h] = exportSize();
    const out = await composite(w,h);
    assertRendered(out);
    const blob = await new Promise(res=> out.toBlob(res, 'image/webp', 0.92));
    if(!blob) throw new Error('could not encode WebP at this size');
    dl(blob, stamp('webp'));
    toast('WebP exported');
  });
}

function exportSVG(){
  return runExport('Rendering', async ()=>{
    const [w,h] = exportSize();
    const out = await composite(w,h);
    assertRendered(out);
    const data = out.toDataURL('image/png');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image width="${w}" height="${h}" href="${data}"/></svg>`;
    dl(new Blob([svg], {type:'image/svg+xml'}), stamp('svg'));
    toast('SVG exported');
  });
}

function pickVideoMime(){
  const cands = [
    'video/mp4;codecs=avc1.640028',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  if(!window.MediaRecorder) return '';
  for(const c of cands){ if(MediaRecorder.isTypeSupported(c)) return c; }
  return '';
}

/* clock position for frame progress p, so a looped clip ends where it began */
function videoClock(startClock, p, rate, durSec, loopOn){
  if(!loopOn) return startClock + p * rate * durSec;
  const tri = p < 0.5 ? p*2 : (1-p)*2;      // ping-pong: 0 → peak → 0
  return startClock + tri * rate * (durSec/2);
}

function exportVideo(){
  const mime = pickVideoMime();
  if(!mime){ toast('Video export not supported here'); return Promise.resolve(); }
  return runExport('Recording', async ()=>{
    const isMp4 = mime.indexOf('video/mp4') === 0;
    const durSec = Math.max(0.5, Math.min(60, parseFloat($('vidDur').value) || 5));
    const loopOn = $('vidLoop').getAttribute('aria-checked') === 'true';
    const [w,h] = exportSize();
    const overlay = await buildOverlay(w,h);

    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const octx = out.getContext('2d');

    const stream = out.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16_000_000 });
    const chunks = [];
    rec.ondataavailable = e => { if(e.data && e.data.size) chunks.push(e.data); };

    const startClock = clock;
    const rate = S.speed * 2.0;             // clock units / sec (matches live loop)
    const total = durSec * 1000;
    const restoreClock = ()=>{ clock = startClock; };

    await new Promise((resolve, reject)=>{
      rec.onerror = e => reject(e.error || new Error('recording failed'));
      rec.onstop = ()=>{
        restoreClock();
        if(!chunks.length){ reject(new Error('recorder produced no data')); return; }
        dl(new Blob(chunks, {type: mime}), stamp(isMp4 ? 'mp4' : 'webm'));
        toast(isMp4 ? 'MP4 exported' : 'WEBM exported (MP4 unsupported here)');
        resolve();
      };
      const t0 = performance.now();
      rec.start();
      (function frame(now){
        try{
          const el = Math.min(now - t0, total);
          clock = videoClock(startClock, el / total, rate, durSec, loopOn);
          paintField(octx, w, h);
          octx.drawImage(overlay, 0, 0);
          if(el < total) requestAnimationFrame(frame);
          else rec.stop();
        } catch(err){
          try{ rec.stop(); }catch(e){}
          restoreClock();
          reject(err);
        }
      })(t0);
    });
  });
}

/* ---- export controls ---- */
let expFmt = 'png';
function setExportLabel(){ $('exportBtn').textContent = 'Export ' + expFmt.toUpperCase(); }
$('expFmt').addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  [...$('expFmt').querySelectorAll('button')].forEach(x=>x.setAttribute('aria-pressed', String(x===b)));
  expFmt = b.dataset.v;
  $('vidOpts').hidden = expFmt !== 'mp4';
  if(!exporting) setExportLabel();
});
$('vidLoop').onclick = ()=>{
  const on = $('vidLoop').getAttribute('aria-checked') !== 'true';
  setSwitch('vidLoop', on);
};
$('exportBtn').onclick = ()=>{
  if(expFmt==='png') exportPNG();
  else if(expFmt==='webp') exportWEBP();
  else if(expFmt==='svg') exportSVG();
  else exportVideo();
};

/* ---------- test surface ----------
   The pure helpers plus the few hooks a headless run needs to pin the clock and
   inspect state. Nothing in the UI reads this. */
window.__NF = {
  S,
  setClock(v){ clock = v; },
  getClock: ()=> clock,
  isExporting: ()=> exporting,
  isContextLost: ()=> contextLost,
  limits: ()=> ({ tileDim: tileLimit(), tileArea: TILE_AREA_BUDGET, dimMin: DIM_MIN, dimMax: DIM_MAX, areaMax: AREA_MAX }),
  fitFrameWidth, previewDpr, setZoom, setCanvasSize, setFormatLayout, layoutStats, tilePlan, clampDim, axisMax, maskStops, maskGradient,
  toShares, setWeight, normaliseWeights, colorName, applyBrand, snapshot, restore, BRANDS,
  contrastRatio, aaBadge, stepPct, roleSize, tokenize, spanPx, colWidthPx, videoClock,
  BASELINE, TOKENS, FORMATS, FORMAT_LAYOUT, formatBySize, isLockedBaseline, ratioScale, refPx, tokenPx, tokenCss, typePx, logoHeightPx, logoAR, measureCols,
  markupToHtml, htmlToMarkup, setTextField, readTextField,
  composite, paintField, activeBlocks,
  render(){ sizeCanvas(); draw(canvas.width, canvas.height); }
};
Object.defineProperties(window.__NF, {
  SCALE_WIDE:        { enumerable:true, get(){ return FORMAT_LAYOUT['2:1'].scale; } },
  SCALE_WIDESCREEN:  { enumerable:true, get(){ return FORMAT_LAYOUT['16:9'].scale; } },
  SCALE_CLASSIC:     { enumerable:true, get(){ return FORMAT_LAYOUT['4:3'].scale; } },
  SCALE_SQUARE:      { enumerable:true, get(){ return FORMAT_LAYOUT['1:1'].scale; } },
  SCALE_TALL:        { enumerable:true, get(){ return FORMAT_LAYOUT['9:16'].scale; } }
});

