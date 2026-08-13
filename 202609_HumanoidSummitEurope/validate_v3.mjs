import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const files = ['index_v3.html', 'index_v3_offline.html', 'family_print.html'];
const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkBalanced(html, name) {
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  const stack = [];
  for (const match of clean.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
    const tag = match[1].toLowerCase();
    const token = match[0];
    if (voidTags.has(tag) || token.endsWith('/>')) continue;
    if (!token.startsWith('</')) stack.push({ tag, index:match.index });
    else {
      const open = stack.pop();
      assert(open && open.tag === tag, `${name}: tag mismatch at ${match.index}: expected ${open?.tag}, got ${tag}`);
    }
  }
  assert(stack.length === 0, `${name}: unclosed tags: ${stack.slice(-5).map(x => x.tag).join(', ')}`);
}

for (const name of files) {
  const html = fs.readFileSync(path.join(here, name), 'utf8');
  checkBalanced(html, name);
  const executableHtml = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const script of executableHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    new Function(script[1]);
  }
  assert(!/https?:\/\/[^"']+\.(?:js|css)(?:[?"'])/i.test(html), `${name}: external runtime dependency found`);
  console.log(`${name}: structure and script syntax OK`);
}

const online = fs.readFileSync(path.join(here, 'index_v3.html'), 'utf8');
const sharedCss = fs.readFileSync(path.join(here, 'v3.css'), 'utf8');
assert((online.match(/data-tab="(?:plan|venue|rec)"/g) || []).length === 3, 'index_v3.html: primary navigation is not exactly three sections');
assert((online.match(/<details class="day" open/g) || []).length === 8, 'index_v3.html: all eight days must start open');
assert(!online.includes('data-tab="prep"') && !online.includes('data-tab="fam"'), 'index_v3.html: secondary content leaked into primary navigation');
assert(online.includes('id="btn-export-json"') && online.includes('id="import-json"'), 'index_v3.html: JSON transfer controls missing');
assert(online.includes("plan-confirmed:"), 'index_v3.html: plan confirmation state missing');
assert((online.match(/<th>事前の狙い・質問<\/th><th>当日メモ<\/th>/g) || []).length === 3, 'index_v3.html: session preparation/day-note columns missing');
assert(online.includes("key:'day', rows:3") && online.includes("store.get('ses:' + tr.dataset.k + ':day'"), 'index_v3.html: per-session day-note persistence missing');
assert(!online.includes('const OWNERS') && !online.includes('担当ボタン'), 'index_v3.html: obsolete assignment controls remain');
assert(online.includes('data-trip-layout="field-v1"') && online.includes('<script src="../shared/trip-field/runtime.js"></script>'), 'index_v3.html: shared trip-field runtime missing');
assert(online.includes('window.TripField.createStore(EVENT_KEY)'), 'index_v3.html: shared storage API not used');
assert(online.includes('<link rel="stylesheet" href="v3.css">') && !online.includes('<style>'), 'index_v3.html: shared stylesheet link missing or CSS still embedded');
assert(sharedCss.includes('--bg:#EDF2F3') && sharedCss.includes('.field-nav{position:sticky'), 'v3.css: v3 field styles missing');
assert(sharedCss.includes('.family-page #fam-table tr') && sharedCss.includes("content:'場所'"), 'v3.css: family mobile-card styles missing');
assert(!/@import\s+url|https?:\/\//i.test(sharedCss), 'v3.css: remote dependency found');

const offline = fs.readFileSync(path.join(here, 'index_v3_offline.html'), 'utf8');
assert(offline.includes('DESK PRINT') && offline.includes('机上用印刷版'), 'index_v3_offline.html: desk-print identity missing');
assert(offline.includes('<style>') && !offline.includes('href="v3.css"'), 'index_v3_offline.html: CSS must remain embedded');
const offlineMarkup = offline.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
assert(!/<script\b/i.test(offlineMarkup), 'index_v3_offline.html: desk-print copy must have no runtime scripts');
assert(offline.includes('data-trip-layout="desk-print-v1"') && offline.includes('body.desk-copy #tab-rec'), 'index_v3_offline.html: desk-print layout rules missing');

const family = fs.readFileSync(path.join(here, 'family_print.html'), 'utf8');
assert((family.match(/<tbody id="fam-days">[\s\S]*?<\/tbody>/) || [''])[0].match(/<tr>/g)?.length === 8, 'family_print.html: family itinerary must have eight rows');
assert(!family.includes('id="fam-clock"'), 'family_print.html: live clock should not be in print-only document');
assert(family.includes('<link rel="stylesheet" href="v3.css">') && !family.includes('<style>'), 'family_print.html: shared stylesheet link missing or CSS still embedded');
assert(family.includes('data-trip-layout="family-v1"'), 'family_print.html: shared family layout marker missing');

console.log('v3 acceptance checks: OK');
