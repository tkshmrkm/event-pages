import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const files = ['index.html', 'index_v3.html', 'index_v3_offline.html', 'family_print.html'];
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

const onlineName = 'index.html';
const online = fs.readFileSync(path.join(here, onlineName), 'utf8');
const sharedCss = fs.readFileSync(path.join(here, 'v3.css'), 'utf8');
assert((online.match(/data-tab="(?:plan|venue|rec)"/g) || []).length === 3, `${onlineName}: primary navigation is not exactly three sections`);
assert((online.match(/<details class="day" open/g) || []).length === 8, `${onlineName}: all eight days must start open`);
assert(!online.includes('data-tab="prep"') && !online.includes('data-tab="fam"'), `${onlineName}: secondary content leaked into primary navigation`);
assert(online.includes('id="btn-export-json"') && online.includes('id="import-json"'), `${onlineName}: JSON transfer controls missing`);
assert(online.includes('id="btn-download-md"') && online.includes('buildRecordMarkdown()') && online.includes('text/markdown;charset=utf-8'), `${onlineName}: final Markdown download missing`);
assert(online.includes("plan-confirmed:"), `${onlineName}: plan confirmation state missing`);
assert((online.match(/<th>事前の狙い・質問<\/th><th>当日メモ<\/th>/g) || []).length === 3, `${onlineName}: session preparation/day-note columns missing`);
assert(online.includes("key:'day', rows:3") && online.includes("store.get('ses:' + tr.dataset.k + ':day'"), `${onlineName}: per-session day-note persistence missing`);
assert(!online.includes('const OWNERS') && !online.includes('担当ボタン'), `${onlineName}: obsolete assignment controls remain`);
assert(online.includes('data-trip-layout="field-v1"') && online.includes('<script src="../shared/trip-field/runtime.js"></script>'), `${onlineName}: shared trip-field runtime missing`);
assert(online.includes('window.TripField.createStore(EVENT_KEY)'), `${onlineName}: shared storage API not used`);
assert(online.includes('data-trip-cloud') && online.includes('TripField.createCloudSync'), `${onlineName}: Cloudflare sync UI/runtime missing`);
assert((online.match(/cloud\.mountAppend\(/g) || []).length >= 2 && online.includes("dataset.rec.endsWith(':day')"), `${onlineName}: shared append controls missing`);
assert(online.includes('data-trip-cloud-author'), `${onlineName}: shared note author field missing`);
assert(online.includes('共同メモは1件ずつ追加保存') && online.includes('同時に送っても上書きしません'), `${onlineName}: multi-device append guidance missing`);
assert(online.includes("cloud.entriesFor('rec:'") && online.includes("cloud.entriesFor('ses:'") && online.includes('**共同メモ**'), `${onlineName}: shared entries missing from Markdown export`);
assert(!/const\s+(?:API_KEY|SYNC_TOKEN)\s*=\s*["'][^"']+["']/.test(online), `${onlineName}: synchronization secret must not be embedded`);
assert(online.includes('<link rel="stylesheet" href="v3.css">') && !online.includes('<style>'), `${onlineName}: shared stylesheet link missing or CSS still embedded`);
assert(sharedCss.includes('--bg:#EDF2F3') && sharedCss.includes('.field-nav{position:sticky'), 'v3.css: v3 field styles missing');
assert(sharedCss.includes('.family-page #fam-table tr') && sharedCss.includes("content:'場所'"), 'v3.css: family mobile-card styles missing');
// data:URIは自己完結しているので外部依存ではない。中のSVGが名前空間として
// http://www.w3.org/2000/svg を宣言するため、素の正規表現だと誤検知する。
// data:URIだけを取り除いてから、本当のネットワーク取得が無いかを見る。
const cssWithoutDataUris = sharedCss.replace(/url\(\s*(["']?)data:[\s\S]*?\1\s*\)/gi, 'url(data:)');
assert(!/@import\s+url|https?:\/\//i.test(cssWithoutDataUris), 'v3.css: remote dependency found');

// ---------- 交通手段アイコン（EUROBLECH方式） ----------
// 内訳: 旅程行のフライト8 ＋ 合流バー1 ＋ フライトカード見出し1 ＋ 凡例1 ＝ 11。
// オンライン版はFAMデータ（帰国日）の分がスクリプト内にあるので+1で12。
// 机上用印刷版はスクリプトを持たないため11。鉄道は旅程35＋凡例1＋準備タブ1＝37、タクシー1＋凡例1＝2。
const ONLINE_FLIGHT_ICONS = 12;
const OFFLINE_FLIGHT_ICONS = 11;
const countIn = (text, pattern) => (text.match(pattern) || []).length;
assert(sharedCss.includes('.flight-mark{') && sharedCss.includes('-webkit-mask:url("data:image/svg+xml'), 'v3.css: shared flight-mark icon missing');
assert(sharedCss.includes('.mode-icon{') && sharedCss.includes('.mode-icon-unknown{'), 'v3.css: shared mode-icon styles missing');
assert(!sharedCss.includes('.trip-flight'), 'v3.css: retired .trip-flight rule still present');
const offlineHtml = fs.readFileSync(path.join(here, 'index_v3_offline.html'), 'utf8');
const familyHtml = fs.readFileSync(path.join(here, 'family_print.html'), 'utf8');
for (const [name, text, flights] of [[onlineName, online, ONLINE_FLIGHT_ICONS], ['index_v3_offline.html', offlineHtml, OFFLINE_FLIGHT_ICONS]]) {
  assert(countIn(text, /class="flight-mark"/g) === flights, `${name}: expected ${flights} flight-mark icons`);
  assert(countIn(text, /class="mode-icon mode-icon-train"/g) === 37, `${name}: expected 37 train icons`);
  assert(countIn(text, /class="mode-icon mode-icon-car"/g) === 2, `${name}: expected 2 car icons`);
  // 交通手段としての絵文字も、廃止したモノクロ✈︎も0件でなければならない。
  assert(!/✈/.test(text), `${name}: flight glyph must use .flight-mark, not a text or emoji ✈`);
  assert(!/[\u{1F686}\u{1F695}]/u.test(text), `${name}: train/taxi emoji must use .mode-icon`);
  assert(!text.includes('class="et t-fly"') && !text.includes('class="et t-move"') && !text.includes('class="et t-taxi"'), `${name}: retired transport emoji spans still present`);
}
assert(!/✈/.test(familyHtml), 'family_print.html: flight glyph must use .flight-mark');

// ---------- 地図リンクは場所名そのものへ ----------
for (const [name, text] of [[onlineName, online], ['family_print.html', familyHtml]]) {
  assert(!text.includes('>地図</a>') && !text.includes('>（地図）</a>'), `${name}: map links must wrap the place name, not a separate 地図 link`);
}
assert(countIn(online, /<a class="place"/g) >= 20, `${onlineName}: place map links missing`);

// ---------- 日付カードの一括開閉 ----------
assert(online.includes('id="days-tg"') && online.includes('class="day-toolbar no-print"'), `${onlineName}: day card collapse/expand control missing`);
assert(online.includes('syncDaysToggle') && online.includes("addEventListener('toggle', syncDaysToggle)"), `${onlineName}: collapse label must follow individual day toggles`);
// 「＋詳細」トグルは廃止。ボタンも処理も残さず、補足は常に見える状態にする。
for (const [name, text] of [[onlineName, online], ['index_v3_offline.html', offlineHtml]]) {
  assert(!text.includes('id="detail-tg"') && !text.includes('applyDetail'), `${name}: retired detail toggle still present`);
}
assert(online.includes("store.del('detail')"), `${onlineName}: stored detail flag must be cleared, or it rides along in the backup JSON`);
assert(/\.note,\.dt\{display:block\}/.test(sharedCss), 'v3.css: notes must stay visible without the detail toggle');

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

const redirect = fs.readFileSync(path.join(here, 'index_v3.html'), 'utf8');
assert(redirect.includes('http-equiv="refresh"') && redirect.includes('url=./'), 'index_v3.html: legacy URL redirect missing');
assert(redirect.includes("location.replace('./' + location.search + location.hash)"), 'index_v3.html: query/hash preserving redirect missing');

console.log('v3 acceptance checks: OK');
