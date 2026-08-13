import fs from 'node:fs';
import path from 'node:path';

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Usage: node build-desk-print.mjs <online.html> <desk-print.html>');
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
if (inputPath === outputPath) throw new Error('Input and output must be different files');
if (!fs.existsSync(inputPath)) throw new Error(`Input not found: ${inputPath}`);

const inputDir = path.dirname(inputPath);
let html = fs.readFileSync(inputPath, 'utf8');

function localAsset(reference, kind) {
  if (/^(?:https?:)?\/\//i.test(reference)) throw new Error(`Remote ${kind} is not allowed in a desk-print copy: ${reference}`);
  if (/^(?:data:|#)/i.test(reference)) return null;
  const clean = reference.split(/[?#]/, 1)[0];
  const assetPath = path.resolve(inputDir, clean);
  if (!fs.existsSync(assetPath)) throw new Error(`${kind} not found: ${assetPath}`);
  return assetPath;
}

function inlineStylesheet(tag, href) {
  const assetPath = localAsset(href, 'stylesheet');
  if (!assetPath) return tag;
  const css = fs.readFileSync(assetPath, 'utf8').replace(/<\/style/gi, '<\\/style');
  return `<style>\n/* inlined from ${path.basename(assetPath)} */\n${css}\n</style>`;
}

html = html.replace(/<link\b([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, (tag, a, b, href) => inlineStylesheet(tag, href));
html = html.replace(/<link\b([^>]*?)href=["']([^"']+)["']([^>]*?)rel=["']stylesheet["']([^>]*)>/gi, (tag, a, href) => inlineStylesheet(tag, href));

/* A desk copy is intentionally static. Saved browser notes remain in the online page. */
html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

const deskCss = `
<style>
body.trip-desk-copy .trip-field-nav,
body.trip-desk-copy [data-trip-panel="records"],
body.trip-desk-copy .trip-actions,
body.trip-desk-copy .trip-no-print { display:none!important; }
body.trip-desk-copy [data-trip-panel="itinerary"],
body.trip-desk-copy [data-trip-panel="venue"] { display:block!important; }
body.trip-desk-copy .trip-panel + .trip-panel { margin-top:18px; }
body.trip-desk-copy .trip-field textarea,
body.trip-desk-copy .trip-field input,
body.trip-desk-copy .trip-field select { display:none!important; }
body.trip-desk-copy .trip-field:has(textarea),
body.trip-desk-copy .trip-field:has(input),
body.trip-desk-copy .trip-field:has(select) { display:none!important; }
@media print {
  body.trip-desk-copy .trip-header { border-bottom:1px solid #555; }
  body.trip-desk-copy .trip-main { padding-top:8px; }
}
</style>`;

html = html.replace('</head>', `${deskCss}\n</head>`);
html = html.replace(/<title>(.*?)<\/title>/i, '<title>$1（机上用印刷版）</title>');
html = html.replace(/<body\b([^>]*)>/i, (tag, attrs) => {
  const withClass = /class=["']([^"']*)["']/.test(attrs)
    ? attrs.replace(/class=["']([^"']*)["']/, (m, classes) => `class="${classes} trip-desk-copy"`)
    : `${attrs} class="trip-desk-copy"`;
  return `<body${withClass} data-trip-copy="desk-print">`;
});
html = html.replace(/(<main\b[^>]*>)/i, '$1\n<div class="trip-banner" data-kind="warning"><span>🖨</span><div><strong>机上用印刷版です。</strong>スマートフォンではオンライン版を使用してください。メモ入力欄はこの紙には含めていません。</div></div>');

if (/<script\b/i.test(html) || /<link\b[^>]*rel=["']stylesheet["']/i.test(html)) {
  throw new Error('Interactive or external runtime assets remain in desk-print copy');
}

fs.mkdirSync(path.dirname(outputPath), { recursive:true });
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`${outputPath}: ${Buffer.byteLength(html)} bytes`);
