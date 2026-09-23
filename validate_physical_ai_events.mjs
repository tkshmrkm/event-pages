import fs from 'node:fs';
import vm from 'node:vm';

const dataPath = new URL('./physical_ai_events.js', import.meta.url);
const htmlPath = new URL('./physical_ai_events_overview.html', import.meta.url);
const sandbox = { window: {} };
const errors = [];
const warnings = [];

vm.runInNewContext(fs.readFileSync(dataPath, 'utf8'), sandbox, {
  filename: 'physical_ai_events.js'
});

const events = sandbox.window.PHYSICAL_AI_EVENTS;
if (!Array.isArray(events)) {
  throw new Error('window.PHYSICAL_AI_EVENTS が配列ではありません');
}

const requiredCommon = [
  'id', 'dateStatus', 'name', 'budgetCandidate', 'importance',
  'businessFit', 'category', 'assignment', 'location', 'purpose'
];
const requiredConfirmed = ['sortDate', 'year', 'dateLabel', 'type', 'status'];
const requiredPending = ['order', 'handling'];
const allowedStatuses = new Set([
  '参加済み', '参加予定', '検討中', '候補', '不参加',
  '論文・発表追跡', '参考情報', '2027計画', '2028計画'
]);
const allowedTypes = new Set([
  '学会・専門会議', '展示会・見本市', '技術カンファレンス・サミット'
]);
const seenIds = new Set();
const seenRecords = new Set();
const seenPendingOrders = new Set();

function fail(index, event, message) {
  errors.push(`${index + 1}件目（${event?.name || '名称不明'}）: ${message}`);
}

events.forEach((event, index) => {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    errors.push(`${index + 1}件目: オブジェクトではありません`);
    return;
  }

  for (const key of requiredCommon) {
    if (!(key in event) || event[key] === '') fail(index, event, `${key} がありません`);
  }
  if (typeof event.budgetCandidate !== 'boolean') {
    fail(index, event, 'budgetCandidate は boolean で指定してください');
  }
  if (!['confirmed', 'pending'].includes(event.dateStatus)) {
    fail(index, event, `dateStatus が不正です: ${event.dateStatus}`);
  }
  if (seenIds.has(event.id)) fail(index, event, `id が重複しています: ${event.id}`);
  seenIds.add(event.id);

  const recordKey = `${event.dateStatus}\u0000${event.sortDate || ''}\u0000${event.name}`;
  if (seenRecords.has(recordKey)) fail(index, event, '同じイベント名・日付区分の行が重複しています');
  seenRecords.add(recordKey);

  if (event.dateStatus === 'confirmed') {
    for (const key of requiredConfirmed) {
      if (!(key in event) || event[key] === '') fail(index, event, `${key} がありません`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.sortDate || '') || Number.isNaN(Date.parse(`${event.sortDate}T00:00:00Z`))) {
      fail(index, event, `sortDate が不正です: ${event.sortDate}`);
    }
    if (!Number.isInteger(event.year) || event.year !== Number((event.sortDate || '').slice(0, 4))) {
      fail(index, event, `year と sortDate の年が一致しません: ${event.year} / ${event.sortDate}`);
    }
    if (!allowedStatuses.has(event.status)) fail(index, event, `status が不正です: ${event.status}`);
    if (!allowedTypes.has(event.type)) fail(index, event, `type が不正です: ${event.type}`);

    if (event.sortDate < '2026-09-23' && event.status === '参加予定') {
      warnings.push(`${event.name}: 開催日が基準日より前ですが参加予定のままです`);
    }
  }

  if (event.dateStatus === 'pending') {
    for (const key of requiredPending) {
      if (!(key in event) || event[key] === '') fail(index, event, `${key} がありません`);
    }
    if (!Number.isInteger(event.order) || event.order < 0) {
      fail(index, event, `order が不正です: ${event.order}`);
    }
    if (seenPendingOrders.has(event.order)) fail(index, event, `pending の order が重複しています: ${event.order}`);
    seenPendingOrders.add(event.order);
  }

  if ('sourceUrl' in event || 'verifiedAt' in event) {
    if (!event.sourceUrl || !event.verifiedAt) fail(index, event, 'sourceUrl と verifiedAt は対で指定してください');
    try {
      const url = new URL(event.sourceUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    } catch {
      fail(index, event, `sourceUrl が不正です: ${event.sourceUrl}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.verifiedAt || '')) {
      fail(index, event, `verifiedAt が不正です: ${event.verifiedAt}`);
    }
  }
});

const html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('<script src="physical_ai_events.js"></script>')) {
  errors.push('表示HTMLから physical_ai_events.js を読み込んでいません');
}
if (!html.includes('window.PHYSICAL_AI_EVENTS')) {
  errors.push('表示HTMLにイベントデータの描画処理がありません');
}
if (/<tr\s+data-datekey=/i.test(html)) {
  errors.push('表示HTMLに開催日確定イベントの行データが残っています');
}
if (!/<tbody\s+id="pendingTableBody">\s*<\/tbody>/i.test(html)) {
  errors.push('未確定イベント用 tbody が空の描画先になっていません');
}

const confirmedCount = events.filter(event => event.dateStatus === 'confirmed').length;
const pendingCount = events.filter(event => event.dateStatus === 'pending').length;

if (errors.length) {
  console.error(`FAIL: ${errors.length}件の問題`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${events.length}件（開催日確定 ${confirmedCount}件 / 未確定 ${pendingCount}件）`);
}

if (warnings.length) {
  console.warn(`WARN: ${warnings.length}件`);
  warnings.forEach(warning => console.warn(`- ${warning}`));
}
