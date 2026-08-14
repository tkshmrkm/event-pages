import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'index_v3.html'), 'utf8');
const css = readFileSync(join(here, 'v3.css'), 'utf8');
const js = readFileSync(join(here, 'v3.js'), 'utf8');
const hrsCss = readFileSync(join(here, '..', '202609_HumanoidSummitEurope', 'v3.css'), 'utf8');
const itinerary = html.slice(html.indexOf('id="tab-itinerary"'), html.indexOf('id="tab-prep"'));
const prep = html.slice(html.indexOf('id="tab-prep"'), html.indexOf('id="tab-venue"'));
const day1022 = itinerary.slice(itinerary.indexOf('id="day-1022"'), itinerary.indexOf('id="day-1023"'));
const day1025 = itinerary.slice(itinerary.indexOf('id="day-1025"'));
const rowTimes = [...itinerary.matchAll(/<div class="row-time">([\s\S]*?)<\/div>/g)].map(match => match[1].replace(/<[^>]+>/g, '').trim());

const count = pattern => (html.match(pattern) || []).length;
const checks = [
  ['HRS public stylesheet linked', html.includes('href="../202609_HumanoidSummitEurope/v3.css"')],
  ['local v3 assets linked', html.includes('href="v3.css"') && html.includes('src="v3.js"')],
  ['no v2 runtime dependency', !/v2\.(?:css|js)/.test(html)],
  ['five primary tabs', count(/data-tab="(?:itinerary|prep|venue|rec|family)"/g) === 5],
  ['nine HRS detail day cards', count(/<details class="day"/g) === 9],
  ['all day cards initially open', count(/<details class="day"[^>]* open/g) === 9],
  ['nine day topic blocks', count(/class="day-topics"/g) === 9],
  ['all overnight lodging outcomes present', count(/class="stay stay-/g) === 10 && !day1025.includes('class="stay stay-')],
  ['static four-column routes present', count(/class="route-four(?:\s|\")/g) >= 30],
  ['three overnight +1 arrivals', count(/<time>\d{2}:\d{2} \+1<\/time>/g) === 3],
  ['no repeated month/day in endpoints', !/class="endpoint"[\s\S]{0,180}<time>\d{1,2}\/\d{1,2}/.test(itinerary)],
  ['no colored airplane emoji in itinerary', !/[✈🛫🛬]\uFE0F/.test(itinerary)],
  ['flight icons use outlined deterministic SVG mask', count(/class="flight-mark(?: inline-flight-mark)?"/g) >= 20 && css.includes('-webkit-mask:url("data:image/svg+xml') && css.includes("fill='none'") && css.includes('color:#0B5C60')],
  ['itinerary color legend and factory color present', html.includes('class="day-kind-legend"') && /id="day-1022"[^>]*data-kind="visit"/.test(html)],
  ['10/19 context moved to topics', itinerary.includes('美馬・金築はEuroBLECH開幕前の自由日') && !itinerary.includes('class="text-xs text-slate-500 px-1">EuroBLECHは10/20開幕')],
  ['lounge candidates are conditional without defensive prose', itinerary.includes('JALサクララウンジ') && itinerary.includes('Plaza Premium Lounge／The Coral Finest Business Class Lounge') && !itinerary.includes('利用不可とは断定せず') && !itinerary.includes('ステータス無し・プライオリティパス無し')],
  ['unnecessary one-day wording removed', !html.includes('参加できるのは実質この日だけ')],
  ['booking status belongs to preparation', !/選定済み（未購入|運賃は手配中/.test(itinerary) && prep.includes('航空券状況') && prep.includes('選定済み（未購入')],
  ['baggage-drop wording matches approved sample', (itinerary.match(/ホテルに荷物を預ける/g) || []).length === 2 && !itinerary.includes('ホテルフロントへ荷物預け') && !itinerary.includes('荷物預け（予約済み）')],
  // ホテル名は場所名と同じく、文字そのものが地図リンクである（2026-08-14からの標準）。
  ['hotel names are kept in lodging outcomes', (itinerary.match(/<strong>宿泊：<\/strong><a class="place"[^>]*>Holiday Inn Express Amsterdam - Sloterdijk Station<\/a>/g) || []).length === 2 && (itinerary.match(/<strong>宿泊：<\/strong><a class="place"[^>]*>Hotel FREIgeist Göttingen Innenstadt<\/a>/g) || []).length >= 4 && !/ホテルに荷物を預ける[\s\S]{0,250}(?:Holiday Inn Express|Hotel FREIgeist)/.test(itinerary)],
  ['lodging without a place is not linked', /<strong>宿泊：<\/strong>機内/.test(itinerary) && !/<a class="place"[^>]*>機内<\/a>/.test(html) && !/<a class="place"[^>]*>帰宅<\/a>/.test(html)],
  // セントレアの出発待ちは10/17村上と10/18美馬・金築の2回。どちらも1ブロックに寄せてある。
  // 残る「空港到着目安」は10/20のスキポールの1件だけ。
  ['pre-departure windows are single blocks', (itinerary.match(/セントレアで出発待ち 3時間 — 過ごし方/g) || []).length === 2 && (itinerary.match(/13:10〜16:10/g) || []).length === 2 && (itinerary.match(/空港到着目安/g) || []).length === 1 && !itinerary.includes('セントレアで昼食') && !itinerary.includes('JALサクララウンジ（国際線・出国審査後）')],
  ['10/19 granularity aligned', itinerary.includes('<div class="row-time">09:45〜16:50</div>') && itinerary.includes('👥 美馬・金築（FRA着・ヴォルフスブルク日帰り）') && itinerary.includes('荷物受取・チェックイン') && !itinerary.includes('なぜ先にゲッティンゲンへ寄るのか')],
  ['10/19 networking time retained', /<div class="row-time">18:00〜21:00<\/div>[\s\S]{0,700}VIP Networking Drinks/.test(itinerary) && !/<div class="row-time">夕方<\/div>[\s\S]{0,700}VIP Networking Drinks/.test(itinerary)],
  ['10/19 movements use four-column rows', /class="route-four"[^>]*><div class="row-time">12:20頃[\s\S]*?<strong>徒歩<\/strong>[\s\S]*?<time>12:30頃<\/time>/.test(itinerary) && /class="route-four"[^>]*><div class="row-time">17:30頃[\s\S]*?<strong>ICE直通<\/strong>[\s\S]*?<time>18:45頃<\/time>/.test(itinerary)],
  ['10/22 decisions and review styling present', day1022.includes('class="return-choice"') && day1022.includes('早帰り案：16:00頃') && day1022.includes('市内滞在案：18:00頃') && day1022.includes('20:05頃ホテル着') && (day1022.match(/route-review/g) || []).length === 2],
  ['10/24 return-day sequence aligned', itinerary.includes('07:00〜10:00') && itinerary.includes('10:40〜12:55') && itinerary.includes('フランクフルト出発 → 香港（全員）') && !itinerary.includes('旧T2時代の案内・館内図は使えない')],
  ['10/25 return sequence aligned', day1025.includes('香港国際空港着・乗り継ぎ') && day1025.includes('14:10〜15:00頃') && day1025.includes('15:00頃') && day1025.includes('Visit Japan Web') && !/(?:15:28頃|16:45頃|名鉄ミュースカイ|新幹線 のぞみ)/.test(day1025)],
  ['baggage terminology aligned', !/手荷物受取|荷物ピックアップ/.test(html) && (itinerary.match(/荷物受取/g) || []).length >= 3],
  ['airport procedures use consistent outline icons', (itinerary.match(/line-icon-procedure/g) || []).length >= 4 && itinerary.includes('入国審査・荷物受取・税関') && itinerary.includes('チェックイン・保安検査・出国審査')],
  ['itinerary times are zero-padded', !/<div class="row-time">[0-9]:[0-9]{2}/.test(itinerary)],
  ['Japanese prose uses Japanese city names', !/(?:Amsterdam行き|Amsterdam到着後|Wolfsburgへ日帰り|Hannoverへ|Bremenへ日帰り|午後にFrankfurtへ|Frankfurt空港から)/.test(itinerary)],
  ['duplicate station-arrival action removed', !itinerary.includes('Hannover Messe/Laatzen駅着')],
  ['Bremen return stays a decision rather than a confirmed booking', day1022.includes('列車候補を確認') && day1022.includes('約2時間の目安') && !day1022.includes('予約確定済み')],
  ['Bremen topic has no Hannover carryover', !day1022.includes('会場（メッセ）到着後') && day1022.includes('ゲッティンゲン駅・車内・ブレーメン到着後')],
  ['legacy icon placeholders removed', !html.includes('class="fas fa-') && !js.includes('✈︎')],
  ['event naming aligned', html.includes('<title>TechEx Europe・EuroBLECH 2026') && html.includes('TechEx Europe・EuroBLECH 2026 ・ field guide v3') && js.includes('# TechEx Europe・EuroBLECH 2026 記録') && !html.includes('VIP networking drinks')],
  ['Japanese punctuation normalized', !html.includes('·') && !/(?:村上|美馬・金築):/.test(html) && !/\d{1,2}\/\d{1,2} \([月火水木金土日]\)/.test(html)],
  ['outline action icons replace black-filled emoji', count(/class="line-icon line-icon-/g) >= 20 && css.includes('.line-icon svg') && !itinerary.includes('🛋') && !itinerary.includes('🛂')],
  ['no oversized itinerary time cells', rowTimes.every(value => value.length <= 32)],
  ['four-column mobile contract retained', /@media\(max-width:640px\)[\s\S]*\.route-four,.lanes \.route-four\{grid-template-columns:72px minmax\(0,1fr\) 74px minmax\(0,1fr\)\}/.test(css)],
  ['family information architecture retained', html.includes('class="timezone-early"') && html.includes('class="family-flights"') && count(/class="family-day-row/g) === 9],
  ['family schedule distinguishes flight and ground movement', html.includes('kind-flight') && html.includes('kind-move') && html.includes('kind-transfer') && html.includes('kind-procedure')],
  ['family schedule avoids redundant date prefixes', !/<article class="family-day-row[\s\S]*?<p>[^<]*10\/(?:17|18|19|20|21|22|23|24|25)/.test(html)],
  ['family tab omits fares and daylight-saving note', !html.includes('class="flight-fares"') && !html.includes('欧州夏時間が終了')],
  ['family times are visually prominent', css.includes('.agenda-line time{color:#0B4F5A;font-size:14px;font-weight:800')],
  // 家族タブは2026-08-14に家族視点へ圧縮した。細かい駅間移動は載せないが、
  // 香港乗継・帰着・帰宅の3点は残す。Visit Japan Webは旅程タブ側で担保する。
  ['family final arrival and airport procedures present', html.includes('香港で2時間15分') && html.includes('セントレア NGO着') && html.includes('入国手続きを終えて各自帰宅')],
  ['Visit Japan Web retained in itinerary', itinerary.includes('Visit Japan Web')],
  ['family where-overview present', count(/class="where-day/g) === 9 && count(/class="where-cell/g) === 13 && html.includes('どこにいるか') && html.includes('class="place">ハノーファー')],
  ['family time difference is the dominant type', html.includes('class="tz-diff"') && /\.timezone-card \.tz-diff\{[^}]*font-size:38px/.test(css) && html.includes('−7<i>時間</i>') && html.includes('−1<i>時間</i>')],
  // 圧縮前は52行。現在31行。駅間移動を戻すと再び膨らむので上限で歯止めをかける。
  ['family day detail stays compressed', count(/class="agenda-line"/g) <= 36],
  ['family tab drops event-type distinctions', html.includes('schedule-tag kind-work') && !/schedule-legend[\s\S]{0,400}kind-euro/.test(html)],
  ['no nested action bodies', !html.includes('action-body"><div class="action-body')],
  ['HRS final font stack', hrsCss.includes("--font:'BIZ UDPGothic','Yu Gothic UI','Meiryo',system-ui,sans-serif")],
  ['HRS date navigation behavior', js.includes('function markDay()') && js.includes("todayCard.classList.add('today')") && js.includes('day.open = true')],
  ['browser-local records retained', js.includes("const FIELD_KEY = 'eurotrip2026-v3'") && js.includes('localStorage.setItem')],
];

new vm.Script(js, { filename: 'v3.js' });
const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([label, ok]) => console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`));
if (failed.length) process.exit(1);
