/* Assembles the shipped index.html from src/.

   The Field Generator is a single self-contained HTML file so anyone can open
   it in a browser with no install. Developers edit the files under src/ —
   page markup, app code, the woff2 faces, and the logo SVGs — then run this
   script to bake fonts and artwork back into index.html.

     node tools/build.js           # write index.html
     node tools/build.js --check   # fail if the committed file is stale
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'index.html');

const FONT_FAMILY = 'Suisse BP Intl';

const read = (rel, enc) => fs.readFileSync(path.join(SRC, rel), enc);
const readJSON = rel => JSON.parse(read(rel, 'utf8'));

function fontFaceCss(face) {
  const bytes = fs.readFileSync(path.join(SRC, 'fonts', face.file));
  const b64 = bytes.toString('base64');
  return (
    `@font-face{font-family:'${FONT_FAMILY}';font-style:${face.style};` +
    `font-weight:${face.weight};font-display:swap;` +
    `src:url(data:font/woff2;base64,${b64}) format('woff2')}`
  );
}

function fontFacesStmt() {
  const faces = readJSON('fonts.json');
  const entries = faces.map(face =>
    `${JSON.stringify(face.key)}: ${JSON.stringify(fontFaceCss(face))}`
  );
  return `const FONT_FACES = {${entries.join(', ')}};`;
}

function logoStmt() {
  const meta = readJSON('logo.json');
  const lines = Object.keys(meta).map(name => {
    const row = meta[name];
    const svg = fs.readFileSync(path.join(SRC, 'logo', row.file), 'utf8').replace(/\n+$/, '');
    return `  ${name}:{ svg:${JSON.stringify(svg)}, ar:${row.ar} }`;
  });
  return 'const LOGO = {\n' + lines.join(',\n') + '\n};';
}

function assemble() {
  const page = read('page.html', 'utf8');
  const app = read('app.js', 'utf8');
  const boot = read('boot.js', 'utf8');
  const inject = [
    '// inject brand faces once (kept in JS so exports can subset to used weights)',
    '(function(){ const st=document.createElement(\'style\');',
    '  st.textContent = Object.values(FONT_FACES).join(\'\\n\');',
    '  document.head.appendChild(st); })();',
  ].join('\n');
  return (
    page +
    '<script>\n' +
    app +
    '/* ---------- embedded assets ---------- */\n' +
    '/* Generated font files and logo artwork. Do not edit by hand. */\n' +
    fontFacesStmt() + '\n\n' +
    inject + '\n\n' +
    '/* Logo mark and lockup SVG. */\n' +
    logoStmt() + '\n\n' +
    boot +
    '</script>\n</body>\n</html>\n'
  );
}

function main() {
  const built = assemble();
  const check = process.argv.includes('--check');
  if (check) {
    const committed = fs.readFileSync(OUT, 'utf8');
    if (committed === built) return;
    console.error(
      'index.html does not match `npm run build`.\n' +
      'Edit files under src/ and run `npm run build`, then commit both the source and the assembled file.'
    );
    process.exit(1);
  }
  fs.writeFileSync(OUT, built);
}

main();
