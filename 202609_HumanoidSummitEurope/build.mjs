import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedDir = path.resolve(here, '..', 'shared', 'trip-field');
const sourcePath = path.join(here, 'source.html');
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
/* ヘッダーの家族／入国／レポ／印刷。EUROBLECHのstyle.cssと同じ規則をHRSにも持たせる
   （2026-08-19。クラスだけ出して規則が無く、393pxで見出しが4行に潰れていた）。 */
.header-actions{display:flex;gap:6px;flex:0 0 auto}
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
/* 補足の折り畳み。202610_Europe_TechEx_EuroBLECHのdetails.fold／.fold-bodyと同一定義
   （あちらのmt-1相当の上マージンはdetails.fold自身のmargin-topで持たせる）。 */
details.fold{margin-top:5px}
details.fold>summary{min-height:38px;display:flex;align-items:center;gap:5px;cursor:pointer;list-style:none;color:#2A5FA0;font-size:var(--f4);font-weight:600}
details.fold>summary::-webkit-details-marker{display:none}
details.fold>summary::before{content:'▸';color:var(--mu);font-size:var(--f5)}
details.fold[open]>summary::before{content:'▾'}
details.fold>.fold-body{margin-top:4px;border-left:2px solid var(--line);padding-left:9px;color:var(--tx2);font-size:var(--f4);line-height:1.6}
/* 折り畳みの中に置く経路図。393px幅に収めるため寸法は固定pxで持たず親幅に従わせる。
   PCで原寸まで伸びると紙にも画面にも大きすぎるのでmax-widthで止める。 */
.fold-body .route-map{display:block;width:100%;max-width:520px;height:auto;margin:6px 0;border:1px solid var(--line);border-radius:6px;background:#fff}
.fold-body .route-map-link{display:block;text-decoration:none}
.btn{min-height:44px;padding:9px 13px;font-size:13px;border-color:var(--line);color:var(--tx2)}
.banner{font-size:14px;border-width:2px}
/* .line-iconの定義はshared/trip-field/core.cssにある（全イベント共通）。
   個別名（-print／-calendar／-map）は意味づけのためのモディファイアで、
   スタイルはベースクラスが持つ。ここで寸法を上書きしない。 */
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
/* 日付カードの一括開閉。旅程タブ専用の操作なのでヘッダーではなくここに置く（202610_Europe_TechEx_EuroBLECHのstyle.cssと同一） */
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
  .hdr-top{gap:8px;align-items:center}
  .hdr-top .no-print{align-self:center}
  .header-actions{gap:4px}
  .header-actions .btn{padding-left:8px;padding-right:8px}
  .hdr .eyebrow{font-size:11px}
  .hdr h1{font-size:18px}
  /* 5タブ（概要・旅程・会場・準備・記録）だと8pxでは393pxに12px足りず、記録の右端が
     切れる。スクロールバーはCSSで消してあるので、切れていることに気付けない。
     6pxで5×68=340pxに収まる。min-height:48pxは触らないので指で押せる高さは変わらない
     （2026-08-16に実測）。 */
  .tabs button{min-width:0;padding-left:6px;padding-right:6px}
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
/* .family-section は5セクション構成の共通カード枠（出張サマリー／時差・気候／
   日程詳細／宿泊先情報／緊急連絡先）。「どこにいて何をしているか」は
   日程詳細と内容が重複するため削除済み（.family-whereと.where-*一式も廃止）。
   .family-scheduleも同じ枠を使う（202610_Europe_TechEx_EuroBLECHと同じ）。 */
.family-section,.family-schedule{margin-bottom:14px;overflow:hidden;border:2px solid var(--line);border-radius:12px;background:#fff;box-shadow:0 1px 2px rgba(16,24,32,.05)}
.family-section-head{padding:10px 14px;background:var(--neu-bg);color:var(--tx2);font-size:16px;font-weight:700}
.family-section-body{padding:13px 14px}
/* .where-leadはどこにいるかブロックの廃止後も、出張サマリー・気候の見出し段落として残る。 */
.where-lead{margin:0 0 11px;color:var(--tx2);font-size:13px;line-height:1.6}
/* 入国審査官に見せる1枚。英語で、紙に出したとき1ページに収まることを優先する。
   氏名・パスポート番号は入力欄で、印刷すると値がそのまま紙に出る。 */
.immi-page{background:#fff}
.immi-page .wrap{max-width:720px;margin:0 auto;padding:18px 16px 40px}
.immi-head{border-bottom:3px solid #0B5C60;padding-bottom:10px;margin-bottom:14px}
.immi-head h1{margin:2px 0 4px;font-size:24px;letter-spacing:.01em}
.immi-sub{margin:0 0 8px;color:var(--tx2);font-size:14px;font-weight:600}
.immi-id{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;margin-bottom:16px}
.immi-id label{display:grid;gap:4px}
.immi-id span{color:var(--mu);font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.immi-id input{border:0;border-bottom:1.5px solid #6B7A82;border-radius:0;padding:5px 2px;background:transparent;color:var(--tx);font-size:17px;font-weight:600}
.immi-id input:focus{outline:none;border-bottom-color:#0B5C60}
.immi-note{grid-column:1/-1;margin:2px 0 0;color:var(--mu);font-size:12px;line-height:1.6}
.immi-table{width:100%;border-collapse:collapse;font-size:13.5px}
.immi-table th,.immi-table td{border:1px solid var(--line);padding:9px 11px;text-align:left;vertical-align:top;line-height:1.65}
.immi-table th{width:150px;background:#EEF4F4;color:var(--tx);font-weight:700;white-space:nowrap}
.immi-foot{margin-top:14px;color:var(--mu);font-size:12px}
@media(max-width:560px){
  .immi-id{grid-template-columns:1fr}
  .immi-table th{width:auto;display:block;border-bottom:0}
  .immi-table td{display:block}
}
@media print{
  .immi-page .no-print{display:none!important}
  .immi-id input{border-bottom:1px solid #000}
  .immi-table{font-size:11.5pt}
}
/* 出張サマリーは面で分ける。白地に文字が続くだけだと、滞在地・日程・連絡不能の
   3種類が1つの塊に見える。EUROBLECHと同じ濃さ・同じ左罫にそろえる（2026-08-15）。 */
.sum-place,.sum-facts{border-radius:8px;padding:9px 11px;line-height:1.6}
.sum-place{border-left:4px solid;font-size:13px}
.sum-place strong{display:block;color:var(--tx);font-size:15px;font-weight:700}
.sum-place span{display:block;margin-top:3px;color:var(--tx2)}
.sum-a{background:#DBE8F6;border-left-color:#6C9BD2}
.sum-b{background:#D9EDE0;border-left-color:#63A87C}
.sum-facts{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 8px;background:#E6EAEE;border-left:4px solid #94A3B0;text-align:center;font-size:12px}
.sum-facts b{display:block;color:var(--tx);font-size:13px;font-weight:700}
.sum-facts span{display:block;color:var(--tx2)}
@media(max-width:420px){.sum-facts{grid-template-columns:1fr;text-align:left}}
/* 日程詳細（家族向け）：202610_Europe_TechEx_EuroBLECHのstyle.cssと同一定義
   （.schedule-body／.schedule-legend／.schedule-tag kind-*／.family-day-row／.agenda-line）。
   kind-*はHRSが実際に使う7種類だけを移植する（meal/techex/euro/visit/homeは未使用のため省く）。
   kind-moveとkind-workは共通トークン（--move/--move-tx/--conf/--conf-tx）を使うので、
   このファイル冒頭のHRS配色（outdoorCss）をそのまま継承する。
   .family-day-row aside .placeは個別に色指定しない。shared/trip-field/core.cssの
   既定.place（#2A5FA0・太さ600・下線なし）がEuroBLECHと同じ値のため重複させない。 */
.schedule-body{padding:12px}
.schedule-legend{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-bottom:10px;border:1px solid var(--line);border-radius:9px;padding:8px 10px;background:#F5F8F9}
.schedule-legend>strong{margin-right:3px;color:var(--tx2);font-size:13px}
.schedule-tag{display:inline-flex;align-items:center;width:fit-content;min-height:24px;border:1px solid currentColor;border-radius:999px;padding:2px 7px;font-size:11px;font-weight:700;white-space:nowrap}
.kind-flight{background:#E8E7FA;color:#40378A}
.kind-move{background:var(--move);color:var(--move-tx)}
.kind-transfer{background:#E9F2FA;color:#245A85}
.kind-procedure{background:#F1F3F4;color:#45545D}
.kind-work{background:var(--conf);color:var(--conf-tx)}
.kind-stay{background:#EEF5FB;color:#245A85}
.kind-review{background:#FFF0C2;color:#7A3E08}
/* HRSは全行程が同一行動なので、EuroBLECHの.family-shared（合流後の1枠表示）を
   毎日使う。人別の2枠は使わないため、grid-template-columnsはheader/section/asideの
   3列で足りる（EuroBLECHは人別2枠を持つため4列）。 */
.family-day-row{display:grid;grid-template-columns:72px minmax(0,1fr) 170px;overflow:hidden;margin-top:8px;border:1px solid var(--line);border-radius:9px;background:#fff}
.family-day-row>header{padding:11px 9px;background:var(--tx2);color:#fff;text-align:center}
.family-day-row>header strong,.family-day-row>header span{display:block}
.family-day-row>header strong{font-size:16px}
.family-day-row>header span{font-size:12px;opacity:.85}
.family-day-row>section,.family-day-row>aside{min-width:0;border-left:1px solid var(--line);padding:9px 10px}
.family-day-row h3{margin:0 0 7px;color:var(--mu);font-size:12px;font-weight:700;letter-spacing:.04em}
.agenda-line{display:grid;grid-template-columns:82px auto minmax(0,1fr);align-items:start;gap:6px;padding:7px 0;border-top:1px solid var(--line2)}
.agenda-line:first-of-type{border-top:0;padding-top:0}
.agenda-line time{color:#0B4F5A;font-size:14px;font-weight:800;line-height:1.35;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.agenda-line p,.family-day-row aside p{margin:0;color:var(--tx2);font-size:13px;line-height:1.55;overflow-wrap:anywhere}
.agenda-line p b{color:var(--tx)}
.family-day-row aside{background:#F7F9FA}
.family-day-row aside p+p{margin-top:8px;border-top:1px solid var(--line2);padding-top:8px}
.family-day-row aside small{color:var(--mu);font-size:11px}
/* 時刻の読み方の宣言。EuroBLECHの.timezone-leadと同じ寸法。
   文面だけHRSの実態に合わせる（HRSは現地時刻と日本時間が混在するため）。 */
.timezone-lead{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin:0 0 10px;color:var(--tx2);font-size:14px}
.timezone-lead strong{color:#0B4F5A;font-size:19px;line-height:1.3}
.timezone-lead span{color:var(--mu);font-size:13px}
/* 時差：家族が使うのは差の数字なので、そこだけを大きくする（EuroBLECHと同じ.timezone-cards構造）。
   ゾーン名に国旗絵文字を入れない。国旗の合成外字はWindowsでは合成されず「JP」「DE」という
   文字のまま表示されることをユーザーが実機で確認済み（EuroBLECHは日本・ドイツの国旗を
   使うが、HRSでは意図的に外す。これはEuroBLECHとの意図的な相違）。
   このコメント自身にも国旗を書かない。style.cssは絵文字の一括置換を通らないので、
   説明のつもりで書いた1文字がそのまま生成物に残る。 */
.timezone-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.timezone-card{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:2px 8px;min-width:0;border:1px solid var(--line);border-radius:9px;padding:9px 10px;background:#F5F8F9;color:var(--tx2)}
.timezone-card span,.timezone-card small{grid-column:1/3}
.timezone-card span{font-size:13px;font-weight:700}
.timezone-card small{color:var(--mu);font-size:12px}
.timezone-card .tz-diff{grid-column:1/3;color:#0B4F5A;font-size:38px;font-weight:800;line-height:1.05;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.timezone-card .tz-diff i{margin-left:2px;font-size:15px;font-style:normal;font-weight:700}
.zone-japan .tz-diff{color:var(--mu);font-size:26px}
.zone-europe{border-color:#78A9A9;background:#E7F3F2}
/* 気候：列を持つ表にすると、393px幅で出典列が168pxを占め、見出しが1文字ずつ
   縦に折り返して気温が押し出された。都市ごとの行にして、家族が見たい気温を
   大きく、出典・統計期間を小さい補足として下に置く（.timezone-cardと同じ
   「知りたい数字を大きく」の作り）。出典は消さず、重みだけ下げる。 */
.climate-list{display:grid;gap:8px}
.climate-row{min-width:0;border:1px solid var(--line);border-radius:9px;padding:9px 10px;background:#F5F8F9}
.climate-place{margin:0;color:var(--tx2);font-size:15px;font-weight:700;line-height:1.35}
.climate-temp{display:flex;flex-wrap:wrap;gap:2px 18px;margin:5px 0 0}
.climate-temp span{display:inline-flex;align-items:baseline;gap:6px}
.climate-temp i{color:var(--mu);font-size:12px;font-style:normal;font-weight:700}
.climate-temp b{color:#0B4F5A;font-size:22px;font-weight:800;line-height:1.25;letter-spacing:-.01em;font-variant-numeric:tabular-nums}
.climate-src{margin:6px 0 0;color:var(--mu);font-size:11px;line-height:1.5}
@media(max-width:640px){
  .family-head{padding:12px 0 10px}
  .family-head h1{font-size:20px}
  /* 日程詳細：header/section/asideの3列を2列（見出し＋本文）へ畳む。
     HRSは人別セクションを持たないので、本文列はsection・asideの2段だけでよい
     （EuroBLECHは人別2枠＋asideの3段）。202610_Europe_TechEx_EuroBLECHのstyle.css
     と同じ考え方だが、段数がHRSの実態に合わせて少ない。 */
  /* EuroBLECHの58pxそのままだと、HRSの2桁日付（9/10・9/12・9/13・9/14）が
     見出しの<strong>内で42px要り、40pxの余白（58px−左右padding18px）に収まらず
     折り返す。64pxへ広げて1行に収める。 */
  .family-day-row{grid-template-columns:64px minmax(0,1fr)}
  .family-day-row>header{grid-row:1/3}
  .family-day-row>section,.family-day-row>aside{grid-column:2;border-left:1px solid var(--line);border-top:1px solid var(--line)}
  .family-day-row>section{border-top:0}
  .agenda-line{grid-template-columns:82px minmax(0,1fr);gap:3px 7px}
  .agenda-line time{grid-row:1/3;font-size:14px}
  .agenda-line .schedule-tag{grid-column:2}
  .agenda-line p{grid-column:2}
}
@media print{
  .family-head{padding-top:0}
  .family-page .tab{padding-top:8px}
  /* 紙で途中に切れ目を作らない（2026-08-30）。Chromeで印刷した実物を見ると、
     3か所で割れていた。時差・気候は「現地の気候」の見出しだけが前ページに残り、
     9/11の日カードは日付と宿泊だけが前ページ、中身が次ページ、緊急連絡先は
     4行が次ページへこぼれていた。**畳める単位ごとにavoidを付ける。**
     .family-scheduleには付けない。8日分で1ページに収まらないので、
     満たせないavoidは無視され、代わりに日カードの途中で切れる。 */
  .family-section,.family-day-row{break-inside:avoid}
  .schedule-legend,.timezone-cards,.climate-row,.sum-place,.sum-facts,.agenda-line{break-inside:avoid}
  /* 見出しだけが前ページの末尾に取り残されないように、次の要素と離さない。 */
  .family-section-head,.schedule-legend{break-after:avoid}
  .family-section-body>*,.climate-list>*{orphans:2;widows:2}
}
`;

/* 概要タブ。各ブロックは索引であって内容ではない。1行の事実と詳細タブへの
   導線だけを置き、理由や候補の中身は旅程・会場・準備が持つ。ここが長くなると
   「ひと目で俯瞰する場所」でなくなる（2026-08-16）。 */
// 冒頭バナーの未確定サマリー。概要タブの日程概要も、どの日に札を付けるかを
// この1文から決める。未確定の日付を2か所で別々に持つと、片方だけ古くなる。
const UNDECIDED_BANNER = '未確定は <a href="#day-0912">9/12</a>・<a href="#day-0913">9/13</a> の過ごし方';

const overviewCss = String.raw`
.ov-days{width:100%;border-collapse:collapse;font-size:13px}
.ov-days th{background:var(--line2);border-bottom:1px solid var(--line);padding:5px 8px;color:var(--mu);font-size:12px;font-weight:700;text-align:left;white-space:nowrap}
.ov-days td{border-top:1px solid var(--line2);padding:7px 8px;vertical-align:top;line-height:1.55}
.ov-days td.ov-date{width:64px;color:var(--tx);font-weight:700;white-space:nowrap}
/* 宿泊列は190px。150pxだと最長の「Best Western Hotel Airport Frankfurt」が3行に
   割れていた（1行に必要な幅は267pxと実測、2026-08-16）。267pxまで広げると主な内容が
   痩せるので、2行に収まる190pxで止める。 */
.ov-days td.ov-stay{width:190px;color:var(--tx2)}
/* 未確定の理由。宿泊と同じ小さい灰色にすると、9/11のように理由と宿泊が続く行で
   2つが同じ列の値に見えた。左罫を付けて、主な内容への注記だと分かるようにする。 */
.ov-note{display:block;margin-top:3px;padding-left:7px;border-left:2px solid var(--line);color:var(--mu);font-size:12px}
/* 区分。便名や会議名が並ぶだけでは、その日が何の日かが読み取れない。
   進み具合の札（.plan-state）ではないので、そちらと見た目を分ける。
   札は2つまで。暦（休日）と中身（会議・企業訪問・移動）は別の軸なので、
   1つの札にまとめない。74pxでは2つ並ばないのでPC幅では自然に縦へ折り返し、
   日付と同じ行に出る430px以下では横に並ぶ。 */
.ov-days td.ov-kind{width:74px}
.ov-kind>span{display:inline-block;margin:0 4px 2px 0;border:1px solid var(--line);border-radius:4px;padding:0 6px;background:var(--hov);color:var(--tx2);font-size:11px;font-weight:700;white-space:nowrap}
/* 休日は面を反転させる。淡い面どうしだと隣の札と見分けが付かず、明記した意味が
   薄れる（--neuの面で試して読めなかった）。色相は増やさない。黄は警告、
   ラベンダーは未確定、ローズはHRSと決まっているので、濃い無彩に白抜きにする。 */
.ov-kind>span.ov-off{border-color:var(--tx2);background:var(--tx2);color:#fff}
/* フライトは1区間1行。日程概要は1日1行が原則だが、便だけは例外にする。復路が
   「過ごし方は未定」に隠れて、帰国便が概要のどこにも出ていなかった（2026-08-23）。
   横に並べ、入りきらなければ折り返す。393pxで2行、PC幅で1行に収まる分量に留める。 */
.ov-leg{display:flex;flex-wrap:wrap;align-items:baseline;gap:1px 7px;margin-top:4px;font-size:12px;line-height:1.5;color:var(--tx2)}
.ov-leg:first-child{margin-top:0}
.ov-leg+.ov-main{margin-top:4px}
.ov-leg .line-icon{color:var(--mu)}
.ov-leg-no,.ov-leg-code,.ov-leg-pt b{color:var(--tx);font-weight:700}
.ov-leg-pt{display:inline-flex;align-items:baseline;gap:3px;white-space:nowrap}
.ov-leg-day,.ov-leg-tz,.ov-leg-pt em,.ov-leg-dur{color:var(--mu);font-size:11px;font-style:normal}
.ov-facility{display:grid;gap:7px}
.ov-facility>div{display:grid;grid-template-columns:52px minmax(0,1fr);gap:8px;align-items:start;font-size:13px;line-height:1.55}
.ov-facility b{color:var(--mu);font-size:12px;font-weight:700}
.ov-more{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
@media(max-width:430px){
  /* 393pxでは3列のうち宿泊地が押し潰れて1文字ずつ折り返すので、日付を見出し行に
     昇格させて2段にする。家族向け気候表で同じ失敗をしている（2026-08-15）。 */
  .ov-days,.ov-days tbody,.ov-days tr,.ov-days td{display:block;width:auto}
  .ov-days thead{display:none}
  .ov-days tr{border-top:1px solid var(--line2);padding:8px 2px}
  .ov-days tr:first-child{border-top:0}
  .ov-days td{border:0;padding:0}
  /* 狭い幅では日付と区分を同じ行に並べる。区分だけで1行使うと8日で8行増える。 */
  .ov-days td.ov-date{display:inline;width:auto;margin-bottom:2px}
  .ov-days td.ov-kind{display:inline;width:auto;margin-left:6px}
  /* 見出し行を消すので、宿泊セルだけ値の意味が分からなくなる。ラベルを付ける
     （セッション表の.session-field-labelと同じ考え方）。 */
  .ov-days td.ov-stay{width:auto;margin-top:3px;color:var(--mu);font-size:12px}
  .ov-days td.ov-stay::before{content:'宿 ';color:var(--tx2);font-weight:700}
  .ov-facility>div{grid-template-columns:44px minmax(0,1fr)}
}
`;

const deskPrintCss = String.raw`
/* Static desk-print copy: itinerary, preparation, and venue reference only. */
body.desk-copy{background:#fff;padding-bottom:0}
body.desk-copy .field-nav,
body.desk-copy #tab-rec,
body.desk-copy .memo,
body.desk-copy .secondary-entry,
body.desk-copy .plans,
body.desk-copy .no-print,
body.desk-copy .transfer-help{display:none!important}
body.desk-copy #tab-overview,
body.desk-copy #tab-plan,
body.desk-copy #tab-prep,
body.desk-copy #tab-venue{display:block!important}
body.desk-copy #tab-plan,
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
  body.desk-copy #tab-plan,
  body.desk-copy #tab-prep,
  body.desk-copy #tab-venue{break-before:page}
  body.desk-copy .tab{display:none!important}
  body.desk-copy #tab-overview,
  body.desk-copy #tab-plan,
  body.desk-copy #tab-prep,
  body.desk-copy #tab-venue{display:block!important}
}
`;

// ---------- 交通手段アイコン（202610_Europe_TechEx_EuroBLECHのbuild.mjs 303〜325行目付近と同一） ----------
// フライトは.flight-mark（core.cssのmaskアイコン）、それ以外は.mode-icon配下にSVGを差し込む。
const MODE_ICON_PATHS = {
  train: '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M8 16l-2 4m10-4 2 4"/>',
  car: '<path d="M5 17h14M4 17v-4l2-5h12l2 5v4M4 17v2h2v-2m12 0v2h2v-2M6 13h12"/><circle cx="8" cy="15" r=".8"/><circle cx="16" cy="15" r=".8"/>',
};
const MODE_ICON_LABELS = { train: '鉄道', car: 'タクシー' };
const modeIconHtml = kind => '<span class="mode-icon mode-icon-' + kind + '" role="img" aria-label="' + MODE_ICON_LABELS[kind] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + MODE_ICON_PATHS[kind] + '</svg></span>';
const flightMarkHtml = '<span class="flight-mark" role="img" aria-label="フライト"></span>';

// ---------- 黒塗りグリフの置き換え（202610_Europe_TechEx_EuroBLECHの.line-icon方式） ----------
// 🖨（U+1F5A8）と🗓（U+1F5D3）はどちらもWindowsで異体字セレクタ無しの既定＝黒塗りの
// 輪郭グリフになる（Miscellaneous Symbols範囲の既定テキスト表示）。EuroBLECHが絵文字を
// モノクロSVGへ置き換える方式（<span class="line-icon line-icon-*">内にviewBox 24x24・
// stroke幅1.7のSVG）と寸法・描き方をそろえる。隣接するテキスト（ボタンのaria-label、
// バナー・見出しの文言）が既に意味を伝えるため、アイコン自体はaria-hidden。
const LINE_ICON_PATHS = {
  print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  // 🗓の置き換え。オンライン版タブ内「毎日どこで何をしているか」の見出しだけに残る
  // （家族印刷版の同義ブロックは作業1で削除済み）。
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9h16M8 3v4m8-4v4"/><path d="M8 13h2m4 0h2m-8 4h2m4 0h2"/>',
  // 🗺 U+1F5FA の置き換え。プランDの見出しと地図リンク集の見出しの2箇所。
  map: '<path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z"/><path d="M9 4v13m6-10.5V20"/>',
  // 🚉🚄と🚗は交通手段アイコンと同じ絵を使う。同じものを2度描かない。
  train: MODE_ICON_PATHS.train,
  car: MODE_ICON_PATHS.car,
  // 以下は2026-08-15に追加。それまで絵文字のままだった行動・操作の区分。
  // すべてviewBox 0 0 24 24・線画のみ・座標は1〜23に収める（14px前後で表示するため
  // 描き込みすぎない。1つあたり図形4つまでに収めてある）。
  hotel: '<rect x="5" y="8" width="14" height="13"/><rect x="10" y="16" width="4" height="5"/><rect x="7" y="11" width="3" height="3"/><rect x="14" y="11" width="3" height="3"/>',
  food: '<path d="M6 3v7M10 3v7M8 3v7M8 10v11"/><path d="M17 3C14 5 14 9 17 11V21"/>',
  sight: '<path d="M4 9 12 4l8 5"/><path d="M4 9h16M7 9v9M12 9v9M17 9v9"/><path d="M3 21h18"/>',
  robot: '<rect x="5" y="8" width="14" height="11" rx="2"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M12 8V4M9 17h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="8" r="1"/><path d="M12 11v6"/>',
  passport: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 17h6"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 8v3l3 2-1 4h-4l-1-4 3-2z"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M6 21v-2l2-7h8l2 7v2"/>',
  people: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="9" r="3"/><path d="M3 20v-1l2-6h6l1 3"/><path d="M12 20v-1l2-6h6l1 6v1"/>',
  memo: '<rect x="4" y="3" width="13" height="18" rx="1"/><path d="M7 8h7M7 12h7"/><path d="M15 16l4-4 2 2-4 4h-2z"/>',
  warning: '<path d="M12 3 21 20H3z"/><path d="M12 9v5"/><circle cx="12" cy="17" r="1"/>',
  sofa: '<rect x="4" y="12" width="16" height="7" rx="1"/><rect x="3" y="9" width="3" height="9" rx="1"/><rect x="18" y="9" width="3" height="9" rx="1"/><path d="M6 12V8h12v4"/>',
  bulb: '<circle cx="12" cy="9" r="6"/><path d="M9 18h6M10 21h4"/><path d="M10 11l1-2 2 2 1-2"/>',
  star: '<path d="M12 3 15 9 21 10 16 14 18 21 12 17 6 21 8 14 3 10 9 9z"/>',
  speech: '<path d="M4 4h16v11H10l-4 4v-4H4z"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="1"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 10h8M8 14h8M8 18h5"/>',
  pin: '<circle cx="12" cy="9" r="6"/><circle cx="12" cy="9" r="2"/><path d="M8 13 12 21 16 13z"/>',
  download: '<path d="M12 3v12M7 11l5 5 5-5M4 19h16"/>',
  upload: '<path d="M12 21V9M7 13l5-5 5 5M4 5h16"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15 9 13 13 9 15 11 11z"/>',
  suitcase: '<rect x="4" y="8" width="16" height="12" rx="2"/><rect x="9" y="4" width="6" height="4" rx="1"/><path d="M4 14h16"/>',
  tag: '<path d="M4 4h9l8 8-9 9-8-8z"/><circle cx="8" cy="8" r="1.5"/>',
  merge: '<path d="M6 3v6l6 6v6"/><path d="M18 3v6l-6 6"/>',
  split: '<path d="M12 3v6l-6 6v6"/><path d="M12 9l6 6v6"/>',
  city: '<rect x="3" y="10" width="5" height="11"/><rect x="10" y="5" width="5" height="16"/><rect x="17" y="13" width="4" height="8"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 19h2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V8C8 5 10 3 12 3C14 3 16 5 16 8V11"/><circle cx="12" cy="15" r="1.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 6-6"/>',
  checkbox: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 6-6"/>',
  checkMark: '<path d="M4 12l6 6 10-12"/>',
  alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2"/><path d="M5 4 2 7M19 4l3 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  stopwatch: '<circle cx="12" cy="13" r="8"/><path d="M9 3h6M12 3v2"/><path d="M12 9v4l3 2"/>',
  book: '<rect x="3" y="5" width="8" height="15" rx="1"/><rect x="13" y="5" width="8" height="15" rx="1"/>',
  factory: '<path d="M3 21V11L8 14V11L13 14V9L19 13V21Z"/><path d="M8 17h2M13 17h2"/>',
  trash: '<path d="M4 6h16M9 6V4h6v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 10v7M14 10v7"/>',
  cloud: '<path d="M7 17C4 17 3 15 3 13C3 11 5 9 7 9C8 6 11 5 14 6C17 5 20 8 19 11C21 11 21 15 18 17H7Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v11h12V10"/><path d="M10 21v-6h4v6"/>',
  lifebuoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  // フライトは.flight-markのマスク画像と同じ形。文中に置く場合だけこちらを使う。
  flight: '<path d="M22 16v-2l-8.5-5V3.5C13.5 2.67 12.83 2 12 2s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z"/>',
};
const lineIconHtml = name => {
  if (!LINE_ICON_PATHS[name]) throw new Error(`Unknown line icon: ${name}`);
  return `<span class="line-icon line-icon-${name}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${LINE_ICON_PATHS[name]}</svg></span>`;
};
const printIconHtml = lineIconHtml('print');

// ---------- 絵文字をすべてモノクロSVGへ ----------
// 2026-08-15。それまで置き換えていたのは🖨🗓🗺の3文字だけで、アイコンが
// 「モノクロSVG」「Windowsで黒い輪郭になる絵文字（🍽🏛ℹなど14種）」
// 「カラー絵文字（🏨🤖👤など）」の3系統に割れていた。全部.line-iconへそろえる。
//
// 国旗（🇩🇪🇯🇵）はアイコンにせず落とす。Windowsでは合成されず「DE」「JP」という
// 文字のまま出るため。隣に国名・都市名があるので情報は失わない。
const EMOJI_ICON_MAP = {
  '🏨': 'hotel', '🍽': 'food', '🏛': 'sight', '🤖': 'robot', 'ℹ': 'info',
  '🛂': 'passport', '⚽': 'ball', '👤': 'person', '👥': 'people', '📝': 'memo',
  '⚠': 'warning', '🛋': 'sofa', '💡': 'bulb', '📅': 'calendar', '⭐': 'star',
  '💬': 'speech', '📋': 'clipboard', '📍': 'pin', '⬇': 'download', '⬆': 'upload',
  '🧭': 'compass', '🧳': 'suitcase', '🏷': 'tag', '🤝': 'merge', '🔀': 'split',
  '🚉': 'train', '🚄': 'train', '🚗': 'car', '🏙': 'city', '📱': 'phone',
  '🔒': 'lock', '✅': 'checkCircle', '☑': 'checkbox', '✔': 'checkMark',
  '🛫': 'flight', '⏰': 'alarm', '🕐': 'clock', '🕘': 'clock', '⏱': 'stopwatch',
  '📗': 'book', '📘': 'book', '🏭': 'factory', '🗑': 'trash', '☁': 'cloud',
  '🎯': 'target', '🏠': 'home', '🆘': 'lifebuoy',
};
// JS文字列の中の絵文字。textContentへ入る文言はSVGを置けないので、絵文字だけ落とす。
// #who-chipsはv3では非表示（人別フィルターを持たない）なので、そこへ渡す絵文字も空にする。
// 件数を固定しないのは、机上用印刷版が後段でスクリプトごと落とすため、同じ文字列でも
// 生成物によって件数が変わるから。代わりに、処理後にflash()の中へ絵文字が残っていないかを見る。
const stripScriptEmoji = (text, label) => {
  const out = text
    .replace(/flash\('(?:\p{Extended_Pictographic}️?[ 　]?)+/gu, "flash('")
    .replace(/flash\(''\s*\+\s*message\)/g, 'flash(message)')
    .replace(/emoji:'\p{Extended_Pictographic}️?'/gu, "emoji:''")
    .replace(/whoBtn\('all', '(?:\p{Extended_Pictographic}️?[ 　]?)+/gu, "whoBtn('all', '");
  const leftover = [...out.matchAll(/flash\('([^']*)'/g)]
    .filter(match => /\p{Extended_Pictographic}/u.test(match[1]));
  if (leftover.length) {
    throw new Error(`Emoji left inside flash() text in ${label}: ${leftover.map(m => m[1]).join(' / ')}`);
  }
  return out;
};
// 異体字セレクタ（U+FE0F）と直後の空白1つまで一緒に飲み込む。アイコン側が
// margin-rightを持つので、空白を残すと字間が空きすぎる。
const PICTOGRAPH = /(\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}])\uFE0F?[ \u3000]?/gu;
// 国旗は2文字（地域指示子の対）で1つ。先に落とす。
const dropFlags = text => text.replace(/[\u{1F1E6}-\u{1F1FF}]{2}[ \u3000]?/gu, '');
const applyEmojiIcons = (text, label) => {
  const withoutFlags = dropFlags(text);
  // 対応表に無い絵文字を黙って通さない。後から絵文字を足したらここで止まる。
  for (const match of withoutFlags.matchAll(PICTOGRAPH)) {
    if (!EMOJI_ICON_MAP[match[1]]) {
      throw new Error(`Unmapped emoji in ${label}: ${match[1]} U+${match[1].codePointAt(0).toString(16).toUpperCase()}`);
    }
  }
  // WORD JOINER（U+2060）でアイコンと語を繋ごうとしたが効かなかった。.line-iconは
  // inline-flexの原子的インライン箱なので、その手前・直後の改行機会は文字の指定で
  // 抑えられない。凡例のような「アイコン＋語」の並びでは、アイコンだけが行末に残ることがある。
  // 絵文字だったときも同じ位置で折り返していたので、今回の変更で悪化した点ではない。
  // 直すならマークアップ側で「アイコン＋語」をnowrapの箱に入れる必要がある。未着手。
  return withoutFlags.replace(PICTOGRAPH, (_, ch) => lineIconHtml(EMOJI_ICON_MAP[ch]));
};

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
// ---------- 利用フライト：表からカードへ（2026-08-16） ----------
// 準備タブの「利用フライト」は3列の表だった。時刻・空港・便名が同じ大きさの升目に
// 並ぶので、どれが出発でどれが到着なのかが読み取れない。1区間を
// 「出発 → 便名 → 到着」の三つ組にする。様式はshared/trip-field/core.cssの.flight-card。
// 値はすべて元の表に書かれているものをそのまま移す。新しい時刻・便名・数値は足さない。
// 移し漏れを検出するため、使う文字列は元のHTMLに存在することを確認してから使う。
const FLIGHT_JOURNEYS = [
  {
    label: '往路', dates: '9/7（月）〜9/8（火）', total: '総所要17時間30分',
    footer: 'Finnair・エコノミー／CO₂e 約661kg',
    legs: [
      { no: 'AY80', aircraft: 'A350', duration: '13時間5分', note: '深夜便',
        from: ['NGO', '9/7（月）', '22:50'], to: ['HEL', '9/8（火）', '5:55'] },
      { no: 'AY1411', aircraft: 'A321', duration: '2時間40分',
        note: '食事なし（有料軽食あり／水・ブルーベリージュース無料）',
        from: ['HEL', '9/8（火）', '7:40'], to: ['FRA', '9/8（火）', '9:20'] },
    ],
    layovers: [['ヘルシンキ', '1時間45分']],
  },
  {
    label: '復路', dates: '9/13（日）〜9/14（月）', total: '総所要17時間15分',
    footer: 'Finnair・エコノミー／CO₂e 約658kg',
    legs: [
      { no: 'AY1416', aircraft: 'A321', duration: '2時間25分',
        from: ['FRA', '9/13（日）', '19:20'], to: ['HEL', '9/13（日）', '22:45'] },
      { no: 'AY79', aircraft: 'A350', duration: '12時間50分', note: '深夜便',
        from: ['HEL', '9/14（月）', '0:45'], to: ['NGO', '9/14（月）', '19:35'] },
    ],
    layovers: [['ヘルシンキ', '2時間']],
  },
];

function flightPoint(kind, label, [code, date, time]) {
  const [name, tz, query] = AIRPORTS[code];
  return `<div class="flight-point ${kind}"><span class="point-label">${label}</span>`
    + `<time><span class="flight-date">${date}</span><strong>${time}</strong><em>${tz}</em></time>`
    + `<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=${query}" target="_blank" rel="noopener">${name}</a></div>`;
}

function buildFlightCards(source) {
  // 表の中に書かれていた値であることを、組み立てる前に確かめる。
  FLIGHT_JOURNEYS.forEach(j => {
    const facts = [j.dates, j.total, j.footer, ...j.layovers.flat()];
    j.legs.forEach(leg => facts.push(leg.no, leg.aircraft, leg.duration, ...(leg.note ? [leg.note] : []),
      leg.from[2], leg.to[2]));
    facts.forEach(fact => {
      if (!source.includes(fact)) throw new Error(`Flight card fact missing from source: ${fact}`);
    });
    if (j.legs.length - 1 !== j.layovers.length) {
      throw new Error(`Flight card ${j.label}: ${j.legs.length} legs need ${j.legs.length - 1} layovers`);
    }
  });

  return FLIGHT_JOURNEYS.map(j => {
    const legs = j.legs.map((leg, i) => {
      // 中央列は96pxしかないので、機材と所要だけを置く。機内食のような長い注記を
      // 入れると3行に潰れて到着側へ迫る（2026-08-16にPC幅で確認）。注記は
      // 経路の仕様ではないので、区間の下に全幅で出す。
      const body = `<div class="flight-leg">`
        + flightPoint('depart', '出発', leg.from)
        + `<div class="flight-route"><strong>${leg.no}</strong>`
        + `<span class="flight-rule">${flightMarkHtml}</span>`
        + `<small>${leg.aircraft}<br>${leg.duration}</small></div>`
        + flightPoint('arrive', '到着', leg.to)
        + `</div>`
        + (leg.note ? `<p class="flight-note">${leg.note}</p>` : '');
      const layover = i < j.layovers.length
        ? `<div class="layover"><span>乗り継ぎ</span><strong>${j.layovers[i][0]} ${j.layovers[i][1]}</strong></div>`
        : '';
      return body + layover;
    }).join('\n        ');
    return `<article class="flight-card">
        <header class="flight-card-head">
          <div><span class="flight-label">${j.label}</span><h3>${j.dates}</h3></div>
          <span class="flight-total">${j.total}</span>
        </header>
        ${legs}
        <footer>${j.footer}</footer>
      </article>`;
  }).join('\n      ');
}

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

// ---------- 旅程タブの長い補足を折り畳みへ ----------
// 規則：常時表示は30字程度の事実まで。理由・判断材料・条件・列挙は折り畳みへ。
// **字数は目安であって基準ではない。分けるのは事実か理屈か。** 30字を超えても
// 単一の事実なら常時表示に残す。実際に残しているのは、対戦カードとキックオフ（76字）、
// ICEの所要と最短便（40字）、Porscheplatzへの経路（36字）、費用に含む区間（54字）。
//
// 本文は書き換えない。leadは対象の`.note`を一意に特定するための先頭文字列で、
// 一致した`.note`要素をまるごと`<details class="fold">`へ移す。
// visibleを持つ項目だけ「常時表示の事実 ＋ 折り畳みの理屈」へ分ける。visibleは
// 元の文の先頭と一致していなければ止める（分割のつもりで書き換えていないことを
// 機械で確かめる）。visibleの末尾に句点は付けない（常時表示行の規則）ので、
// 区切りの「。」だけは落とす。
// summaryは中身を示す語にする（「続きを読む」のような語は使わない）。
const FOLD_NOTES = [
  // 2026-08-14に折り畳んだ8件
  { lead: 'Maritim Stuttgart（9/8〜9/12', summary: '宿泊の内訳' },
  { lead: '入国審査はHELで完了', summary: '朝食の調達' },
  { lead: '9:20着から約90分あり', summary: '乗る便の判断' },
  { lead: '・Markthalle Stuttgart', summary: 'ランチ候補' },
  { lead: 'セッション一覧（全11項目', summary: '会期の内訳' },
  { lead: 'Liederhalle前からチャーターバスで出発', summary: '訪問の詳細' },
  { lead: 'Universität駅からS1直通で乗り換えなし', visible: 'Universität駅からS1直通で乗り換えなし', summary: '見どころと未確認事項' },
  { lead: 'ワンワールド便。JAL/ワンワールドサファイア', summary: 'ラウンジの利用資格' },
  { lead: 'クラシックダブル28㎡', summary: '予約条件' },

  // 2026-08-15に追加。前回は`<span class="note">`だけを見ていたため、
  // `<div class="note">`側（プラン内の補足）が丸ごと残っていた。
  // 事実が先頭にある4件は、その事実だけを常時表示に残す。
  { tag: 'div', lead: '時刻はすべて目安', visible: '時刻はすべて目安', summary: '所要時間の置き方' },
  { tag: 'div', lead: '開館時刻は公式未確認', visible: '開館時刻は公式未確認', summary: '確認しておくこと' },
  { lead: '※ホテルからHbfは約1.5km', visible: '※ホテルからHbfは約1.5km', summary: '荷物が多いとき' },
  { lead: 'エコノミーは食事なし', visible: 'エコノミーは食事なし', summary: '機内食と飲み物' },
  // 全体が理由・判断材料・手順の7件（1件は同じ文が2箇所に出る）
  { tag: 'div', lead: '<strong>① タクシー（第一候補）：</strong>', summary: '駅からホテルへの行き方' },
  { tag: 'div', lead: '深夜便明けの体調を見て当日選択', summary: '当日の選び方' },
  { tag: 'div', lead: '長距離駅（Fernbf）と近郊駅（S-Bahn）', summary: '乗る駅の見分け', count: 2 },
  { tag: 'div', lead: '大聖堂は駅の目の前なので', summary: 'ケルンでの回り方' },
  { tag: 'div', lead: 'Xは往復ICEの遅延が', summary: '余裕の取り方' },
  { lead: 'ラウンジや買物は予定に入れず', summary: '空港での過ごし方' },
  { lead: 'セッション一覧（全13項目）', summary: '会期の内訳' },
];

// ---------- 予定の状態を5つにそろえる ----------
// 定義は shared/trip-field/core.css の .plan-state。使う語は
// 未検討／候補あり／仮決め／確定／当日判断 の5つだけ。
//
// それまでは同じ「状態」を .st st-booked（予約済・登録済）、.st st-tbd（要予約）、
// .et t-tbd（要検討・未発表・ラウンジ名は要確認）と、3種類の札で言い分けていた。
// 語も粒度もばらばらで、機械で数えられなかった。
//
// 元の語が持っていた情報は捨てない。**進み具合**は札へ、**未確定の理由**は
// すでに折り畳みの中にある（「会期の構成」に未公開の旨、「ラウンジの利用資格」に
// 指定ラウンジ名が未確認の旨）。理由が本文にしか無かった1件（要予約）は、
// 札を候補ありにしたうえで語を行の末尾へ残す。
const PLAN_STATE_LABELS = {
  unconsidered: '未検討',
  candidate: '候補あり',
  tentative: '仮決め',
  fixed: '確定',
  onsite: '当日判断',
};
const planStateHtml = key => `<span class="plan-state plan-state-${key}">${PLAN_STATE_LABELS[key]}</span>`;
const PLAN_STATE_FIXUPS = [
  // 宿泊3件とHRS参加登録。予約・登録が済んでいる＝確定。
  ['<span class="st st-booked">予約済</span>', planStateHtml('fixed'), 3],
  ['<span class="st st-booked">登録済</span>', planStateHtml('fixed'), 1],
  // ランチは候補が3つある（折り畳み「ランチ候補」）。
  // 2026-08-19に2件へ。9/11の企業訪問が12:00で終わることが公式発表され、空いた午後に
  // エスリンゲン観光を候補として置いたため（行くこと自体がまだ決まっていない＝候補あり）。
  ['<span class="et t-tbd">要検討</span>', planStateHtml('candidate'), 2],
  // ワインシュトゥーベは候補の1つ。要予約は確定に必要な条件なので語を残す。
  ['<span class="st st-tbd">要予約</span>', `${planStateHtml('candidate')}<span class="state-note">要予約</span>`, 1],
  // Day 3の訪問先はFraunhofer IPA・ARENA2036の2社に確定。グループ分け（1／2）だけ
  // 公式未案内＝仮決め（行くこと自体は決まっている）。詳細は折り畳み「訪問の詳細」。
  ['<span class="et t-tbd">訪問順は未案内</span>', `${planStateHtml('tentative')}<span class="state-note">訪問順は未案内</span>`, 1],
  // ラウンジへ行くこと自体は決まっていて、どのラウンジかが未確認＝仮決め。
  ['<span class="et t-tbd">ラウンジ名は要確認</span>', planStateHtml('tentative'), 1],
  // 会場タブのDay 3見出しにも同じ状態の札があった（旅程タブとは別の書式で
  // 「訪問順は未案内」と書かれていた）。同じ予定なので同じ札にする。
  [
    '<span class="st st-tbd" style="margin-left:6px">訪問順は未案内</span>',
    `<span class="plan-state plan-state-tentative" style="margin-left:6px">${PLAN_STATE_LABELS.tentative}</span><span class="state-note">訪問順は未案内</span>`,
    1,
  ],
];
// 不参加（VIP Dinner）は5状態に入れない。進み具合ではなく参加の可否だから。

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

  /* 日付の後ろに、旅程タブ末尾の資料カードへの導線を足す。
     日カードだけを並べていたので、便・宿・地図はスクロールしないと辿り着けなかった。
     日付と混ざらないよう区切りのラベルを1つ挟む。畳む対象ではないのでopenDayは呼ばない。 */
  const refLbl = document.createElement('span');
  refLbl.className = 'lbl'; refLbl.textContent = '資料';
  dayBox.appendChild(refLbl);
  [['flights','フライト'], ['stays','宿泊'], ['maplinks','地図']].forEach(([id, label]) => {
    const target = document.getElementById(id);
    if (!target) return;
    const a = document.createElement('a');
    a.className = 'chip'; a.href = '#' + id; a.textContent = label;
    /* 折り畳みカード（地図）は開いてから飛ばないと中身が見えない。 */
    a.addEventListener('click', () => { if (target.tagName === 'DETAILS') target.open = true; });
    dayBox.appendChild(a);
  });

  /* ---------- 日付カードの一括開閉 ----------
     ラベルは今の状態を示すので、個別に開閉したときや日付チップで
     開いたときも追随させる（202610_Europe_TechEx_EuroBLECHのpage.jsと同一の判定）。
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
// style.css（オンライン版が読む）と机上用印刷版（元CSSをそのまま埋め込む）の
// 両方に効かせる必要があるので、対にして2箇所で使う。
const LEGEND_COMMENT_OLD = '   ✈飛行機 🚆鉄道 🚕タクシー 🛂空港手続き 🏨宿 🍽食事 🏛観光 ⚽観戦 🤖HRS';
// 凡例の説明も絵文字を持たない。CSSコメントの中に絵文字が残っていると、
// 机上用印刷版（元CSSを<style>へ埋め込む）で絵文字の一括置換に巻き込まれる。
const LEGEND_COMMENT_NEW = '   交通手段も行動の区分もモノクロSVG（.flight-mark／.mode-icon／.line-icon）。空港手続き・宿・食事・観光・観戦・HRS';
// 同じコメント段落の残り2行。「絵文字だけ」という説明も、⚽と🤖を名指しする行も、
// 全部SVGへ移した今は事実と違ううえ、style.cssへそのまま出る（style.cssは絵文字の
// 一括置換を通らないので、コメントの中の絵文字だけが生成物に残っていた）。
const KIND_COMMENT_FIXUPS = [
  ['/* イベント種別：絵文字だけ。色は付けない（HRSと要検討のみ例外）',
   '/* イベント種別：モノクロSVGアイコン。色は付けない（HRSと要検討のみ例外）'],
  ['   ⚽は観戦で、HRS（🤖）とは別物なので rose の色は使わない。 */',
   '   観戦はHRSとは別物なので rose の色は使わない。 */'],
];
// 旧い状態札のCSS。中身は .plan-state（共通部品）へ移したので、規則ごと落とす。
// .st と .st-skip は残す（不参加は進み具合の軸ではないので5状態に入れていない）。
const DEAD_STATE_CSS = [
  '.et.t-tbd{display:inline-block;border:1px dashed var(--tbd-bd);background:var(--tbd-bg);color:var(--choose-tx);border-radius:4px;padding:0 5px;font-size:var(--f4);font-weight:700;margin-left:4px}\n',
  '.st-booked{background:var(--hov);border-color:#CBD3DC;color:var(--tx2)}\n',
  '.st-tbd{background:var(--tbd-bg);border-color:var(--tbd-bd);color:var(--choose-tx)}\n',
];
const sourceCss = DEAD_STATE_CSS.reduce(
  (css, rule, i) => mustReplace(css, rule, '', `dead state chip rule #${i}`),
  KIND_COMMENT_FIXUPS.reduce(
    (css, [oldText, newText], i) => mustReplace(css, oldText, newText, `kind comment in source CSS #${i}`),
    mustReplace(sourceCssMatch[1], LEGEND_COMMENT_OLD, LEGEND_COMMENT_NEW, 'legend comment in source CSS'))
);
const compiledSharedCss = `${sourceCss}\n${sharedCoreCss}\n${outdoorCss}\n${overviewCss}\n${familyCss}`.trim() + '\n';

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
  html = mustReplace(html, '<title>HRS Europe 2026 出張ガイド（v2・標準形）</title>', `<title>HRS Europe 2026 出張ガイド${offline ? '（机上用印刷版）' : ''}</title>`, 'title');
  if (offline) {
    html = mustReplace(html, /<!--[\s\S]*?-->/, '<!-- Self-contained static desk-print copy; no note storage or runtime scripts. -->', 'desk-print document note');
  }
  // 机上用印刷版は1ファイルで完結させる約束なので、style.cssと同じ中身を<style>へ入れる。
  // 従来はsharedCoreCssとfamilyCssが抜けたまま配っていた。つまり.line-icon／
  // .flight-mark／.plan-state／.sum-*の規則が無い。アイコンのSVGは寸法規則が無いと
  // 親の幅いっぱいに広がるので、見出しのアイコン1つでページが崩れる
  // （2026-08-16に画面で確認。概要タブを先頭に置いて初めて目に付いた）。
  // オンライン版はこの<style>ごとstyle.cssのlinkへ差し替わるため、offline時だけ足す。
  // 連結順はcompiledSharedCss（style.css）と同じにする。順が違うと打ち消しがずれる。
  html = mustReplace(html, '</style>',
    `${offline ? sharedCoreCss : ''}\n${outdoorCss}\n${overviewCss}\n${offline ? familyCss : ''}\n${offline ? deskPrintCss : ''}\n</style>`,
    'style end');
  // 冒頭の要約が「未確定は9/12・9/13だけ」と断定していたが、ページ自身が
  // 9/11（Day 3・企業訪問）に仮決めの札を2枚付けている。訪問先（Fraunhofer IPA・
  // ARENA2036）と集合方法（Liederhalle発のチャーターバス）は公式発表済みで、
  // 残るのはグループ分けだけ。9/12・9/13（こちらが決める）とは未確定の理由が
  // 違うので、書き分けたうえで9/11を落とさない。
  html = mustReplace(html,
    '未確定は <a href="#day-0912">9/12</a>・<a href="#day-0913">9/13</a> の過ごし方だけ。便とホテルは確定済み。',
    UNDECIDED_BANNER,
    'undecided summary');

  const header = String.raw`<header class="hdr">
  <div class="wrap">
    <div class="hdr-top">
      <div>
        <div class="eyebrow">GERMANY BUSINESS TRIP 2026</div>
        <h1>HRS Europe 2026 出張ガイド${offline ? '<span class="offline-mark">DESK PRINT</span>' : ''}</h1>
        <div class="subtitle">9/7（月）〜9/14（月）｜2名｜シュトゥットガルト・フランクフルト</div>
      </div>
      <div class="${offline ? 'desk-print-trigger' : 'no-print header-actions'}" style="display:flex;gap:5px;flex-shrink:0">
        <a class="btn" href="family_print.html">${printIconHtml}家族</a>
        <a class="btn" href="immigration_print.html" title="入国審査用（英語）">${printIconHtml}入国</a>
        <button class="btn" onclick="window.print()" aria-label="印刷">${printIconHtml}</button>
      </div>
    </div>
  </div>
</header>
<div class="field-nav">
  <div class="wrap">
    <nav class="tabs" id="tabs" role="tablist" aria-label="主要セクション">
      <button data-tab="overview" role="tab" aria-controls="tab-overview" aria-selected="false"><span class="ic">${lineIconHtml('compass')}</span>概要</button>
      <button data-tab="plan" class="on" role="tab" aria-controls="tab-plan" aria-selected="true"><span class="ic">📅</span>旅程</button>
      <button data-tab="venue" role="tab" aria-controls="tab-venue" aria-selected="false"><span class="ic">🤖</span>視察</button>
      <button data-tab="prep" role="tab" aria-controls="tab-prep" aria-selected="false"><span class="ic">✅</span>準備</button>
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
  // 2026-08-19に106→107。9/11の企業訪問が12:00で終わると公式発表され、
  // 空いた午後にエスリンゲン観光の行を1本足したぶん。
  if (actions !== 107) throw new Error(`Expected 107 itinerary rows, converted ${actions}`);

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
  // 机上用印刷版は元CSSをそのまま<style>へ埋め込むため、style.css側とは別にここでも当てる。
  html = mustReplace(html, LEGEND_COMMENT_OLD, LEGEND_COMMENT_NEW, 'legend comment in embedded CSS');
  // 机上用印刷版は元CSSを<style>へそのまま埋め込むので、同じ段落をここでも直す。
  // 直さないと、絵文字の一括置換がCSSコメントの中の⚽と🤖をSVGへ変えてしまう。
  html = KIND_COMMENT_FIXUPS.reduce(
    (text, [oldText, newText], i) => mustReplace(text, oldText, newText, `kind comment in embedded CSS #${i}`),
    html);

  // ---------- 地図リンクを場所名そのものへ ----------
  MAP_LINK_FIXUPS.forEach(([search, replacement, expectedCount], i) => {
    html = replaceAllCounted(html, search, replacement, `map link fixup #${i}`, expectedCount);
  });

  // ---------- 旅程タブの長い補足を折り畳みへ ----------
  // 本文は書き換えず、置き場所だけ<details class="fold">へ移す。
  // 机上用印刷版は後段の共通処理で全<details>をopenにするため、常時展開で読める。
  FOLD_NOTES.forEach(({ tag = 'span', lead, summary, visible, count = 1 }, i) => {
    const label = `itinerary note fold #${i} (${summary})`;
    const pattern = new RegExp(`<${tag} class="note">(${escapeRe(lead)}[\\s\\S]*?)</${tag}>`, 'g');
    const found = [...html.matchAll(pattern)];
    if (found.length !== count) {
      throw new Error(`Fold match count mismatch: ${label} (expected ${count}, found ${found.length})`);
    }
    const body = found[0][1];
    // 2件以上あるときは、同じ文が繰り返されている場合だけ扱う（別の文を巻き込まない）。
    if (found.some(match => match[1] !== body)) {
      throw new Error(`Fold matches differ in content: ${label}`);
    }
    let head = '';
    let rest = body;
    if (visible) {
      // 分割は先頭一致でなければ止める。句点で切れているときだけ「。」を落とす。
      if (body.startsWith(`${visible}。`)) rest = body.slice(visible.length + 1);
      else if (body.startsWith(visible)) rest = body.slice(visible.length);
      else throw new Error(`Fold split is not a prefix of the source note: ${label}`);
      head = `<${tag} class="note">${visible}</${tag}>`;
    }
    html = replaceAllCounted(
      html,
      `<${tag} class="note">${body}</${tag}>`,
      `${head}<details class="fold"><summary>${summary}</summary><div class="fold-body">${rest}</div></details>`,
      label,
      count
    );
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
    ? `<div class="banner b-info"><span class="i">${printIconHtml}</span><div><strong>机上用印刷版です。</strong>スマートフォンではオンライン版を使用します。この紙には旅程・準備・会場の参照情報だけを載せ、メモ入力欄は含めません。</div></div>`
    : `<div class="transfer-help"><strong>記録の正本はこのオンライン版です。</strong>入力はこの端末・ブラウザ内に保存されます。終了時はJSONを書き出してバックアップしてください。</div>`;
  html = mustReplace(html, '<section class="tab on" id="tab-plan" role="tabpanel" aria-label="旅程">', `<section class="tab on" id="tab-plan" role="tabpanel" aria-label="旅程">\n${planIntro}`, 'plan section');

  const venueStorageNotice = offline ? String.raw`<div class="banner b-info">
    <span class="i">🏛</span>
    <div><strong>会場の公式構成と確認事項です。</strong>講演中のメモ入力はスマートフォンのオンライン版を使用します。</div>
  </div>` : String.raw`<div class="banner b-info">
    <span class="i">📝</span>
    <div><strong>講演ごとに、事前の狙い・質問と当日メモを入力できます。</strong>当日メモは「＋ 時刻付きで追記」で既存内容の末尾へ追加でき、入力のたび自動保存します。</div>
  </div>`;
  // タブ名は「会場」から「視察」へ（2026-08-16）。中身の35KBはほぼ全部が
  // セッション表と講演ごとの記入欄で、会場情報は冒頭の1枚だけだった。名前のせいで
  // フライト・宿泊・地図をここで探されていた。入力するのは「何を見に来たか」と
  // 「何を見たか」で、場所ではなく行為。視察なら展示会・講演会・工場見学・企業訪問を
  // すべて覆うので、次のイベントでもそのまま使える。
  // 内部キー（data-tab="venue" / id="tab-venue"）は変えない。保存済みのタブ状態と
  // ストレージのキーが壊れる。表示名だけを替える。
  html = mustReplace(html,
    '<section class="tab" id="tab-venue" role="tabpanel" aria-label="会場">',
    '<section class="tab" id="tab-venue" role="tabpanel" aria-label="視察">\n' + venueStorageNotice,
    'venue storage notice');
  html = html.replace(/<th>狙い・聞くこと<\/th><th>担当<\/th>/g, '<th>事前の狙い・質問</th><th>当日メモ</th>');
  html = mustReplace(
    html,
    '<div class="foot">💡 「狙い・聞くこと」「担当」は下の表に直接書けます（この端末に保存）。担当ボタンは <strong>空 → 京 → 犬 → 両</strong> の順に切り替わります。</div>',
    '<div class="foot">💡 事前に「狙い・質問」を入れておき、講演中は隣の「当日メモ」へ要点・数字・後で調べることを時刻付きで追記します。どちらも入力のたび自動保存されます。</div>',
    'venue field guidance'
  );

  const secondaryEntry = String.raw`
  <details class="card secondary-entry">
    <summary class="ttl" style="cursor:pointer;list-style:none"><h2 style="display:inline;font:inherit;margin:0">出発前の準備</h2></summary>
    <div class="bd">
      <a class="btn" href="#" data-goto="prep">✅ 出発前準備を開く</a>
      <span class="small muted">家族向け印刷版・入国審査用・セッション×登壇者レポはヘッダーの「家族／入国／レポ」から開けます。</span>
    </div>
  </details>
`;
  // タブ内「家族タブだけ印刷」ボタンも同じアイコンにそろえる（家族向け印刷版とは別に、
  // オンライン版のfam-fabタブをその場で印刷するボタン）。
  html = mustReplace(
    html,
    '<button class="btn" id="btn-print-fam">🖨 この家族用ページだけ印刷</button>',
    `<button class="btn" id="btn-print-fam">${printIconHtml} この家族用ページだけ印刷</button>`,
    'family-tab print button icon'
  );
  // オンライン版タブ内「毎日どこで何をしているか」の見出しにも🗓が残る
  // （家族印刷版側の同義ブロックは作業1で削除済みだが、これはオンライン版だけが持つ
  // 別機能＝JS生成の日別テーブルの見出しで、削除対象ではないためアイコンだけ差し替える）。
  html = mustReplace(
    html,
    '<h2 class="ttl">🗓 毎日どこで何をしているか</h2>',
    `<h2 class="ttl">${lineIconHtml('calendar')} 毎日どこで何をしているか</h2>`,
    'family-tab day table heading icon'
  );
  // 🗺 U+1F5FA も既定表示が文字なので黒い輪郭グリフになる。旅程のプラン見出しと
  // 会場タブの地図リンク集の見出しに残っていた。同じ方式でSVGへ差し替える。
  html = replaceAllCounted(html, '<div class="plan-head">🗺 ', `<div class="plan-head">${lineIconHtml('map')} `, 'plan head map glyph', 1);
  html = replaceAllCounted(html, '>🗺 地図・その他リンク集', `>${lineIconHtml('map')} 地図・その他リンク集`, 'link collection map glyph', 1);
  html = mustReplace(
    html,
    /<\/section>\s*(<!-- ==================== タブ：準備 ==================== -->)/,
    `${secondaryEntry}\n</section>\n\n$1`,
    'prep boundary'
  );
  // 準備はナビに出す（2026-08-16）。それまでは旅程タブのボタンからしか開けない
  // 隠し部屋で、中の「利用フライト」がオンライン版では事実上たどり着けなかった。
  // このタブには寿命がある。出発前に中身が全部埋まったことを確認したら、タブごと
  // 外す。そのとき現地で要る情報（便の時刻など）が準備にしか無い状態にしないこと。
  // 旅程の日カードが同じ便を持っているかを、外す前に必ず確かめる。
  // タブになったので「← 旅程へ戻る」は不要。隠し部屋だったころの導線。
  html = mustReplace(html,
    '<section class="tab" id="tab-prep" role="tabpanel" aria-label="準備">',
    '<section class="tab" id="tab-prep" role="tabpanel" aria-label="準備">\n  <div class="banner b-info no-print" style="margin-bottom:10px">'
    + lineIconHtml('checkCircle')
    + '<div><strong>出発前に埋めるタブ</strong>。全部そろったら、このタブは畳んで構わない</div></div>',
    'prep section');

  // ---------- 利用フライトの2つの表をカードへ差し替える ----------
  // 往路の<h3>から復路の表の終わりまでをまとめて置き換える。表の値は
  // FLIGHT_JOURNEYSへ移してあり、buildFlightCardsが元HTMLとの一致を確認する。
  html = mustReplace(html,
    /<h3>往路 9\/7（月）[\s\S]*?<\/table><\/div>\s*(?=<div class="banner)/,
    buildFlightCards(html) + '\n\n      ',
    'flight tables to cards');
  if (/<h3>復路 9\/13（日）/.test(html)) throw new Error('flight tables remain after the card replacement');

  // ---------- 現地で使う3枚を準備から旅程へ移す（2026-08-16） ----------
  // 準備タブは出発前に埋め切ったら畳む約束にした。ところが中身は性質が2つに割れて
  // いる。要対応タスクは出発前だけのもので、畳んで問題ない。利用フライト（空港で
  // 見る）・宿泊（現地で見る）・地図とリンク集（ラウンジ・緊急連絡先・鉄道アプリ）は
  // 現地で要る。このままタブごと畳むと、9/7の夜に空港で便を引けなくなる。
  // 注意書きで守るより、畳んでも何も失われない配置にしておく。
  // 移す先は旅程。移動と宿泊は日付に紐づくもので、ディナー候補を旅程に置いている
  // のと同じ理屈。タブは増やさない。
  const prepSection = (html.match(/<section class="tab" id="tab-prep"[\s\S]*?\n<\/section>/) || [])[0];
  if (!prepSection) throw new Error('prep section not found for the on-site card move');
  const cut = prepSection.search(/<div class="card"[^>]*>\s*<h2 class="ttl"><span class="flight-mark"/);
  if (cut < 0) throw new Error('flight card not found inside the prep section');
  const onSiteCards = prepSection.slice(cut).replace(/\s*<\/section>\s*$/, '');
  ['利用フライト', '宿泊（2拠点）', '地図・その他リンク集'].forEach(title => {
    if (!onSiteCards.includes(title)) throw new Error(`on-site card missing from the move: ${title}`);
  });
  if (onSiteCards.includes('要対応タスク')) throw new Error('the todo card must stay in the preparation tab');
  html = html.replace(prepSection, prepSection.slice(0, cut).replace(/\s*$/, '\n</section>'));
  // 旅程の</section>と準備の<section>の間には、改行（CRLF）と「タブ：準備」の
  // コメントが挟まる。素の\n</section>では当たらない。
  html = mustReplace(html,
    /<\/section>(\s*<!--[^>]*タブ：準備[\s\S]*?-->\s*<section class="tab" id="tab-prep")/,
    `\n${onSiteCards}\n</section>$1`,
    'on-site cards into the itinerary');
  if (/id="tab-prep"[\s\S]*?利用フライト[\s\S]*?<\/section>[\s\S]*?id="tab-venue"/.test(html)) {
    throw new Error('the flight card is still inside the preparation tab');
  }

  // ---------- パネルのDOM順をタブの並びにそろえる（2026-08-24） ----------
  // タブバーは 概要 / 旅程 / 視察 / 準備 / 記録 だが、source.htmlの並びは
  // 旅程 → 準備 → 視察 で、生成物のDOMもその順のままだった。印刷はタブを全部
  // 開いて縦に並べるので、紙の上で準備が視察より前に出ていた（机上用印刷版で確認）。
  // 画面では切り替えて見るので気付かない。EB側は最初からタブ順と同じ。
  const prepBlock = (html.match(/\s*<!--[^>]*タブ：準備[\s\S]*?-->\s*<section class="tab" id="tab-prep"[\s\S]*?\n<\/section>/) || [])[0];
  if (!prepBlock) throw new Error('prep section (with its comment) not found for the panel reorder');
  const venueBlock = (html.match(/<section class="tab" id="tab-venue"[\s\S]*?\n<\/section>/) || [])[0];
  if (!venueBlock) throw new Error('venue section not found for the panel reorder');
  html = html.replace(prepBlock, '').replace(venueBlock, `${venueBlock}\n${prepBlock.trim()}`);
  // 並びが合っていることは validate.mjs が生成物で見る。ここではまだ概要が
  // 差し込まれておらず、家族タブも残っているので、この時点では数えられない。

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
  html = html.replace('会場タブの「狙い・聞くこと」「担当」をすべて消します。', '視察タブの「事前の狙い・質問」「当日メモ」をすべて消します。');
  // 旅程のDay 1・Day 2の行から視察タブへ送るリンク。タブ名を替えたので文言もそろえる。
  html = replaceAllCounted(html, '<a href="#" data-goto="venue">会場タブ</a>',
    '<a href="#" data-goto="venue">視察タブ</a>', 'venue tab link label', 2);
  // ページ冒頭のレイアウト説明コメント。3タブ時代のまま取り残されていた。
  // 机上用印刷版は先頭のコメントを丸ごと差し替えるので、あちらには存在しない。
  if (!offline) {
    html = mustReplace(html, '    タブ    : 旅程 / 準備 / 会場 / 記録 / 家族',
      '    タブ    : 概要 / 旅程 / 視察 / 準備 / 記録（家族と入国審査は別ページ）',
      'layout comment tab list');
  }
  // 残りの「会場タブ」はHTMLコメントとJSコメントの中だけ。画面には出ないが、
  // 次に読む人が古い名前で探すので一緒にそろえる。Liederhalleそのものを指す
  // 「会場」は本物なので触らない（「会場タブ」という並びだけを置き換える）。
  html = html.split('会場タブ').join('視察タブ');
  html = html.replace('==================== タブ：会場 ====================',
    '==================== タブ：視察 ====================');

  html = html.replace("    document.querySelectorAll('.ses .ow').forEach(bt => { bt.dataset.v = ''; bt.textContent = '—'; });\n", '');
  html = html.replace('入力はこの端末に自動保存されます（サーバー送信なし）。', '入力はまずこの端末・このブラウザ内に自動保存されます。Cloudflare同期を使う場合は、複数端末での同時編集を避けてください。');
  html = html.replace('下のボタンで全文を Markdown にしてコピーでき、そのまま出張報告や <code>CHANGELOG.md</code> の材料になります。', 'PCでクラウド側の記録を読み込んだ後、全文をMarkdownファイルとしてダウンロードできます。コピーは出張報告や <code>CHANGELOG.md</code> の下書きに使えます。');

  // ---------- 概要タブを旅程の手前へ差し込む ----------
  // 既定タブはplanのまま。概要は出発前と机上で効くもので、現地で開くのは旅程。
  // 起動時にいきなり概要が出ると、現地では毎回1タップ余分になる。
  html = mustReplace(html,
    '<section class="tab on" id="tab-plan" role="tabpanel" aria-label="旅程">',
    buildOverviewSection(html, UNDECIDED_BANNER) + '\n\n<section class="tab on" id="tab-plan" role="tabpanel" aria-label="旅程">',
    'overview section');

  html = html.replace('  showTab(store.get(\'tab\', \'plan\'));', "  showTab(['overview','plan','venue','rec','prep'].includes(store.get('tab','plan')) ? store.get('tab','plan') : 'plan');");
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
    html = mustReplace(html, /<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="style.css">', 'online stylesheet extraction');
  }

  // ---------- 予定の状態を5つにそろえる ----------
  PLAN_STATE_FIXUPS.forEach(([search, replacement, expected], i) => {
    html = replaceAllCounted(html, search, replacement, `plan state fixup #${i}`, expected);
  });
  // 置き換え漏れを見る。旧い札の書式が残っていたら止める。
  const leftoverStateChips = html.match(/class="(?:st st-tbd|et t-tbd)"/g) || [];
  if (leftoverStateChips.length) {
    throw new Error(`Old state chips remain: ${leftoverStateChips.length}`);
  }

  // ---------- オンライン版から家族向けセクションを落とす ----------
  // #tab-famは主要タブ（旅程・会場・記録）に無く、CSSでも非表示で、画面から開く方法が
  // 無かった。家族向けはfamily_print.htmlが正本で、そちらはsource.htmlから
  // 組み直して作る。つまりこのセクションはどこからも使われず、旧v2のまま取り残されて
  // いた（5セクション構成にも気候の行にも追随していない）。約5,400字ぶんの死蔵。
  html = mustReplace(html, /\n*<section class="tab" id="tab-fam"[\s\S]*?<\/section>/, '', 'family section removal');
  if (/id="tab-fam"/.test(html)) throw new Error('family section still present after removal');

  // ---------- 絵文字をモノクロSVGへ ----------
  // 交通手段の変換（✈→.flight-mark）が終わり、机上用印刷版がスクリプトを落とした
  // あとに走らせる。ここまでの工程が足したり消したりした絵文字も、まとめて拾える。
  // 先にJS文字列の中を片付ける。flash()はtextContentへ入れるのでSVGを置けない。
  const documentName = offline ? 'desk_print.html' : 'index.html';
  html = stripScriptEmoji(html, documentName);
  html = applyEmojiIcons(html, documentName);
  return html;
}

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
//         19:35中部国際空港着（日本時間）まで機内。
const FAMILY_BLACKOUT_OUTBOUND = '9/7 22:50 〜 9/8 16:20';
const FAMILY_BLACKOUT_RETURN = '9/14 2:20 〜 9/14 19:35';

// ---------- 時差・気候：出発日・帰国日と同じ9月同士で比べる ----------
// 数値は一次情報を読んで確認済み（ドイツ側は独語版Wikipediaの気候表、
// 名古屋・京都側は気象庁の平年値）。ここでは調べ直さず、そのまま使う。
// 4都市とも一次情報で確認済みで、未確認の数値は無い。不揃いなのは統計期間だけなので
// 「限界」とは書かず、各都市に出典名と統計期間を併記して読み手が違いに気付ける形にする
// （季節感の用途では直近6年の値のほうが実態に近いこともあり、欠陥として書くのは不正確）。
// 名古屋（29.1／21.0）と京都（29.2／20.7）は実測値がほぼ同じなので1行にまとめる。
// 丸めたことが分かるよう「約」を付ける（29.1と29.2を「29.1」とだけ書くと片方の値に
// 見えてしまうため）。シュトゥットガルト・フランクフルトは元の値が1都市ぶんなので
// 丸めない。
const CLIMATE_ROWS = [
  ['名古屋・京都 9月', '約29℃', '約21℃', '気象庁 平年値（1991–2020）。名古屋29.1/21.0、京都29.2/20.7の概数'],
  // シュトゥットガルトとフランクフルトは1行にまとめた。150kmしか離れておらず、
  // 実際の値も最高21℃で同じ、最低が11℃と12℃で1℃違うだけだった。
  // しかも統計期間が違う（2015–2020と1981–2010）ので、その1℃差は都市の違いなのか
  // 期間の違いなのか分からない。並べると比較できる数字に見えてしまう。
  ['ドイツ（シュトゥットガルト・フランクフルト） 9月', '約21℃', '約11〜12℃', '独語版Wikipediaの気候表（統計期間は都市により異なる）'],
];
// 季節感の換算（本文で使うだけで、表の行にはしない）。10月・11月も名古屋・京都は
// ほぼ同じ値なので丸めてまとめる。名古屋23.3/14.8・京都23.4/14.4 → 約23℃/約14〜15℃、
// 名古屋17.3/8.6・京都17.3/8.4 → 約17℃/約8.5℃。

// ---------- 家族印刷版：日程詳細（EUROBLECH方式） ----------
// 202610_Europe_TechEx_EuroBLECHのsection.family-schedule（schedule-body内に
// schedule-legend＋family-day-row×日数、各日はagenda-line＋asideの宿泊）と
// 同じ構造をそのまま踏襲する。出どころはsource.htmlの旅程タブ（#tab-plan、
// 8日分）だけで、時刻・便名・地名はすべてそこに書かれている値をそのまま使う。
// 新しい時刻・場所は足していない。9/12・9/13の日中は本人たちもまだ未決なので、
// 特定の案を先取りせず「要検討」として案の名前だけを載せる。
// HRSは全行程が同一行動（人別の別行動がない）ので、EuroBLECHが合流後に使う
// <section class="family-shared"><h3>全員</h3> の1枠構成を毎日使う
// （class="family-day-row shared-day"も毎日付ける）。
// 5つ目の要素は概要タブ用の短い言い方（省略可）。荷物を預ける・入国審査といった
// 手続きの列挙は、その日の全体像には要らない（2026-08-23にユーザーが指摘）。
// 家族向けは4つ目の本文をそのまま使い、概要だけが短いほうを取る。
// 新しい事実を書けないよう、buildOverviewSectionが本文の一部であることを確認する。
const FAMILY_DAYS = [
  { date:'9/7', dow:'月', events:[
    ['22:50発','flight','機内','NGO発 → HEL（Finnair AY80／A350・13時間5分）。<b>翌朝まで連絡がつきにくい</b>'],
  ], stays:[['全員','機内']] },
  { date:'9/8', dow:'火', events:[
    ['5:55〜7:40','transfer','乗り継ぎ','ヘルシンキで1時間45分'],
    ['7:40','flight','フライト','HEL発 → FRA（AY1411／A321・2時間40分）9:20着'],
    ['9:20','procedure','到着','Frankfurt FRA着。荷物受取・税関'],
    ['12:11〜12:30頃','move','移動','Stuttgart Hbf着 → Maritim Stuttgartに荷物を預ける（正式チェックインは15:00〜）'],
    ['夕方〜夜','stay','チェックイン','Maritim Stuttgartにチェックイン'],
  ], stays:[['全員','Maritim Stuttgart']] },
  { date:'9/9', dow:'水', events:[
    ['9:00〜17:00','work','仕事','HRS Europe 2026 Day 1（Liederhalle）'],
  ], stays:[['全員','Maritim Stuttgart']] },
  { date:'9/10', dow:'木', events:[
    ['9:00〜17:00','work','仕事','HRS Europe 2026 Day 2（Liederhalle）'],
  ], stays:[['全員','Maritim Stuttgart']] },
  { date:'9/11', dow:'金', events:[
    ['8:30〜12:00','work','仕事','HRS Europe 2026 Day 3：企業訪問（Fraunhofer IPA・ARENA2036）。Liederhalle前からチャーターバスで出発、午後は自由行動'],
  ], stays:[['全員','Maritim Stuttgart']] },
  { date:'9/12', dow:'土', events:[
    ['日中','review','過ごし方は未定','A：Mainz観戦／B：ケルン／C：ポルシェ／D：ポルシェ＋ケルンの4案から検討中'],
  ], stays:[['全員','Best Western Hotel Airport Frankfurt']] },
  { date:'9/13', dow:'日', events:[
    ['日中','review','過ごし方は未定','X：ケルン／Y：市内／Z：Mainzの3案から検討中'],
    ['19:20発','flight','フライト','FRA発 → HEL（Finnair AY1416／A321・2時間25分）22:45着'],
    ['22:45〜0:45','transfer','乗り継ぎ','ヘルシンキで2時間'],
    ['0:45発','flight','機内','HEL発 → NGO（AY79／A350・12時間50分）。<b>翌9/14 19:35中部国際空港着まで連絡がつきにくい</b>'],
  ], stays:[['全員','機内']] },
  { date:'9/14', dow:'月', events:[
    ['19:35','flight','帰着','中部国際空港着'],
    ['21:05頃','move','帰宅','入国審査・荷物受取・税関を終え、名鉄名古屋で分岐して各自帰宅','名鉄名古屋で分岐して各自帰宅'],
  ], stays:[['全員','帰宅']] },
];
// 地図リンクは場所名そのものに張るのが規約。2件のURLはFAMILY_FIXUPSが使っている
// ものと同じ値（出どころは同一の既存リンク）。「機内」「帰宅」は場所を指さないので
// リンクしない（EuroBLECHのNON_PLACE_STAYSと同じ扱い）。
const FAMILY_STAY_MAP_LINKS = {
  'Maritim Stuttgart': 'https://www.google.com/maps/search/?api=1&query=Maritim+Hotel+Stuttgart+Seidenstrasse+34+70174+Stuttgart',
  'Best Western Hotel Airport Frankfurt': 'https://www.google.com/maps/search/?api=1&query=Best+Western+Hotel+Airport+Frankfurt+De-Saint-Exupery-Strasse+6+60549+Frankfurt',
};
const NON_PLACE_STAYS = ['機内', '帰宅'];

// ============================================================
// 概要タブ（2026-08-16）
// ============================================================
// 出張概要／日程概要／イベント概要／施設概要の4ブロック。
// どのブロックも「1行の事実 ＋ 詳細タブへの導線」に留める。理由・候補の中身・
// リンク集は旅程・会場・準備が持つ。ここに周辺レストランや観光地やラウンジを
// 集めると、全タブ中で最も長いタブになり「ひと目で俯瞰する場所」でなくなる。
//
// 日程概要はFAMILY_DAYSから組む。手で書くと、日程を1回直した時点で概要だけが
// 古くなる。概要は全体を見る場所なので、ズレたときの実害が最も大きい。
// フライトのある日は、この並びからflightを外して選ぶ（overviewDayRows）。便名と
// 時刻は区間の行が持つので、同じ便を主な内容にも出すと1行に同じ事実が2回並ぶ。
// 2026-08-16はflightをmoveより上に置いていた。当時の概要に区間の行が無く、moveを
// 上にすると9/14が「入国審査…各自帰宅」を拾って、その日の主役である19:35の
// 中部国際空港着が概要から消えたため。区間の行を出す以上、その理由はもう無い。
// flightを残してあるのは、区間データの無いフライト行（9/14の帰着）を持つ日でも
// 主な内容が空にならないようにするため。
const OVERVIEW_MAIN_KIND_ORDER = ['work', 'review', 'flight', 'move', 'procedure', 'transfer', 'stay'];
// 「。」以降は補足なので落とす。「（）」は残す。'Maritim Stuttgartに荷物を預ける
// （正式チェックインは15:00〜）' のように括弧が条件を持つ行があり、括弧で切ると
// 意味が変わる。
const overviewHeadline = text => text.replace(/<[^>]+>/g, '').split('。')[0].trim();
// 未確定の日だけ、「。」の後ろに残した理由を小さく添える（9/12・9/13の過ごし方案）。
// 状態の札は付けない。CLAUDE.mdの「状態を持つ単位は予定1件」に従い、札の所有者は
// 旅程・会場に置く。同じ予定の札を概要にも複製すると、片方だけ古くなる。
// 9/11は訪問先・集合方法とも確定済み（残るのはグループ分けのみ）なので、
// 2026-08-19にこの一覧から外した。バナー本文には9/11の決定事項として残す。
const overviewTail = text => text.replace(/<[^>]+>/g, '').split('。').slice(1).join('。').trim();
// 未確定の日は自分で判定しない。ページ冒頭の警告バナーが名指ししている日付を
// そのまま使い、バナー側が変わったらビルドで気付けるようにする。
const OVERVIEW_UNDECIDED_DATES = ['9/12', '9/13'];

// 日ごとの区分。1行の内容だけだと便名や会議名が並ぶばかりで、その日が何の日なのかが
// 読み取れない（2026-08-16にユーザーが指摘）。ここもFAMILY_DAYSから導出する。
// 手で並べると、日程を1日ずらしたときに区分だけ古くなる。
// 軸は1本だけにする。2026-08-23まで9/8が「移動」（その日の行為）、9/13が「帰国日」
// （旅程上の位置）で、2つの軸が混ざっていた（ユーザーが指摘）。行為で名付けると
// 往路の到着日と復路の出発日がどちらも「移動」になり、区分から向きが消える。
// 旅程上の位置で名付ける。境目の4日は越える境界で呼び、間の日は中身で呼ぶ。
// 順序が判定順。上から最初に当たったものを採る。
//   初日            … 出国（日本を出る。機内泊でも帰りではない）
//   最終日          … 帰国（日本に着く）
//   機内泊          … 帰路（現地を出て、その夜は空の上）
//   前夜が機内泊    … 到着（現地に着く）
//   仕事あり        … イベント
//   移動あり        … 移動（境界をまたがない移動だけの日。HRSには無い）
//   それ以外        … 休日
// 休日かどうかは暦の話で、その日に何をするか（会議・企業訪問・移動）とは別の軸。
// 1つの札にまとめると、9/13のように「休日で、かつ帰路」の日が表せない
// （2026-08-23にユーザーが指摘）。札は2つまで出し、休日を先に置く。
// 祝日はいまの日程に無い。入るときはdowと同じくFAMILY_DAYSに持たせる。
// ここで日付を決め打ちしない。
const OVERVIEW_OFF_DOW = ['土', '日'];
const overviewIsDayOff = day => OVERVIEW_OFF_DOW.includes(day.dow);

// 仕事の日の中身。会場に籠もる日と外へ出る日を同じ「イベント」でまとめると、
// 9/11だけ場所も終わる時刻も違うことが概要から消える。予定文から読むので、
// 日程を差し替えれば札も一緒に動く。当たらなければ会議（HRSは国際会議の視察）。
const OVERVIEW_WORK_KINDS = [['企業訪問', '企業訪問'], ['工場見学', '工場見学'], ['打ち合わせ', '打合せ']];
const overviewWorkKind = day => {
  const work = day.events.find(ev => ev[1] === 'work');
  const hit = OVERVIEW_WORK_KINDS.find(([needle]) => work[3].includes(needle));
  return hit ? hit[1] : '会議';
};

const overviewDayKind = (day, i, all) => {
  if (i === 0) return '出国';
  if (i === all.length - 1) return '帰国';
  if (day.stays.some(s => s[1] === '機内')) return '帰路';
  if (all[i - 1].stays.some(s => s[1] === '機内')) return '到着';
  if (day.events.some(e => e[1] === 'work')) return overviewWorkKind(day);
  if (day.events.some(e => ['flight', 'move', 'transfer'].includes(e[1]))) return '移動';
  return '';
};
// 導出結果が変わったら気付けるように、期待値を並べて突き合わせる。
// 2026-08-23に3度動かした。9/8「移動」→「到着」、9/13「帰国日」→「帰路」で
// 軸を1本（旅程上の位置）にそろえ、そのあと休日を別の札へ出して、
// 残った軸を「その日の中身」にした。9/12は中身の予定がまだ無いので空になる。
const OVERVIEW_DAY_KINDS = ['出国', '到着', '会議', '会議', '企業訪問', '', '帰路', '帰国'];
const OVERVIEW_DAY_OFFS = ['', '', '', '', '', '休日', '休日', ''];

// 概要に出すフライトは、利用フライトのFLIGHT_JOURNEYSから引く。概要のために便名や
// 時刻を書き直さない（書き直せば旅程と概要が別々の値を持つ）。
// 並べる日は出発日にする。復路のAY79は家族向けでは9/13の夜の続きとして書いてあるが、
// ヘルシンキ発は日付をまたいだ9/14 0:45で、中部国際空港着19:35も9/14。9/14の行に
// 置かないと、帰国便が概要から消える（2026-08-23までそうなっていた）。
const overviewDayKey = label => label.split('（')[0];
// 並べ替え用。「日中」のように時刻を持たない行は0にして、その日の先頭へ置く。
const overviewMinutes = label => {
  const hit = String(label).match(/(\d{1,2}):(\d{2})/);
  return hit ? Number(hit[1]) * 60 + Number(hit[2]) : 0;
};

// 陸路も区間行に出す。9/8はフランクフルトに着いたあとICEでシュトゥットガルトへ入るので、
// フライトだけではその日の移動が半分しか出ない（2026-08-23にユーザーが指摘）。
// 出すのは都市間の移動だけ。空港アクセス（名鉄名古屋⇔中部国際空港の28分）は当日の
// 行動計画の粒度なので旅程が持つ。9/12のシュトゥットガルト→フランクフルトは案ごとに
// 便も時刻も違う（8:30頃／10:26／13:00頃／15:00）ので、案が決まるまで出さない。
// 決まったらここへ1件足す。値はsource.htmlの旅程にある文字列で、buildOverviewSectionが
// 組み立て前に一致を確認する。
// 地点は、空港はコード、駅は駅名。フライトの区間行と同じ場所が同じ字で出るようにする
// （旅程が持つ「長距離駅（Fernbf）」まで概要には出さない）。
const GROUND_LEGS = [
  { icon: 'train', no: 'ICE 515', duration: '1時間20分',
    from: ['FRA', 'CEST', '9/8', '10:51'], to: ['Stuttgart Hbf', 'CEST', '9/8', '12:11'] },
];
// フライトの区間データを、陸路と同じ形（地点・時刻帯・日付・時刻）へそろえる。
const overviewFlightLeg = leg => ({
  icon: 'flight', no: leg.no, duration: leg.duration,
  from: [leg.from[0], AIRPORTS[leg.from[0]][1], overviewDayKey(leg.from[1]), leg.from[2]],
  to: [leg.to[0], AIRPORTS[leg.to[0]][1], overviewDayKey(leg.to[1]), leg.to[2]],
});
const OVERVIEW_LEGS_BY_DATE = {};
FLIGHT_JOURNEYS.forEach(journey => journey.legs.forEach(leg => {
  const shaped = overviewFlightLeg(leg);
  const date = shaped.from[2];
  (OVERVIEW_LEGS_BY_DATE[date] = OVERVIEW_LEGS_BY_DATE[date] || []).push(shaped);
}));
GROUND_LEGS.forEach(leg => {
  const date = leg.from[2];
  (OVERVIEW_LEGS_BY_DATE[date] = OVERVIEW_LEGS_BY_DATE[date] || []).push(leg);
});
Object.values(OVERVIEW_LEGS_BY_DATE).forEach(legs =>
  legs.sort((a, b) => overviewMinutes(a.from[3]) - overviewMinutes(b.from[3])));
const OVERVIEW_LEG_COUNT = Object.values(OVERVIEW_LEGS_BY_DATE).reduce((n, legs) => n + legs.length, 0);

// 1区間1行。出発時刻・地点・発、到着時刻・地点・着、便名、所要をこの順で出す。
// 向きは矢印ではなく「発」「着」で示す（EUROBLECH方式）。日付をまたぐ側だけ日付を
// 添える。22:50発の便が5:55に着くのを同じ日と読ませない。
// 393pxでは折り返して2行になる。3行に伸びる書き方（機材・ラウンジ・注記）は足さない。
const overviewLegMarkup = (dayDate, leg) => {
  // 時刻帯は、出発と到着で違うときだけ出す。0:45発・19:35着で所要12時間50分の区間は、
  // 時刻帯が無いと数字だけが合わない行になる。同じ時刻帯の中を走るICEには要らない。
  const showTz = leg.from[1] !== leg.to[1];
  const point = (label, [name, tz, date, time]) =>
    '<span class="ov-leg-pt">'
    + (date === dayDate ? '' : `<span class="ov-leg-day">${date}</span>`)
    + `<b>${time}</b>${showTz ? `<span class="ov-leg-tz">${tz}</span>` : ''}`
    + `<span class="ov-leg-code">${name}</span><em>${label}</em></span>`;
  return `<div class="ov-leg">${lineIconHtml(leg.icon)}<span class="ov-leg-no">${leg.no}</span>`
    + point('発', leg.from) + point('着', leg.to)
    + `<span class="ov-leg-dur">${leg.duration}</span></div>`;
};

function overviewDayRows() {
  return FAMILY_DAYS.map((day, i, all) => {
    const legs = OVERVIEW_LEGS_BY_DATE[day.date] || [];
    // 区間行が持っている移動は主な内容に出さない。区間行にしていない移動は残す
    // （9/14の「名鉄名古屋で分岐して各自帰宅」。空港アクセスは区間行にしないため）。
    const order = legs.length
      ? ['work', 'review'].concat(legs.some(leg => leg.icon !== 'flight') ? [] : ['move'])
      : OVERVIEW_MAIN_KIND_ORDER;
    const pick = order
      .map(kind => day.events.find(ev => ev[1] === kind))
      .find(Boolean);
    // 移動しかない日は区間行だけになる。主な内容が空の行があってよい。
    if (!pick && !legs.length) throw new Error(`Overview: no representative event for ${day.date}`);
    const main = pick ? overviewHeadline(pick[4] || pick[3]) : '';
    if (pick && !main) throw new Error(`Overview: empty headline for ${day.date}`);
    const undecided = OVERVIEW_UNDECIDED_DATES.includes(day.date);
    const note = undecided && pick ? overviewTail(pick[3]) : '';
    // 主な内容も区間行も、その日の時刻で並べる。主な内容を先頭に固定すると、9/8が
    // 「Stuttgart Hbf着（12:11）→ 7:40のフライト」と逆順になる（2026-08-23に指摘）。
    const parts = legs.map(leg => ({ at: overviewMinutes(leg.from[3]), html: overviewLegMarkup(day.date, leg) }));
    if (pick) {
      parts.push({
        at: overviewMinutes(pick[0]),
        html: `<div class="ov-main">${main}${note ? `<span class="ov-note">${note}</span>` : ''}</div>`,
      });
    }
    parts.sort((a, b) => a.at - b.at);
    return {
      date: `${day.date}（${day.dow}）`,
      kind: overviewDayKind(day, i, all),
      off: overviewIsDayOff(day) ? '休日' : '',
      main,
      legs,
      content: parts.map(part => part.html).join(''),
      stay: day.stays.map(s => s[1]).join('／'),
    };
  });
}

function buildOverviewSection(source, undecidedBanner) {
  // 使う事実はすべて既存ソースの中にある。新しい固有名詞・数字は持ち込まない。
  // ソースが変わったら気付けるよう、使う前に確認する（家族サマリーと同じ規律）。
  // 主催・規模・前回開催だけは、このリポジトリのどこにも無かった外部の事実。
  // 2026-08-16にhumanoidrobotssummit.comとacgrobot.comを実際に開いて確認した。
  //   主催   ACG Events Global（両サイトの表記。ページ内の「主催 acgrobot」リンクとも一致）
  //   規模   参加1,000名超・500社超・出展40社超（いずれも主催者の見込み値）
  //   前回   HRS Europe 2025 ベルリン、参加500名超（acgrobot.comの記載）
  // 登壇者数は同一ページ内で「30+」と「40」が食い違っていたので載せない。
  // 見込み値を実績のように書かないこと。画面にも主催者発表である旨と出典を出す。
  // これらはソース照合の対象外（元のHTMLに無いのが当然のため）。
  const overviewFacts = [
    '9/7（月）〜9/14（月）｜2名｜シュトゥットガルト・フランクフルト',
    'Liederhalle', 'Berliner Platz 1-3', 'ホテルから徒歩約3分',
    '9/9・9/10 は講演＋展示（40+社）／9/11 は近郊企業訪問',
    'Google DeepMind・NVIDIA・BMW Group・Boston Dynamics・Unitree Robotics・Siemens・Fraunhofer IPA',
    'Maritim Stuttgart', 'Best Western Hotel Airport Frankfurt',
    // 各日のテーマ。会場タブの日別プレースホルダーが持っている文字列をそのまま使う。
    '政策・市場・量産・Embodied AI・モーター技術',
    '医療応用・センサー・GDPR・フレキシブル生産ライン',
    '企業訪問（Fraunhofer IPA・ARENA2036、8:30〜12:00）',
  ];
  overviewFacts.forEach(fact => {
    if (!source.includes(fact)) throw new Error(`Overview fact missing from source: ${fact}`);
  });
  // 未確定の日付は警告バナーが正本。バナーに無い日付へ札を付けない。
  OVERVIEW_UNDECIDED_DATES.forEach(date => {
    if (!undecidedBanner.includes(date)) {
      throw new Error(`Overview: ${date} is marked undecided but the warning banner does not name it`);
    }
  });

  // 日ごとの件数はセッション表から数える。見出しに書いてある数を書き写すと、
  // 表が増減したときに概要だけ古い数を出す。
  const sessionCount = day => (source.match(new RegExp(`data-k="${day}-\\d+"`, 'g')) || []).length;
  const [d1, d2, d3] = ['d1', 'd2', 'd3'].map(sessionCount);
  if (!d1 || !d2 || !d3) throw new Error(`Overview: session rows not found (d1=${d1} d2=${d2} d3=${d3})`);

  // 概要のフライトと利用フライトが同じ便を指していること。片側だけを見ると、
  // 概要に増やしたまま家族向けの本文が古い便名を持つ状態が通る。
  const familyFlightNos = [...new Set(FAMILY_DAYS
    .flatMap(day => day.events)
    .filter(ev => ev[1] === 'flight')
    .flatMap(ev => ev[3].match(/AY\d+/g) || []))].sort();
  const legNos = Object.values(OVERVIEW_LEGS_BY_DATE).flat()
    .filter(leg => leg.icon === 'flight').map(leg => leg.no).sort();
  if (familyFlightNos.join('／') !== legNos.join('／')) {
    throw new Error(`Overview: flight numbers differ. legs ${legNos.join('／')} vs itinerary ${familyFlightNos.join('／')}`);
  }
  // 陸路は概要のために書き起こした行なので、値が旅程にあることを確かめてから使う。
  GROUND_LEGS.forEach(leg => {
    [leg.no, leg.duration, leg.from[0], leg.from[3], leg.to[0], leg.to[3]].forEach(fact => {
      if (!source.includes(fact)) throw new Error(`Overview: ground leg fact missing from source: ${fact}`);
    });
  });
  Object.keys(OVERVIEW_LEGS_BY_DATE).forEach(date => {
    if (!FAMILY_DAYS.some(day => day.date === date)) {
      throw new Error(`Overview: flight leg on ${date}, which is not a day of the trip`);
    }
  });

  const rows = overviewDayRows();
  if (rows.length !== 8) throw new Error(`Overview: expected 8 day rows, got ${rows.length}`);
  const shownLegs = rows.reduce((n, r) => n + r.legs.length, 0);
  if (shownLegs !== OVERVIEW_LEG_COUNT) {
    throw new Error(`Overview: ${OVERVIEW_LEG_COUNT} legs to show, but ${shownLegs} reached the table`);
  }
  const kinds = rows.map(r => r.kind);
  if (kinds.join('／') !== OVERVIEW_DAY_KINDS.join('／')) {
    throw new Error(`Overview: day kinds changed. got ${kinds.join('／')}, expected ${OVERVIEW_DAY_KINDS.join('／')}`);
  }
  const offs = rows.map(r => r.off);
  if (offs.join('／') !== OVERVIEW_DAY_OFFS.join('／')) {
    throw new Error(`Overview: days off changed. got ${offs.join('／')}, expected ${OVERVIEW_DAY_OFFS.join('／')}`);
  }
  // 概要用の短い言い方は、旅程の本文の一部であること。ここで言い換えを作らない。
  FAMILY_DAYS.forEach(day => day.events.forEach(ev => {
    if (ev[4] && !ev[3].includes(ev[4])) {
      throw new Error(`Overview: ${day.date} short form "${ev[4]}" is not part of the itinerary text`);
    }
  }));
  const dayRowsHtml = rows.map(r =>
    `<tr><td class="ov-date">${r.date}</td>`
    + `<td class="ov-kind">${r.off ? `<span class="ov-off">${r.off}</span>` : ''}${r.kind ? `<span>${r.kind}</span>` : ''}</td>`
    + `<td>${r.content}</td>`
    + `<td class="ov-stay">${r.stay}</td></tr>`
  ).join('\n          ');

  return String.raw`<section class="tab" id="tab-overview" role="tabpanel" aria-label="概要">
  <div class="card">
    <h2 class="ttl">${lineIconHtml('suitcase')}出張概要</h2>
    <div class="bd" style="display:grid;gap:8px">
      <p class="where-lead" style="margin:0">HRS Europe 2026（ヒューマノイドの国際会議）の視察｜9/7（月）発 〜 9/14（月）着 ｜ 2名 ｜ Finnair NGO⇔FRA</p>
      <div class="sum-place sum-a"><strong>シュトゥットガルト</strong><span>9/8（火）〜9/12（土）</span><span>HRS Europe 2026。会場はホテルの隣（徒歩約3分）</span></div>
      <div class="sum-place sum-b"><strong>フランクフルト</strong><span>9/12（土）〜9/13（日）</span><span>帰国前泊。空港近郊</span></div>
      <div class="sum-facts">
        <div><b>会期</b><span>9/9〜9/11</span><span>3日間</span></div>
        <div><b>全日程</b><span>8日間</span><span>2名</span></div>
        <div><b>帰着</b><span>9/14（月）</span><span>中部国際空港 19:35</span></div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2 class="ttl">${lineIconHtml('calendar')}日程概要</h2>
    <div class="bd">
      <table class="ov-days">
        <thead><tr><th>日付</th><th>区分</th><th>主な内容</th><th>宿泊</th></tr></thead>
        <tbody>
          ${dayRowsHtml}
        </tbody>
      </table>
      <div class="ov-more no-print"><button class="btn" data-goto="plan">${lineIconHtml('calendar')}日ごとの旅程へ</button></div>
    </div>
    <div class="foot">${lineIconHtml('bulb')}都市間の移動は全${OVERVIEW_LEG_COUNT}区間を1行ずつ出します。候補の中身と地図リンクは旅程タブが持ちます</div>
  </div>

  <div class="card">
    <h2 class="ttl">${lineIconHtml('robot')}イベント概要</h2>
    <div class="bd small" style="display:grid;gap:7px">
      <div>ヒューマノイドの国際会議。9/9〜9/11の3日間で、Day 1・Day 2に全${d1 + d2}項目と展示40+社、最終日は企業訪問</div>
      <div class="ov-facility">
        <div><b>Day 1</b><span>9/9（水）全${d1}項目 — 政策・市場・量産・Embodied AI・モーター技術</span></div>
        <div><b>Day 2</b><span>9/10（木）全${d2}セッション — 医療応用・センサー・GDPR・フレキシブル生産ライン</span></div>
        <div><b>Day 3</b><span>9/11（金）企業訪問（Fraunhofer IPA・ARENA2036、8:30〜12:00）</span></div>
      </div>
      <div class="ov-facility">
        <div><b>主催</b><span><a class="place" href="https://acgrobot.com/" target="_blank" rel="noopener">ACG Events Global</a></span></div>
        <div><b>規模</b><span>参加1,000名超・500社超・出展40社超の見込み（主催者発表）</span></div>
        <div><b>前回</b><span>HRS Europe 2025（ベルリン）参加500名超。今回がシュトゥットガルトへの移転初回</span></div>
      </div>
      <div>${lineIconHtml('star')}主要出展社：Google DeepMind・NVIDIA・BMW Group・Boston Dynamics・Unitree Robotics・Siemens・Fraunhofer IPA</div>
      <details class="fold"><summary>数字の出どころ</summary><div class="fold-body">規模の3つと前回の参加者数は主催者の公表値で、第三者による検証はされていない。参加1,000名超・500社超は開催前の見込み、前回500名超は主催者が実績として書いているもの。登壇者数は公式サイトの同一ページに「30+」と「40」の2つが載っていて判断できないため、ここには出していない。出典は<a href="https://humanoidrobotssummit.com/" target="_blank" rel="noopener">humanoidrobotssummit.com</a>と<a href="https://acgrobot.com/" target="_blank" rel="noopener">acgrobot.com</a>（2026-08-16 閲覧）。</div></details>
      <div class="ov-more no-print"><button class="btn" data-goto="venue">${lineIconHtml('book')}セッション表と当日メモへ</button></div>
    </div>
  </div>

  <div class="card">
    <h2 class="ttl">${lineIconHtml('hotel')}施設概要</h2>
    <div class="bd">
      <div class="ov-facility">
        <div><b>会場</b><span>Liederhalle（Berliner Platz 1-3）。Maritim Stuttgartから徒歩約3分</span></div>
        <div><b>宿</b><span>Maritim Stuttgart 9/8〜9/12 ／ Best Western Hotel Airport Frankfurt 9/12〜9/13</span></div>
        <div><b>空港</b><span>往路 NGO → HEL → FRA ／ 復路 FRA → HEL → NGO（ヘルシンキ乗継）</span></div>
      </div>
      <div class="ov-more no-print"><button class="btn" data-goto="plan">${lineIconHtml('calendar')}フライト・宿泊の詳細と地図リンク集へ</button></div>
    </div>
    <div class="foot">${lineIconHtml('bulb')}詳細も周辺の食事・観光・ラウンジも旅程タブの末尾にあります。準備タブは出発前のToDoだけ</div>
  </div>
</section>`;
}
function familyStayPlace(name) {
  if (NON_PLACE_STAYS.includes(name)) return name;
  const href = FAMILY_STAY_MAP_LINKS[name];
  if (!href) throw new Error(`Family schedule stay place URL missing: ${name}`);
  return `<a class="place" href="${href}" target="_blank" rel="noopener">${name}</a>`;
}
const familyEventMarkup = ([time, kind, tag, text]) =>
  `<div class="agenda-line"><time>${time}</time><span class="schedule-tag kind-${kind}">${tag}</span><p>${text}</p></div>`;
const familyStayMarkup = stays =>
  `<aside><h3>宿泊</h3>${stays.map(([who, name]) => `<p>${familyStayPlace(name)}<br><small>${who}</small></p>`).join('')}</aside>`;
const familyDayMarkup = day =>
  `<article class="family-day-row shared-day"><header><strong>${day.date}</strong><span>${day.dow}</span></header>` +
  `<section class="family-shared"><h3>全員</h3>${day.events.map(familyEventMarkup).join('')}</section>` +
  familyStayMarkup(day.stays) + '</article>';
// 凡例はHRSが実際に使う7種類（202610_Europe_TechEx_EuroBLECHと同一の7種すべてを使う。
// 該当なしで外した種別はない）。
const familyScheduleLegend = '<div class="schedule-legend" aria-label="色の意味"><strong>表示の区別</strong>'
  + '<span class="schedule-tag kind-flight">フライト</span>'
  + '<span class="schedule-tag kind-move">地上移動</span>'
  + '<span class="schedule-tag kind-transfer">到着・乗り継ぎ</span>'
  + '<span class="schedule-tag kind-procedure">手続き</span>'
  + '<span class="schedule-tag kind-work">仕事</span>'
  + '<span class="schedule-tag kind-stay">滞在・宿</span>'
  + '<span class="schedule-tag kind-review">要検討</span></div>';
const familyScheduleSection = `<section class="family-schedule"><div class="family-section-head">📅 日程詳細（家族向け）</div><div class="schedule-body">${familyScheduleLegend}${FAMILY_DAYS.map(familyDayMarkup).join('')}</div></section>`;

function buildFamily() {
  const sectionMatch = source.match(/<section class="tab" id="tab-fam"[\s\S]*?<\/section>/);
  if (!sectionMatch) throw new Error('Family source not found');
  let section = sectionMatch[0]
    .replace('<section class="tab"', '<section class="tab on"')
    .replace('id="btn-print-fam"', 'onclick="window.print()"')
    // 🖨（U+1F5A8）はWindowsで黒塗りグリフになるため、家族印刷版のボタンでも
    // オンライン版と同じline-icon SVGへそろえる。
    .replace('🖨 この家族用ページだけ印刷', `${printIconHtml} この家族用ページだけ印刷`);
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

  // 「日本時間で見ると、現地はこうなっている」の対応表は削除する（ユーザーの決定）。
  // .timezone-cardsと.timezone-leadの時差カードだけを残し、時刻の対応表は載せない。

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
    '9/7（月）〜9/14（月）｜2名｜シュトゥットガルト・フランクフルト',
    'ロボットの国際会議',
    '9月14日（月）', '中部国際空港着',
    '入国審査・荷物受取に約40分', '20:35頃 中部国際空港発（ミュースカイ）',
    '21:50頃 京都駅', '21:40頃 犬山駅',
    '9/13（日）19:20 フランクフルト発', '9/14（月）19:35 中部国際空港着', 'Finnair',
    '9/7（月）22:50 中部国際空港発', '9/8（火）9:20 フランクフルト着',
  ];
  summaryFacts.forEach(fact => {
    if (!source.includes(fact)) throw new Error(`Family summary fact missing from source: ${fact}`);
  });

  // ---------- ① 出張サマリー ----------
  // 帰りの「19:20 フランクフルト発」は現地時刻、「19:35 中部国際空港着」は
  // 日本時刻。元のカードはどちらか書いていなかったので、ここで明示する。
  // 連絡が取れない時間帯は、ページ自身の時差（7時間）から出しただけの
  // 機内区間の時刻で、新しい事実ではない。
  const familySummarySection = String.raw`<section class="family-section family-summary"><div class="family-section-head">🧳 出張サマリー</div><div class="family-section-body" style="display:grid;gap:8px">
    <p class="where-lead">HRS Europe 2026（ロボットの国際会議）｜2名｜Finnair NGO⇔FRA</p>
    <div class="sum-place sum-a"><strong>シュトゥットガルト</strong><span>9/8（火）〜9/12（土）</span><span>HRS Europe 2026。会場はホテルの隣（徒歩約3分）</span></div>
    <div class="sum-place sum-b"><strong>フランクフルト</strong><span>9/12（土）〜9/13（日）</span><span>帰国前泊。空港近郊</span></div>
    <div class="sum-facts">
      <div><b>出発</b><span>9/7（月）</span><span>中部国際空港発</span></div>
      <div><b>期間</b><span>8日間</span><span>2名</span></div>
      <div><b>帰着</b><span>9/14（月）</span><span>中部国際空港 19:35</span></div>
    </div>
    <div class="small"><strong>行きの便</strong>：9/7（月）22:50 中部国際空港発（日本時刻） → 9/8（火）9:20 フランクフルト着（現地時刻）</div>
    <div class="small"><strong>帰りの便</strong>：9/13（日）19:20 フランクフルト発（現地時刻） → ヘルシンキ乗継 → 9/14（月）19:35 中部国際空港着（日本時刻・Finnair）</div>
    <div class="small" style="font-weight:700">連絡が取れない時間帯（日本時間）：往路の機内 ${FAMILY_BLACKOUT_OUTBOUND}／復路の機内 ${FAMILY_BLACKOUT_RETURN}</div>
    <div class="small">帰宅の見込み：19:35 中部国際空港着 → 入国審査・荷物受取に約40分 → 20:35頃中部国際空港発（ミュースカイ） → 21:50頃京都駅／21:40頃犬山駅</div>
  </div></section>`;

  // ---------- ② 時差・気候 ----------
  // 気候は表にしない。393px幅では出典列が168pxを占め、見出しが1文字ずつ縦に
  // 折り返して、家族が最も見たい気温が右へ押し出されていた（2026-08-15に実機で確認）。
  // 都市ごとの行にして、気温を大きく、出典を小さい補足に落とす。出典は消さない。
  const climateRowsHtml = CLIMATE_ROWS.map(([place, hi, lo, src]) =>
    `<div class="climate-row"><p class="climate-place">${place}</p>
          <p class="climate-temp"><span><i>平均最高</i><b>${hi}</b></span><span><i>平均最低</i><b>${lo}</b></span></p>
          <p class="climate-src">${src}</p></div>`
  ).join('\n        ');
  const familyTimezoneSection = String.raw`<section class="family-section family-timezone"><div class="family-section-head">🕐 時差・気候</div><div class="family-section-body" style="display:grid;gap:12px">
    <p class="timezone-lead"><strong>時刻は現地時刻。日本時間には「日本時間」と付けます</strong><span>日本＝JST・UTC+9／ドイツ＝CEST・UTC+2</span></p>
    ${timezoneInner}
    <div>
      <p class="where-lead" style="margin-bottom:8px">現地の気候（9月同士の比較）</p>
      <div class="climate-list">
        ${climateRowsHtml}
      </div>
      <div class="small muted" style="margin-top:6px">季節感は名古屋・京都の10月下旬〜11月上旬。日中は10月寄り、朝晩は11月寄り</div>
    </div>
  </div></section>`;

  // ---------- ④ 宿泊先情報 ----------
  const familyHotelSection = String.raw`<section class="family-section family-hotel"><div class="family-section-head">🏨 宿泊先情報</div><div class="family-section-body" style="display:grid;gap:6px">
    ${hotelInner}
  </div></section>`;

  // ---------- ⑤ 緊急連絡先 ----------
  // 住所・電話は外務省「在外公館リスト」（令和5年5月22日付）を実際に開いて確認した値。
  // 名称そのものが地図リンク（プロジェクトの規約。別に「📍 地図」は作らない）。
  // 管轄区域はこのリストに記載が無く未確認のため書かない。滞在先に地理的に近いのが
  // フランクフルトという事実だけ添える（「管轄」という言葉は使わない）。
  const familyEmergencySection = String.raw`<section class="family-section family-emergency"><div class="family-section-head">🆘 緊急連絡先</div><div class="family-section-body" style="display:grid;gap:8px">
    <div class="small"><strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Hiroshimastr.+6+10785+Berlin" target="_blank" rel="noopener">在ドイツ日本国大使館</a></strong><br>
      Hiroshimastr.6, 10785 Berlin｜<a href="tel:+4930210940">+49 30 210940</a>｜<a href="${embassyHref}" target="_blank" rel="noopener">公式サイト</a></div>
    <div class="small"><strong><a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=Friedrich-Ebert-Anlage+49+60327+Frankfurt+am+Main" target="_blank" rel="noopener">在フランクフルト日本国総領事館</a></strong><br>
      MesseTurm 34. OG, Friedrich-Ebert-Anlage 49, 60327 Frankfurt am Main｜<a href="tel:+49692385730">+49 69 2385730</a></div>
    <div class="small muted">滞在先（フランクフルト空港近郊のホテル）に地理的に近いのは在フランクフルト日本国総領事館。</div>
    <div class="small">欧州共通緊急番号：<a href="tel:112">112</a>（警察・消防・救急）</div>
    <div class="small"><a href="${mofaHref}" target="_blank" rel="noopener">外務省 海外安全ホームページ</a></div>
    <div class="small muted">出典：外務省 在外公館リスト（令和5年5月22日付）、2026-08-15確認。</div>
  </div></section>`;

  const openTag = mustExtract(section, /^<section[^>]*>/, 'family section open tag');
  const newSection = `${openTag}

  ${printBlock}
  ${familySummarySection}

  ${familyTimezoneSection}

  ${familyScheduleSection}

  ${familyHotelSection}

  ${familyEmergencySection}
</section>`;

  // 家族印刷版もオンライン版と同じアイコン規約にそろえる（節見出しの絵文字を含む）。
  return applyEmojiIcons(`<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>HRS Europe 2026 家族向け予定表</title><link rel="stylesheet" href="style.css"></head>
<body class="family-page" data-trip-layout="family-v1"><header class="family-head"><div class="wrap"><div class="eyebrow">HRS EUROPE 2026 · FAMILY COPY</div><h1>家族向け予定表</h1><p>2026年9月7日（月）〜9月14日（月）｜ドイツ出張</p></div></header><main class="wrap">${newSection}</main></body></html>`, 'family_print.html');
}

// ---------- 入国審査官に見せる1枚 ----------
// 審査官はドイツ語か英語しか読まないので、このページだけ英語で書く。
// 氏名とパスポート番号は入力欄にして、どこにも保存しない。localStorageにも
// Cloudflare同期にも乗せない。閉じれば消える。共用端末で開いても残らないため。
// 事実はすべてページ内の他の生成物と同じ元データから取っている。
function buildImmigration() {
  const rows = [
    ['Purpose of stay', 'Attending <strong>HRS Europe 2026</strong>, an international conference on humanoid robotics. Business trip, 2 travellers from Japan. No paid work in Germany.'],
    ['Conference', 'HRS Europe 2026<br>Venue: <strong>Liederhalle</strong>, Berliner Platz 1-3, 70174 Stuttgart<br>Sessions 9–10 Sep 2026; guided company visits near Stuttgart on 11 Sep 2026'],
    ['Entry / Exit', 'Arrive <strong>8 Sep 2026, 09:20</strong> at Frankfurt (FRA), Finnair AY80 / AY1411 via Helsinki<br>Depart <strong>13 Sep 2026, 19:20</strong> from Frankfurt (FRA), Finnair AY1416 / AY79 via Helsinki<br>Arrive Nagoya (NGO) 14 Sep 2026, 19:35 — <strong>return ticket held</strong>'],
    ['Length of stay', '<strong>6 nights</strong> in Germany (8–13 Sep 2026). Within the 90-day visa-free limit for Japanese nationals.'],
    ['Accommodation', '8–12 Sep: <strong>Maritim Hotel Stuttgart</strong><br>Seidenstraße 34, 70174 Stuttgart — Tel +49 711 9420<br><br>12–13 Sep: <strong>Best Western Hotel Airport Frankfurt</strong><br>De-Saint-Exupéry-Straße 6, 60549 Frankfurt am Main'],
    ['In case of enquiry', 'Consulate-General of Japan in Frankfurt<br>MesseTurm 34, Friedrich-Ebert-Anlage 49, 60327 Frankfurt am Main<br>Tel +49 69 238573-0'],
  ].map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('\n      ');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>HRS Europe 2026 — Traveller Information</title><link rel="stylesheet" href="style.css"></head>
<body class="immi-page" data-trip-layout="immigration-v1"><main class="wrap">
  <header class="immi-head">
    <div class="eyebrow">FOR BORDER CONTROL · GERMANY</div>
    <h1>Traveller Information</h1>
    <p class="immi-sub">HRS Europe 2026 · Stuttgart, Germany · 8–13 September 2026</p>
    <div class="no-print"><button class="btn" type="button" onclick="window.print()">Print this page</button></div>
  </header>
  <section class="immi-id">
    <label><span>Full name (as in passport)</span><input type="text" autocomplete="off" spellcheck="false"></label>
    <label><span>Passport number</span><input type="text" autocomplete="off" spellcheck="false"></label>
    <p class="immi-note no-print">Type these just before printing. Nothing on this page is saved — close the page and the fields are empty again.</p>
  </section>
  <table class="immi-table">
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p class="immi-foot">Prepared by the traveller. Details match the itinerary and the bookings held.</p>
</main></body></html>
`;
}

const outputs = [
  ['style.css', compiledSharedCss],
  ['index.html', buildMain()],
  ['desk_print.html', buildMain({ offline:true })],
  ['family_print.html', buildFamily()],
  ['immigration_print.html', buildImmigration()]
];

for (const [name, contents] of outputs) {
  const clean = contents.replace(/[ \t]+$/gm, '');
  fs.writeFileSync(path.join(here, name), clean, 'utf8');
  console.log(`${name}: ${Buffer.byteLength(clean)} bytes`);
}
