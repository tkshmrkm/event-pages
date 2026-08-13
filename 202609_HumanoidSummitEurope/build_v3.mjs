import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedDir = path.resolve(here, '..', 'shared', 'trip-field');
const sourcePath = path.join(here, 'index_v2.html');
const source = fs.readFileSync(sourcePath, 'utf8');
const sharedCoreCss = fs.readFileSync(path.join(sharedDir, 'core.css'), 'utf8');
const sourceCssMatch = source.match(/<style>([\s\S]*?)<\/style>/);
if (!sourceCssMatch) throw new Error('Source CSS not found');
// Set this to the deployed trip-notes Worker URL. Never put SYNC_TOKEN here.
const cloudEndpoint = 'https://trip-field-sync.mrkn55.workers.dev';

function mustReplace(text, search, replacement, label) {
  if (typeof search === 'string' && !text.includes(search)) {
    throw new Error(`Missing source fragment: ${label}`);
  }
  if (search instanceof RegExp && !search.test(text)) {
    throw new Error(`Missing source pattern: ${label}`);
  }
  return text.replace(search, replacement);
}

const outdoorCss = String.raw`
/* ============================================================
   v3 field-use overrides — direct-sunlight mobile operation
   ============================================================ */
:root{
  --font:'BIZ UDPGothic','Yu Gothic UI','Meiryo',system-ui,sans-serif;
  --bg:#EDF2F3;--card:#FFFFFF;--line:#AEBCC3;--line2:#E3EAED;
  --tx:#101820;--mu:#46565F;--mu2:#5C6B73;--tx2:#263640;--tx3:#263640;
  --hov:#E7EEF0;
  --move:#9FD7D8;--move-tx:#0B3A3C;
  --conf:#F0B49F;--conf-tx:#5D200F;--conf-bg:#FBE8E0;
  --choose:#CFC7EA;--choose-tx:#302568;--tbd-bg:#EEEAF8;--tbd-bd:#A79BCB;
  --neu-bg:#D8E2E6;--neu-bd:#AEBCC3;
  --f0:24px;--f1:18px;--f2:16px;--f3:14px;--f4:13px;--f5:12px;
  --hdrh:104px;
}
body{line-height:1.62;padding-bottom:24px}
.wrap{max-width:940px;padding-left:12px;padding-right:12px}
.hdr{position:static;background:#fff;box-shadow:none;border-bottom:1px solid var(--line)}
.hdr-top{padding:12px 0 10px}
.hdr h1{font-size:20px}
.hdr .subtitle{font-size:13px;color:var(--tx2)}
.field-nav{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.98);border-bottom:2px solid var(--line);box-shadow:0 2px 6px rgba(16,24,32,.12)}
.tabs{gap:6px;padding-top:4px}
.tabs button{min-height:48px;padding:6px 14px;font-size:14px;color:var(--mu);border-bottom-width:4px}
.tabs button .ic{display:inline;margin-right:5px;font-size:16px}
.tabs button.on{color:var(--tx);border-bottom-color:#0B3A3C}
.subbar{padding:6px 0 7px;border-top:1px solid var(--line2)}
#who-chips{display:none!important}
.chips{gap:7px}
.chips .lbl{font-size:12px;color:var(--tx2)}
.chip{min-height:44px;padding:10px 14px;border-color:var(--line);font-size:13px;color:var(--tx2)}
.chip.on{background:#101820;border-color:#101820;color:#fff}
.tab{padding-top:12px}
.card,.day,.rec{border-width:2px;border-color:var(--line);box-shadow:0 1px 2px rgba(16,24,32,.05)}
.day{scroll-margin-top:calc(var(--hdrh) + 8px);margin-bottom:12px}
.day > summary.day-head{padding:12px 14px 12px 34px;min-height:64px}
.day > summary.day-head::before{left:14px;top:16px;font-size:14px}
.day-head .d{font-size:18px}
.day-head .t{font-size:14px;opacity:1;color:inherit}
.day-head .badge{top:12px;font-size:12px;padding:3px 9px;border:1px solid currentColor;background:rgba(255,255,255,.55)}
.day.confirmed > summary.day-head{background:var(--move);color:var(--move-tx)}
.day.confirmed .badge{background:#fff;border-style:solid}
.lane-head{font-size:13px;padding:8px 12px;border-bottom-color:var(--line)}
.lane[data-who=all]{background:#fff;color:var(--tx)}
.joinbar{background:var(--neu-bg);color:var(--tx2);border-color:var(--line);padding:10px 14px}
.tl td{padding:11px 12px;font-size:16px;border-top-color:var(--line2)}
.tl td.t{width:98px;font-size:14px;color:var(--tx2);background:#F4F7F8}
.sub,.opt,.lane-note{font-size:14px;color:var(--tx2)}
.note{font-size:13px;color:var(--mu);border-left-color:var(--line)}
.btn{min-height:44px;padding:9px 13px;font-size:13px;border-color:var(--line);color:var(--tx2)}
.banner{font-size:14px;border-width:2px}
.card > .ttl{padding:11px 14px;font-size:16px;color:var(--tx2)}
.memo > summary{min-height:44px;font-size:14px}
.memo textarea,.rec textarea,.ed{font-size:16px;border-color:var(--line)}
.ses td.prepc,.ses td.notec{width:34%}
.session-field-label{display:none;font-size:12px;font-weight:700;color:var(--tx2);margin-bottom:5px}
.ed.session-day{min-height:72px;background:#fff}
.transfer-help{margin:0 0 12px;padding:10px 12px;border:2px solid var(--line);border-radius:10px;background:#fff;color:var(--tx2);font-size:13px}
.secondary-entry{margin-top:14px}
.secondary-entry .bd{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.secondary-entry .btn{text-decoration:none;display:inline-flex;align-items:center}
.offline-mark{display:inline-block;margin-left:6px;padding:1px 7px;border-radius:999px;background:#101820;color:#fff;font-size:11px;vertical-align:2px}
.cloud-sync summary{cursor:pointer;list-style:none}
.cloud-sync summary::-webkit-details-marker{display:none}
.cloud-sync p{margin:0 0 9px}
.cloud-sync .cloud-key{display:grid;gap:5px;margin:8px 0;color:var(--mu2);font-size:var(--f3);font-weight:700}
.cloud-sync input[type=password]{width:100%;min-height:44px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--tx);font:16px/1.4 var(--font)}
.cloud-sync .cloud-remember{display:flex;gap:7px;align-items:flex-start;margin:8px 0 12px;font-size:var(--f3)}
.cloud-sync .cloud-remember input{width:18px;height:18px;margin:1px 0 0}
.cloud-sync .cloud-actions{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:7px}
.cloud-sync [data-trip-cloud-status]{min-height:1.5em;color:var(--mu);font-size:var(--f3)}
@media(max-width:640px){
  .wrap{padding-left:10px;padding-right:10px}
  .hdr-top{gap:8px}
  .hdr-top .no-print{align-self:center}
  .hdr .eyebrow{font-size:11px}
  .hdr h1{font-size:18px}
  .tabs button{min-width:0;padding-left:8px;padding-right:8px}
  .day-head .t{padding-right:64px}
  .lanes{grid-template-columns:1fr}
  .tl td{padding:10px 9px}
  .tl td.t{width:82px;white-space:normal}
  .plans{gap:7px;padding:9px 10px}
  .plans .chip{padding:9px 11px}
  .ses tr{padding-top:12px;padding-bottom:12px}
  .ses tr > td:nth-child(2){padding-right:0}
  .ses td.prepc,.ses td.notec{width:auto;margin-top:10px}
  .session-field-label{display:block}
}
@media print{
  .field-nav,.secondary-entry,.transfer-help{display:none!important}
  .hdr{border-bottom:1px solid #777}
}
`;

const familyCss = String.raw`
/* Family page: compact cards on phones, normal table on paper. */
.family-page{padding:0 0 24px}
.family-head{background:#fff;border-bottom:2px solid var(--line);padding:16px 0 12px}
.family-head h1{margin:2px 0;font-size:22px}
.family-head p{margin:0;color:var(--tx2);font-size:14px}
.family-page .tab,.family-page .tab.on{display:block}
@media(max-width:640px){
  .family-head{padding:12px 0 10px}
  .family-head h1{font-size:20px}
  .family-page #fam-table,.family-page #fam-table tbody,.family-page #fam-table tr,.family-page #fam-table td{display:block;width:100%}
  .family-page #fam-table thead{display:none}
  .family-page #fam-table tr{padding:0 0 10px;border:0;border-bottom:2px solid var(--line);background:#fff}
  .family-page #fam-table tr:last-child{border-bottom:0}
  .family-page #fam-table td{border:0;padding:5px 12px;white-space:normal;font-size:15px}
  .family-page #fam-table td:first-child{padding:8px 12px;background:var(--neu-bg);color:var(--tx);font-size:16px;font-weight:700}
  .family-page #fam-table td:nth-child(2){padding-top:8px;font-weight:700;color:var(--tx2)}
  .family-page #fam-table td:nth-child(2)::before{content:'場所';display:inline-block;min-width:52px;margin-right:6px;color:var(--mu);font-size:12px;font-weight:700}
  .family-page #fam-table td:nth-child(3)::before{content:'予定';display:inline-block;min-width:52px;margin-right:6px;color:var(--mu);font-size:12px;font-weight:700;vertical-align:top}
}
@media print{
  .family-head{padding-top:0}
  .family-page .tab{padding-top:8px}
  .family-page #fam-table{display:table;width:100%}
  .family-page #fam-table thead{display:table-header-group}
  .family-page #fam-table tbody{display:table-row-group}
  .family-page #fam-table tr{display:table-row}
  .family-page #fam-table td{display:table-cell;width:auto;padding:5px 8px;border:1px solid var(--line);font-size:var(--f3);background:transparent}
  .family-page #fam-table td:nth-child(2)::before,.family-page #fam-table td:nth-child(3)::before{display:none;content:none}
}
`;

const deskPrintCss = String.raw`
/* Static desk-print copy: itinerary, preparation, and venue reference only. */
body.desk-copy{background:#fff;padding-bottom:0}
body.desk-copy .field-nav,
body.desk-copy #tab-rec,
body.desk-copy #tab-fam,
body.desk-copy .memo,
body.desk-copy .secondary-entry,
body.desk-copy .plans,
body.desk-copy .no-print,
body.desk-copy .transfer-help{display:none!important}
body.desk-copy #tab-plan,
body.desk-copy #tab-prep,
body.desk-copy #tab-venue{display:block!important}
body.desk-copy #tab-prep,
body.desk-copy #tab-venue{margin-top:20px;padding-top:12px;border-top:3px solid var(--line)}
body.desk-copy .note,
body.desk-copy .dt,
body.desk-copy .plan.hide{display:block!important}
body.desk-copy .ses th:nth-child(n+3),
body.desk-copy .ses td:nth-child(n+3){display:none!important}
body.desk-copy .credit{padding-bottom:0}
body.desk-copy .desk-print-trigger{display:flex;gap:5px;flex-shrink:0}
@media print{
  body.desk-copy .desk-print-trigger{display:none!important}
  body.desk-copy .hdr{border-bottom:1px solid #555}
  body.desk-copy #tab-prep,
  body.desk-copy #tab-venue{break-before:page}
  body.desk-copy .tab{display:none!important}
  body.desk-copy #tab-plan,
  body.desk-copy #tab-prep,
  body.desk-copy #tab-venue{display:block!important}
}
`;

const compiledSharedCss = `${sourceCssMatch[1]}\n${sharedCoreCss}\n${outdoorCss}\n${familyCss}`.trim() + '\n';

const transferControls = String.raw`
    <button class="btn" id="btn-download-md">⬇ メモをMarkdownでDL</button>
    <button class="btn" id="btn-export-json">⬇ バックアップJSONをDL</button>
    <label class="btn" for="import-json" style="display:inline-flex;align-items:center">⬆ JSONを読み込む</label>
    <input id="import-json" type="file" accept="application/json,.json" hidden>
`;

const cloudPanel = String.raw`
  <details class="card cloud-sync no-print" data-trip-cloud data-endpoint="${cloudEndpoint}">
    <summary class="ttl">☁ Cloudflare同期</summary>
    <div class="bd">
      <p class="small muted">オンライン版のメモを端末間で同期します。同期キーは公開HTMLへ書かず、この画面で入力します。</p>
      <label class="cloud-key">同期キー<input type="password" autocomplete="current-password" data-trip-cloud-key></label>
      <label class="cloud-remember"><input type="checkbox" data-trip-cloud-remember> この端末に同期キーを保存</label>
      <div class="cloud-actions">
        <button class="btn" type="button" data-trip-cloud-pull>クラウドから読込</button>
        <button class="btn" type="button" data-trip-cloud-push>今すぐ保存</button>
      </div>
      <div data-trip-cloud-status role="status" aria-live="polite"></div>
    </div>
  </details>
`;

const transferScript = String.raw`
  /* ---------- オンライン版／オフライン版の記録移送（JSON） ---------- */
  const jsonButton = document.getElementById('btn-export-json');
  const jsonInput = document.getElementById('import-json');
  if (jsonButton) jsonButton.addEventListener('click', () => {
    const data = {};
    store.keys().forEach(fullKey => {
      const shortKey = fullKey.slice((EVENT_KEY + ':').length);
      try { data[shortKey] = JSON.parse(localStorage.getItem(fullKey)); }
      catch(e) { data[shortKey] = localStorage.getItem(fullKey); }
    });
    const payload = {
      schema: 'hrs2026-field-records',
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hrs2026-records-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash('✅ JSONを書き出しました');
  });
  if (jsonInput) jsonInput.addEventListener('change', () => {
    const file = jsonInput.files && jsonInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        if (!payload || payload.schema !== 'hrs2026-field-records' || payload.version !== 1 || !payload.data || Array.isArray(payload.data)) {
          throw new Error('形式が違います');
        }
        Object.entries(payload.data).forEach(([k, value]) => store.set(k, value));
        flash('✅ 読み込みました。画面を更新します');
        setTimeout(() => location.reload(), 600);
      } catch(e) {
        flash('⚠ JSONを読み込めませんでした');
      } finally {
        jsonInput.value = '';
      }
    };
    reader.readAsText(file);
  });
  TripField.createCloudSync({
    store,
    endpoint: document.querySelector('[data-trip-cloud]')?.dataset.endpoint || '',
    status: message => flash('☁ ' + message),
    onRestore: () => setTimeout(() => location.reload(), 500)
  });

`;

const confirmationScript = String.raw`
  /* ---------- 候補の選択と確定を分ける ---------- */
  document.querySelectorAll('.plans').forEach(box => {
    const group = box.dataset.group;
    const day = box.closest('.day');
    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'chip confirm-plan';
    const paintConfirmation = () => {
      const confirmed = store.get('plan-confirmed:' + group, false);
      day.classList.toggle('confirmed', confirmed);
      const badge = day.querySelector('.day-head .badge');
      if (badge) badge.textContent = confirmed ? '確定' : '検討中';
      confirmButton.textContent = confirmed ? '✓ 確定済み' : 'この案で確定';
      confirmButton.classList.toggle('on', confirmed);
    };
    confirmButton.addEventListener('click', e => {
      e.preventDefault();
      store.set('plan-confirmed:' + group, !store.get('plan-confirmed:' + group, false));
      paintConfirmation();
    });
    box.addEventListener('click', e => {
      if (!e.target.closest('.chip[data-plan]')) return;
      store.set('plan-confirmed:' + group, false);
      setTimeout(paintConfirmation, 0);
    });
    box.appendChild(confirmButton);
    paintConfirmation();
  });

`;

const sessionFieldsScript = String.raw`
  /* ---------- 会場タブ：講演ごとの事前準備と当日メモ ----------
     どちらもこの端末の localStorage に入力のたび保存する。
     従来の :aim キーは事前準備として引き継ぐ。                  */
  document.querySelectorAll('.ses tr[data-k]').forEach(tr => {
    const k = tr.dataset.k;
    const addField = ({ cellClass, label, placeholder, key, rows, day }) => {
      const td = document.createElement('td');
      td.className = cellClass;
      const caption = document.createElement('span');
      caption.className = 'session-field-label';
      caption.textContent = label;
      const ta = document.createElement('textarea');
      ta.className = 'ed' + (day ? ' session-day' : '');
      ta.rows = rows;
      ta.placeholder = placeholder;
      ta.setAttribute('aria-label', label);
      ta.value = store.get('ses:' + k + ':' + key, '');
      const grow = () => {
        ta.style.height = 'auto';
        ta.style.height = Math.max(ta.scrollHeight, day ? 72 : 52) + 'px';
      };
      if (ta.value) grow();
      ta.addEventListener('input', () => {
        store.set('ses:' + k + ':' + key, ta.value);
        grow();
      });
      td.append(caption, ta);
      tr.appendChild(td);
    };
    addField({
      cellClass:'prepc',
      label:'事前の狙い・質問',
      placeholder:'聞きたいこと、確認したい技術・企業',
      key:'aim', rows:2, day:false
    });
    addField({
      cellClass:'notec',
      label:'当日メモ',
      placeholder:'要点、発言、数字、後で調べること',
      key:'day', rows:3, day:true
    });
  });

`;

const sessionMarkdownBlock = String.raw`    /* 会場タブに書いた講演ごとの事前準備と当日メモ */
    const ses = [];
    document.querySelectorAll('.ses tr[data-k]').forEach(tr => {
      const prep = store.get('ses:' + tr.dataset.k + ':aim', '').trim();
      const day = store.get('ses:' + tr.dataset.k + ':day', '').trim();
      if (!prep && !day) return;
      const enEl = tr.querySelector('.en').cloneNode(true);
      const kind = enEl.querySelector('.kind');
      const kindTx = kind ? kind.textContent.trim() : '';
      enEl.querySelectorAll('.kind,.st').forEach(n => n.remove());
      const en = (kindTx ? '[' + kindTx + '] ' : '') + enEl.textContent.trim().replace(/\s+/g, ' ');
      ses.push('### ' + en, '');
      if (prep) ses.push('- **事前の狙い・質問**：' + prep);
      if (day) ses.push('- **当日メモ**：' + day);
      ses.push('');
    });
    if (ses.length) L.push('## 講演別メモ', '', ...ses);`;

const originalMarkdownTail = String.raw`    const text = L.join('\n');
    const done2 = () => flash('✅ コピーしました');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done2, () => fallback(text, done2));
    } else fallback(text, done2);
  });`;

const markdownDownloadHandlers = String.raw`    return L.join('\n');
  };

  document.getElementById('btn-export').addEventListener('click', () => {
    const text = buildRecordMarkdown();
    const done2 = () => flash('✅ Markdownをコピーしました');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done2, () => fallback(text, done2));
    } else fallback(text, done2);
  });

  document.getElementById('btn-download-md').addEventListener('click', () => {
    TripField.downloadText(
      buildRecordMarkdown(),
      'hrs2026-trip-notes-' + new Date().toISOString().slice(0,10) + '.md',
      'text/markdown;charset=utf-8'
    );
    flash('✅ Markdownをダウンロードしました');
  });`;

function buildMain({ offline = false } = {}) {
  let html = source;
  html = mustReplace(html, '<title>HRS Europe 2026 出張ガイド（v2・標準形）</title>', `<title>HRS Europe 2026 フィールドガイド v3${offline ? '（机上用印刷版）' : ''}</title>`, 'title');
  if (offline) {
    html = mustReplace(html, /<!--[\s\S]*?-->/, '<!-- Self-contained static desk-print copy; no note storage or runtime scripts. -->', 'desk-print document note');
  }
  html = mustReplace(html, '</style>', `${outdoorCss}\n${offline ? deskPrintCss : ''}\n</style>`, 'style end');

  const header = String.raw`<header class="hdr">
  <div class="wrap">
    <div class="hdr-top">
      <div>
        <div class="eyebrow">🇩🇪 HRS EUROPE 2026 · STUTTGART</div>
        <h1>HRS Europe 2026 フィールドガイド${offline ? '<span class="offline-mark">DESK PRINT</span>' : ''}</h1>
        <div class="subtitle">9/7（月）発 〜 9/14（月）着 ｜ 2名 ｜ Finnair NGO⇔FRA</div>
      </div>
      <div class="${offline ? 'desk-print-trigger' : 'no-print'}" style="display:flex;gap:5px;flex-shrink:0">
        ${offline ? '' : '<button class="btn" id="detail-tg" title="補足説明の表示を切り替え">＋詳細</button>'}
        <button class="btn" onclick="window.print()" aria-label="印刷">🖨</button>
      </div>
    </div>
  </div>
</header>
<div class="field-nav">
  <div class="wrap">
    <nav class="tabs" id="tabs" role="tablist" aria-label="主要セクション">
      <button data-tab="plan" class="on" role="tab" aria-controls="tab-plan" aria-selected="true"><span class="ic">📅</span>旅程</button>
      <button data-tab="venue" role="tab" aria-controls="tab-venue" aria-selected="false"><span class="ic">🤖</span>会場</button>
      <button data-tab="rec" role="tab" aria-controls="tab-rec" aria-selected="false"><span class="ic">📝</span>記録</button>
    </nav>
    <div class="subbar" id="subbar">
      <div class="chips" id="who-chips" aria-hidden="true"></div>
      <div class="chips" id="day-chips"><span class="lbl">日付</span></div>
    </div>
  </div>
</div>`;
  html = mustReplace(html, /<header class="hdr">[\s\S]*?<\/header>/, header, 'header');

  html = html.replace(/<details class="day"/g, '<details class="day" open');
  html = html.replace(/\u2708\uFE0F?/g, '\u2708\uFE0E').replace(/[🛫🛬]/gu, '\u2708\uFE0E');
  html = mustReplace(html, "const EVENT_KEY = 'hrs2026-v2';", "const EVENT_KEY = 'hrs2026-v3';", 'storage namespace');
  html = mustReplace(html, /const store = \{[\s\S]*?\n\};/, 'const store = window.TripField.createStore(EVENT_KEY);', 'shared storage runtime');
  html = mustReplace(html, "const hdr = document.querySelector('.hdr');", "const hdr = document.querySelector('.field-nav');", 'sticky height element');
  html = html.replace("{ id:'kyoto',   label:'京都発', short:'京', emoji:'👤', hue:{ bg:'#BAD2F7', fg:'#21518F', bd:'#8FB4E8' } }", "{ id:'kyoto',   label:'京都発', short:'京', emoji:'👤', hue:{ bg:'#B7D4F1', fg:'#153F68', bd:'#8EB6DC' } }");
  html = html.replace("{ id:'inuyama', label:'犬山発', short:'犬', emoji:'👤', hue:{ bg:'#B6E4C4', fg:'#1A5C33', bd:'#86CB9C' } }", "{ id:'inuyama', label:'犬山発', short:'犬', emoji:'👤', hue:{ bg:'#BFDFC6', fg:'#17482A', bd:'#91C49C' } }");

  const planIntro = offline
    ? `<div class="banner b-info"><span class="i">🖨</span><div><strong>机上用印刷版です。</strong>スマートフォンではオンライン版を使用します。この紙には旅程・準備・会場の参照情報だけを載せ、メモ入力欄は含めません。</div></div>`
    : `<div class="transfer-help"><strong>記録の正本はこのオンライン版です。</strong>入力はこの端末・ブラウザ内に保存されます。終了時はJSONを書き出してバックアップしてください。</div>`;
  html = mustReplace(html, '<section class="tab on" id="tab-plan" role="tabpanel" aria-label="旅程">', `<section class="tab on" id="tab-plan" role="tabpanel" aria-label="旅程">\n${planIntro}`, 'plan section');

  const venueStorageNotice = offline ? String.raw`<div class="banner b-info">
    <span class="i">🏛</span>
    <div><strong>会場の公式構成と確認事項です。</strong>講演中のメモ入力はスマートフォンのオンライン版を使用します。</div>
  </div>` : String.raw`<div class="banner b-info">
    <span class="i">📝</span>
    <div><strong>講演ごとに、事前の狙い・質問と当日メモを入力できます。</strong>入力のたび、この端末・このブラウザ内へ自動保存します。サーバーや別端末には自動同期されないため、終了時は「記録」からJSONも書き出してください。</div>
  </div>`;
  html = mustReplace(html, '<section class="tab" id="tab-venue" role="tabpanel" aria-label="会場">', '<section class="tab" id="tab-venue" role="tabpanel" aria-label="会場">\n' + venueStorageNotice, 'venue storage notice');
  html = html.replace(/<th>狙い・聞くこと<\/th><th>担当<\/th>/g, '<th>事前の狙い・質問</th><th>当日メモ</th>');
  html = mustReplace(
    html,
    '<div class="foot">💡 「狙い・聞くこと」「担当」は下の表に直接書けます（この端末に保存）。担当ボタンは <strong>空 → 京 → 犬 → 両</strong> の順に切り替わります。</div>',
    '<div class="foot">💡 事前に「狙い・質問」を入れておき、講演中は隣の「当日メモ」へ要点・数字・後で調べることを記録します。どちらも入力のたび自動保存されます。</div>',
    'venue field guidance'
  );

  const secondaryEntry = String.raw`
  <details class="card secondary-entry">
    <summary class="ttl" style="cursor:pointer;list-style:none"><h2 style="display:inline;font:inherit;margin:0">出発前の準備・家族向け資料</h2></summary>
    <div class="bd">
      <a class="btn" href="#" data-goto="prep">✅ 出発前準備を開く</a>
      <a class="btn" href="family_print.html">🖨 家族向け印刷版</a>
      <span class="small muted">現地で頻繁に使わない情報は主要ナビから分離しています。</span>
    </div>
  </details>
`;
  html = mustReplace(
    html,
    /<\/section>\s*(<!-- ==================== タブ：準備 ==================== -->)/,
    `${secondaryEntry}\n</section>\n\n$1`,
    'prep boundary'
  );
  html = mustReplace(html, '<section class="tab" id="tab-prep" role="tabpanel" aria-label="準備">', '<section class="tab" id="tab-prep" role="tabpanel" aria-label="準備">\n  <div class="no-print" style="margin-bottom:10px"><button class="btn" data-goto="plan">← 旅程へ戻る</button></div>', 'prep section');

  html = mustReplace(html, '<button class="btn" id="btn-export">📋 Markdownでコピー</button>', '<button class="btn" id="btn-export">📋 Markdownでコピー</button>\n' + transferControls, 'record buttons');
  html = mustReplace(html, '    <span class="small muted" id="export-msg" style="align-self:center" role="status" aria-live="polite"></span>\n  </div>', '    <span class="small muted" id="export-msg" style="align-self:center" role="status" aria-live="polite"></span>\n  </div>\n' + cloudPanel, 'cloud sync panel');
  html = mustReplace(html, "  document.getElementById('btn-clear').addEventListener('click', () => {", transferScript + "  document.getElementById('btn-clear').addEventListener('click', () => {", 'JSON script insertion');
  html = mustReplace(html, '  /* ---------- ToDo ---------- */', confirmationScript + '  /* ---------- ToDo ---------- */', 'confirmation script insertion');
  html = mustReplace(
    html,
    /    \/\* 会場タブに書いた「狙い・聞くこと」「担当」 \*\/[\s\S]*?    if \(ses\.length\) L\.push\('## セッションの狙い・担当', '', \.\.\.ses, ''\);/,
    sessionMarkdownBlock,
    'session Markdown export'
  );
  html = mustReplace(html, "  document.getElementById('btn-export').addEventListener('click', () => {", '  const buildRecordMarkdown = () => {', 'Markdown builder start');
  html = mustReplace(html, originalMarkdownTail, markdownDownloadHandlers, 'Markdown copy and download handlers');
  html = mustReplace(
    html,
    /  \/\* ---------- 会場タブ：セッションごとの「狙い」記入欄と「担当」ボタン ----------[\s\S]*?\n  \}\);\n\n  \/\* ---------- 家族タブ：毎日の予定/,
    sessionFieldsScript + '  /* ---------- 家族タブ：毎日の予定',
    'session input fields'
  );
  html = html.replace('会場タブの「狙い・聞くこと」「担当」をすべて消します。', '会場タブの「事前の狙い・質問」「当日メモ」をすべて消します。');
  html = html.replace("    document.querySelectorAll('.ses .ow').forEach(bt => { bt.dataset.v = ''; bt.textContent = '—'; });\n", '');
  html = html.replace('入力はこの端末に自動保存されます（サーバー送信なし）。', '入力はこの端末・このブラウザ内に自動保存されます（サーバー送信・別端末同期なし）。');
  html = html.replace('下のボタンで全文を Markdown にしてコピーでき、そのまま出張報告や <code>CHANGELOG.md</code> の材料になります。', 'PCでクラウド側の記録を読み込んだ後、全文をMarkdownファイルとしてダウンロードできます。コピーは出張報告や <code>CHANGELOG.md</code> の下書きに使えます。');

  html = html.replace('レイアウト v2（タブ × 日カード × レーン）', `レイアウト v3（屋外スマホ・連続旅程・3セクション）${offline ? '｜机上用印刷版' : ''}`);
  html = html.replace('更新日：2026年8月13日', '更新日：2026年8月13日（v3フィールド版）');
  html = html.replace('  showTab(store.get(\'tab\', \'plan\'));', "  showTab(['plan','venue','rec','prep'].includes(store.get('tab','plan')) ? store.get('tab','plan') : 'plan');");
  html = mustReplace(html, '<body>', offline
    ? '<body class="detail desk-copy" data-trip-layout="desk-print-v1" data-trip-copy="desk-print">'
    : '<body data-trip-layout="field-v1" data-trip-key="hrs2026-v3">', 'layout marker');
  const lastScript = html.lastIndexOf('<script>');
  if (lastScript < 0) throw new Error('Main script not found');
  if (offline) {
    const scriptEnd = html.indexOf('</script>', lastScript);
    if (scriptEnd < 0) throw new Error('Main script end not found');
    html = html.slice(0, lastScript) + html.slice(scriptEnd + '</script>'.length);
    html = html.replace(/data-done="1"/g, 'data-done="1" checked');
    html = html.replace(/<details(?![^>]*\bopen\b)/g, '<details open');
  } else {
    html = html.slice(0, lastScript) + '<script src="../shared/trip-field/runtime.js"></script>\n' + html.slice(lastScript);
    html = mustReplace(html, /<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="v3.css">', 'online stylesheet extraction');
  }
  return html;
}

function extractFamilyRows() {
  const match = source.match(/const FAM = (\{[\s\S]*?\n\});/);
  if (!match) throw new Error('FAM data not found');
  const fam = Function(`"use strict"; return (${match[1]});`)();
  const dow = ['日','月','火','水','木','金','土'];
  return Object.keys(fam).sort().map(key => {
    const date = new Date(`${key}T00:00:00Z`);
    const item = fam[key];
    return `<tr><td class="t">${date.getUTCMonth()+1}/${date.getUTCDate()}（${dow[date.getUTCDay()]}）</td><td>${item.place}</td><td>${item.note}</td></tr>`;
  }).join('\n');
}

function buildFamily() {
  const sectionMatch = source.match(/<section class="tab" id="tab-fam"[\s\S]*?<\/section>/);
  if (!sectionMatch) throw new Error('Family source not found');
  let section = sectionMatch[0]
    .replace('<section class="tab"', '<section class="tab on"')
    .replace('id="btn-print-fam"', 'onclick="window.print()"')
    .replace('<tbody id="fam-days"></tbody>', `<tbody id="fam-days">${extractFamilyRows()}</tbody>`);
  section = section.replace(/<!-- ② いまの状態[\s\S]*?<!-- ③ 毎日どこで何をしているか/, '<!-- 毎日どこで何をしているか');
  section = section.replace('出張中は<strong>その日の行が色付き</strong>になります。細かい時刻までは載せていません。', '細かい時刻は省き、居場所と大きな予定だけを載せています。');
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>HRS Europe 2026 家族向け予定表</title><link rel="stylesheet" href="v3.css"></head>
<body class="family-page" data-trip-layout="family-v1"><header class="family-head"><div class="wrap"><div class="eyebrow">HRS EUROPE 2026 · FAMILY COPY</div><h1>家族向け予定表</h1><p>2026年9月7日（月）〜9月14日（月）｜ドイツ出張</p></div></header><main class="wrap">${section}</main></body></html>`;
}

const outputs = [
  ['v3.css', compiledSharedCss],
  ['index.html', buildMain()],
  ['index_v3_offline.html', buildMain({ offline:true })],
  ['family_print.html', buildFamily()]
];

for (const [name, contents] of outputs) {
  const clean = contents.replace(/[ \t]+$/gm, '');
  fs.writeFileSync(path.join(here, name), clean, 'utf8');
  console.log(`${name}: ${Buffer.byteLength(clean)} bytes`);
}
