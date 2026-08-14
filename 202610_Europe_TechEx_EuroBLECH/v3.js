const FIELD_KEY = 'eurotrip2026-v3';
const TAB_ALIASES = { events: 'venue', docs: 'prep', itinerary: 'itinerary', prep: 'prep', venue: 'venue', rec: 'rec', family: 'family' };
const days = Array.from(document.querySelectorAll('#tab-itinerary .day'));
const tabs = Array.from(document.querySelectorAll('#tabs [data-tab]'));
const subbar = document.getElementById('subbar');

function showTab(requested) {
  const tab = TAB_ALIASES[requested] || requested;
  document.querySelectorAll('main > .tab').forEach(panel => panel.classList.toggle('on', panel.id === `tab-${tab}`));
  tabs.forEach(button => {
    const on = button.dataset.tab === tab;
    button.classList.toggle('on', on);
    button.setAttribute('aria-selected', String(on));
  });
  subbar?.classList.toggle('off', tab !== 'itinerary');
  if (tab === 'itinerary') markDay();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

window.switchTab = showTab;
tabs.forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));

const dayBox = document.getElementById('day-chips');
const todayISO = (() => {
  const now = new Date();
  const pad = value => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
})();

function openDay(id) {
  const day = document.getElementById(id);
  if (!day) return;
  day.open = true;
  requestAnimationFrame(() => day.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

days.forEach(day => {
  const link = document.createElement('a');
  link.className = 'chip';
  link.href = `#${day.id}`;
  link.dataset.for = day.id;
  link.innerHTML = `${day.dataset.label}<span style="font-weight:400;font-size:var(--f5);margin-left:2px">${day.dataset.dow}</span>`;
  if (day.dataset.date === todayISO) link.classList.add('today');
  link.addEventListener('click', event => {
    event.preventDefault();
    openDay(day.id);
  });
  dayBox?.appendChild(link);
});

const dayChips = Array.from(dayBox?.querySelectorAll('.chip') || []);
function markDay() {
  if (!document.getElementById('tab-itinerary')?.classList.contains('on')) return;
  const line = (document.querySelector('.field-nav')?.offsetHeight || 0) + 12;
  let current = null;
  days.forEach(day => { if (day.getBoundingClientRect().top <= line) current = day.id; });
  if (!current) current = days.find(day => day.getBoundingClientRect().top >= 0)?.id || days[0]?.id;
  dayChips.forEach(chip => {
    const on = chip.dataset.for === current;
    chip.classList.toggle('on', on);
    if (on && dayBox) {
      const left = chip.offsetLeft - dayBox.offsetLeft;
      const right = left + chip.offsetWidth;
      if (left < dayBox.scrollLeft) dayBox.scrollLeft = Math.max(0, left - 8);
      else if (right > dayBox.scrollLeft + dayBox.clientWidth) dayBox.scrollLeft = right - dayBox.clientWidth + 8;
    }
  });
}

let scrollFrame = 0;
window.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; markDay(); });
}, { passive: true });

const todayCard = days.find(day => day.dataset.date === todayISO);
if (todayCard) {
  todayCard.open = true;
  todayCard.classList.add('today');
  setTimeout(() => todayCard.scrollIntoView({ block: 'start' }), 80);
}

document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || anchor.closest('#day-chips')) return;
  const target = document.querySelector(anchor.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  const panel = target.closest('.tab');
  if (panel && !panel.classList.contains('on')) showTab(panel.id.replace('tab-', ''));
  for (let item = target.closest('details'); item; item = item.parentElement?.closest('details')) item.open = true;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

const CHECKLIST = [
  '📘 旅券（有効期限6ヶ月以上確認・全員）',
  '🎫 EuroBLECH 入場券（村上・ベッコフ経由で無料発行済み／Eチケット持参）',
  '🎫 EuroBLECH 入場券（美馬・自身で購入済み／領収書を精算用に保管）',
  '🎫 EuroBLECH 入場券（金築・ベッコフ経由を連絡済み → 発券を待って受領）',
  '💻 TechEx Europe Gold Pass（村上・無償付与で取得済み／当日提示物を確認）',
  '<span class="flight-mark inline-flight-mark" role="img" aria-label="フライト"></span> CX 航空券 村上往路（NGO→HKG→AMS CX539/CX271・10/17 16:10発）購入手配',
  '<span class="flight-mark inline-flight-mark" role="img" aria-label="フライト"></span> CX 航空券 美馬・金築往路（NGO→HKG→FRA CX539/CX289・10/18 16:10発）手配',
  '<span class="flight-mark inline-flight-mark" role="img" aria-label="フライト"></span> 航空券 復路（FRA→HKG→NGO CX288/CX536・10/24発・NGO着 10/25 14:10）購入手配',
  '<span class="flight-mark inline-flight-mark" role="img" aria-label="フライト"></span> KL1791 AMS→HAJ 航空券購入（村上・10/20 16:50発）',
  '🏨 Holiday Inn Express Amsterdam - Sloterdijk Station（村上・10/18〜20 2泊）予約済み',
  '🏨 Hotel FREIgeist Göttingen Innenstadt（10/19〜23泊）予約済み・村上レイトチェックイン確認',
  '🏨 Toyoko Inn Frankfurt am Main Hauptbahnhof（全員・10/23泊）予約済み',
  '🏭 Mercedes-Benz Werk Bremen 工場見学（全員3名分・10/22 12:45〜14:00）予約確定済み',
  '🚆 美馬・金築 FRA→Göttingen 鉄道予約（RE2＋ICE774）',
  '🚆 美馬・金築 Göttingen⇄Wolfsburg 鉄道予約',
  '🎫 美馬・金築 Autostadt Wolfsburg 入場チケット手配',
  '🛄 Hotel FREIgeist 日中の荷物預かりを事前連絡',
  '🚆 Göttingen→Hannover Messe/Laatzen 鉄道予約',
  '🚆 Hannover Flughafen→Göttingen 鉄道予約',
  '🚆 Göttingen→Bremen Hbf 鉄道予約',
  '🚆 Hannover Messe/Laatzen→Frankfurt(Main) Hbf 鉄道予約',
  '🚄 京都⇄名古屋 新幹線＋名鉄ミュースカイ手配',
  '💳 クレジットカード／Revolut 海外設定確認',
  '📱 DB Navigator アプリ',
  '📱 Visit Japan Web（入国・税関情報を事前登録し、QRコードを端末に保存）',
  '📋 名刺（多めに用意）',
  '🔌 変換プラグ（Cタイプ・EU規格）',
];
const DEFAULT_CHECKED = new Set([1, 2, 4, 9, 10, 11, 12]);

function checklistDone(index) {
  const saved = localStorage.getItem(`${FIELD_KEY}:check:${index}`);
  return saved === null ? DEFAULT_CHECKED.has(index) : saved === '1';
}

function renderChecklist() {
  const body = document.getElementById('checklist-body');
  if (!body) return;
  body.innerHTML = CHECKLIST.map((item, index) => `<label class="check-item${checklistDone(index) ? ' done' : ''}"><input type="checkbox" data-check="${index}" ${checklistDone(index) ? 'checked' : ''}><span>${item}</span></label>`).join('');
  body.querySelectorAll('[data-check]').forEach(input => input.addEventListener('change', () => {
    localStorage.setItem(`${FIELD_KEY}:check:${input.dataset.check}`, input.checked ? '1' : '0');
    renderChecklist();
  }));
  const progress = document.getElementById('check-progress');
  if (progress) progress.textContent = `${CHECKLIST.filter((_, index) => checklistDone(index)).length}/${CHECKLIST.length}`;
}

function recordKey(key) { return `${FIELD_KEY}:record:${key}`; }
function fit(field) { field.style.height = 'auto'; field.style.height = `${Math.max(field.scrollHeight, 72)}px`; }

function mountRecords() {
  const root = document.getElementById('record-days');
  if (!root) return;
  root.innerHTML = days.map(day => {
    const date = day.querySelector('.day-head .d')?.textContent || day.dataset.label;
    const title = day.querySelector('.day-head .t')?.textContent || '当日の記録';
    return `<section class="record-card" data-record-day="${day.id}"><div class="record-heading"><span>${date}<small>${title}</small></span><span class="save-state">自動保存</span></div><label><span>事前の狙い</span><textarea data-rec="${day.id}:aim" rows="2"></textarea></label><label><span>当日メモ</span><textarea data-rec="${day.id}:day" rows="3"></textarea></label><label><span>帰国後の所感・次のアクション</span><textarea data-rec="${day.id}:after" rows="2"></textarea></label></section>`;
  }).join('');
  document.querySelectorAll('textarea[data-rec]').forEach(field => {
    field.value = localStorage.getItem(recordKey(field.dataset.rec)) || '';
    fit(field);
    field.addEventListener('input', () => {
      localStorage.setItem(recordKey(field.dataset.rec), field.value);
      fit(field);
      const state = field.closest('.record-card')?.querySelector('.save-state');
      if (state) { state.textContent = '保存済み'; clearTimeout(state._timer); state._timer = setTimeout(() => { state.textContent = '自動保存'; }, 1200); }
    });
  });
}

document.getElementById('export-records')?.addEventListener('click', () => {
  const lines = ['# TechEx Europe・EuroBLECH 2026 記録', ''];
  document.querySelectorAll('.record-card').forEach(card => {
    lines.push(`## ${card.querySelector('.record-heading span')?.childNodes[0]?.textContent?.trim() || card.dataset.recordDay}`);
    card.querySelectorAll('textarea[data-rec]').forEach(field => {
      const label = field.closest('label')?.querySelector('span')?.textContent || field.dataset.rec;
      lines.push('', `### ${label}`, field.value.trim() || '（未記入）');
    });
    lines.push('');
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); link.download = 'europe-2026-field-notes.md'; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
});

document.getElementById('clear-records')?.addEventListener('click', () => {
  if (!confirm('日別記録をこのブラウザから消去しますか？')) return;
  Object.keys(localStorage).filter(key => key.startsWith(`${FIELD_KEY}:record:`)).forEach(key => localStorage.removeItem(key));
  mountRecords();
});

renderChecklist();
mountRecords();
markDay();

window.addEventListener('beforeprint', () => days.forEach(day => { day.dataset.printOpen = String(day.open); day.open = true; }));
window.addEventListener('afterprint', () => days.forEach(day => { day.open = day.dataset.printOpen === 'true'; delete day.dataset.printOpen; }));
