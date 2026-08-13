import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, 'index.html');
const outputPath = join(here, 'index_v3.html');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const DAY_META = {
  '1017': { date: '2026-10-17', kind: 'move', badge: '移動', zone: '各地点の現地時刻。香港は日本より1時間遅い', focus: '村上が1日先行。香港で夕食・シャワー後、Amsterdam行き深夜便へ' },
  '1018': { date: '2026-10-18', kind: 'move', badge: '別行動', zone: '村上は欧州現地時間（日本より7時間遅い）。美馬・金築は日本・香港の各現地時刻', focus: '村上はAmsterdam到着後に時差調整。美馬・金築は日本を出発' },
  '1019': { date: '2026-10-19', kind: 'conf', badge: 'TechEx', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: '村上はTechEx Europe Day 1。美馬・金築はGöttingen経由でAutostadtへ' },
  '1020': { date: '2026-10-20', kind: 'conf', badge: '別行動', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: '村上はTechEx Day 2後にHannoverへ。美馬・金築はEuroBLECH Day 1' },
  '1021': { date: '2026-10-21', kind: 'conf', badge: 'EuroBLECH', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: '3名でEuroBLECHに終日参加' },
  '1022': { date: '2026-10-22', kind: 'move', badge: '工場見学', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: 'Bremenへ日帰りし、Mercedes-Benz Werk Bremenを見学' },
  '1023': { date: '2026-10-23', kind: 'conf', badge: 'EuroBLECH', zone: '欧州現地時間 CEST（日本より7時間遅い）', focus: 'EuroBLECH最終日。午後にFrankfurtへ移動' },
  '1024': { date: '2026-10-24', kind: 'move', badge: '帰国便', zone: '欧州現地時間 CEST（日本より7時間遅い）。到着後の香港は日本より1時間遅い', focus: 'Frankfurt Terminal 3から香港経由の帰国便へ' },
  '1025': { date: '2026-10-25', kind: 'move', badge: '帰着', zone: '香港は日本より1時間遅い。日本到着後はJST', focus: '香港で乗り継ぎ、14:10にセントレア到着後、各自帰宅' },
};

const STAYS = {
  '1017': [{ who: '村上', name: '機内泊', tone: 'murakami' }],
  '1018': [
    { who: '村上', name: 'Holiday Inn Express Amsterdam - Sloterdijk Station', tone: 'murakami' },
    { who: '美馬・金築', name: '機内泊', tone: 'team' },
  ],
  '1019': [
    { who: '村上', name: 'Holiday Inn Express Amsterdam - Sloterdijk Station', tone: 'murakami' },
    { who: '美馬・金築', name: 'Hotel FREIgeist Göttingen Innenstadt', tone: 'team' },
  ],
  '1020': [{ who: '全員', name: 'Hotel FREIgeist Göttingen Innenstadt', tone: 'shared' }],
  '1021': [{ who: '全員', name: 'Hotel FREIgeist Göttingen Innenstadt', tone: 'shared' }],
  '1022': [{ who: '全員', name: 'Hotel FREIgeist Göttingen Innenstadt', tone: 'shared' }],
  '1023': [{ who: '全員', name: 'Toyoko Inn Frankfurt am Main Hauptbahnhof', tone: 'shared' }],
  '1024': [{ who: '全員', name: '機内泊', tone: 'shared' }],
  '1025': [{ who: '全員', name: '帰宅', tone: 'shared' }],
};

const ROUTES = [
  ['1017','京都駅発 → 名古屋','10/17（土）11:30頃','JST','京都駅','新幹線 のぞみ','約36分','10/17（土）時刻未確認','JST','名古屋駅'],
  ['1017','名古屋駅発 → 中部国際空港','10/17（土）12:35','JST','名鉄名古屋駅','名鉄ミュースカイ','約28分','10/17（土）13:03','JST','中部国際空港駅'],
  ['1017','CX539 NGO発','10/17（土）16:10','JST','中部国際空港（NGO）','CX539','4時間20分','10/17（土）19:30','HKT','香港国際空港（HKG）'],
  ['1017','CX271 HKG発','10/17（土）23:15','HKT','香港国際空港（HKG）','CX271','13時間40分','10/18（日）06:55','CEST','Amsterdam Airport Schiphol（AMS）'],
  ['1018','Schiphol → Amsterdam Sloterdijk','10/18（日）07:30','CEST','Schiphol Airport Station','NS直通','約8〜10分','10/18（日）時刻未確認','CEST','Amsterdam Sloterdijk'],
  ['1018','京都駅発 → 名古屋','10/18（日）11:30頃','JST','京都駅','新幹線 のぞみ','約36分','10/18（日）時刻未確認','JST','名古屋駅'],
  ['1018','名古屋駅発 → 中部国際空港','10/18（日）12:35','JST','名鉄名古屋駅','名鉄ミュースカイ','約28分','10/18（日）13:03','JST','中部国際空港駅'],
  ['1018','CX539 NGO発','10/18（日）16:10','JST','中部国際空港（NGO）','CX539','4時間20分','10/18（日）19:30','HKT','香港国際空港（HKG）'],
  ['1018','CX289 HKG発','10/18（日）23:55','HKT','香港国際空港（HKG）','CX289','13時間20分','10/19（月）07:15','CEST','Frankfurt Airport（FRA）'],
  ['1019','ホテル → RAI','10/19（月）08:30','CEST','Holiday Inn Express Amsterdam - Sloterdijk Station','メトロ50系統＋徒歩','約25〜28分','10/19（月）08:55頃','CEST','RAI Amsterdam'],
  ['1019','RAI → ホテルへ戻る','10/19（月）時刻未確認','CEST','RAI Amsterdam','メトロ50系統＋徒歩','所要時間未確認','10/19（月）時刻未確認','CEST','Holiday Inn Express Amsterdam - Sloterdijk Station'],
  ['1019','RE2 + ICE774 FRA空港駅発','10/19（月）08:22','CEST','Frankfurt空港駅','RE2＋ICE774','2時間9分','10/19（月）10:31','CEST','Göttingen Hbf'],
  ['1019','ICE ゲッティンゲン発 → Wolfsburg','10/19（月）11:00頃','CEST','Göttingen Hbf','ICE（Hannover経由）','約1時間15〜20分','10/19（月）12:20頃','CEST','Wolfsburg Hbf'],
  ['1019','Wolfsburg Hbf） 着 → Autostadt','10/19（月）12:20頃','CEST','Wolfsburg Hbf','徒歩','約10分','10/19（月）12:30頃','CEST','Autostadt'],
  ['1019','ICE ヴォルフスブルク中央駅','10/19（月）17:30頃','CEST','Wolfsburg Hbf','ICE直通','約1時間15〜20分','10/19（月）18:45頃','CEST','Göttingen Hbf'],
  ['1020','チェックアウト（荷物持参）→ RAIへ','10/20（火）時刻未確認','CEST','Holiday Inn Express Amsterdam - Sloterdijk Station','メトロ50系統＋徒歩','約25〜28分','10/20（火）時刻未確認','CEST','RAI Amsterdam'],
  ['1020','RAI →','10/20（火）14:55','CEST','RAI Amsterdam','鉄道','約10分','10/20（火）15:20頃','CEST','Amsterdam Airport Schiphol（AMS）'],
  ['1020','✈️ KL1791（KLM Cityhopper）AMS発','10/20（火）16:50','CEST','Amsterdam Airport Schiphol（AMS）','KL1791','55分','10/20（火）17:45','CEST','Hannover Airport（HAJ）'],
  ['1020','S5 Hannover Flughafen発','10/20（火）19:06','CEST','Hannover Flughafen','S5','17分','10/20（火）19:23','CEST','Hannover Hbf'],
  ['1020','ICE77','10/20（火）19:53','CEST','Hannover Hbf','ICE77','32分','10/20（火）20:25','CEST','Göttingen Hbf'],
  ['1020','ICE888','10/20（火）07:55','CEST','Göttingen Hbf','ICE888（直通）','28分','10/20（火）08:23','CEST','Hannover Messe/Laatzen'],
  ['1021','ICE888','10/21（水）07:55','CEST','Göttingen Hbf','ICE888','28分','10/21（水）08:23','CEST','Hannover Messe/Laatzen'],
  ['1022','ICE1674','10/22（木）09:00','CEST','Göttingen Hbf','ICE1674（直通）','1時間45分','10/22（木）10:45','CEST','Bremen Hbf'],
  ['1022','ブレーメン中央駅（Bremen Hbf） → ゲッティンゲン','10/22（木）時刻未定','CEST','Bremen Hbf','列車番号未定','所要時間未確認','10/22（木）18:00前目安','CEST','Göttingen Hbf'],
  ['1023','ICE888','10/23（金）07:55','CEST','Göttingen Hbf','ICE888','28分','10/23（金）08:23','CEST','Hannover Messe/Laatzen'],
  ['1023','S4','10/23（金）14:30','CEST','Hannover Messe/Laatzen','S4','8分','10/23（金）14:38','CEST','Hannover Hbf'],
  ['1023','ICE771','10/23（金）14:53','CEST','Hannover Hbf','ICE771','2時間21分','10/23（金）17:14','CEST','Frankfurt(Main) Hbf'],
  ['1024','FRA中央駅','10/24（土）10:15','CEST','Frankfurt(Main) Hbf','Airport Express','約12分','10/24（土）10:40','CEST','Frankfurt Airport Terminal 3'],
  ['1024','フランクフルト → 香港','10/24（土）13:40','CEST','Frankfurt Airport（FRA）','CX288','11時間40分','10/25（日）07:20','HKT','香港国際空港（HKG）'],
  ['1025','CX536 HKG発','10/25（日）09:35','HKT','香港国際空港（HKG）','CX536','3時間35分','10/25（日）14:10','JST','中部国際空港（NGO）'],
];

let source = readFileSync(sourcePath, 'utf8');
source = source
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>Europe TechEx・EuroBLECH 2026 フィールドガイド v3</title>')
  .replace(/<link[^>]+font-awesome[^>]*>/gi, '')
  .replace(/<script[^>]+cdn\.tailwindcss\.com[^>]*><\/script>/gi, '')
  .replace(/<style>[\s\S]*?<\/style>/i, '')
  .replace(/<script>[\s\S]*?<\/script>\s*<\/body>/i, '</body>')
  .replace('</head>', '<link rel="stylesheet" href="../202609_HumanoidSummitEurope/v3.css">\n<link rel="stylesheet" href="v3.css">\n</head>');

const transformScript = `
<script id="v3-build-transform">
(() => {
  const DAY_META = ${JSON.stringify(DAY_META)};
  const STAYS = ${JSON.stringify(STAYS)};
  const ROUTES = ${JSON.stringify(ROUTES)};
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plainTime = value => value.replace(/^\\d{1,2}\\/\\d{1,2}（.）/, '').trim();
  const routeDay = value => (value.match(/^(\\d{1,2})\\/(\\d{1,2})/) || []).slice(1).join('');
  const mapLink = place => '<a class="place" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place) + '" target="_blank" rel="noopener">' + esc(place) + '</a>';
  const isFlight = service => /^(?:CX|KL)\\d+/.test(service);
  const routeMarkup = data => {
    const [dayId,, departWhen, departZone, departPlace, service, duration, arriveWhen, arriveZone, arrivePlace] = data;
    const depart = plainTime(departWhen);
    let arrive = plainTime(arriveWhen);
    if (routeDay(arriveWhen) && routeDay(arriveWhen) !== dayId) arrive += ' +1';
    return '<div class="row-time">' + esc(depart) + '</div>' +
      '<div class="endpoint"><span class="label">出発</span><time>' + esc(depart) + '</time><span class="tz">（' + esc(departZone) + '）</span>' + mapLink(departPlace) + '</div>' +
      '<div class="mode"><span class="' + (isFlight(service) ? 'flight-mark' : 'arrow') + '">' + (isFlight(service) ? '✈︎' : '→') + '</span><strong>' + esc(service) + '</strong><small>' + esc(duration.replace('所要時間未確認','時間未確認')) + '</small></div>' +
      '<div class="endpoint"><span class="label">到着</span><time>' + esc(arrive) + '</time><span class="tz">（' + esc(arriveZone) + '）</span>' + mapLink(arrivePlace) + '</div>';
  };
  const rows = day => Array.from(day.querySelectorAll('[class*="border-l-4"]'));
  const rowFor = (day, text) => rows(day).find(row => row.textContent.replace(/\\s+/g, ' ').includes(text));
  const actionify = row => {
    if (!row || row.classList.contains('route-four') || row.classList.contains('action')) return;
    const children = Array.from(row.children);
    const time = children.find(el => /^(?:\\d{1,2}:\\d{2}|\\d{1,2}:\\d{2}頃|\\d{1,2}:\\d{2}〜|朝|午前|午後|夕方|夜|日中|午前〜午後|午後〜|14:00以降)/.test(el.textContent.trim()));
    const timeText = time ? time.textContent.trim() : '—';
    if (time) time.remove();
    row.className = 'action' + (time ? '' : ' no-time');
    const body = document.createElement('div');
    body.className = 'action-body';
    while (row.firstChild) body.appendChild(row.firstChild);
    row.innerHTML = '<div class="row-time">' + esc(timeText) + '</div>';
    row.appendChild(body);
  };
  const stayMarkup = stay => '<div class="stay stay-' + stay.tone + '"><span>' + esc(stay.who) + '</span><strong>宿泊：</strong>' + esc(stay.name) + '</div>';
  const laneFrom = (sourceLane, tone, fallbackTitle, stay) => {
    const lane = document.createElement('div');
    lane.className = 'lane lane-' + tone;
    const oldHead = sourceLane.firstElementChild;
    let title = fallbackTitle;
    if (oldHead && /^(?:👤|👥)/.test(oldHead.textContent.trim())) {
      title = oldHead.textContent.trim();
      oldHead.remove();
    }
    lane.innerHTML = '<div class="lane-head">' + esc(title) + '</div>';
    while (sourceLane.firstChild) lane.appendChild(sourceLane.firstChild);
    lane.querySelectorAll('[class*="border-l-4"]').forEach(actionify);
    if (stay) lane.insertAdjacentHTML('beforeend', stayMarkup(stay));
    return lane;
  };

  document.querySelector('body > div')?.remove();
  document.getElementById('day-nav')?.remove();
  document.querySelector('nav.fixed')?.remove();

  const itinerary = document.getElementById('tab-itinerary');
  const prep = document.getElementById('tab-prep');
  const docs = document.getElementById('tab-docs');
  const venue = document.getElementById('tab-events');
  const family = document.getElementById('tab-family');
  if (!itinerary || !prep || !venue || !family) throw new Error('Required source panels are missing');

  const prepStack = prep.querySelector(':scope > div');
  const docsStack = docs?.querySelector(':scope > div');
  if (prepStack && docsStack) {
    const marker = document.createElement('div');
    marker.className = 'section-divider';
    marker.innerHTML = '<strong>📁 書類・予約情報</strong><span>旧「書類」タブの内容を準備へ統合</span>';
    prepStack.appendChild(marker);
    while (docsStack.firstChild) prepStack.appendChild(docsStack.firstChild);
  }
  docs?.remove();
  venue.id = 'tab-venue';

  const record = document.createElement('section');
  record.id = 'tab-rec';
  record.className = 'tab records-tab';
  record.setAttribute('role', 'tabpanel');
  record.innerHTML = '<div class="records-intro"><div><div class="eyebrow">FIELD NOTES</div><h2>日別記録</h2><p>入力はこのブラウザ内に自動保存されます。</p></div><div class="record-actions"><button type="button" id="export-records">Markdown書き出し</button><button type="button" id="clear-records">記録を消去</button></div></div><div id="record-days"></div>';

  const days = Array.from(itinerary.querySelectorAll('.day-card[id^="day-"]'));
  days.forEach(day => {
    const id = day.id.replace('day-', '');
    const meta = DAY_META[id];
    if (!meta) return;
    ROUTES.filter(route => route[0] === id).forEach(route => {
      const row = rowFor(day, route[1]);
      if (row) { row.className = 'route-four'; row.innerHTML = routeMarkup(route); }
    });
    [['AMS 着','06:55','入国審査・荷物受取'],['FRA 着','07:15','入国審査・荷物受取'],['HKG 着','07:20','香港で乗り換え（2時間15分）']].forEach(([match,time,label]) => {
      const row = rowFor(day, match);
      if (row && !row.classList.contains('route-four')) row.innerHTML = '<div class="text-slate-500">' + time + '</div><div class="font-semibold">' + label + '</div>';
    });
    if (id === '1021') {
      const before = Array.from(day.querySelectorAll('.font-semibold')).find(el => /宿泊/.test(el.textContent))?.closest('[class*="border-l-4"]');
      before?.insertAdjacentHTML('beforebegin', '<div class="route-four">' + routeMarkup(['1021','','時刻未確認','CEST','Hannover Messe/Laatzen','列車番号未確認','所要時間未確認','時刻未確認','CEST','Göttingen Hbf']) + '</div>');
    }
    if (id === '1022') {
      const before = rowFor(day, 'Mercedes-Benz Werk Bremen');
      before?.insertAdjacentHTML('beforebegin', '<div class="route-four">' + routeMarkup(['1022','','10:45以降','CEST','Bremen Hbf','現地交通手段未確認','所要時間未確認','12:45まで','CEST','Mercedes-Benz Werk Bremen']) + '</div>');
    }
    if (id === '1025') {
      const before = rowFor(day, '解散・帰宅');
      before?.insertAdjacentHTML('beforebegin', '<div class="route-four">' + routeMarkup(['1025','','15:00頃','JST','中部国際空港駅','名鉄ミュースカイ','約28分','15:28頃','JST','名古屋駅']) + '</div><div class="route-four">' + routeMarkup(['1025','','時刻未確認','JST','名古屋駅','新幹線 のぞみ','所要時間未確認','16:45頃','JST','京都駅']) + '</div>');
    }
    const absorbed = {
      '1017': ['HKG着（乗継 3時間45分）'],
      '1018': ['HKG着（乗継 4時間25分）'],
      '1025': ['中部国際空港（セントレア）着陸'],
    }[id] || [];
    absorbed.forEach(match => {
      const duplicate = rowFor(day, match);
      if (duplicate && !duplicate.classList.contains('route-four')) duplicate.remove();
    });

    const topicRows = rows(day).filter(row => /食事・.*スーパー/.test(row.textContent));
    const topicDetails = topicRows.map(row => {
      const heading = row.querySelector('.font-semibold');
      const title = (heading?.textContent || '食事・買い物').replace(/^[^\\p{L}\\p{N}]+/u, '').trim();
      heading?.remove();
      const html = row.innerHTML;
      row.remove();
      return '<details class="topic"><summary>' + esc(title) + '</summary><div class="topic-body">' + html + '</div></details>';
    }).join('');
    rows(day).filter(row => /(?:に宿泊|泊（|機内泊)/.test(row.textContent) && !row.classList.contains('route-four')).forEach(row => row.remove());

    const oldHead = day.firstElementChild;
    const oldBody = oldHead?.nextElementSibling;
    const labels = oldHead ? Array.from(oldHead.querySelectorAll(':scope > span')).map(el => el.textContent.trim()) : [];
    const details = document.createElement('details');
    details.className = 'day'; details.id = day.id; details.open = true;
    details.dataset.label = labels[0]?.match(/\\d{1,2}\\/\\d{1,2}/)?.[0] || id;
    details.dataset.dow = labels[0]?.match(/（(.)）/)?.[1] || '';
    details.dataset.date = meta.date; details.dataset.kind = meta.kind;
    details.innerHTML = '<summary class="day-head"><span class="d">' + esc(labels[0] || id) + '</span><span class="t">' + esc(labels.slice(1).join(' ')) + '</span><span class="badge">' + esc(meta.badge) + '</span></summary>' +
      '<div class="day-zone">' + esc(meta.zone) + '</div><section class="day-topics"><h3>本日のトピックス</h3><p>' + esc(meta.focus) + '</p>' + topicDetails + '</section>';

    const split = oldBody?.querySelector(':scope > .split-grid');
    const stays = STAYS[id] || [];
    if (split) {
      const laneWrap = document.createElement('div'); laneWrap.className = 'lanes';
      const sources = Array.from(split.children);
      laneWrap.appendChild(laneFrom(sources[0], 'murakami', '👤 村上', stays.find(s => s.tone === 'murakami')));
      if (sources[1]) laneWrap.appendChild(laneFrom(sources[1], 'team', '👥 美馬・金築', stays.find(s => s.tone === 'team')));
      details.appendChild(laneWrap);
      if (id === '1020') details.insertAdjacentHTML('beforeend', '<div class="joinbar"><span>合流</span><strong>夜にGöttingenで合流 — 以降は3名で行動</strong></div>');
      const shared = stays.find(s => s.tone === 'shared');
      if (shared) details.insertAdjacentHTML('beforeend', stayMarkup(shared));
    } else if (oldBody) {
      const source = oldBody.querySelector(':scope > .space-y-2') || oldBody;
      const tone = id === '1017' ? 'murakami' : 'all';
      const title = id === '1017' ? '👤 村上 — 1日先行' : '👥 全員';
      details.appendChild(laneFrom(source, tone, title, stays[0]));
    }
    day.replaceWith(details);
  });

  const textWalker = document.createTreeWalker(itinerary, NodeFilter.SHOW_TEXT);
  while (textWalker.nextNode()) textWalker.currentNode.nodeValue = textWalker.currentNode.nodeValue.replace(/✈[\uFE0E\uFE0F]?|🛫|🛬/g, '✈︎');

  const stack = itinerary.querySelector(':scope > .max-w-2xl');
  if (stack) { stack.className = 'itinerary-stack'; stack.querySelectorAll(':scope > :not(.day)').forEach(el => { if (!el.closest('.day')) el.classList.add('intro-card'); }); }
  [prep, venue, family].forEach(panel => {
    panel.className = 'tab legacy-tab'; panel.setAttribute('role','tabpanel');
    const inner = panel.querySelector(':scope > div'); if (inner) inner.className = 'legacy-stack';
  });
  itinerary.className = 'tab on'; itinerary.setAttribute('role','tabpanel');

  const header = document.createElement('header');
  header.className = 'hdr';
  header.innerHTML = '<div class="wrap hdr-top"><div><div class="eyebrow">EUROPE BUSINESS TRIP 2026</div><h1>TechEx Europe・EuroBLECH 出張ガイド</h1><div class="subtitle">10/17（土）〜10/25（日）｜3名｜Amsterdam・Hannover・Bremen</div></div><div class="no-print header-actions"><button class="btn" id="detail-tg" type="button">＋詳細</button><button class="btn" type="button" onclick="window.print()" aria-label="印刷">印刷</button></div></div>';
  const nav = document.createElement('div');
  nav.className = 'field-nav';
  nav.innerHTML = '<div class="wrap"><nav class="tabs" id="tabs" role="tablist" aria-label="主要セクション"><button data-tab="itinerary" class="on" role="tab" aria-selected="true"><span class="ic">📅</span>旅程</button><button data-tab="prep" role="tab" aria-selected="false"><span class="ic">✅</span>準備</button><button data-tab="venue" role="tab" aria-selected="false"><span class="ic">🏢</span>会場</button><button data-tab="rec" role="tab" aria-selected="false"><span class="ic">📝</span>記録</button><button data-tab="family" role="tab" aria-selected="false"><span class="ic">🏠</span>家族</button></nav><div class="subbar" id="subbar"><div class="chips" id="day-chips"><span class="lbl">日付</span></div></div></div>';
  document.body.prepend(nav); document.body.prepend(header);
  const main = document.createElement('main'); main.className = 'wrap';
  [itinerary, prep, venue, record, family].forEach(panel => main.appendChild(panel));
  nav.after(main);
  document.body.insertAdjacentHTML('beforeend','<footer class="field-footer">Europe TechEx / EuroBLECH 2026 · field guide v3</footer><!--V3_SCRIPT-->');
  document.querySelectorAll('script').forEach(script => { if (script.id !== 'v3-build-transform') script.remove(); });
  document.getElementById('v3-build-transform')?.remove();
})();
</script>`;

source = source.replace('</body>', `${transformScript}\n</body>`);

const tempRoot = mkdtempSync(join(tmpdir(), 'event-pages-v3-'));
const inputPath = join(tempRoot, 'build-input.html');
const profilePath = join(tempRoot, 'edge-profile');
writeFileSync(inputPath, source, 'utf8');

try {
  let output = execFileSync(edgePath, [
    '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profilePath}`, '--virtual-time-budget=1500', '--dump-dom',
    pathToFileURL(inputPath).href,
  ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, windowsHide: true });
  if (!output.includes('class="route-four"') || !output.includes('class="day"')) {
    throw new Error('Static HRS transformation did not complete');
  }
  output = output.replace('<!--V3_SCRIPT-->', '<script src="v3.js"></script>');
  output = output.split(/\r?\n/).map(line => line.trimEnd()).join('\n').replace(/\n*$/, '\n');
  writeFileSync(outputPath, output, 'utf8');
  console.log(`Generated ${outputPath}`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
