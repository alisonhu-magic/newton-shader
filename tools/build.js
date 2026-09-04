/* Assembles the shipped index.html from src/.

   The Field Generator is a single self-contained HTML file so anyone can open
   it in a browser with no install. Developers edit the files under src/ —
   page markup and app code — then run this script to write index.html.

     node tools/build.js           # write index.html
     node tools/build.js --check   # fail if the committed file is stale
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'index.html');

const read = (rel, enc) => fs.readFileSync(path.join(SRC, rel), enc);

function assemble() {
  const page = read('page.html', 'utf8');
  const app = read('app.js', 'utf8');
  const boot = read('boot.js', 'utf8');
  return (
    page +
    '<script>\n' +
    app +
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
