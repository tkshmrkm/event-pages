// 千歳出張ページの受入検査。必ず build.mjs を回してから実行する。
//   node .\202611_Chitose\build.mjs
//   node .\202611_Chitose\validate.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = name => fs.readFileSync(path.join(here, name), 'utf8');
function assert(value, message){ if (!value) throw new Error(message); }

const online = read('index.html');
const desk = read('desk_print.html');
const css = read('style.css');

// 生成物が build.mjs より古ければ、直したことの確認にならない
const built = fs.statSync(path.join(here, 'index.html')).mtimeMs;
assert(built >= fs.statSync(path.join(here, 'build.mjs')).mtimeMs, 'index.html is older than build.mjs: run build.mjs first');

// ---- 絵文字は1文字も置かない（列挙ではなくExtended_Pictographicで見る。CSSも生成物） ----
for (const [name, text] of [['index.html', online], ['desk_print.html', desk], ['style.css', css]]) {
  const found = [...new Set(text.match(/\p{Extended_Pictographic}/gu) || [])];
  assert(found.length === 0, `${name}: emoji found ${found.map(c => `U+${c.codePointAt(0).toString(16).toUpperCase()}`).join(' ')}`);
}

// ---- タブ：2文字まで、現地で開くものが先、既定は旅程、パネルのDOM順はタブと同じ ----
const tabs = [...online.matchAll(/<button class="trip-tab[^"]*"[^>]*data-trip-tab="([^"]+)"[^>]*>([^<]+)<\/button>/g)].map(m => [m[1], m[2]]);
assert(JSON.stringify(tabs.map(t => t[0])) === JSON.stringify(['overview', 'itinerary', 'venue', 'food', 'prep', 'records']), `unexpected tab order: ${tabs.map(t => t[0])}`);
for (const [id, label] of tabs) assert([...label].length <= 2, `tab label longer than two characters: ${label} (${id})`);
const panels = [...online.matchAll(/data-trip-panel="([^"]+)"/g)].map(m => m[1]);
assert(JSON.stringify(panels) === JSON.stringify(tabs.map(t => t[0])), `panel DOM order differs from tabs: ${panels}`);
const defaults = [...online.matchAll(/data-trip-tab="([^"]+)"[^>]*data-trip-default/g)].map(m => m[1]);
assert(defaults.length === 1 && defaults[0] === 'itinerary', `default tab must be itinerary, found ${defaults}`);
assert(/data-trip-panel="itinerary"/.test(online.match(/<section class="trip-panel is-active"[^>]*>/)[0]), 'static active panel must be itinerary');

// ---- パネルを切り出す ----
function panel(html, id){
  const start = html.indexOf(`data-trip-panel="${id}"`);
  assert(start >= 0, `panel ${id} missing`);
  const end = html.indexOf('</section>\n', start);
  // パネルの中にflight-cardの<section>があるので、次のパネルの開始までを取る
  const next = html.indexOf('<section class="trip-panel', start + 10);
  return html.slice(start, next < 0 ? html.indexOf('</main>', start) : next);
}
const P = Object.fromEntries(tabs.map(([id]) => [id, panel(online, id)]));

// ---- 畳む準備タブに、現地で要るものを置かない。在り処と無い場所を対で見る ----
const groundOnly = [
  ['flight card', /class="flight-card"/g, 2],
  ['Chitose hotel address', /幸町4丁目20番地1号/g, 1],
  ['Chitose hotel phone link', /href="tel:0123296050"/g, 1],
  ['hotel comparison', /比較した千歳のホテル/g, 1],
];
for (const [label, re, count] of groundOnly) {
  assert((P.itinerary.match(re) || []).length === count, `itinerary must hold ${count} × ${label}`);
  assert(!re.test(P.prep), `prep must not hold ${label}`);
  re.lastIndex = 0;
}

// ---- 予定の状態は共通の5語だけ。札の語とクラスが対応すること ----
const STATE = { '未検討':'unconsidered', '候補あり':'candidate', '仮決め':'tentative', '確定':'fixed', '当日判断':'onsite' };
const chips = [...online.matchAll(/<span class="plan-state plan-state-([a-z]+)">([^<]+)<\/span>/g)];
assert(chips.length > 0, 'no plan-state chips');
for (const [, cls, label] of chips) assert(STATE[label] === cls, `plan-state mismatch: ${label} / ${cls}`);
assert(!/plan-state/.test(P.overview), 'overview must not carry plan-state chips (their owner is itinerary / venue)');

// ---- 視察の記録単位は「事前の狙い・質問」と「当日メモ」の2欄 ----
const units = [...P.venue.matchAll(/data-trip-store="venue:([^:"]+):prep"/g)].map(m => m[1]);
assert(units.length >= 10, `expected session/visit records, found ${units.length}`);
for (const unit of units) assert(P.venue.includes(`data-trip-store="venue:${unit}:day" data-trip-note="day" data-trip-append-timestamp`), `${unit}: shared day note missing`);
const keys = [...online.matchAll(/data-trip-store="([^"]+)"/g)].map(m => m[1]);
assert(new Set(keys).size === keys.length, 'duplicate data-trip-store keys');

// ---- この出張の名前空間はほかと重ならない ----
const tripKey = online.match(/data-trip-key="([^"]+)"/)[1];
const root = path.resolve(here, '..');
for (const dir of fs.readdirSync(root, { withFileTypes:true })) {
  if (!dir.isDirectory() || dir.name === path.basename(here) || dir.name.startsWith('.')) continue;
  const idx = path.join(root, dir.name, 'index.html');
  if (fs.existsSync(idx)) assert(!fs.readFileSync(idx, 'utf8').includes(`data-trip-key="${tripKey}"`), `trip key ${tripKey} reused in ${dir.name}`);
}

// ---- 同期キーを埋め込まない ----
assert(!/data-trip-cloud-key[^>]*\svalue=/.test(online), 'sync key input must not carry a value');
assert(online.includes('data-endpoint="https://trip-field-sync.mrkn55.workers.dev"'), 'cloud endpoint missing');

// ---- 常時表示行の末尾に句点を付けない（折り畳みの中は対象外） ----
const visible = online.replace(/<details class="fold">[\s\S]*?<\/details>/g, '');
for (const re of [/<span class="trip-detail">([^]*?)<\/span>(?=<\/div>|<\/label>)/g, /<div class="trip-banner"[^>]*>[\s\S]*?<div>([^<]*)<\/div><\/div>/g, /<span class="state-note">([^<]*)<\/span>/g]) {
  for (const m of visible.matchAll(re)) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    assert(!text.endsWith('。'), `always-visible line ends with a full stop: ${text}`);
  }
}

// ---- 1つの対象の呼び名は1つ（hrefを除いた本文で数える） ----
const body = online.replace(/\shref="[^"]*"/g, '');
for (const banned of ['セントレア', '新千歳空港 国内線', 'CTS', 'HND']) assert(!body.includes(banned), `use one name per place; found ${banned}`);

// ---- 元の計画から移した事実（削っていないこと） ----
const facts = [
  'JAL529', 'JAL590', 'JAL500（7:45発）', 'JAL502（8:50発）', '43,595円', '13,740円', '14,140円', '709円', '426円', '1,500円',
  '0123-29-6050', 'のぞみ416号', 'のぞみ462号', 'のぞみ81号', 'のぞみ400号', 'のぞみ434号', 'のぞみ476号', 'のぞみ204号', 'のぞみ267号', 'のぞみ463号', 'のぞみ289号',
  '1I1', '1G2', '1D3', '2J1', '2G2', '2F3', '1G1', '1I2', '1E3', '1I3', '2G1', '2J2', '2D3', '矢野 雄一郎', '中村 文一', '中井 直正',
  'JR東日本ホテルメッツ 大森', 'ホテルメトロポリタン 大井町トラックス', 'JR東日本ホテルメッツ 横浜鶴見', '千歳ステーションホテル', 'ホテルルートイン千歳駅前', 'JRイン千歳', 'エアターミナルホテル', '溝の口',
  '草間さん', 'クリーンルーム', 'プレハブ事務所', '8:00のバスの乗り場',
  '有楽庵', '茶月', 'ロイヤルホスト尾山台店', 'ほっともっと', 'そば処そら', '石臼挽き蕎麦 あずみ野', '信州そば あずみ野', '羽田寿司幸', '寿司田', '銀座おのでら', '銀座ライオン',
  'ジンギスカン', 'とろろ昆布うどん', '主治医', '10/24の検査結果', '和らぎ水', '5:45ごろ起きる',
  'ヒューマノイドロボット EXPO', 'フィジカルAI EXPO', '11,000円', 'VIP登録', 'OSRM', '保安検査は出発20分前',
  '12,000円', '19,000円', '23,000円', '28,000円', '5,000円', '6,000円', 'キャンセル不可',
];
const text = online.replace(/<[^>]+>/g, '');
for (const fact of facts) assert(text.includes(fact), `fact from the original plan is missing: ${fact}`);

// ---- 机上用印刷版は1ファイルで完結し、スクリプトを持たない ----
assert(!/<script\b/i.test(desk), 'desk_print.html: scripts must not remain');
assert(!/<link\b[^>]*rel=["']stylesheet["']/i.test(desk), 'desk_print.html: external stylesheet remains');
assert(desk.includes('data-trip-copy="desk-print"'), 'desk_print.html: print identity missing');
// マークアップと、それを表示する規則は対で見る
for (const rule of ['.line-icon{', '.mode-icon{', '.flight-mark{', '.plan-state{', '.cf-table{', 'details.fold']) assert(desk.includes(rule), `desk_print.html: rule ${rule} not inlined`);
assert(desk.includes('body.trip-desk-copy [data-trip-panel="records"]'), 'desk_print.html: record panel must be hidden');
assert(!/<details\b(?![^>]*\sopen\b)/.test(desk), 'desk_print.html: every fold must print open');
for (const id of ['overview', 'itinerary', 'venue', 'food', 'prep']) assert(desk.includes(`data-trip-panel="${id}"`), `desk_print.html: panel ${id} missing`);

// ---- 配るファイルは、リンクの先が在ることと、gitに無視されていないことを対で見る ----
const shipped = new Set(['index.html', 'desk_print.html', 'style.css', 'build.mjs', 'validate.mjs']);
for (const m of online.matchAll(/(?:href|src)="([^"#:]+)"/g)) {
  const target = path.resolve(here, m[1]);
  assert(fs.existsSync(target), `link target missing: ${m[1]}`);
  shipped.add(path.relative(here, target));
}
try {
  const ignored = execFileSync('git', ['check-ignore', ...[...shipped].map(name => path.join(here, name))], { encoding:'utf8' }).trim();
  assert(!ignored, `these shipped files are ignored by git, so they never reach GitHub Pages:\n${ignored}`);
} catch (error) {
  // check-ignore は「1件も無視していない」ときに終了コード1で返る。それが正常。
  if (error.status !== 1) throw error;
}

console.log(`202611_Chitose: acceptance checks OK (${tabs.length} tabs, ${chips.length} plan states, ${units.length} records, ${facts.length} facts)`);
