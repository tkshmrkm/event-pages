import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedDir = path.resolve(here, '..', 'shared', 'trip-field');
const sourcePath = path.join(here, 'index_v2.html');
// 置換対象の文字列はLFで書いてある。リポジトリは .gitattributes の `* text=auto` と
// core.autocrlf=true により作業ツリーがCRLFになるため、読み込み時にLFへそろえる。
// これを外すと Windows のチェックアウトで Missing source fragment に必ず落ちる。
const readSource = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const source = readSource(sourcePath);
const sharedCoreCss = readSource(path.join(sharedDir, 'core.css'));
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

// 正規表現で1件だけ拾う抽出用。mustReplaceの「置換」ではなく「値を取り出す」
// 版。0件でも2件以上でも、意図しない箇所を拾っている可能性があるので止める。
function mustExtract(text, regex, label) {
  const matches = text.match(new RegExp(regex, regex.flags.includes('g') ? regex.flags : regex.flags + 'g'));
  if (!matches || matches.length !== 1) {
    throw new Error(`Extraction fragment count mismatch: ${label} (found ${matches ? matches.length : 0})`);
  }
  return matches[0];
}

// EuroBLECH方式の全件置換。同一文字列が複数箇所に出る場合に、件数を数えて
// 期待値と食い違ったら止める（黙って0件・過剰置換になるのを防ぐ）。
function replaceAllCounted(text, search, replacement, label, expectedCount) {
  const count = text.split(search).length - 1;
  if (count !== expectedCount) {
    throw new Error(`Replacement count mismatch: ${label} (expected ${expectedCount}, found ${count})`);
  }
  return text.split(search).join(replacement);
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
/* 日付カードの一括開閉。旅程タブ専用の操作なのでヘッダーではなくここに置く（202610_Europe_TechEx_EuroBLECHのv3.cssと同一） */
.day-toolbar{display:flex;align-items:center;justify-content:flex-end;gap:9px;margin:9px 0 0;color:var(--mu);font-size:var(--f5)}
.day-toolbar .btn{padding:5px 11px;font-size:var(--f5)}
/* 「＋詳細」トグルは廃止した。EUROBLECHにも無い。補足は常に出す。
   机上用印刷版は元から常時表示だったので、これで online と揃う。 */
.note,.dt{display:block}
/* 旅程はdivスタック。.actionと.route-fourの第1列を同じ幅にして、
   2列の行と4列の行で時刻を縦にそろえる。EUROBLECHと同じ考え方。 */
.tl-stack{display:block;background:#fff}
/* 時刻列は112px。表のときは列が内容に合わせて自動で広がったが、gridは広がらない。
   「13:00〜14:00」が112px要るので、そこに合わせたうえで折り返しも許す。 */
.action{display:grid;grid-template-columns:112px minmax(0,1fr);border-top:1px solid var(--line2);background:#fff}
.tl-stack>.action:first-child,.tl-stack>.route-four:first-child{border-top:0}
.action>div{min-width:0;padding:11px 12px;line-height:1.6}
.action>.row-time{border-right:1px solid var(--line);padding-left:7px;padding-right:7px;background:#F4F7F8;color:var(--tx2);font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;white-space:normal;overflow-wrap:anywhere}
.action.no-time>.row-time{color:transparent}
.action-body{color:var(--tx2);font-size:16px;overflow-wrap:anywhere}
.action:hover{background:#F7F9FB}
/* フライトの4列。畳むと発着の対応が読めなくなるので、スマートフォンでも4列のまま。 */
.route-four{display:grid;grid-template-columns:112px minmax(0,1fr) 124px minmax(0,1fr);border-top:1px solid var(--line2);background:#fff}
.route-four>div{min-width:0;padding:11px 7px;line-height:1.45}
.route-four>.row-time{border-right:1px solid var(--line);background:#F4F7F8;color:var(--tx2);font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;white-space:normal;overflow-wrap:anywhere}
.route-four>div+div+div{border-left:1px solid var(--line)}
.route-four .endpoint{color:var(--tx2);font-size:var(--f3);overflow-wrap:anywhere}
.route-four .endpoint .label{display:block;margin-bottom:5px;color:var(--mu);font-size:var(--f4);font-weight:700}
.route-four .endpoint time{display:inline;color:var(--tx);font-size:var(--f3);font-weight:700;line-height:1.45}
.route-four .endpoint .tz{display:inline;margin-left:2px;color:var(--mu);font-size:var(--f4);font-weight:600}
.route-four .endpoint .place{display:block;margin-top:5px;font-size:var(--f3);line-height:1.45}
.route-four .mode{display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--tx2);font-size:var(--f4);text-align:center;overflow-wrap:anywhere}
.route-four .mode strong{color:var(--tx2);font-size:var(--f3);font-weight:700}
/* 凡例は地の文なので、行内に並ぶようにする。.mode-iconの既定はflexで、そのままだと行が崩れる。 */
.legend .flight-mark,.legend .mode-icon{vertical-align:-4px;margin-right:1px}
.legend .mode-icon{display:inline-flex}
@media(max-width:640px){
  .wrap{padding-left:10px;padding-right:10px}
  .hdr-top{gap:8px}
  .hdr-top .no-print{align-self:center}
  .hdr .eyebrow{font-size:11px}
  .hdr h1{font-size:18px}
  .tabs button{min-width:0;padding-left:8px;padding-right:8px}
  .day-head .t{padding-right:64px}
  .action{grid-template-columns:82px minmax(0,1fr)}
  .action>div{padding:10px 9px}
  .action>.row-time{white-space:normal;overflow-wrap:anywhere}
  .route-four{grid-template-columns:82px minmax(0,1fr) 74px minmax(0,1fr)}
  .route-four>div{padding:9px 5px}
  .route-four>.row-time{white-space:normal;overflow-wrap:anywhere}
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
/* どこにいるか：202610_Europe_TechEx_EuroBLECHのv3.cssと同じ構造
   （section.family-where > .where-body > .where-lead + .where-grid、
   .where-day > .where-people > .where-cell）。都市名が主役なので、
   日付と補足はその手がかりに徹して小さくする。HRSは全行程が同一行動なので
   人別セルを持たず、.where-peopleの中は常に1セル。EuroBLECHの.is-shared
   （合流後の1セル表示）と同じ扱いにして、1セルでも幅いっぱいに広げる。 */
/* .family-section は5セクション構成の共通カード枠（出張サマリー／時差・気候／
   宿泊先情報／緊急連絡先）。.family-whereと同じ枠・見出し様式を再利用し、
   重複定義しない。 */
.family-where,.family-section{margin-bottom:14px;overflow:hidden;border:2px solid var(--line);border-radius:12px;background:#fff;box-shadow:0 1px 2px rgba(16,24,32,.05)}
.family-section-head{padding:10px 14px;background:var(--neu-bg);color:var(--tx2);font-size:16px;font-weight:700}
.where-body,.family-section-body{padding:13px 14px}
.where-lead{margin:0 0 11px;color:var(--tx2);font-size:13px;line-height:1.6}
.where-grid{display:grid;gap:8px}
.where-day{display:grid;grid-template-columns:56px minmax(0,1fr);overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff}
.where-day>header{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:10px 6px;background:var(--tx2);color:#fff;text-align:center}
.where-day>header strong{font-size:17px;line-height:1.1;font-variant-numeric:tabular-nums}
.where-day>header span{font-size:12px;opacity:.85}
.where-people{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));min-width:0}
.where-day.is-shared .where-people{grid-template-columns:minmax(0,1fr)}
.where-cell{min-width:0;border-left:1px solid var(--line);padding:9px 11px}
.where-cell:first-child{border-left:0}
/* 地図リンク用の.place（shared/trip-field/core.cssで#2A5FA0・太さ600・下線なし）と
   同じクラス名だが意味が違うので、.where-cellの内側だけ本文色・800・19pxへ上書きする。 */
.where-cell .place{display:block;color:var(--tx);font-size:19px;font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.where-cell small{display:block;margin-top:4px;color:var(--tx);font-size:13.5px;font-weight:600;line-height:1.5;overflow-wrap:anywhere}
.where-work small{color:#0B5C60}
.where-home small{color:var(--mu);font-weight:400}
.where-work{background:#F2F8F7}.where-work .place{color:#0B4F5A}
.where-move{background:#F6F7FA}
.where-home{background:#F7F8F8}.where-home .place{color:var(--mu)}
/* 時刻の読み方の宣言。EuroBLECHの.timezone-leadと同じ寸法。
   文面だけHRSの実態に合わせる（HRSは現地時刻と日本時間が混在するため）。 */
.timezone-lead{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin:0 0 10px;color:var(--tx2);font-size:14px}
.timezone-lead strong{color:#0B4F5A;font-size:19px;line-height:1.3}
.timezone-lead span{color:var(--mu);font-size:13px}
/* 時差：家族が使うのは差の数字なので、そこだけを大きくする（EuroBLECHと同じ.timezone-cards構造）。
   ゾーン名に国旗絵文字を入れない。国旗の合成外字はWindowsでは合成されず「JP」「DE」という
   文字のまま表示されることをユーザーが実機で確認済み（EuroBLECHは🇯🇵🇩🇪を使うが、
   HRSでは意図的に外す。これはEuroBLECHとの意図的な相違）。 */
.timezone-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.timezone-card{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:2px 8px;min-width:0;border:1px solid var(--line);border-radius:9px;padding:9px 10px;background:#F5F8F9;color:var(--tx2)}
.timezone-card span,.timezone-card small{grid-column:1/3}
.timezone-card span{font-size:13px;font-weight:700}
.timezone-card small{color:var(--mu);font-size:12px}
.timezone-card .tz-diff{grid-column:1/3;color:#0B4F5A;font-size:38px;font-weight:800;line-height:1.05;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.timezone-card .tz-diff i{margin-left:2px;font-size:15px;font-style:normal;font-weight:700}
.zone-japan .tz-diff{color:var(--mu);font-size:26px}
.zone-europe{border-color:#78A9A9;background:#E7F3F2}
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

// ---------- 交通手段アイコン（202610_Europe_TechEx_EuroBLECHのbuild_v3.mjs 303〜325行目付近と同一） ----------
// フライトは.flight-mark（core.cssのmaskアイコン）、それ以外は.mode-icon配下にSVGを差し込む。
const MODE_ICON_PATHS = {
  train: '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M8 16l-2 4m10-4 2 4"/>',
  car: '<path d="M5 17h14M4 17v-4l2-5h12l2 5v4M4 17v2h2v-2m12 0v2h2v-2M6 13h12"/><circle cx="8" cy="15" r=".8"/><circle cx="16" cy="15" r=".8"/>',
};
const MODE_ICON_LABELS = { train: '鉄道', car: 'タクシー' };
const modeIconHtml = kind => '<span class="mode-icon mode-icon-' + kind + '" role="img" aria-label="' + MODE_ICON_LABELS[kind] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + MODE_ICON_PATHS[kind] + '</svg></span>';
const flightMarkHtml = '<span class="flight-mark" role="img" aria-label="フライト"></span>';

// ---------- フライトの4列表示（EUROBLECH方式） ----------
// EUROBLECHの.route-fourは「row-time / endpoint / mode / endpoint」の4列を
// 1つのグリッドが持つ。時刻列をグリッドの外に出さない。各endpointは
// <span class="label">出発</span> と <time> を別要素として持ち、時刻をラベルに混ぜない。
// HRSの旅程は<table>なので、行を<td colspan="2">にしてその中へ同じ4列を置く。
//
// EUROBLECHとの相違は1点だけ。あちらの endpoint は <span class="tz">（JST）</span> と
// 空港名の地図リンクを持つが、HRSの元データは空港コードしか持たず、
// 時間帯も正式名称も書かれていない。書けば未検証の断定になるので付けていない。
// 空港の正式名称はいずれも元データにある。地図クエリも既存のものを使う。
// 時間帯はページ自身の数字で確定する。NGO 22:50発＋13時間5分でHEL 5:55着なら
// 到着地は出発地より6時間遅い。日本がUTC+9なのでHELはUTC+3。同じ計算を4区間で
// 行うと HEL=UTC+3・FRA=UTC+2 が2回ずつ一致する。9月はEUの夏時間なのでEEST/CEST。
const AIRPORTS = {
  NGO: ['中部国際空港（NGO）', 'JST',  '中部国際空港+セントレア'],
  HEL: ['ヘルシンキ空港（HEL）', 'EEST', 'Helsinki+Airport'],
  FRA: ['フランクフルト空港（FRA）', 'CEST', 'Frankfurt+Airport'],
};
const endpoint = (label, time, code) => {
  const [name, tz, query] = AIRPORTS[code];
  return `<div class="endpoint"><span class="label">${label}</span><time>${time}</time><span class="tz">（${tz}）</span>`
    + `<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=${query}" target="_blank" rel="noopener">${name}</a></div>`;
};
const routeFour = (rowTime, from, to, carrier, detail, depart, arrival) =>
  '<div class="route-four">'
  + `<div class="row-time">${rowTime}</div>`
  + endpoint('出発', depart, from)
  + `<div class="mode">${flightMarkHtml}<strong>${carrier}</strong><small>${detail}</small></div>`
  + endpoint('到着', arrival, to)
  + '</div>';
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 便名・機材・所要は元の丸括弧の中身をそのまま分解しただけ。到着時刻は
// 各区間の直後にある到着行の値。いずれもこちらで足した数字はない。
const FLIGHT_SEGMENTS = [
  ['22:50発', 'NGO発 → HEL（Finnair AY80／A350・13時間5分）',   'NGO', 'HEL', 'Finnair AY80',   'A350・13時間5分',  '22:50', '5:55'],
  ['7:40',    'HEL発 → FRA（AY1411／A321・2時間40分）',         'HEL', 'FRA', 'AY1411',         'A321・2時間40分',  '7:40',  '9:20'],
  ['19:20発', 'FRA発 → HEL（Finnair AY1416／A321・2時間25分）', 'FRA', 'HEL', 'Finnair AY1416', 'A321・2時間25分',  '19:20', '22:45'],
  ['0:45発',  'HEL発 → NGO（AY79／A350・12時間50分）',          'HEL', 'NGO', 'AY79',           'A350・12時間50分', '0:45',  '19:35'],
];

// ---------- 地図リンクを場所名そのものへ張り替える ----------
// 「地図」「（地図）」という別リンクをやめ、直前の場所名を<a class="place">で包む。
// hrefは既存のGoogle Maps検索リンクをそのまま流用する。3件目・4件目は、
// 3列目に'all'を指定すると全件を置換する（同一文が複数箇所に出る場合）。
const MAP_LINK_FIXUPS = [
  [
    '<strong>Stuttgart Hbf 着</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=Stuttgart+Hauptbahnhof" target="_blank" rel="noopener">地図</a>',
    '<strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Stuttgart+Hauptbahnhof" target="_blank" rel="noopener">Stuttgart Hbf</a> 着</strong>',
    1,
  ],
  [
    'Arnulf-Klett-Platz 側の乗り場 <a href="https://www.google.com/maps/search/?api=1&amp;query=Taxi+Stuttgart+Hauptbahnhof+Arnulf-Klett-Platz" target="_blank" rel="noopener">（地図）</a> から',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Taxi+Stuttgart+Hauptbahnhof+Arnulf-Klett-Platz" target="_blank" rel="noopener">Arnulf-Klett-Platz</a> 側の乗り場から',
    1,
  ],
  [
    'Berliner Platz (Liederhalle) <a href="https://www.google.com/maps/search/?api=1&amp;query=Berliner+Platz+Liederhalle+Stuttgart" target="_blank" rel="noopener">（地図）</a>（約3分）',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Berliner+Platz+Liederhalle+Stuttgart" target="_blank" rel="noopener">Berliner Platz (Liederhalle)</a>（約3分）',
    1,
  ],
  [
    '<strong>Maritim Stuttgart 着</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=Maritim+Hotel+Stuttgart+Seidenstrasse+34+70174+Stuttgart" target="_blank" rel="noopener">地図</a>',
    '<strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Maritim+Hotel+Stuttgart+Seidenstrasse+34+70174+Stuttgart" target="_blank" rel="noopener">Maritim Stuttgart</a> 着</strong>',
    1,
  ],
  [
    'Schlossplatz <a href="https://www.google.com/maps/search/?api=1&amp;query=Schlossplatz+Stuttgart" target="_blank" rel="noopener">地図</a>、',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Schlossplatz+Stuttgart" target="_blank" rel="noopener">Schlossplatz</a>、',
    1,
  ],
  [
    'Residenzschloss＋Blühendes Barock庭園 <a href="https://www.google.com/maps/search/?api=1&amp;query=Residenzschloss+Ludwigsburg" target="_blank" rel="noopener">地図</a> →',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Residenzschloss+Ludwigsburg" target="_blank" rel="noopener">Residenzschloss＋Blühendes Barock庭園</a> →',
    1,
  ],
  [
    // 9/9の「ホテル→Liederhalle」と、宿泊カード内の「会場 Liederhalle」の2箇所で共通。
    'Liederhalle <a href="https://www.google.com/maps/search/?api=1&amp;query=Kultur-+und+Kongresszentrum+Liederhalle+Berliner+Platz+1-3+70174+Stuttgart" target="_blank" rel="noopener">（地図）</a>',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Kultur-+und+Kongresszentrum+Liederhalle+Berliner+Platz+1-3+70174+Stuttgart" target="_blank" rel="noopener">Liederhalle</a>',
    2,
  ],
  [
    // 会場タブの📍付き別リンク形式。📍自体は場所名の目印として残す。
    '📍 <strong>Liederhalle</strong>（Berliner Platz 1-3） <a href="https://www.google.com/maps/search/?api=1&amp;query=Kultur-+und+Kongresszentrum+Liederhalle+Berliner+Platz+1-3+70174+Stuttgart" target="_blank" rel="noopener">地図</a> — ホテルから徒歩約3分',
    '📍 <strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Kultur-+und+Kongresszentrum+Liederhalle+Berliner+Platz+1-3+70174+Stuttgart" target="_blank" rel="noopener">Liederhalle</a></strong>（Berliner Platz 1-3） — ホテルから徒歩約3分',
    1,
  ],
  [
    // 9/12（プランB/D）・9/13（プランX/Z）の「BestWestern 着」×3。
    '<strong>BestWestern 着</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=Best+Western+Hotel+Airport+Frankfurt+De-Saint-Exupery-Strasse+6+60549+Frankfurt" target="_blank" rel="noopener">地図</a>',
    '<strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Best+Western+Hotel+Airport+Frankfurt+De-Saint-Exupery-Strasse+6+60549+Frankfurt" target="_blank" rel="noopener">BestWestern</a> 着</strong>',
    3,
  ],
  [
    '<strong>Best Western Hotel Airport Frankfurt</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=Best+Western+Hotel+Airport+Frankfurt+De-Saint-Exupery-Strasse+6+60549+Frankfurt" target="_blank" rel="noopener">（地図）</a>：9/12〜9/13',
    '<strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Best+Western+Hotel+Airport+Frankfurt+De-Saint-Exupery-Strasse+6+60549+Frankfurt" target="_blank" rel="noopener">Best Western Hotel Airport Frankfurt</a></strong>：9/12〜9/13',
    1,
  ],
  [
    'Best Western Hotel Airport Frankfurt（フランクフルト空港） <a href="https://www.google.com/maps/search/?api=1&amp;query=Best+Western+Hotel+Airport+Frankfurt+De-Saint-Exupery-Strasse+6+60549+Frankfurt" target="_blank" rel="noopener">（地図）</a>',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Best+Western+Hotel+Airport+Frankfurt+De-Saint-Exupery-Strasse+6+60549+Frankfurt" target="_blank" rel="noopener">Best Western Hotel Airport Frankfurt</a>（フランクフルト空港）',
    1,
  ],
  [
    // 9/12（プランA/C）の「Frankfurt空港発 → Mainz Hbf」×2。
    '<strong>Frankfurt空港発 → Mainz Hbf</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=Mainz+Hauptbahnhof" target="_blank" rel="noopener">地図</a>（約35〜40分）',
    '<strong>Frankfurt空港発 → <a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Mainz+Hauptbahnhof" target="_blank" rel="noopener">Mainz Hbf</a></strong>（約35〜40分）',
    2,
  ],
  [
    '<strong>Mainz Hbf発 → MEWA ARENA</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=MEWA+ARENA+Mainz" target="_blank" rel="noopener">地図</a>',
    '<strong>Mainz Hbf発 → <a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=MEWA+ARENA+Mainz" target="_blank" rel="noopener">MEWA ARENA</a></strong>',
    1,
  ],
  [
    // 9/12（プランB/D）・9/13（プランY）の「ケルン大聖堂と旧市街」×3。
    '<strong>ケルン大聖堂と旧市街</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=Koelner+Dom" target="_blank" rel="noopener">地図</a>',
    '<strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Koelner+Dom" target="_blank" rel="noopener">ケルン大聖堂と旧市街</a></strong>',
    3,
  ],
  [
    // 9/12（プランA）・9/13（プランX）の「Porsche Museum 見学」×2。
    '<strong>Porsche Museum 見学</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=Porsche+Museum+Stuttgart" target="_blank" rel="noopener">地図</a>',
    '<strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Porsche+Museum+Stuttgart" target="_blank" rel="noopener">Porsche Museum</a> 見学</strong>',
    2,
  ],
  [
    'Römerberg <a href="https://www.google.com/maps/search/?api=1&amp;query=Roemerberg+Frankfurt" target="_blank" rel="noopener">地図</a>',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Roemerberg+Frankfurt" target="_blank" rel="noopener">Römerberg</a>',
    1,
  ],
  [
    'Kleinmarkthalle <a href="https://www.google.com/maps/search/?api=1&amp;query=Kleinmarkthalle+Frankfurt" target="_blank" rel="noopener">地図</a>',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Kleinmarkthalle+Frankfurt" target="_blank" rel="noopener">Kleinmarkthalle</a>',
    1,
  ],
  [
    'Gutenberg博物館 <a href="https://www.google.com/maps/search/?api=1&amp;query=Gutenberg+Museum+Mainz" target="_blank" rel="noopener">地図</a>',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Gutenberg+Museum+Mainz" target="_blank" rel="noopener">Gutenberg博物館</a>',
    1,
  ],
  [
    'Mainzer Dom <a href="https://www.google.com/maps/search/?api=1&amp;query=Mainzer+Dom" target="_blank" rel="noopener">地図</a>',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Mainzer+Dom" target="_blank" rel="noopener">Mainzer Dom</a>',
    1,
  ],
  [
    '<strong>Maritim Stuttgart</strong> <a href="https://www.google.com/maps/search/?api=1&amp;query=Maritim+Hotel+Stuttgart+Seidenstrasse+34+70174+Stuttgart" target="_blank" rel="noopener">（地図）</a>（★★★★／Seidenstraße 34, 70174）',
    '<strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Maritim+Hotel+Stuttgart+Seidenstrasse+34+70174+Stuttgart" target="_blank" rel="noopener">Maritim Stuttgart</a></strong>（★★★★／Seidenstraße 34, 70174）',
    1,
  ],
  [
    'Maritim Stuttgart（シュトゥットガルト）　TEL +49 711 9420 <a href="https://www.google.com/maps/search/?api=1&amp;query=Maritim+Hotel+Stuttgart+Seidenstrasse+34+70174+Stuttgart" target="_blank" rel="noopener">（地図）</a>',
    '<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Maritim+Hotel+Stuttgart+Seidenstrasse+34+70174+Stuttgart" target="_blank" rel="noopener">Maritim Stuttgart</a>（シュトゥットガルト）　TEL +49 711 9420',
    1,
  ],
];

const dayToolbar = '<div class="day-toolbar no-print"><span>日付カード</span><button class="btn" id="days-tg" type="button" aria-expanded="true">すべて閉じる</button></div>';

const dayToggleScript = String.raw`  const openDay = id => {
    const d = document.getElementById(id);
    if (d && d.classList.contains('day')) d.open = true;
    syncDaysToggle();
    return d;
  };

  /* ---------- 日付ナビ ---------- */
  const dayBox = document.getElementById('day-chips');
  /* 端末のローカル日付（UTCではなく）。渡航中は現地日付になる。 */
  const todayISO = (() => {
    const n = new Date(), p = x => String(x).padStart(2,'0');
    return n.getFullYear() + '-' + p(n.getMonth()+1) + '-' + p(n.getDate());
  })();
  days.forEach(d => {
    const a = document.createElement('a');
    a.className = 'chip'; a.href = '#' + d.id;
    a.innerHTML = d.dataset.label + '<span style="font-weight:400;font-size:var(--f5);margin-left:2px">' + d.dataset.dow + '</span>';
    a.dataset.for = d.id;
    if (d.dataset.date === todayISO) a.classList.add('today');
    a.addEventListener('click', () => openDay(d.id));   /* 畳んだ日へ飛ぶときは開く */
    dayBox.appendChild(a);
  });

  /* ---------- 日付カードの一括開閉 ----------
     ラベルは今の状態を示すので、個別に開閉したときや日付チップで
     開いたときも追随させる（202610_Europe_TechEx_EuroBLECHのv3.jsと同一の判定）。
     開閉状態は保存しない（既定は全部開く）。                                */
  const daysToggle = document.getElementById('days-tg');
  const syncDaysToggle = () => {
    if (!daysToggle) return;
    const anyOpen = days.some(d => d.open);
    daysToggle.textContent = anyOpen ? 'すべて閉じる' : 'すべて開く';
    daysToggle.setAttribute('aria-expanded', String(anyOpen));
  };
  daysToggle?.addEventListener('click', () => {
    const closing = days.some(d => d.open);
    days.forEach(d => { d.open = !closing; });
    syncDaysToggle(); setH();
    if (closing) window.scrollTo({ top: 0, behavior: 'auto' });
  });
  days.forEach(d => d.addEventListener('toggle', syncDaysToggle));
  syncDaysToggle();`;

// 元CSSのコメントが旧アイコン方式（✈/🚆/🚕）のままだと、机上用印刷版に埋め込まれた
// ときに廃止済みの記号が残る。説明を現行方式へ書き換えてから連結する。
// v3.css（オンライン版が読む）と机上用印刷版（元CSSをそのまま埋め込む）の
// 両方に効かせる必要があるので、対にして2箇所で使う。
const LEGEND_COMMENT_OLD = '   ✈飛行機 🚆鉄道 🚕タクシー 🛂空港手続き 🏨宿 🍽食事 🏛観光 ⚽観戦 🤖HRS';
const LEGEND_COMMENT_NEW = '   交通手段はアイコン（.flight-mark／.mode-icon）。その他は 🛂空港手続き 🏨宿 🍽食事 🏛観光 ⚽観戦 🤖HRS';
const sourceCss = mustReplace(sourceCssMatch[1], LEGEND_COMMENT_OLD, LEGEND_COMMENT_NEW, 'legend comment in source CSS');
const compiledSharedCss = `${sourceCss}\n${sharedCoreCss}\n${outdoorCss}\n${familyCss}`.trim() + '\n';

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
      <p class="small muted">二人の共同メモは1件ずつ追加保存され、同時に送っても上書きしません。旅程選択や自由編集欄は最後の保存が優先されます。</p>
      <label class="cloud-key">記入者名<input type="text" autocomplete="name" data-trip-cloud-author placeholder="例：村上"></label>
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

const timestampAppendScript = String.raw`
  /* ---------- 当日メモ：二人で同じ欄へ名前・時刻付き追記 ---------- */
  const mountSharedDayNotes = cloud => recAll
    .filter(ta => ta.dataset.rec.endsWith(':day'))
    .forEach(ta => cloud.mountAppend(ta, 'rec:' + ta.dataset.rec));

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
  const cloud = TripField.createCloudSync({
    store,
    endpoint: document.querySelector('[data-trip-cloud]')?.dataset.endpoint || '',
    status: message => flash('☁ ' + message),
    onRestore: () => setTimeout(() => location.reload(), 500)
  });
  mountSharedDayNotes(cloud);

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
      if (day) cloud.mountAppend(ta, 'ses:' + k + ':day');
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
      const shared = cloud.entriesFor('ses:' + tr.dataset.k + ':day');
      if (!prep && !day && !shared.length) return;
      const enEl = tr.querySelector('.en').cloneNode(true);
      const kind = enEl.querySelector('.kind');
      const kindTx = kind ? kind.textContent.trim() : '';
      enEl.querySelectorAll('.kind,.st').forEach(n => n.remove());
      const en = (kindTx ? '[' + kindTx + '] ' : '') + enEl.textContent.trim().replace(/\s+/g, ' ');
      ses.push('### ' + en, '');
      if (prep) ses.push('- **事前の狙い・質問**：' + prep);
      if (day) ses.push('- **当日メモ**：' + day);
      shared.forEach(entry => ses.push('- **共同メモ** ' + entry.clientTime + ' · ' + entry.author + '：' + entry.text));
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

  // ---------- 「＋詳細」トグルの撤去 ----------
  // EUROBLECHはこのボタンを持たない。補足を隠す既定は、現地で見落としの元になる。
  // ボタンを消すだけだと.noteと.dtが永久に隠れるので、CSS側で常時表示にしてある。
  html = mustReplace(html, `  /* ---------- 詳細トグル（既定はOFF＝骨だけ表示） ---------- */
  const dtBtn = document.getElementById('detail-tg');
  function applyDetail(on){
    document.body.classList.toggle('detail', on);
    dtBtn.textContent = on ? '−詳細' : '＋詳細';
    dtBtn.style.background = on ? '#2C3440' : '';
    dtBtn.style.color = on ? '#fff' : '';
    dtBtn.style.borderColor = on ? '#2C3440' : '';
    store.set('detail', on);
    setH();
  }
  dtBtn.addEventListener('click', () => applyDetail(!document.body.classList.contains('detail')));
  applyDetail(store.get('detail', false));
`, `  /* 廃止した詳細トグルの保存値を落とす。書き出しが除くのは ui: 付きのキーだけなので、
     残すとバックアップJSONに毎回入り、読み込んだ端末へも複製される。
     古いJSONを読み込めば戻ってくるので、この1行は常設で意味がある。 */
  store.del('detail');
`, 'detail toggle script');

  html = html.replace(/<details class="day"/g, '<details class="day" open');
  // ---------- 交通手段アイコン（EuroBLECH方式） ----------
  // 旧方式（カラー絵文字✈️をモノクロ✈︎へ正規化するだけの処理）は廃止。
  // フライトは.flight-mark、鉄道・タクシーは.mode-iconへ差し替える。2列構造・文言は変えない。
  html = replaceAllCounted(html, '<span class="et t-fly">✈</span>', flightMarkHtml, 'flight icon (t-fly)', 8);
  html = replaceAllCounted(html, '<span class="et t-move">🚆</span>', modeIconHtml('train'), 'train icon (t-move)', 35);
  html = replaceAllCounted(html, '<span class="et t-taxi">🚕</span>', modeIconHtml('car'), 'taxi icon (t-taxi)', 1);
  // 旧ビルドはカラー絵文字✈️をモノクロ✈︎へ正規化していた。その処理を外した以上、
  // 交通行の外に残る✈️も.flight-markへ変えないと、カラー絵文字がそのまま出てしまう。
  html = replaceAllCounted(html, '<div class="joinbar" data-type="merge"><span>✈️</span>', `<div class="joinbar" data-type="merge"><span>${flightMarkHtml}</span>`, 'joinbar flight glyph', 1);
  html = replaceAllCounted(html, '<h2 class="ttl">✈️ 利用フライト', `<h2 class="ttl">${flightMarkHtml} 利用フライト`, 'flight card heading glyph', 1);
  // FAMのplaceはindex.htmlとfamily_print.htmlの両方でinnerHTML経由で描画されるのでHTMLを入れてよい。
  html = replaceAllCounted(html, "place:'✈️ 帰国日'", `place:'${flightMarkHtml} 帰国日'`, 'family return-day glyph', 1);
  // ---------- フライトを4列にする ----------
  // 到着行（「HEL 着」など）は乗継や入国手続きを持つ別の出来事なので、まとめない。
  // EUROBLECHの「到着と乗り継ぎは分ける」「日跨ぎ便で着いた日は◯◯着を出す」に従う。
  // ---------- 旅程の表をdivスタックへ ----------
  // EUROBLECHは.lane直下に.actionと.route-fourを並べる。両者の第1列が同じ幅なので、
  // 2列の行と4列の行で時刻が縦にそろう。<table>のcolspanではこの整列が作れない。
  // 旅程タブの106行はすべて<td class="t">X</td><td>Y</td>の同形でcolspanの例外は無い。
  // （ファイル全体では114行あるが、残り8行は準備タブの表で、ここでは触らない。）
  let stacks = 0, actions = 0;
  html = html.replace(/<table class="tl">[\s\S]*?<\/table>/g, block => {
    stacks++;
    const converted = block
      .replace(/^<table class="tl">/, '<div class="tl-stack">')
      .replace(/<\/table>$/, '</div>')
      .replace(/<tr><td class="t">([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><\/tr>/g, (m, time, body) => {
        actions++;
        return `<div class="action"><div class="row-time">${time}</div><div class="action-body">${body}</div></div>`;
      });
    // 変換漏れはこのブロックの中だけで見る。文書全体を見ると他タブの表を拾ってしまう。
    if (/<(?:table|tr|td)\b/.test(converted)) throw new Error(`Table markup left in itinerary stack ${stacks}`);
    return converted;
  });
  if (stacks !== 18) throw new Error(`Expected 18 itinerary tables, converted ${stacks}`);
  if (actions !== 106) throw new Error(`Expected 106 itinerary rows, converted ${actions}`);

  // ---------- フライトを4列にする ----------
  // 到着行（「HEL 着」など）は乗継や入国手続きを持つ別の出来事なのでまとめない。
  // 補足（機内泊など）は4列の中に押し込まず、EUROBLECHと同じく時刻なしの.actionへ出す。
  FLIGHT_SEGMENTS.forEach(([rowTime, text, from, to, carrier, detail, depart, arrival]) => {
    const pattern = new RegExp(
      `<div class="action"><div class="row-time">${escapeRe(rowTime)}</div>`
      + `<div class="action-body">${escapeRe(flightMarkHtml + text)}([\\s\\S]*?)</div></div>`
    );
    const found = html.match(pattern);
    if (!found) throw new Error(`Flight route ${from}-${to} not found`);
    const rest = found[1].trim();
    html = html.replace(pattern, routeFour(rowTime, from, to, carrier, detail, depart, arrival)
      + (rest ? `<div class="action no-time"><div class="row-time"></div><div class="action-body">${rest}</div></div>` : ''));
  });

  // 準備タブの鉄道チケットの行も交通手段の印なので、絵文字ではなくアイコンにそろえる。
  html = replaceAllCounted(html, '<div>🚆 鉄道は事前購入せず', `<div>${modeIconHtml('train')} 鉄道は事前購入せず`, 'rail ticket bullet', 1);
  // 机上用印刷版は元CSSをそのまま<style>へ埋め込むため、v3.css側とは別にここでも当てる。
  html = mustReplace(html, LEGEND_COMMENT_OLD, LEGEND_COMMENT_NEW, 'legend comment in embedded CSS');

  // ---------- 地図リンクを場所名そのものへ ----------
  MAP_LINK_FIXUPS.forEach(([search, replacement, expectedCount], i) => {
    html = replaceAllCounted(html, search, replacement, `map link fixup #${i}`, expectedCount);
  });

  // ---------- 日付カードの一括開閉 ----------
  html = mustReplace(
    html,
    '    <div class="foot legend">✈ 飛行機 ・ 🚆 鉄道 ・ 🚕 タクシー ・ 🛂 空港手続き ・ 🏨 宿 ・ 🍽 食事 ・ 🏛 観光 ・ ⚽ 観戦 ・ 🛋 ラウンジ ・ 🤖 HRS<span class="muted">｜印が無い行は徒歩か、その場での行動</span></div>\n  </div>\n\n  <!-- ---------- 9/7 ---------- -->',
    `    <div class="foot legend">${flightMarkHtml} 飛行機 ・ ${modeIconHtml('train')} 鉄道 ・ ${modeIconHtml('car')} タクシー ・ 🛂 空港手続き ・ 🏨 宿 ・ 🍽 食事 ・ 🏛 観光 ・ ⚽ 観戦 ・ 🛋 ラウンジ ・ 🤖 HRS<span class="muted">｜印が無い行は徒歩か、その場での行動</span></div>\n  </div>\n\n  ${dayToolbar}\n\n  <!-- ---------- 9/7 ---------- -->`,
    'day toolbar insertion point'
  );
  html = mustReplace(
    html,
    String.raw`  const openDay = id => {
    const d = document.getElementById(id);
    if (d && d.classList.contains('day')) d.open = true;
    return d;
  };

  /* ---------- 日付ナビ ---------- */
  const dayBox = document.getElementById('day-chips');
  /* 端末のローカル日付（UTCではなく）。渡航中は現地日付になる。 */
  const todayISO = (() => {
    const n = new Date(), p = x => String(x).padStart(2,'0');
    return n.getFullYear() + '-' + p(n.getMonth()+1) + '-' + p(n.getDate());
  })();
  days.forEach(d => {
    const a = document.createElement('a');
    a.className = 'chip'; a.href = '#' + d.id;
    a.innerHTML = d.dataset.label + '<span style="font-weight:400;font-size:var(--f5);margin-left:2px">' + d.dataset.dow + '</span>';
    a.dataset.for = d.id;
    if (d.dataset.date === todayISO) a.classList.add('today');
    a.addEventListener('click', () => openDay(d.id));   /* 畳んだ日へ飛ぶときは開く */
    dayBox.appendChild(a);
  });
  /* 全部開く／畳む（横スクロールする日付行ではなく、人フィルタ行の右端に置く） */
  const allBtn = document.createElement('button');
  allBtn.className = 'chip'; allBtn.style.marginLeft = 'auto'; allBtn.style.position = 'sticky'; allBtn.style.right = '0';
  const paintAll = () => { allBtn.textContent = days.every(d => d.open) ? '全部たたむ' : '全部ひらく'; };
  allBtn.addEventListener('click', () => {
    const toOpen = !days.every(d => d.open);
    days.forEach(d => d.open = toOpen);
    paintAll(); setH();
  });
  days.forEach(d => d.addEventListener('toggle', paintAll));
  paintAll();
  whoBox.appendChild(allBtn);`,
    dayToggleScript,
    'day card bulk toggle script'
  );
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
    <div><strong>講演ごとに、事前の狙い・質問と当日メモを入力できます。</strong>当日メモは「＋ 時刻付きで追記」で既存内容の末尾へ追加でき、入力のたび自動保存します。</div>
  </div>`;
  html = mustReplace(html, '<section class="tab" id="tab-venue" role="tabpanel" aria-label="会場">', '<section class="tab" id="tab-venue" role="tabpanel" aria-label="会場">\n' + venueStorageNotice, 'venue storage notice');
  html = html.replace(/<th>狙い・聞くこと<\/th><th>担当<\/th>/g, '<th>事前の狙い・質問</th><th>当日メモ</th>');
  html = mustReplace(
    html,
    '<div class="foot">💡 「狙い・聞くこと」「担当」は下の表に直接書けます（この端末に保存）。担当ボタンは <strong>空 → 京 → 犬 → 両</strong> の順に切り替わります。</div>',
    '<div class="foot">💡 事前に「狙い・質問」を入れておき、講演中は隣の「当日メモ」へ要点・数字・後で調べることを時刻付きで追記します。どちらも入力のたび自動保存されます。</div>',
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
  html = mustReplace(html, '  /* ---------- 記録の書き出し（Markdown） ---------- */', timestampAppendScript + '  /* ---------- 記録の書き出し（Markdown） ---------- */', 'timestamp append controls');
  html = mustReplace(
    html,
    /    \/\* 会場タブに書いた「狙い・聞くこと」「担当」 \*\/[\s\S]*?    if \(ses\.length\) L\.push\('## セッションの狙い・担当', '', \.\.\.ses, ''\);/,
    sessionMarkdownBlock,
    'session Markdown export'
  );
  html = mustReplace(html, "  document.getElementById('btn-export').addEventListener('click', () => {", '  const buildRecordMarkdown = () => {', 'Markdown builder start');
  html = mustReplace(html, "      const a = v(d.id + ':aim'), b = v(d.id + ':day'), c = v(d.id + ':after');\n      if (!a && !b && !c) return;", "      const a = v(d.id + ':aim'), b = v(d.id + ':day'), c = v(d.id + ':after');\n      const shared = cloud.entriesFor('rec:' + d.id + ':day');\n      if (!a && !b && !c && !shared.length) return;", 'shared day Markdown condition');
  html = mustReplace(html, "      if (b) L.push('- **当日**：' + b);", "      if (b) L.push('- **当日**：' + b);\n      shared.forEach(entry => L.push('- **共同メモ** ' + entry.clientTime + ' · ' + entry.author + '：' + entry.text));", 'shared day Markdown entries');
  html = mustReplace(html, originalMarkdownTail, markdownDownloadHandlers, 'Markdown copy and download handlers');
  html = mustReplace(
    html,
    /  \/\* ---------- 会場タブ：セッションごとの「狙い」記入欄と「担当」ボタン ----------[\s\S]*?\n  \}\);\n\n  \/\* ---------- 家族タブ：毎日の予定/,
    sessionFieldsScript + '  /* ---------- 家族タブ：毎日の予定',
    'session input fields'
  );
  html = html.replace('会場タブの「狙い・聞くこと」「担当」をすべて消します。', '会場タブの「事前の狙い・質問」「当日メモ」をすべて消します。');
  html = html.replace("    document.querySelectorAll('.ses .ow').forEach(bt => { bt.dataset.v = ''; bt.textContent = '—'; });\n", '');
  html = html.replace('入力はこの端末に自動保存されます（サーバー送信なし）。', '入力はまずこの端末・このブラウザ内に自動保存されます。Cloudflare同期を使う場合は、複数端末での同時編集を避けてください。');
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

// ---------- 家族印刷版の「どこにいて何をしているか」（EUROBLECH方式） ----------
// 家族が最初に知りたいのは「どの日にどこにいるか」なので、都市名を最大文字にし、
// 日付と予定はその手がかりに徹して小さくする。文言はFAMのまま。事実は足していない。
// HRSは全行程が同一行動なので、EUROBLECHのような人別セルは持たない。
// 日別の場所と予定はFAMが持っている。ここで別に書き起こすと二重管理になり、
// 「どこにいるか」と「毎日どこで何をしているか」が同じ内容で2つ並ぶ。FAMから作る。
function whereDays() {
  const match = source.match(/const FAM = (\{[\s\S]*?\n\});/);
  if (!match) throw new Error('FAM data not found');
  const fam = Function(`"use strict"; return (${match[1]});`)();
  const dowNames = ['日', '月', '火', '水', '木', '金', '土'];
  const keys = Object.keys(fam).sort();
  return keys.map((key, i) => {
    const date = new Date(`${key}T00:00:00Z`);
    const item = fam[key];
    // 国旗絵文字はWindowsで「DE」と出るうえ、都市名を最大文字にする妨げになる。
    // 最終日の`✈️ 帰国日`は場所ではないので、他の行と同じ「どこ→どこ」にそろえる。
    let city = item.place.replace(/^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u, '').replace(/^✈️\s*/, '');
    if (city === '帰国日') city = '機内 → 日本';
    return {
      date: `${date.getUTCMonth() + 1}/${date.getUTCDate()}`,
      dow: dowNames[date.getUTCDay()],
      city,
      note: item.note,
      kind: item.conf ? 'work' : (i === keys.length - 1 ? 'home' : 'move'),
    };
  });
}
// 都市名はEuroBLECHと同じ.placeを使う（地図リンク用の.placeと衝突しないよう、
// familyCss側で.where-cell .placeだけ本文色・800・19pxへ上書きする）。
// <span class="who">は入れない。HRSは全行程が同一行動で、人別セルを持たないため。
const whereCell = d => `<div class="where-cell where-${d.kind}"><b class="place">${d.city}</b><small>${d.note}</small></div>`;
const whereDay = d => `<article class="where-day is-shared"><header><strong>${d.date}</strong><span>${d.dow}</span></header><div class="where-people">${whereCell(d)}</div></article>`;
const whereBlock = `  <!-- どこにいるか（1日1行・都市名が主役。FAMが唯一の出どころ。EuroBLECHと同じ
       section.family-where > .where-body > .where-lead + .where-grid の構造）-->
  <section class="family-where"><div class="family-section-head">🗓 どこにいて何をしているか</div><div class="where-body"><p class="where-lead">出張期間中、別行動はない。</p><div class="where-grid">${whereDays().map(whereDay).join('')}</div></div></section>

`;

// 時差は、家族が使うのは差の数字なので、そこを最大文字にする。
// タイムゾーン略号とUTCオフセットは補足に落とす（EuroBLECHと同じ.timezone-cards構造）。
const timezoneCardOld = `      <div style="text-align:center;background:var(--conf-bg);border:1px solid var(--conf);border-radius:10px;padding:12px 10px">
        <div style="font-size:var(--f0);font-weight:700;color:var(--conf-tx);line-height:1.45">日本の時刻 <span style="color:var(--conf-tx)">− 7時間</span> ＝ 現地（ドイツ）の時刻</div>
        <div class="small" style="color:var(--conf-tx);margin-top:4px">例：日本の 21:00 → 現地は同じ日の 14:00</div>
      </div>`;
// ゾーン名に国旗絵文字を入れない（EuroBLECHは🇯🇵🇩🇪を使うが、Windowsでは合成されず
// 「JP」「DE」という文字のまま表示されることをユーザーが実機で確認済み。意図的な相違）。
// 「例：日本の21:00→現地は同じ日の14:00」は直後の既存の補足文（日本のほうが7時間
// 進んでいます…）に事実として残っているため、ここで別途持たせる必要はない。
const timezoneCardNew = `      <div class="timezone-cards">
        <div class="timezone-card zone-japan"><span>日本</span><strong class="tz-diff">基準</strong><small>JST・UTC+9</small></div>
        <div class="timezone-card zone-europe"><span>ドイツ</span><strong class="tz-diff">−7<i>時間</i></strong><small>CEST・UTC+2</small></div>
      </div>`;
// timezoneCardOldの中にあった「例：21:00→14:00」はEuroBLECHの.timezone-card構造
// （span/strong/smallの固定3要素）に収まらないため落ちる。事実を落とさないよう、
// 直後に残る既存の補足文（日本のほうが7時間進んでいます…）の末尾へ移す。
// 事実は変えず、置き場所だけ移動する。
const TIMEZONE_EXAMPLE_OLD = `      <div class="small muted" style="margin-top:8px">日本のほうが7時間進んでいます（9月のドイツは夏時間のため7時間。冬は8時間）。<br>
        つまり <strong>日本の夕方〜深夜が、現地の朝〜夕方</strong>。日本の午前中は、現地はまだ夜中です。</div>`;
const TIMEZONE_EXAMPLE_NEW = `      <div class="small muted" style="margin-top:8px">日本のほうが7時間進んでいます（9月のドイツは夏時間のため7時間。冬は8時間）。<br>
        つまり <strong>日本の夕方〜深夜が、現地の朝〜夕方</strong>。日本の午前中は、現地はまだ夜中です。<br>
        例：日本の 21:00 → 現地は同じ日の 14:00</div>`;

// 家族印刷版はbuildFamily()が変換前のsourceから切り出すので、
// buildMain()側の置換が届かない。同じ規約をこちら側にも当てる。
const FAMILY_FIXUPS = [
  // 帰国日のカラー絵文字はwhereDays()が落とすので、ここでは扱わない。
  // 地図リンクはホテル名そのものへ張る。「（地図）」の別リンクは出さない
  [
    '<strong>9/8〜9/12</strong>　Maritim Stuttgart（シュトゥットガルト）　TEL +49 711 9420 <a href="https://www.google.com/maps/search/?api=1&amp;query=Maritim+Hotel+Stuttgart+Seidenstrasse+34+70174+Stuttgart" target="_blank" rel="noopener">（地図）</a>',
    '<strong>9/8〜9/12</strong>　<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Maritim+Hotel+Stuttgart+Seidenstrasse+34+70174+Stuttgart" target="_blank" rel="noopener">Maritim Stuttgart</a>（シュトゥットガルト）　TEL +49 711 9420',
  ],
  [
    '<strong>9/12〜9/13</strong>　Best Western Hotel Airport Frankfurt（フランクフルト空港） <a href="https://www.google.com/maps/search/?api=1&amp;query=Best+Western+Hotel+Airport+Frankfurt+De-Saint-Exupery-Strasse+6+60549+Frankfurt" target="_blank" rel="noopener">（地図）</a>',
    '<strong>9/12〜9/13</strong>　<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Best+Western+Hotel+Airport+Frankfurt+De-Saint-Exupery-Strasse+6+60549+Frankfurt" target="_blank" rel="noopener">Best Western Hotel Airport Frankfurt</a>（フランクフルト空港）',
  ],
];

// ---------- 出張サマリー：連絡が取れない時間帯（日本時間） ----------
// このページ自身の記載（「日本のほうが7時間進んでいます」＝ドイツは日本より
// 7時間遅い）から算出しただけで、新しい事実ではない。
//   往路：22:50発（日本時間、NGO発） → 9:20フランクフルト着（現地時間） は
//         現地9:20＋7時間＝日本時間16:20。
//   復路：19:20発（現地時間、FRA発） は 日本時間で9/14 2:20。
//         19:35セントレア着（日本時間）まで機内。
const FAMILY_BLACKOUT_OUTBOUND = '9/7 22:50 〜 9/8 16:20';
const FAMILY_BLACKOUT_RETURN = '9/14 2:20 〜 9/14 19:35';

// ---------- 時差・気候：シュトゥットガルトと名古屋の平年値 ----------
// 数値は一次情報を読んで確認済み（ドイツ側は独語版Wikipediaの気候表、
// 名古屋側は気象庁の平年値）。ここでは調べ直さず、そのまま使う。
// 期間・出典が違う概算比較であることは家族印刷版の本文にも明記する。
const CLIMATE_ROWS = [
  ['シュトゥットガルト 9月', '21.0℃', '11.0℃', '独語版Wikipediaの気候表（2015–2020、出典表記は wetterdienst.de／wetterkontor.de）'],
  ['名古屋 10月', '23.3℃', '14.8℃', '気象庁 平年値（1991–2020）'],
  ['名古屋 11月', '17.3℃', '8.6℃', '気象庁 平年値（1991–2020）'],
];

function buildFamily() {
  const sectionMatch = source.match(/<section class="tab" id="tab-fam"[\s\S]*?<\/section>/);
  if (!sectionMatch) throw new Error('Family source not found');
  let section = sectionMatch[0]
    .replace('<section class="tab"', '<section class="tab on"')
    .replace('id="btn-print-fam"', 'onclick="window.print()"');
  FAMILY_FIXUPS.forEach(([search, replacement], i) => {
    if (!section.includes(search)) throw new Error(`Family fixup #${i} not found`);
    section = section.split(search).join(replacement);
  });
  section = mustReplace(section, timezoneCardOld, timezoneCardNew, 'family timezone card');
  section = mustReplace(section, TIMEZONE_EXAMPLE_OLD, TIMEZONE_EXAMPLE_NEW, 'family timezone example relocation');

  // ============================================================
  // 5セクションへ組み替える（出張サマリー／時差・気候／家族日程詳細／
  // 宿泊先情報／緊急連絡先）。②いまの状態（画面用の時計）と③毎日どこで
  // 何をしているかの表（fam-table）は、単純に抽出対象から外すことで
  // 落とす（whereBlockと内容が重複していたため）。
  // ============================================================

  // 印刷ボタン行はそのまま先頭に残す。
  const printBlock = mustExtract(section, /<div class="no-print"[\s\S]*?<\/div>\n/, 'family print-button block');

  // ①時差カードのtimezone-cardsと補足説明。
  const timezoneInner = mustExtract(
    section,
    /<div class="timezone-cards">[\s\S]*?<\/div>\s*<div class="small muted" style="margin-top:8px">[\s\S]*?例：日本の 21:00 → 現地は同じ日の 14:00<\/div>/,
    'family timezone inner block'
  );

  // ④日本時間で見るとカードの対応表。
  const japanTimeInner = mustExtract(
    section,
    /<div class="scroll-x"><table class="tb">[\s\S]*?<\/table><\/div>\s*<div class="foot">[\s\S]*?<\/div>/,
    'family japan-time table block'
  );

  // 🏨宿泊カードの3行（Maritim／BestWestern／機内泊）。地図リンクは
  // 既にFAMILY_FIXUPSでホテル名そのものへ張り替え済み。
  let hotelInner = mustExtract(
    section,
    /<div class="bd small" style="display:grid;gap:6px">\s*<div><strong>9\/8〜9\/12<\/strong>[\s\S]*?<div><strong>9\/7・9\/13の夜<\/strong>　機内<\/div>/,
    'family hotel lines block'
  );
  hotelInner = mustReplace(hotelInner, /^<div class="bd small" style="display:grid;gap:6px">\s*/, '', 'family hotel lines open-strip');

  // 🇯🇵万一のとき行から、大使館サイトと外務省サイトのURLだけを借りる
  // （地図リンクは新規に張るが、公式サイトのURLは既存のものをそのまま使う）。
  const emergencyRaw = mustExtract(
    section,
    /<div class="muted" style="padding-top:2px">🇯🇵 万一のとき：[\s\S]*?<\/div>/,
    'family emergency raw block'
  );
  const embassyHrefMatch = emergencyRaw.match(/href="([^"]+)"[^>]*>在ドイツ日本国大使館<\/a>/);
  const mofaHrefMatch = emergencyRaw.match(/href="([^"]+)"[^>]*>外務省 海外安全ホームページ<\/a>/);
  if (!embassyHrefMatch) throw new Error('Family emergency embassy link not found');
  if (!mofaHrefMatch) throw new Error('Family emergency MOFA link not found');
  const embassyHref = embassyHrefMatch[1];
  const mofaHref = mofaHrefMatch[1];

  // 出張サマリーで使う事実は、すべて既存ソースの中に既にある（新しい固有名詞・
  // 数字は持ち込まない）。ソースが変わったら気付けるよう、使う前に確認する。
  const summaryFacts = [
    '9/7（月）発 〜 9/14（月）着 ｜ 2名 ｜ Finnair NGO⇔FRA',
    'ロボットの国際会議',
    '9月14日（月）', '中部国際空港（セントレア）着',
    '入国審査・荷物受取に約40分', '20:35頃 セントレア発（ミュースカイ）',
    '21:50頃 京都駅', '21:40頃 犬山駅',
    '9/13（日）19:20 フランクフルト発', '9/14（月）19:35 セントレア着', 'Finnair',
    '9/7（月）22:50 セントレア発', '9/8（火）9:20 フランクフルト着',
  ];
  summaryFacts.forEach(fact => {
    if (!source.includes(fact)) throw new Error(`Family summary fact missing from source: ${fact}`);
  });

  // ---------- ① 出張サマリー ----------
  // 帰りの「19:20 フランクフルト発」は現地時刻、「19:35 セントレア着」は
  // 日本時刻。元のカードはどちらか書いていなかったので、ここで明示する。
  // 連絡が取れない時間帯は、ページ自身の時差（7時間）から出しただけの
  // 機内区間の時刻で、新しい事実ではない。
  const familySummarySection = String.raw`<section class="family-section family-summary"><div class="family-section-head">🧳 出張サマリー</div><div class="family-section-body" style="display:grid;gap:8px">
    <p class="where-lead">HRS Europe 2026（ロボットの国際会議）｜2026年9月7日（月）〜9月14日（月）｜ドイツ シュトゥットガルト→フランクフルト｜2名｜Finnair NGO⇔FRA</p>
    <div class="small"><strong>行きの便</strong>：9/7（月）22:50 セントレア発（日本時刻） → 9/8（火）9:20 フランクフルト着（現地時刻）</div>
    <div class="small"><strong>帰りの便</strong>：9/13（日）19:20 フランクフルト発（現地時刻） → ヘルシンキ乗継 → 9/14（月）19:35 セントレア着（日本時刻・Finnair）</div>
    <div class="small" style="font-weight:700">連絡が取れない時間帯（日本時間）：往路の機内 ${FAMILY_BLACKOUT_OUTBOUND}／復路の機内 ${FAMILY_BLACKOUT_RETURN}</div>
    <div class="small">帰宅の見込み：19:35 セントレア着 → 入国審査・荷物受取に約40分 → 20:35頃セントレア発（ミュースカイ） → 21:50頃京都駅／21:40頃犬山駅</div>
  </div></section>`;

  // ---------- ② 時差・気候 ----------
  const climateTableRows = CLIMATE_ROWS.map(([place, hi, lo, src]) =>
    `<tr><td>${place}</td><td>${hi}</td><td>${lo}</td><td>${src}</td></tr>`
  ).join('\n        ');
  const familyTimezoneSection = String.raw`<section class="family-section family-timezone"><div class="family-section-head">🕐 時差・気候</div><div class="family-section-body" style="display:grid;gap:12px">
    <p class="timezone-lead"><strong>時刻は現地時刻。日本時間には「日本時間」と付けます</strong><span>日本＝JST・UTC+9／ドイツ＝CEST・UTC+2</span></p>
    ${timezoneInner}
    ${japanTimeInner}
    <div>
      <p class="where-lead" style="margin-bottom:8px">現地の気候（季節感の目安）</p>
      <div class="scroll-x"><table class="tb">
        <thead><tr><th>地点・月</th><th>平均最高</th><th>平均最低</th><th>出典・期間</th></tr></thead>
        <tbody>
        ${climateTableRows}
        </tbody>
      </table></div>
      <div class="small muted" style="margin-top:6px">季節感でいうと、名古屋の10月下旬〜11月上旬くらい。日中は10月寄り、朝晩は11月寄りで、昼と朝晩の体感がずれる。<br>
        ※ シュトゥットガルト側は独語版Wikipediaの2015–2020の値（DWDの30年平年値ではない）。名古屋は気象庁の30年平年値（1991–2020）。期間も出典も異なる概算比較。<br>
        ※ 数値はシュトゥットガルトのもの。フランクフルト（9/12〜9/14）の気候は未確認。</div>
    </div>
  </div></section>`;

  // ---------- ④ 宿泊先情報 ----------
  const familyHotelSection = String.raw`<section class="family-section family-hotel"><div class="family-section-head">🏨 宿泊先情報</div><div class="family-section-body" style="display:grid;gap:6px">
    ${hotelInner}
  </div></section>`;

  // ---------- ⑤ 緊急連絡先 ----------
  // 大使館名そのものが地図リンク（プロジェクトの規約）。電話番号・住所は
  // 大使館公式サイトが403で確認できていないため載せない。渡航前に確認して
  // 書き込む欄だけを置く。
  const familyEmergencySection = String.raw`<section class="family-section family-emergency"><div class="family-section-head">🆘 緊急連絡先</div><div class="family-section-body" style="display:grid;gap:8px">
    <div class="small"><strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Embassy+of+Japan+in+Germany+Berlin" target="_blank" rel="noopener">在ドイツ日本国大使館</a></strong>　（<a href="${embassyHref}" target="_blank" rel="noopener">公式サイト</a>）</div>
    <div class="small muted">電話番号・住所は未確認です（大使館公式サイトが開けず確認できていません）。渡航前に公式サイトで確認し、下欄に書き込んでください。<br>
      電話：______________________　住所：______________________</div>
    <div class="small">欧州共通緊急番号：<a href="tel:112">112</a>（警察・消防・救急）</div>
    <div class="small"><a href="${mofaHref}" target="_blank" rel="noopener">外務省 海外安全ホームページ</a></div>
  </div></section>`;

  const openTag = mustExtract(section, /^<section[^>]*>/, 'family section open tag');
  const newSection = `${openTag}

  ${printBlock}
  ${familySummarySection}

  ${familyTimezoneSection}

  ${whereBlock}
  ${familyHotelSection}

  ${familyEmergencySection}
</section>`;

  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>HRS Europe 2026 家族向け予定表</title><link rel="stylesheet" href="v3.css"></head>
<body class="family-page" data-trip-layout="family-v1"><header class="family-head"><div class="wrap"><div class="eyebrow">HRS EUROPE 2026 · FAMILY COPY</div><h1>家族向け予定表</h1><p>2026年9月7日（月）〜9月14日（月）｜ドイツ出張</p></div></header><main class="wrap">${newSection}</main></body></html>`;
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
