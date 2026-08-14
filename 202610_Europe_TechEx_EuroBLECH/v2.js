// HRS-inspired field UI and browser-local records for index_v2.html.
const FIELD_KEY = 'eurotrip2026-v2';
const PRIMARY_TABS = new Set(['itinerary', 'prep', 'events', 'rec', 'family']);

const ITINERARY_DAYS = {
  '1017': { kind: 'move', badge: '移動', lane: 'murakami', laneTitle: '村上（1日先行）', split: '別行動 — 村上が先行出発' },
  '1018': { kind: 'move', badge: '別行動', split: '別行動 — 村上はAmsterdam／美馬・金築は日本出発' },
  '1019': { kind: 'techex', badge: 'TechEx', split: '別行動 — 村上はTechEx／美馬・金築はWolfsburg' },
  '1020': { kind: 'move', badge: '別行動', split: '別行動 — 村上はTechExから移動／美馬・金築はEuroBLECH' },
  '1021': { kind: 'euro', badge: 'EuroBLECH', merge: '合流済み — ここから3名で行動' },
  '1022': { kind: 'visit', badge: '工場見学' },
  '1023': { kind: 'euro', badge: 'EuroBLECH' },
  '1024': { kind: 'move', badge: '移動' },
  '1025': { kind: 'move', badge: '帰着' },
};

const ITINERARY_TRANSPORTS = [
  ['1017', '京都駅発 → 名古屋', '10/17（土）11:30頃', 'JST', '京都駅', '新幹線 のぞみ', '約36分', '10/17（土）時刻未確認', 'JST', '名古屋駅'],
  ['1017', '名古屋駅発 → 中部国際空港', '10/17（土）12:35', 'JST', '名古屋駅', '名鉄ミュースカイ', '約28分', '10/17（土）13:03', 'JST', '中部国際空港駅'],
  ['1017', 'CX539 NGO発', '10/17（土）16:10', 'JST', '中部国際空港（NGO）', 'CX539', '4時間20分', '10/17（土）19:30', 'HKT', '香港国際空港（HKG）', '乗り換え：香港 3時間45分', 'HKG着（乗継 3時間45分）'],
  ['1017', 'CX271 HKG発', '10/17（土）23:15', 'HKT', '香港国際空港（HKG）', 'CX271', '13時間40分', '10/18（日）06:55', 'CEST', 'アムステルダム・スキポール空港（AMS）', '', '深夜便（総移動 約21時間45分）'],
  ['1018', 'Schiphol → Amsterdam Sloterdijk駅', '10/18（日）07:30', 'CEST', 'スキポール空港駅', 'NS直通列車', '約8〜10分', '10/18（日）07:38〜07:40頃', 'CEST', 'Amsterdam Sloterdijk駅'],
  ['1018', '京都駅発 → 名古屋', '10/18（日）11:30頃', 'JST', '京都駅', '新幹線 のぞみ', '約36分', '10/18（日）時刻未確認', 'JST', '名古屋駅'],
  ['1018', '名古屋駅発 → 中部国際空港', '10/18（日）12:35', 'JST', '名古屋駅', '名鉄ミュースカイ', '約28分', '10/18（日）13:03', 'JST', '中部国際空港駅'],
  ['1018', 'CX539 NGO発', '10/18（日）16:10', 'JST', '中部国際空港（NGO）', 'CX539', '4時間20分', '10/18（日）19:30', 'HKT', '香港国際空港（HKG）', '乗り換え：香港 4時間25分', 'HKG着（乗継 4時間25分）'],
  ['1018', 'CX289 HKG発', '10/18（日）23:55', 'HKT', '香港国際空港（HKG）', 'CX289', '13時間20分', '10/19（月）07:15', 'CEST', 'フランクフルト空港（FRA）', '', '深夜便（総移動 約22時間5分）'],
  ['1019', 'ホテル → RAI', '10/19（月）08:30', 'CEST', 'Holiday Inn Express Amsterdam - Sloterdijk Station', 'メトロ50系統＋徒歩', '約25〜28分', '10/19（月）08:55〜08:58頃', 'CEST', 'RAI Amsterdam'],
  ['1019', 'RAI → ホテルへ戻る', '10/19（月）時刻未確認', 'CEST', 'RAI Amsterdam', 'メトロ50系統＋徒歩', '所要時間未確認', '10/19（月）時刻未確認', 'CEST', 'Holiday Inn Express Amsterdam - Sloterdijk Station'],
  ['1019', 'RE2 + ICE774 FRA空港駅発', '10/19（月）08:22', 'CEST', 'フランクフルト空港駅', 'RE2＋ICE774', '2時間9分', '10/19（月）10:31', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）', '乗り換え：1回', 'ゲッティンゲン着 → Hotel FREIgeistへ荷物を預ける'],
  ['1019', 'ICE ゲッティンゲン発 → Wolfsburg', '10/19（月）11:00頃', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）', 'ICE（Hannover経由）', '約1時間15〜20分', '10/19（月）12:20頃', 'CEST', 'ヴォルフスブルク中央駅（Wolfsburg Hbf）'],
  ['1019', 'ヴォルフスブルク中央駅（Wolfsburg Hbf） 着 → Autostadtへ', '10/19（月）12:20頃', 'CEST', 'ヴォルフスブルク中央駅（Wolfsburg Hbf）', '徒歩', '約10分', '10/19（月）12:30頃', 'CEST', 'Autostadt'],
  ['1019', 'ICE ヴォルフスブルク中央駅', '10/19（月）17:30頃', 'CEST', 'ヴォルフスブルク中央駅（Wolfsburg Hbf）', 'ICE直通', '約1時間15〜20分', '10/19（月）18:45頃', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）', '', 'ゲッティンゲン着 → 荷物ピックアップ'],
  ['1020', 'チェックアウト（荷物持参）→ RAIへ', '10/20（火）時刻未確認', 'CEST', 'Holiday Inn Express Amsterdam - Sloterdijk Station', 'メトロ50系統＋徒歩', '約25〜28分', '10/20（火）時刻未確認', 'CEST', 'RAI Amsterdam'],
  ['1020', 'RAI →', '10/20（火）14:55', 'CEST', 'RAI Amsterdam', '鉄道（列車名未確認）', '約10分', '10/20（火）15:20頃', 'CEST', 'アムステルダム・スキポール空港（AMS）', '到着時刻は空港到着目安', '空港到着目安'],
  ['1020', 'KL1791（KLM Cityhopper）AMS発', '10/20（火）16:50', 'CEST', 'アムステルダム・スキポール空港（AMS）', 'KL1791／KLM Cityhopper', '55分', '10/20（火）17:45', 'CEST', 'ハノーファー空港（HAJ）'],
  ['1020', 'S5 Hannover Flughafen発', '10/20（火）19:06', 'CEST', 'ハノーファー空港駅（Hannover Flughafen）', 'S5', '17分', '10/20（火）19:23', 'CEST', 'ハノーファー中央駅（Hannover Hbf）'],
  ['1020', 'ICE77 ハノーファー中央駅', '10/20（火）19:53', 'CEST', 'ハノーファー中央駅（Hannover Hbf）', 'ICE77', '32分', '10/20（火）20:25', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）', '乗り換え：ハノーファー中央駅で30分'],
  ['1020', 'ICE888', '10/20（火）07:55', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）', 'ICE888（直通）', '28分', '10/20（火）08:23', 'CEST', 'ハノーファー・メッセ／ラーツェン駅', '', 'Hannover Messe/Laatzen着'],
  ['1021', 'ICE888', '10/21（水）07:55', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）', 'ICE888', '28分', '10/21（水）08:23', 'CEST', 'ハノーファー・メッセ／ラーツェン駅'],
  ['1022', 'ICE1674', '10/22（木）09:00', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）', 'ICE1674（直通）', '1時間45分', '10/22（木）10:45', 'CEST', 'ブレーメン中央駅（Bremen Hbf）'],
  ['1022', 'ブレーメン中央駅（Bremen Hbf） → ゲッティンゲン', '10/22（木）時刻未定', 'CEST', 'ブレーメン中央駅（Bremen Hbf）', '列車番号未定', '所要時間未確認', '10/22（木）18:00前目安', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）'],
  ['1023', 'ICE888', '10/23（金）07:55', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）', 'ICE888', '28分', '10/23（金）08:23', 'CEST', 'ハノーファー・メッセ／ラーツェン駅'],
  ['1023', 'S4', '10/23（金）14:30', 'CEST', 'ハノーファー・メッセ／ラーツェン駅', 'S4', '8分', '10/23（金）14:38', 'CEST', 'ハノーファー中央駅（Hannover Hbf）'],
  ['1023', 'ICE771', '10/23（金）14:53', 'CEST', 'ハノーファー中央駅（Hannover Hbf）', 'ICE771', '2時間21分', '10/23（金）17:14', 'CEST', 'フランクフルト中央駅（Frankfurt(Main) Hbf）', '乗り換え：ハノーファー中央駅で15分'],
  ['1024', 'フランクフルト中央駅（Frankfurt(Main) Hbf）', '10/24（土）10:15', 'CEST', 'フランクフルト中央駅（Frankfurt(Main) Hbf）', 'Airport Express', '約12分', '10/24（土）10:40', 'CEST', 'フランクフルト空港・Terminal 3', '発着時刻と所要時間の整合は要確認', 'FRA空港 到着'],
  ['1024', 'フランクフルト → 香港', '10/24（土）13:40', 'CEST', 'フランクフルト空港（FRA）', 'CX288', '11時間40分', '10/25（日）07:20', 'HKT', '香港国際空港（HKG）'],
  ['1025', 'CX536 HKG発', '10/25（日）09:35', 'HKT', '香港国際空港（HKG）', 'CX536', '3時間35分', '10/25（日）14:10', 'JST', '中部国際空港（NGO）', '', '中部国際空港（セントレア）着陸'],
];

function renderTransport(data) {
  const [, , departWhen, departZone, departPlace, service, duration, arriveWhen, arriveZone, arrivePlace, note] = data;
  return `<div class="hrs-transport">
    <div class="hrs-transport-point"><span>出発</span><strong>${departWhen}</strong><em>${departZone}</em><b>${departPlace}</b></div>
    <div class="hrs-transport-service"><span>${service.startsWith('CX') || service.startsWith('KL') ? '✈︎' : '→'}</span><strong>${service}</strong><small>所要時間：${duration}</small></div>
    <div class="hrs-transport-point"><span>到着</span><strong>${arriveWhen}</strong><em>${arriveZone}</em><b>${arrivePlace}</b></div>
  </div>${note ? `<div class="hrs-transport-note">${note}</div>` : ''}`;
}

function normalizeItineraryTransports(itinerary) {
  ITINERARY_TRANSPORTS.forEach(data => {
    const [dayId, match, , , , , , , , , , absorb] = data;
    const day = itinerary.querySelector(`#day-${dayId}`);
    const heading = Array.from(day?.querySelectorAll('.font-semibold') || []).find(el => el.textContent.includes(match));
    const row = heading?.closest('[class*="border-l-4"]');
    if (!row) return;
    row.classList.add('hrs-transport-row');
    row.innerHTML = renderTransport(data);
    if (absorb) {
      const absorbedHeading = Array.from(day.querySelectorAll('.font-semibold')).find(el => el !== heading && el.textContent.includes(absorb));
      absorbedHeading?.closest('[class*="border-l-4"]')?.classList.add('hrs-transport-absorbed');
    }
  });

  const arrivalActions = [
    ['1018', 'AMS 着', '06:55', '入国審査・荷物受取'],
    ['1019', 'FRA 着', '07:15', '入国審査・荷物受取'],
    ['1025', 'HKG 着', '07:20', '香港で乗り換え（2時間15分）'],
  ];
  arrivalActions.forEach(([dayId, match, time, label]) => {
    const day = itinerary.querySelector(`#day-${dayId}`);
    const heading = Array.from(day?.querySelectorAll('.font-semibold') || []).find(el => el.textContent.includes(match));
    const row = heading?.closest('[class*="border-l-4"]');
    if (!row) return;
    row.innerHTML = `<div class="hrs-action-time">${time}</div><div class="font-semibold">${label}</div>`;
  });

  const missingRoutes = [
    ['1021', 'Hotel FREIgeist Göttingen Innenstadt に宿泊', ['1021', '', '10/21（水）時刻未確認', 'CEST', 'ハノーファー・メッセ／ラーツェン駅', '列車番号未確認', '所要時間未確認', '10/21（水）時刻未確認', 'CEST', 'ゲッティンゲン中央駅（Göttingen Hbf）', 'EuroBLECH終了後の復路。時刻と列車を要確認']],
    ['1022', 'Mercedes-Benz Werk Bremen', ['1022', '', '10/22（木）10:45以降', 'CEST', 'ブレーメン中央駅（Bremen Hbf）', '現地交通手段未確認', '所要時間未確認', '10/22（木）12:45まで', 'CEST', 'Mercedes-Benz Werk Bremen', '工場への移動手段と集合場所を要確認']],
    ['1025', '解散・帰宅', ['1025', '', '10/25（日）15:00頃', 'JST', '中部国際空港駅', '名鉄ミュースカイ', '約28分', '10/25（日）15:28頃', 'JST', '名古屋駅']],
    ['1025', '解散・帰宅', ['1025', '', '10/25（日）時刻未確認', 'JST', '名古屋駅', '新幹線 のぞみ', '所要時間未確認', '10/25（日）16:45頃', 'JST', '京都駅']],
  ];
  missingRoutes.forEach(([dayId, beforeMatch, data]) => {
    const day = itinerary.querySelector(`#day-${dayId}`);
    const beforeHeading = Array.from(day?.querySelectorAll('.font-semibold') || []).find(el => el.textContent.includes(beforeMatch));
    const beforeRow = beforeHeading?.closest('[class*="border-l-4"]');
    if (!day || !beforeRow) return;
    const row = document.createElement('div');
    row.className = 'border-l-4 border-slate-400 pl-4 py-2 rounded-r-md text-sm hrs-transport-row';
    row.innerHTML = renderTransport(data);
    beforeRow.parentElement.insertBefore(row, beforeRow);
  });
}

function prepareTimelineRows(root) {
  root.querySelectorAll(':scope > [class*="border-l-4"]').forEach(row => {
    row.classList.add('hrs-timeline-row');
    const children = Array.from(row.children);
    const time = children.find(el => {
      const value = el.textContent.trim();
      return /^(?:\d{1,2}:\d{2}|\d{1,2}:\d{2}頃|\d{1,2}:\d{2}〜|\d{1,2}:\d{2}–|朝|午前|午後|夕方|夜|機内泊|日中|午前〜午後|午後〜|14:00以降)/.test(value);
    });
    if (time) {
      time.classList.add('hrs-time');
      row.insertBefore(time, row.firstChild);
    } else {
      row.classList.add('hrs-row-no-time');
    }
  });
}

function enhanceItineraryLayout() {
  const itinerary = document.getElementById('tab-itinerary');
  if (!itinerary || itinerary.dataset.hrsEnhanced === 'true') return;
  itinerary.dataset.hrsEnhanced = 'true';
  normalizeItineraryTransports(itinerary);

  const content = itinerary.querySelector(':scope > .max-w-2xl');
  if (content && !content.querySelector('.itinerary-rules')) {
    const rules = document.createElement('section');
    rules.className = 'itinerary-rules';
    rules.innerHTML = `
      <div><strong>旅程の読み方</strong><span>上から下へ、時刻順に読む</span></div>
      <div class="itinerary-rule-tags">
        <span class="rule-chip rule-move">移動日</span>
        <span class="rule-chip rule-techex">TechEx</span>
        <span class="rule-chip rule-euro">EuroBLECH</span>
        <span class="rule-chip rule-visit">工場見学</span>
      </div>
      <p>青＝村上、緑＝美馬・金築は、実際に別行動するレーン見出しだけに使用。合流後は灰色の「全員」です。</p>`;
    content.prepend(rules);
  }

  itinerary.querySelectorAll('.day-card[id^="day-"]').forEach(day => {
    const id = day.id.replace('day-', '');
    const meta = ITINERARY_DAYS[id] || { kind: 'move', badge: '移動' };
    day.classList.add('hrs-day');
    day.dataset.kind = meta.kind;

    const head = day.firstElementChild;
    const body = head?.nextElementSibling;
    if (!head || !body) return;
    head.classList.add('hrs-day-head');
    body.classList.add('hrs-day-body');
    if (!head.querySelector('.hrs-day-badge')) {
      const badge = document.createElement('em');
      badge.className = 'hrs-day-badge';
      badge.textContent = meta.badge;
      head.appendChild(badge);
    }

    const split = body.querySelector(':scope > .split-grid');
    if (split) {
      split.classList.add('hrs-lanes');
      Array.from(split.children).forEach((lane, index) => {
        lane.classList.add('hrs-lane', index === 0 ? 'lane-murakami' : 'lane-team');
        const laneHead = lane.firstElementChild;
        if (laneHead) laneHead.classList.add('hrs-lane-head');
        prepareTimelineRows(lane);
      });
      if (meta.split && !body.querySelector('.hrs-splitbar')) {
        const bar = document.createElement('div');
        bar.className = 'hrs-splitbar';
        bar.innerHTML = `<span>分岐</span><strong>${meta.split}</strong>`;
        body.insertBefore(bar, split);
      }
    } else {
      const lane = document.createElement('section');
      const isMurakami = meta.lane === 'murakami';
      lane.className = `hrs-lane ${isMurakami ? 'lane-murakami' : 'lane-all'}`;
      const laneHead = document.createElement('div');
      laneHead.className = 'hrs-lane-head';
      laneHead.textContent = meta.laneTitle || '全員';
      lane.appendChild(laneHead);
      const legacyGroup = body.querySelector(':scope > .space-y-2:only-child');
      if (legacyGroup) {
        const legacyPersonHead = legacyGroup.firstElementChild;
        if (legacyPersonHead && /^(?:👤|👥)/.test(legacyPersonHead.textContent.trim())) legacyPersonHead.remove();
        while (legacyGroup.firstChild) lane.appendChild(legacyGroup.firstChild);
        legacyGroup.remove();
      } else {
        while (body.firstChild) lane.appendChild(body.firstChild);
      }
      prepareTimelineRows(lane);
      body.appendChild(lane);
      if (meta.split) {
        const bar = document.createElement('div');
        bar.className = 'hrs-splitbar';
        bar.innerHTML = `<span>分岐</span><strong>${meta.split}</strong>`;
        body.insertBefore(bar, lane);
      }
    }

    if (meta.merge && !body.querySelector('.hrs-joinbar')) {
      const join = document.createElement('div');
      join.className = 'hrs-joinbar';
      join.innerHTML = `<span>合流</span><strong>${meta.merge}</strong>`;
      body.insertBefore(join, body.firstChild);
    }
  });

  const walker = document.createTreeWalker(itinerary, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    walker.currentNode.nodeValue = walker.currentNode.nodeValue.replace(/✈[\uFE0E\uFE0F]?|🛫|🛬/g, '✈︎');
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const panel = document.getElementById('tab-' + tabId);
  if (!panel) return;
  panel.classList.add('active');

  const selected = PRIMARY_TABS.has(tabId) ? tabId : (tabId === 'docs' ? 'prep' : 'rec');
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const on = btn.id === 'nav-' + selected;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-selected', String(on));
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function recordKey(key) {
  return FIELD_KEY + ':record:' + key;
}

function saveRecord(field) {
  localStorage.setItem(recordKey(field.dataset.rec), field.value);
  const state = field.closest('.record-card')?.querySelector('.save-state');
  if (state) {
    state.textContent = '保存済み';
    clearTimeout(state._timer);
    state._timer = setTimeout(() => { state.textContent = '自動保存'; }, 1200);
  }
}

function fitRecord(field) {
  field.style.height = 'auto';
  field.style.height = Math.max(field.scrollHeight, 72) + 'px';
}

function bindRecordField(field) {
  field.value = localStorage.getItem(recordKey(field.dataset.rec)) || '';
  fitRecord(field);
  field.addEventListener('input', () => {
    saveRecord(field);
    fitRecord(field);
  });
}

function mountDailyRecords() {
  const mount = document.getElementById('record-days');
  if (!mount) return;
  const days = Array.from(document.querySelectorAll('#tab-itinerary .day-card')).map(day => {
    const head = day.firstElementChild;
    const bits = head ? Array.from(head.querySelectorAll(':scope > span')).map(x => x.textContent.trim()) : [];
    return {
      id: day.id.replace('day-', ''),
      date: bits[0] || day.id,
      title: bits.slice(1).join(' ') || '当日の記録',
    };
  });

  mount.innerHTML = days.map(day => `
    <section class="record-card" data-record-day="${day.id}">
      <div class="record-heading"><span>${day.date}<small>${day.title}</small></span><span class="save-state" role="status" aria-live="polite">自動保存</span></div>
      <label><span>事前の狙い</span><textarea data-rec="${day.id}:aim" rows="2"></textarea></label>
      <label><span>当日メモ（実測・見たもの・聞いたこと）</span><textarea data-rec="${day.id}:day" rows="3"></textarea></label>
      <label><span>帰国後の所感・次のアクション</span><textarea data-rec="${day.id}:after" rows="2"></textarea></label>
    </section>`).join('');

  days.forEach(day => {
    const card = document.getElementById('day-' + day.id);
    if (!card || card.querySelector('.day-quick-note')) return;
    const note = document.createElement('div');
    note.className = 'day-quick-note no-print';
    note.innerHTML = `<label><span>📝 当日メモ</span><textarea data-rec="${day.id}:day" rows="2" placeholder="実測時刻・変更点・会話をその場で記録"></textarea></label>`;
    card.appendChild(note);
  });

  const byKey = new Map();
  document.querySelectorAll('textarea[data-rec]').forEach(field => {
    bindRecordField(field);
    const key = field.dataset.rec;
    const peers = byKey.get(key) || [];
    peers.push(field);
    byKey.set(key, peers);
    field.addEventListener('input', () => {
      peers.forEach(peer => {
        if (peer !== field && peer.value !== field.value) {
          peer.value = field.value;
          fitRecord(peer);
        }
      });
    });
  });
}

function recordPayload() {
  const data = {};
  document.querySelectorAll('textarea[data-rec]').forEach(field => {
    data[field.dataset.rec] = field.value;
  });
  return { schema: 'eurotrip2026-field-records', version: 1, exportedAt: new Date().toISOString(), data };
}

function downloadFile(name, body, type) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function exportMarkdown() {
  const lines = ['# ヨーロッパ出張 2026 記録', '', `書き出し: ${new Date().toLocaleString('ja-JP')}`, ''];
  const add = (label, value) => {
    lines.push(`### ${label}`, '', value.trim() || '（未記入）', '');
  };
  add('今回の狙い', document.querySelector('[data-rec="all:aim"]')?.value || '');
  document.querySelectorAll('[data-record-day]').forEach(card => {
    const heading = card.querySelector('.record-heading > span')?.innerText.replace(/\n+/g, ' — ') || card.dataset.recordDay;
    lines.push(`## ${heading}`, '');
    add('事前の狙い', card.querySelector('[data-rec$=":aim"]')?.value || '');
    add('当日メモ', card.querySelector('[data-rec$=":day"]')?.value || '');
    add('帰国後の所感・次のアクション', card.querySelector('[data-rec$=":after"]')?.value || '');
  });
  add('帰国後の総括', document.querySelector('[data-rec="all:after"]')?.value || '');
  downloadFile(`europe-trip-records-${new Date().toISOString().slice(0, 10)}.md`, lines.join('\n'), 'text/markdown;charset=utf-8');
}

function setupFieldUi() {
  enhanceItineraryLayout();
  mountDailyRecords();

  document.getElementById('detail-toggle')?.addEventListener('click', event => {
    const on = document.body.classList.toggle('show-details');
    event.currentTarget.textContent = on ? '−詳細' : '＋詳細';
    event.currentTarget.setAttribute('aria-pressed', String(on));
  });

  document.getElementById('btn-download-md')?.addEventListener('click', exportMarkdown);
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    downloadFile(`europe-trip-records-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(recordPayload(), null, 2), 'application/json');
  });
  document.getElementById('import-json')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (payload?.schema !== 'eurotrip2026-field-records' || payload.version !== 1 || !payload.data || Array.isArray(payload.data)) {
        throw new Error('形式が違います');
      }
      Object.entries(payload.data).forEach(([key, value]) => localStorage.setItem(recordKey(key), String(value ?? '')));
      document.querySelectorAll('textarea[data-rec]').forEach(field => {
        field.value = localStorage.getItem(recordKey(field.dataset.rec)) || '';
        fitRecord(field);
      });
      alert('記録を読み込みました。');
    } catch (error) {
      alert('JSONを読み込めませんでした。' + (error?.message ? '\n' + error.message : ''));
    } finally {
      event.target.value = '';
    }
  });
  document.getElementById('btn-clear-records')?.addEventListener('click', () => {
    if (!confirm('この端末に保存したv2の出張記録をすべて消します。よろしいですか？')) return;
    Object.keys(localStorage).filter(key => key.startsWith(FIELD_KEY + ':record:')).forEach(key => localStorage.removeItem(key));
    document.querySelectorAll('textarea[data-rec]').forEach(field => {
      field.value = '';
      fitRecord(field);
    });
  });
}
