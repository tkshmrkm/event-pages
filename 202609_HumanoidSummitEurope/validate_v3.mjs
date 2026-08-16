import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const files = ['index.html', 'index_v3.html', 'index_v3_offline.html', 'family_print.html', 'immigration_print.html'];
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
assert((online.match(/data-tab="(?:overview|plan|venue|rec)"/g) || []).length === 4, `${onlineName}: primary navigation is not exactly four sections`);
// 概要タブ（2026-08-16）。索引であって内容ではないので、4ブロックが揃っていること、
// 日程概要が8日ぶんあること、既定タブが旅程のままであることを見る。
assert(online.includes('<section class="tab" id="tab-overview"') && online.includes('data-tab="overview"'), `${onlineName}: overview tab missing`);
['出張概要', '日程概要', 'イベント概要', '施設概要'].forEach(block => {
  assert(online.includes(`</span>${block}</h2>`), `${onlineName}: overview block missing: ${block}`);
});
assert((online.match(/<td class="ov-date">/g) || []).length === 8, `${onlineName}: overview itinerary must carry all eight days`);
assert(online.includes('<section class="tab on" id="tab-plan"') && !online.includes('<section class="tab on" id="tab-overview"'), `${onlineName}: itinerary must stay the default tab`);
assert(online.includes("['overview','plan','venue','rec','prep'].includes(store.get('tab','plan'))"), `${onlineName}: overview missing from the restored-tab whitelist`);
// 概要は詳細を持たない。各ブロックから詳細タブへ戻れること。
['data-goto="plan"', 'data-goto="venue"', 'data-goto="prep"'].forEach(link => {
  assert(online.includes(link), `${onlineName}: overview cross-link missing: ${link}`);
});
assert(sharedCss.includes('.ov-days{') && sharedCss.includes('.ov-facility{'), 'v3.css: overview styles missing');
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
// #fam-table（旧「毎日どこで何をしているか」の表）は家族印刷版から削除済みなので、
// その専用CSSも持たない。家族向けの様式は.family-section／.family-day-rowが持つ。
assert(!sharedCss.includes('#fam-table'), 'v3.css: dead #fam-table rules must be removed with the table itself');
assert(sharedCss.includes('.family-section-head{') && sharedCss.includes('.family-day-row{'), 'v3.css: family layout styles missing');
// data:URIは自己完結しているので外部依存ではない。中のSVGが名前空間として
// http://www.w3.org/2000/svg を宣言するため、素の正規表現だと誤検知する。
// data:URIだけを取り除いてから、本当のネットワーク取得が無いかを見る。
const cssWithoutDataUris = sharedCss.replace(/url\(\s*(["']?)data:[\s\S]*?\1\s*\)/gi, 'url(data:)');
assert(!/@import\s+url|https?:\/\//i.test(cssWithoutDataUris), 'v3.css: remote dependency found');

// ---------- 交通手段アイコン（EUROBLECH方式） ----------
// 内訳: 旅程行のフライト8 ＋ 合流バー1 ＋ 利用フライト見出し1 ＋ 凡例1 ＝ 11。
// 2026-08-16に「利用フライト」を表からカードへ替え、区間ごとに中央列の印が付いた。
// 往路2区間＋復路2区間＝4本ぶん増えて15。
// オンライン版はFAMデータ（帰国日）の分がスクリプト内にあるので+1で16。
// 机上用印刷版はスクリプトを持たないため15。鉄道は旅程35＋凡例1＋準備タブ1＝37、タクシー1＋凡例1＝2。
const ONLINE_FLIGHT_ICONS = 16;
const OFFLINE_FLIGHT_ICONS = 15;
const countIn = (text, pattern) => (text.match(pattern) || []).length;
assert(sharedCss.includes('.flight-mark{') && sharedCss.includes('-webkit-mask:url("data:image/svg+xml'), 'v3.css: shared flight-mark icon missing');
assert(sharedCss.includes('.mode-icon{') && sharedCss.includes('.mode-icon-unknown{'), 'v3.css: shared mode-icon styles missing');
assert(!sharedCss.includes('.trip-flight'), 'v3.css: retired .trip-flight rule still present');
const offlineHtml = fs.readFileSync(path.join(here, 'index_v3_offline.html'), 'utf8');
const familyHtml = fs.readFileSync(path.join(here, 'family_print.html'), 'utf8');
// 入国審査用の1枚。審査官はドイツ語か英語しか読まないので英語で書く。
// 氏名とパスポート番号はどこにも保存しない。localStorageにも同期にも乗せない。
const immiHtml = fs.readFileSync(path.join(here, 'immigration_print.html'), 'utf8');
assert(!/<script/i.test(immiHtml), 'immigration_print.html: must stay fully static');
assert(countIn(immiHtml, /onclick="/g) === 1 && immiHtml.includes('onclick="window.print()"'), 'immigration_print.html: only the print button may be interactive');
assert(!/localStorage|sessionStorage|TripField|cloudEndpoint/.test(immiHtml), 'immigration_print.html: passport details must never be persisted or synced');
assert(countIn(immiHtml, /<input/g) === 2, 'immigration_print.html: expected the name and passport fields');
assert(!/[぀-ヿ一-鿿]/.test(immiHtml), 'immigration_print.html: must be written in English only');
for (const fact of ['Liederhalle', 'Maritim Hotel Stuttgart', 'Best Western Hotel Airport Frankfurt', 'AY80', 'AY1416', 'return ticket held', 'Consulate-General of Japan in Frankfurt']) {
  assert(immiHtml.includes(fact), `immigration_print.html: missing ${fact}`);
}
// 冒頭の要約は、ページ自身が未検討の札を付けている日を落とさないこと。
// 9/11（Day 3・企業訪問）は訪問先リストも集合方法も公式未発表で、9/12・9/13 と同じく未確定。
// ただし理由は違う（先方が出していない ／ こちらが決める）ので、書き分けたうえで並べる。
for (const [name, text] of [[onlineName, online], ['index_v3_offline.html', offlineHtml]]) {
  const flat = text.replace(/<[^>]*>/g, '');
  assert(/未確定は[^。]*9\/11[^。]*9\/12[^。]*9\/13/.test(flat),
    `${name}: the lead summary must list 9/11 alongside 9/12 and 9/13 as undecided`);
  assert(!/9\/13\s*の過ごし方だけ/.test(flat),
    `${name}: the lead summary must not claim only 9/12 and 9/13 are undecided`);
}
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
// 「🗓 どこにいて何をしているか」は「📅 日程詳細（家族向け）」と内容が重複していたため
// 削除済み（ユーザーの決定）。fam-table／fam-daysの重複表も引き続き無い。
assert(!family.includes('class="family-where"') && !family.includes('class="where-day'), 'family_print.html: the redundant "どこにいて何をしているか" block must not come back');
assert(!family.includes('fam-table') && !family.includes('fam-days'), 'family_print.html: the duplicate day table must not come back');
// 国旗絵文字の検査は時差カードだけに絞る。ページ全体を対象にすると、緊急連絡先の
// 「🇯🇵 万一のとき」的な表示（この検査の対象外）を誤検知するおそれがある。
const timezoneZoneLabels = [...family.matchAll(/<div class="timezone-card[^"]*"><span>([^<]*)<\/span>/g)].map(m => m[1]);
assert(timezoneZoneLabels.length === 2, 'family_print.html: expected 2 timezone cards (Japan, Germany)');
timezoneZoneLabels.forEach(label => assert(!/[\u{1F1E6}-\u{1F1FF}]{2}/u.test(label), 'family_print.html: timezone zone label must not use flag emoji (renders as letters on Windows)'));

// ---------- EuroBLECHと同じ.timezone-cards構造。「日本時間で見ると、現地はこうなっている」の
// 対応表は削除済み（ユーザーの決定）。timezone-cardsとtimezone-leadだけ残す。 ----------
assert(family.includes('class="timezone-cards"'), 'family_print.html: timezone-cards wrapper missing');
assert((family.match(/class="tz-diff"/g) || []).length === 2, 'family_print.html: expected 2 tz-diff cards (Japan basis, Germany difference)');
assert(family.includes('class="timezone-card zone-japan"') && family.includes('class="timezone-card zone-europe"'), 'family_print.html: Japan/Germany timezone cards missing');
assert(family.includes('class="timezone-lead"'), 'family_print.html: timezone-lead heading missing');
assert(family.includes('日本のほうが7時間進んでいます') && family.includes('例：日本の 21:00 → 現地は同じ日の 14:00'), 'family_print.html: existing timezone supplementary facts must survive the restructure');
assert(!/<th>日本の時刻<\/th><th>現地の時刻<\/th>/.test(family), 'family_print.html: the retired "日本時間で見ると" correspondence table must not come back');
assert(!family.includes('id="fam-clock"'), 'family_print.html: live clock should not be in print-only document');
assert(family.includes('<link rel="stylesheet" href="v3.css">') && !family.includes('<style>'), 'family_print.html: shared stylesheet link missing or CSS still embedded');
assert(family.includes('data-trip-layout="family-v1"'), 'family_print.html: shared family layout marker missing');

// ---------- 家族印刷版：5セクション構成 ----------
// 出張サマリー／時差・気候／日程詳細／宿泊先情報／緊急連絡先の順で、
// すべて同じfamily-section-headの見出し様式であること。
assert(!/<script\b/i.test(family), 'family_print.html: family copy must have no runtime scripts');
// 見出しの先頭はモノクロSVGのアイコン（絵文字ではない）。タグを落として文言で比べる。
const familySectionHeadings = [...family.matchAll(/class="family-section-head">([\s\S]*?)<\/div>/g)]
  .map(m => m[1].replace(/<[^>]+>/g, '').trim());
assert(
  JSON.stringify(familySectionHeadings) === JSON.stringify([
    '出張サマリー', '時差・気候', '日程詳細（家族向け）', '宿泊先情報', '緊急連絡先',
  ]),
  `family_print.html: five sections must appear in the expected order (got ${familySectionHeadings.join(' | ')})`
);
// 5つとも見出しにアイコンを持つこと（絵文字から置き換えたので、抜けを検査する）。
const familyHeadIcons = [...family.matchAll(/class="family-section-head"><span class="line-icon/g)];
assert(familyHeadIcons.length === 5, `family_print.html: each of the five section heads needs its SVG icon (got ${familyHeadIcons.length})`);

// ---------- 日程詳細（家族向け）：202610_Europe_TechEx_EuroBLECHと同じ構造 ----------
assert((family.match(/<section class="family-schedule">/g) || []).length === 1, 'family_print.html: family-schedule section missing or duplicated');
assert((family.match(/class="family-day-row shared-day"/g) || []).length === 8, 'family_print.html: family-schedule must have eight day rows');
// family-scheduleは日ごとに<section class="family-shared">を入れ子で持つため、
// 非貪欲な[\s\S]*?<\/section>は最初の内側</section>で止まってしまう。
// 次の兄弟セクション（🏨宿泊先情報）の開始位置までを素直に切り出す。
const scheduleStart = family.indexOf('<section class="family-schedule">');
const hotelStart = family.indexOf('<section class="family-section family-hotel">');
assert(scheduleStart >= 0 && hotelStart > scheduleStart, 'family_print.html: family-schedule section body missing');
const familySchedule = family.slice(scheduleStart, hotelStart);
const scheduleLegendMatch = familySchedule.match(/<div class="schedule-legend"[\s\S]*?<\/div>/);
assert(scheduleLegendMatch, 'family_print.html: schedule-legend missing');
const scheduleLegendKinds = [...scheduleLegendMatch[0].matchAll(/schedule-tag kind-(\w+)/g)].map(m => m[1]).sort();
const scheduleBodyKinds = [...new Set(
  [...familySchedule.matchAll(/class="agenda-line"><time>[^<]*<\/time><span class="schedule-tag kind-(\w+)"/g)].map(m => m[1])
)].sort();
assert(
  JSON.stringify(scheduleLegendKinds) === JSON.stringify(scheduleBodyKinds),
  `family_print.html: schedule-legend kinds must exactly match kinds used in the schedule body (legend: ${scheduleLegendKinds.join(',')}, used: ${scheduleBodyKinds.join(',')})`
);
const agendaLines = [...familySchedule.matchAll(/<div class="agenda-line">([\s\S]*?)<\/div>/g)].map(m => m[1]);
assert(agendaLines.length >= 8, 'family_print.html: family-schedule must have at least one agenda-line per day');
agendaLines.forEach((inner, i) => {
  assert(/^<time>[^<]+<\/time>/.test(inner), `family_print.html: agenda-line #${i} missing a leading <time>`);
  assert(/<span class="schedule-tag kind-\w+">[^<]+<\/span>/.test(inner), `family_print.html: agenda-line #${i} missing its schedule-tag`);
  assert(/<p>[\s\S]+<\/p>$/.test(inner), `family_print.html: agenda-line #${i} missing its <p> body`);
});
assert(/機内/.test(familySchedule) && /連絡がつきにくい/.test(familySchedule), 'family_print.html: schedule must flag an in-flight hard-to-reach window');

// ---------- 緊急連絡先：外務省「在外公館リスト」（令和5年5月22日付）の実値 ----------
assert(family.includes('href="tel:112"'), 'family_print.html: European emergency number 112 must be a tel: link');
assert(/<a class="place"[^>]*>在ドイツ日本国大使館<\/a>/.test(family), 'family_print.html: embassy name itself must be the map link, not a separate 📍 地図 link');
assert(/<a class="place"[^>]*>在フランクフルト日本国総領事館<\/a>/.test(family), 'family_print.html: consulate name itself must be the map link, not a separate 📍 地図 link');
const familyEmergencySection = family.match(/<section class="family-section family-emergency">[\s\S]*?<\/section>/);
assert(familyEmergencySection, 'family_print.html: emergency section missing');
assert(familyEmergencySection[0].includes('href="tel:+4930210940"'), 'family_print.html: embassy phone must be a tel: link (+49 30 210940)');
assert(familyEmergencySection[0].includes('href="tel:+49692385730"'), 'family_print.html: consulate phone must be a tel: link (+49 69 2385730)');
assert(!familyEmergencySection[0].includes('>地図</a>') && !familyEmergencySection[0].includes('>（地図）</a>') && !familyEmergencySection[0].includes('📍'), 'family_print.html: emergency section must not carry a separate 📍 地図 link');
assert(!/管轄/.test(familyEmergencySection[0]), 'family_print.html: emergency section must not claim consular jurisdiction (not confirmed in the source list)');
assert(/外務省 在外公館リスト/.test(familyEmergencySection[0]) && /令和5年5月22日付/.test(familyEmergencySection[0]) && /2026-08-15確認/.test(familyEmergencySection[0]), 'family_print.html: emergency section must cite its source and confirmation date');

// ---------- 気候：4都市（名古屋・京都は1行にまとめる）＋各行に出典名と統計期間 ----------
const climateSection = family.match(/<section class="family-section family-timezone">[\s\S]*?<\/section>/);
assert(climateSection, 'family_print.html: climate/timezone section missing');
// 表ではなく都市ごとの行。列を持つ表は393px幅で出典列が168pxを占め、
// 見出しが1文字ずつ縦に折り返して気温を押し出していた（2026-08-15に実機で確認）。
assert(!/<table/.test(climateSection[0]), 'family_print.html: climate must not be a table (at 393px the source column crushed the temperatures)');
const climateRows = [...climateSection[0].matchAll(/<div class="climate-row"><p class="climate-place">([^<]*)<\/p>\s*<p class="climate-temp"><span><i>[^<]*<\/i><b>([^<]*)<\/b><\/span><span><i>[^<]*<\/i><b>([^<]*)<\/b><\/span><\/p>\s*<p class="climate-src">([^<]*)<\/p><\/div>/g)];
// 2行構成。日本側（名古屋・京都）とドイツ側（シュトゥットガルト・フランクフルト）。
// ドイツの2都市は150kmしか離れておらず、実測でも最高21℃で同じ、最低が11℃と12℃の差だけ。
// しかも統計期間が違う（2015–2020と1981–2010）ので、その1℃を都市差として並べられない。
assert(climateRows.length === 2, `family_print.html: climate must have two rows, Japan and Germany (got ${climateRows.length})`);
const climatePlaces = climateRows.map(m => m[1]).join(' | ');
assert(/名古屋/.test(climatePlaces) && /京都/.test(climatePlaces), 'family_print.html: Nagoya and Kyoto must both be named (merged into one row)');
assert(/シュトゥットガルト/.test(climatePlaces) && /フランクフルト/.test(climatePlaces), 'family_print.html: both German cities must be named in the merged row');
// まとめた行は「約」を付けて丸めたと分かる書き方にする。
climateRows.forEach(([, place, hi, lo]) => {
  assert(/^約/.test(hi) && /^約/.test(lo), `family_print.html: the merged row "${place}" must mark its values as rounded (約)`);
});
// 出典・期間セルに統計期間が入っていること。ドイツ行は都市ごとに期間が違うので、
// 「統計期間は都市により異なる」と書いて、比較できる数字に見せない。
assert(/\d{4}.\d{4}/.test(climateRows.find(m => /名古屋/.test(m[1]))[4]), 'family_print.html: the Japan climate row must state its statistical period');
assert(/統計期間は都市により異なる/.test(climateRows.find(m => /シュトゥットガルト/.test(m[1]))[4]), 'family_print.html: the Germany climate row must say its statistical periods differ by city');
assert(!/限界/.test(climateSection[0]) && !/概算比較/.test(climateSection[0]), 'family_print.html: climate section must not frame the period difference as a limitation/defect');
assert(!/未確認/.test(climateSection[0]), 'family_print.html: all four cities\' climate values are confirmed, so climate section must not call any of them unconfirmed');

// ---------- アイコンは全部モノクロSVG。絵文字は1文字も残さない ----------
// 以前はここで🖨（U+1F5A8）・🗓（U+1F5D3）・🗺（U+1F5FA）の3文字だけを見ていた。
// そのため、同じくWindowsで黒い輪郭グリフになる🍽🏛ℹ など14種49箇所と、
// カラー絵文字35種が検査を素通りしていた（2026-08-15にユーザーが画面で発見）。
// 3文字を数える検査ではなく、Unicodeの性質で数える。
// 国旗（地域指示子の対）も対象。Windowsでは合成されず「DE」「JP」と出る。
// v3.cssも生成物。ここを対象から外していたため、CSSコメントの中の⚽🤖🖨🗓🗺と
// 国旗🇯🇵🇩🇪が2026-08-16まで残っていた。v3.cssはHTMLと違って絵文字の一括置換を
// 通らないので、素通りすると誰も気付かない。immigration_print.htmlもここでまとめて見る。
for (const [name, text] of [[onlineName, online], ['index_v3_offline.html', offlineHtml], ['family_print.html', family], ['immigration_print.html', immiHtml], ['v3.css', sharedCss]]) {
  const pictographs = [...new Set(text.match(/\p{Extended_Pictographic}/gu) || [])];
  assert(pictographs.length === 0,
    `${name}: every icon must be a monochrome SVG; found emoji ${pictographs.map(c => `${c}(U+${c.codePointAt(0).toString(16).toUpperCase()})`).join(' ')}`);
  const flags = [...new Set(text.match(/[\u{1F1E6}-\u{1F1FF}]{2}/gu) || [])];
  assert(flags.length === 0, `${name}: flag emoji must be dropped (Windows renders them as DE/JP letters); found ${flags.join(' ')}`);
}
assert(sharedCss.includes('.line-icon{'), 'v3.css: line-icon style missing');
// .line-iconは.btn（13px）・.plan-head（14px）・.ttl（16px）の文中に置く。
// 固定19pxの箱は文字より大きく見えたので、寸法は文字サイズ基準（em）で持たせる。
// 数値検査が通っても画面が読めない例だったため、比率で持っていることを検査する。
const lineIconRule = (sharedCss.match(/\.line-icon\{[^}]*\}/) || [''])[0];
assert(/width:[\d.]+em/.test(lineIconRule) && /height:[\d.]+em/.test(lineIconRule),
  'v3.css: .line-icon must size itself in em so it follows the surrounding 13–16px text (a fixed 19px box read larger than the text)');
// ヘッダーの印刷ボタンと、家族向け印刷版へのリンクの2箇所。
// 3箇所目だった家族タブ内の印刷ボタンは、#tab-famごと削除した（どこからも開けなかった）。
// ヘッダーの印刷ボタン、家族向け印刷版、入国審査用の3つ。
assert((online.match(/class="line-icon line-icon-print"/g) || []).length === 3, `${onlineName}: expected the print line-icon SVG in the header button, the family-print link and the immigration link`);
assert(online.includes('href="immigration_print.html"'), `${onlineName}: immigration print link missing`);
assert(!online.includes('id="tab-fam"'), `${onlineName}: the unreachable family section must not come back (family_print.html is the family copy)`);

// ---------- 予定の状態は5つだけ ----------
// 未検討／候補あり／仮決め／確定／当日判断。これ以外の語を状態の札に使わない。
// 以前は .st st-booked（予約済・登録済）、.st st-tbd（要予約・訪問先 未発表）、
// .et t-tbd（要検討・未発表・ラウンジ名は要確認）と3書式・7語に散っていた。
const PLAN_STATES = ['未検討', '候補あり', '仮決め', '確定', '当日判断'];
for (const [name, text] of [[onlineName, online], ['index_v3_offline.html', offlineHtml]]) {
  const labels = [...text.matchAll(/class="plan-state plan-state-\w+"[^>]*>([^<]*)</g)].map(m => m[1]);
  assert(labels.length === 9, `${name}: expected 9 plan-state chips (got ${labels.length})`);
  const unknown = [...new Set(labels)].filter(label => !PLAN_STATES.includes(label));
  assert(unknown.length === 0, `${name}: plan states must use only ${PLAN_STATES.join('／')} (got ${unknown.join(' ')})`);
  // 旧書式が復活していないこと。.st-skip（不参加）は進み具合の軸ではないので残す。
  assert(!/class="st st-tbd|class="et t-tbd|class="st st-booked/.test(text), `${name}: old ad-hoc state chips must not come back`);
}
assert(sharedCss.includes('.plan-state{') && PLAN_STATES.length === 5, 'v3.css: shared plan-state component missing');
assert(!sharedCss.includes('.st-booked{') && !sharedCss.includes('.et.t-tbd{'), 'v3.css: dead state chip rules must be removed with the chips');
assert((offlineHtml.match(/class="line-icon line-icon-print"/g) || []).length >= 1, 'index_v3_offline.html: expected the print line-icon SVG in the desk-print banner');
// ---------- 机上用印刷版は本当に1ファイルで完結しているか ----------
// アイコンのマークアップがあることは上で見ていたが、それを表示する規則が
// 埋め込まれているかは誰も見ていなかった。sharedCoreCssとfamilyCssが<style>から
// 抜けていて、.line-icon／.flight-mark／.plan-state／.sum-*が丸ごと無いまま
// 配られていた。寸法規則を失ったSVGは親の幅いっぱいに広がるので、見出しの
// アイコン1つでページが崩れる（2026-08-16に画面で発見）。
// マークアップと規則は対にして検査する。v3.css側だけ見ても机上版は守れない。
for (const rule of ['.line-icon{', '.flight-mark{', '.plan-state{', '.sum-place,', '.ov-days{']) {
  assert(sharedCss.includes(rule), `v3.css: missing the ${rule} rule`);
  assert(offlineHtml.includes(rule), `index_v3_offline.html: the desk-print copy must embed the ${rule} rule that v3.css has, or the markup falls back to unstyled HTML`);
}
assert((online.match(/class="line-icon line-icon-calendar"/g) || []).length >= 1, `${onlineName}: expected the calendar line-icon SVG replacing the retired 🗓 glyph`);

// ---------- 旅程タブの長い補足を折り畳みへ ----------
const FOLD_COUNT = 20;
for (const [name, text] of [[onlineName, online], ['index_v3_offline.html', offlineHtml]]) {
  // 机上用印刷版は全<details>を強制的にopenへ書き換えるため、class="fold"の前に
  // open属性が挿入される（<details open class="fold">）。属性順に依存しない数え方にする。
  assert((text.match(/<details[^>]*\bclass="fold"/g) || []).length === FOLD_COUNT, `${name}: expected ${FOLD_COUNT} folded itinerary notes`);
  assert((text.match(/<div class="fold-body">/g) || []).length === FOLD_COUNT, `${name}: expected ${FOLD_COUNT} fold-body wrappers`);
}
// 常時表示のまま残った<span class="note">に、極端に長い（100字超）ものが残っていないこと。
const planOnly = online.slice(online.indexOf('id="tab-plan"'), online.indexOf('id="tab-venue"'));
const remainingNotes = [...planOnly.matchAll(/<span class="note">([\s\S]*?)<\/span>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
remainingNotes.forEach((text, i) => {
  assert(text.length <= 100, `${onlineName}: itinerary note #${i} is ${text.length} chars and should have been folded ("${text.slice(0, 30)}...")`);
});

const redirect = fs.readFileSync(path.join(here, 'index_v3.html'), 'utf8');
assert(redirect.includes('http-equiv="refresh"') && redirect.includes('url=./'), 'index_v3.html: legacy URL redirect missing');
assert(redirect.includes("location.replace('./' + location.search + location.hash)"), 'index_v3.html: query/hash preserving redirect missing');

console.log('v3 acceptance checks: OK');
