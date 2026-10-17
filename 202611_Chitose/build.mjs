// 千歳出張（2026-11-06〜11）の生成スクリプト。
// 入力はこのファイルの中身だけ。index.html と desk_print.html はここから作る生成物なので直接編集しない。
//   node .\202611_Chitose\build.mjs
//   node .\202611_Chitose\validate.mjs
// 元の計画は手書きの「千歳出張_本命プラン_1106-1111.html」（2026-10-17版）。内容は削らずに移した。
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cloudEndpoint = 'https://trip-field-sync.mrkn55.workers.dev';
const tripKey = 'chitose-202611';

// ---- アイコン（絵文字は使わない。交通手段はEUROBLECH方式） ----
const svg = body => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const SVG = {
  train: '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M8 16l-2 4m10-4 2 4"/>',
  car: '<path d="M5 17h14M4 17v-4l2-5h12l2 5v4M4 17v2h2v-2m12 0v2h2v-2M6 13h12"/><circle cx="8" cy="15" r=".8"/><circle cx="16" cy="15" r=".8"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="M10 21l2.5-6 3 3v3M9.5 12.5l1.5-4.5 3.5 2 2 3M11 8l-3.5 2.5V14"/>',
  unknown: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6v.6M12 17.2v.1"/>',
  printer: '<path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/>',
  meal: '<path d="M6 3v8m-2-8v5a2 2 0 0 0 4 0V3m-2 8v10M16 3v18m0-18c3 2 4 5 4 8h-4"/>',
  hotel: '<path d="M4 21V6h16v15M8 10h2m4 0h2m-8 4h2m4 0h2M9 21v-3h6v3"/>',
  talk: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  meeting: '<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M10.5 20a5.5 5.5 0 0 1 11 0"/>',
  factory: '<path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17z"/><path d="M7 17h2m3 0h2m3 0h2"/>',
  note: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 12h8M8 16h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',
  warn: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5v.1"/>',
};
const mode = (kind, label) => `<span class="mode-icon mode-icon-${kind}" role="img" aria-label="${label}">${svg(SVG[kind])}</span>`;
const M = {
  train: (l = '鉄道') => mode('train', l),
  car: (l = '車') => mode('car', l),
  walk: (l = '徒歩') => mode('walk', l),
  unknown: (l = '手段未定') => mode('unknown', l),
};
const flightMark = '<span class="flight-mark" role="img" aria-label="フライト"></span>';
const icon = kind => `<span class="line-icon" aria-hidden="true">${svg(SVG[kind])}</span>`;

// ---- 予定の状態（共通の5語だけ） ----
const STATE = { '未検討':'unconsidered', '候補あり':'candidate', '仮決め':'tentative', '確定':'fixed', '当日判断':'onsite' };
const st = (label, note = '') => {
  if (!STATE[label]) throw new Error(`unknown plan state: ${label}`);
  return ` <span class="plan-state plan-state-${STATE[label]}">${label}</span>${note ? `<span class="state-note">${note}</span>` : ''}`;
};

const map = (label, query) => `<a class="place" href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(query)}" target="_blank" rel="noopener">${label}</a>`;
const ext = (label, href) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;
const fold = (summary, body) => `<details class="fold"><summary>${summary}</summary><div class="fold-body">${body}</div></details>`;
const row = (time, title, detail = '') => `<div class="trip-row"><div class="trip-time">${time}</div><div class="trip-action">${title}${detail ? `<span class="trip-detail">${detail}</span>` : ''}</div></div>`;
const move = (iconHtml, text) => `<span class="cf-move">${iconHtml}<strong>${text}</strong></span>`;
const table = (head, rows, chosen = []) => `<div class="cf-scroll"><table class="cf-table"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${chosen.includes(i) ? ' class="is-chosen"' : ''}>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const dayNote = id => `<div class="trip-field"><label for="day-${id}-note">当日メモ</label><textarea id="day-${id}-note" data-trip-store="day:${id}:day" data-trip-note="day" data-trip-append-timestamp placeholder="気づいたこと・変更・後で調べること"></textarea></div>`;

// ---- 場所 ----
const P = {
  chushojima: map('中書島', '中書島駅'),
  kamata: map('蒲田', 'JR蒲田駅'),
  oyamadai: map('尾山台', '尾山台駅'),
  venue: map('東京都市大学 世田谷キャンパス', '東京都市大学 世田谷キャンパス'),
  hanedaSta: map('羽田空港第1・第2ターミナル駅', '羽田空港第1・第2ターミナル駅'),
  chitoseSta: map('千歳駅', 'JR千歳駅'),
  shinChitoseSta: map('新千歳空港駅', '新千歳空港駅'),
  superHotel: map('スーパーホテル東京・JR蒲田西口', 'スーパーホテル東京・JR蒲田西口'),
  dormy: map('ドーミーイン千歳', 'ドーミーイン千歳 北海道千歳市幸町4丁目20番地1号'),
  kaihinMakuhari: map('海浜幕張', '海浜幕張駅'),
  messe: map('幕張メッセ 展示ホール1〜3', '幕張メッセ 展示ホール'),
};

// ---- 視察の記録単位（講演会のセッション） ----
const sessions = [
  { id:'1I1', day:'11/7', time:'9:00〜10:30', logi:true, title:'OS15 サイバーフィジカル・フレキシブル・オートメーション I', room:'I室',
    talks:['1I1-1 自動走行型天井クレーンの最短時間制振搬送（山梨大）', '1I1-2 クレーン地切りの力学モデルと吊り荷重心推定', '1I1-3 製造リードタイム推定（東芝）', '1I1-5 ピッキングタスクの模倣学習にリザバーコンピューティングを適用'] },
  { id:'sp1', day:'11/7', time:'10:45〜11:45', title:'特別講演1　矢野 雄一郎 先生（総務省）「異分野協創が拓くシステム制御の可能性」' },
  { id:'1G2', day:'11/7', time:'12:45〜14:15', title:'OS02 制御のための基盤モデル II', room:'G室',
    talks:['1G2-1 制御基盤モデルに向けて（理研）', '1G2-3 想定外の事象に対応する複数ロボットの協調アーキテクチャ（阪大）', '1G2-4 Gemini Roboticsによる物体の把持・搬送（東京理科大）'] },
  { id:'1D3', day:'11/7', time:'14:30〜16:00', logi:true, title:'マルチエージェントシステムの制御 II', room:'D室',
    talks:['1D3-1 制御不能なイベントを含むマルチエージェント経路計画', '1D3-2 人を避けるマルチロボット経路計画（大阪公立大）', '1D3-3 協調運搬タスクの分散割り当て（慶大・川崎重工）'] },
  { id:'sp2', day:'11/7', time:'16:15〜19:30', title:'特別講演2　中村 文一 先生（東京理科大）→ 17:30〜19:30 技術交流会' },
  { id:'2J1', day:'11/8', time:'9:00〜10:30', logi:true, title:'OS04 モーションコントロール I', room:'J室',
    talks:['<b>2J1-1 スタッカクレーンのためのアクティブマスダンパのフィードフォワード制御（東大・豊田自動織機）</b>', '2J1-4 四輪操舵型移動ロボットによる協調搬送', '2J1-5 2台のモジュールトレーラを連結した搬送システムの制御'] },
  { id:'sp3', day:'11/8', time:'10:45〜11:45', title:'特別講演3　中井 直正 先生（関西学院大）「太陽系外に惑星が発見された！」' },
  { id:'2G2', day:'11/8', time:'13:15〜14:45', title:'OS11 フィジカルAI時代の制御理論と産業応用 II', room:'G室',
    talks:['2G2-2 空気圧縮機の軽量モデル予測制御（日立）', '2G2-3 微分可能な粒子フィルタによるEnd-to-Endの動作計画（三菱電機）', '2G2-6 Centroidal Dynamicsの非線形モデル予測制御（トヨタ）'] },
  { id:'2F3', day:'11/8', time:'15:00〜16:30', logi:true, title:'移動ロボットのナビゲーション・環境認識', room:'F室',
    talks:['2F3-2 可搬ランドマークを使う屋外の運搬ビークルの自律走行（山梨大ほか）', '2F3-4 ROS2の屋内自律移動ロボットの自己位置推定の信頼度提示', '2F3-5 LiDARを使う4脚ロボットのナビゲーション'] },
];

const record = (key, head, meta, extra = '') => `
    <article class="trip-record" id="rec-${key}">
      <h3 class="trip-card-title">${head}</h3>
      ${meta ? `<div class="cf-session-meta">${meta}</div>` : ''}
      ${extra}
      <div class="trip-field">
        <label for="${key}-prep">事前の狙い・質問</label>
        <textarea id="${key}-prep" data-trip-store="venue:${key}:prep" data-trip-note="prep" placeholder="確認したい技術・質問"></textarea>
      </div>
      <div class="trip-field">
        <label for="${key}-day">当日メモ</label>
        <textarea id="${key}-day" data-trip-store="venue:${key}:day" data-trip-note="day" data-trip-append-timestamp placeholder="要点・数字・後で調べること"></textarea>
      </div>
    </article>`;

const sessionRecord = s => record(
  `session-${s.id}`,
  `${s.talks ? `${s.id}　` : ''}${s.title}${s.logi ? '<span class="cf-tag">物流・搬送</span>' : ''}`,
  `${s.day}　${s.time}${s.room ? `　${s.room}` : ''}${s.talks ? st('仮決め') : ''}`,
  s.talks ? `<ul class="cf-session-talks">${s.talks.map(t => `<li>${t}</li>`).join('')}</ul>` : ''
);

// ---- 概要 ----
const ov = (date, dow, lines, stay) => `
      <div class="cf-ov-day">
        <div class="cf-ov-date">${date}<small>${dow}</small></div>
        <div class="cf-ov-body">
          ${lines.map(([time, ic, text]) => `<div class="cf-ov-line"><span class="cf-ov-time">${time}</span><span class="cf-ov-icon">${ic}</span><span>${text}</span></div>`).join('\n          ')}
          <div class="cf-ov-stay">${stay}</div>
        </div>
      </div>`;

const overview = `
  <section class="trip-panel" data-trip-panel="overview" aria-label="概要">
    <article class="trip-card">
      <h2 class="trip-card-title">6日間の動き</h2>
      ${ov('11/6', '金', [
        ['14:01', M.train('新幹線'), '中書島 → 蒲田（17:02発の案もあり）'],
        ['夜', icon('meal'), '会食（場所は未定）'],
      ], '泊　東京（蒲田）')}
      ${ov('11/7', '土', [
        ['9:00', icon('talk'), '自動制御連合講演会 1日目（17:30〜19:30は技術交流会）'],
      ], '泊　東京（蒲田）')}
      ${ov('11/8', '日', [
        ['9:00', icon('talk'), '講演会 2日目（16:30まで）'],
        ['19:55', flightMark, 'JAL529　羽田 → 新千歳 21:30着'],
      ], '泊　千歳')}
      ${ov('11/9', '月', [
        ['9:00', icon('meeting'), 'WEB会議、13:00〜17:00 会議（どちらもホテルの客室で）'],
      ], '泊　千歳')}
      ${ov('11/10', '火', [
        ['8:00', icon('factory'), '施設見学（終日。千歳駅からバスで往復）'],
      ], '泊　千歳')}
      ${ov('11/11', '水', [
        ['7:30', flightMark, 'JAL590　新千歳 → 羽田 9:10着'],
        ['9:38', M.car('リムジンバス'), '羽田 → 海浜幕張 10:25着'],
        ['10:30', icon('talk'), 'NexTech Week（17:00閉場まで）'],
        ['18:30', M.train('新幹線'), 'のぞみ81号　東京 → 中書島 21:21着'],
      ], '帰宅')}
    </article>
    <div class="trip-banner"><span class="line-icon" aria-hidden="true">${svg(SVG.info)}</span><div>時刻・乗換・宿の詳細は旅程、聴講するセッションは視察、期限のある手続きは準備</div></div>
    ${fold('前提と出典', `<ul>
      <li><b>航空便</b>：新千歳空港公式サイトの時刻表データで、各日に運航する便を確認（10/16時点）。予約時にJALのサイトでも確認する。</li>
      <li><b>鉄道・バス</b>：Yahoo!乗換案内で2026年11月6日〜11日の日付を指定して検索した結果。</li>
      <li><b>講演会</b>：計測自動制御学会の会告、第69回自動制御連合講演会の公式サイト、プログラムとタイムテーブル（2026/10/05付の暫定版）。</li>
      <li><b>NexTech Week</b>：幕張メッセ公式イベントカレンダー、NexTech Week公式サイト（10/17時点）。</li>
      <li><b>現地</b>：施設から空港までの距離・所要時間はOSRM（地図データからの経路計算）による計算値で、表では余裕を見てタクシー10〜15分としている。</li>
      <li><b>現地のスケジュール</b>：草間さんのモデルケース（千歳駅 8:00発のバス、18:10発のバス）。</li>
      <li><b>千歳のホテル</b>：じゃらんの検索結果（10/17時点）、ドーミーイン千歳の公式サイト。千歳駅から空港までの車の距離はOSRMによる計算値（約5.5km）で、タクシー料金は推定。</li>
      <li><b>東京のホテル</b>：じゃらんの検索結果（10/17時点）、各ホテルの公式サイト。</li>
      <li>保安検査は出発20分前までに通過する前提。</li>
      <li>検討の経緯と他のケースは別ファイル「千歳出張_旅程_検討ケース_1108-1111.html」にある（このページには取り込んでいない）。</li>
    </ul>`)}
  </section>`;

// ---- 旅程 ----
// 国内便はどちらも同日着なので、日付は出発側にだけ書く（属性は変わるところにだけ付ける）
const flightCard = ({ label, no, date, dep, depPlace, arr, arrPlace, dur, state, foot }) => `
      <section class="flight-card">
        <div class="flight-card-head"><div><span class="flight-label">${label}</span><h3>${no}${state}</h3></div><span class="flight-total">${dur}</span></div>
        <div class="flight-leg">
          <div class="flight-point"><span class="point-label">発</span><time><span class="flight-date">${date}</span><strong>${dep}</strong></time>${depPlace}</div>
          <div class="flight-route"><span class="flight-rule">${flightMark}</span><strong>${no}</strong><small>JAL</small></div>
          <div class="flight-point"><span class="point-label">着</span><time><strong>${arr}</strong></time>${arrPlace}</div>
        </div>
        <footer>${foot}</footer>
      </section>`;

const itinerary = `
  <section class="trip-panel is-active" data-trip-panel="itinerary" aria-label="旅程">
    <div class="trip-banner" data-kind="warning"><span class="line-icon" aria-hidden="true">${svg(SVG.warn)}</span><div>JAL529・JAL590は予約済み・未購入。購入期限は10/20（火）21:29</div></div>

    <article class="trip-day" id="day-1106" data-kind="travel">
      <h2 class="trip-day-title"><span class="trip-day-date">11/6（金）</span><span class="trip-day-summary">東京へ移動（ホテルは蒲田）</span></h2>
      ${row('', `<strong>移動の時刻</strong>${st('候補あり', '会食の時刻しだい')}`, '新幹線は未予約。どちらも京都から のぞみ、品川からJR京浜東北線')}
      ${row('14:01', move(M.train('新幹線'), `パターン1　${P.chushojima} 発 → ${P.kamata} 17:07着`), '午後に移動、夜は会食。京都 14:36 のぞみ416号 → 品川 16:57。ホテルに荷物を置いてから会食に向かえる')}
      ${row('17:02', move(M.train('新幹線'), `パターン2　${P.chushojima} 発 → ${P.kamata} 20:10着`), '17時以降に移動。京都 17:36 のぞみ462号 → 品川 19:59')}
      ${row('夜', `<strong>${icon('meal')}会食</strong>${st('未検討')}`, '会食の場所は未定')}
      ${row('', `<strong>${icon('hotel')}${P.superHotel}</strong>${st('確定')}`, '蒲田駅 西口から徒歩約3分。2泊（11/6・7）')}
      <div class="trip-card-body">
        ${fold('経路と運賃', '<p>経路は、中書島 →（京阪）丹波橋 →（近鉄）京都 →（新幹線）品川 →（JR京浜東北線）蒲田。約13,740円。</p>')}
        ${fold('ほかの時刻（検討したもの）', table(['中書島 発', '新幹線', '大井町 着', 'コメント'], [
          ['13:01', 'のぞみ400号', '16:00', ''],
          ['15:02', 'のぞみ434号', '18:04', '会食が19時以降なら'],
          ['18:00', 'のぞみ476号', '20:59', ''],
          ['20:53', 'のぞみ204号', '23:50', '当日中に着ける最終'],
        ]) + '<p>蒲田は大井町からJRで2駅先。</p>')}
      </div>
      ${dayNote('1106')}
    </article>

    <article class="trip-day" id="day-1107" data-kind="event">
      <h2 class="trip-day-title"><span class="trip-day-date">11/7（土）</span><span class="trip-day-summary">自動制御連合講演会 1日目</span></h2>
      ${row('8:17', move(M.train(), `${P.kamata} 発 → ${P.oyamadai} 8:46着`), 'JR京浜東北線 → 大井町 → 東急大井町線。29分、426円')}
      ${row('9:00', `<strong>${icon('talk')}講演会 1日目</strong>${st('仮決め', '10/23までに参加登録')}`, `${P.venue}（1号館・7号館・9号館）。聴講するセッションは視察タブ`)}
      ${row('11:45', `<strong>${icon('meal')}昼食（12:45まで）</strong>`, '尾山台駅周辺の候補は食事タブ')}
      ${row('17:30', `<strong>技術交流会（19:30まで）</strong>${st('仮決め', '参加登録とあわせて申し込む')}`)}
      ${row('19:45', move(M.train(), `${P.oyamadai} 発 → ${P.kamata} 20:17着`))}
      ${dayNote('1107')}
    </article>

    <article class="trip-day" id="day-1108" data-kind="travel">
      <h2 class="trip-day-title"><span class="trip-day-date">11/8（日）</span><span class="trip-day-summary">講演会 2日目のあと千歳へ</span></h2>
      ${row('朝', `<strong>${icon('hotel')}チェックアウトして荷物ごと会場へ</strong>`, '会場にクロークがあるかは未確認')}
      ${row('8:17', move(M.train(), `${P.kamata} 発 → ${P.oyamadai} 8:46着`), '7日と同じ。29分、426円')}
      ${row('9:00', `<strong>${icon('talk')}講演会 2日目（16:30まで）</strong>`, '昼食は11:45〜13:15')}
      ${row('16:45', move(M.train(), `${P.oyamadai} 発 → ${P.hanedaSta} 17:46着`), '東急大井町線 → 大井町 →（JR）品川 →（京急）。709円')}
      ${row('17:46', `<strong>${icon('meal')}羽田で夕食</strong>${st('当日判断')}`, '保安検査の締切 19:35。店の候補は食事タブ')}
      <div class="trip-card-body">
      ${flightCard({ label:'羽田 → 新千歳', no:'JAL529', date:'11/8（日）', dep:'19:55', depPlace:'<span>羽田</span>', arr:'21:30', arrPlace:'<span>新千歳</span>', dur:'1時間35分', state:st('仮決め', '10/20 21:29までに購入'), foot:'普通席・座席は未指定。往復セイバー（JAL590と合計43,595円）' })}
      </div>
      ${row('21:56', move(M.train('JR快速エアポート'), `${P.shinChitoseSta} 発 → ${P.chitoseSta} 22:12着`), '290円。次は22:08発（22:23着）')}
      ${row('22:12', move(M.walk(), `${P.dormy}にチェックイン`), '千歳駅 西口から徒歩約7分')}
      ${dayNote('1108')}
    </article>

    <article class="trip-day" id="day-1109" data-kind="event">
      <h2 class="trip-day-title"><span class="trip-day-date">11/9（月）</span><span class="trip-day-summary">千歳で会議</span></h2>
      ${row('9:00', `<strong>${icon('meeting')}WEB会議</strong>`, 'ドーミーイン千歳の客室（無料Wi-Fiあり）')}
      ${row('13:00', `<strong>${icon('meeting')}会議（17:00まで）</strong>`, 'ドーミーイン千歳の客室')}
      ${row('夜', `<strong>${icon('meal')}駅前の飲み屋街で夕食</strong>`)}
      <div class="trip-card-body">
        ${fold('客室で会議に出る理由と回線', '<p>前日から連泊しているので、チェックアウトを気にせず客室で会議に出られる。客室の回線が不安なら、テザリングなど別の回線も用意しておく。</p>')}
      </div>
      ${dayNote('1109')}
    </article>

    <article class="trip-day" id="day-1110" data-kind="event">
      <h2 class="trip-day-title"><span class="trip-day-date">11/10（火）</span><span class="trip-day-summary">施設見学（終日）</span></h2>
      ${row('7:50', move(M.walk(), `ホテル → ${P.chitoseSta}`), '7:50ごろ出る。徒歩約7分')}
      ${row('8:00', move(M.car('バス'), `${P.chitoseSta} 発 → 現地 8:20ごろ着`) + st('仮決め', '乗り場を確認'), '現地は新千歳空港の国内線ターミナルから東へ車で約6km')}
      ${row('9:00', `<strong>${icon('factory')}朝礼 → そのままクリーンルームへ</strong>`)}
      ${row('10:00', '<strong>CR作業（11:45まで）</strong>')}
      ${row('12:00', `<strong>${icon('meal')}昼食・昼休み（13:00まで）</strong>`, 'クリーンルームとプレハブ事務所の往復は状況による')}
      ${row('13:15', '<strong>CR作業（16:30まで）</strong>')}
      ${row('17:00', '<strong>事務作業</strong>')}
      ${row('18:10', move(M.car('バス'), `現地 発 → ${P.chitoseSta} 18:30ごろ着`), 'ホテルへ徒歩約7分')}
      ${row('夜', `<strong>${icon('meal')}駅前の飲み屋街で夕食</strong>`)}
      <div class="trip-card-body">
        ${fold('現地の方に確認すること', '<ul><li>8:00のバスの乗り場（千歳駅のどの出口か）</li></ul><p>現地のスケジュールは草間さんのモデルケースより。</p>')}
      </div>
      ${dayNote('1110')}
    </article>

    <article class="trip-day" id="day-1111" data-kind="travel">
      <h2 class="trip-day-title"><span class="trip-day-date">11/11（水）</span><span class="trip-day-summary">新千歳 → 幕張メッセ → 帰宅</span></h2>
      ${row('6:15', move(M.car('タクシー'), `${P.dormy} → 新千歳 6:30ごろ着`) + st('仮決め', '前日までに手配'), '約10分・約5.5km。料金の目安は2,000〜3,000円（推定）。保安検査の締切 7:10')}
      <div class="trip-card-body">
        ${fold('別案（JR）', '<p>6:10ごろホテルから千歳駅へ歩く（約7分）→ 千歳 6:21発（JR快速エアポート）→ 新千歳空港駅 6:37着。290円。</p>')}
      ${flightCard({ label:'新千歳 → 羽田', no:'JAL590', date:'11/11（水）', dep:'7:30', depPlace:'<span>新千歳</span>', arr:'9:10', arrPlace:'<span>羽田 第1ターミナル</span>', dur:'1時間40分', state:st('仮決め', '10/20 21:29までに購入'), foot:'満席ならJAL500（7:45発）、JAL502（8:50発）' })}
      </div>
      ${row('9:38', move(M.car('リムジンバス'), `羽田 第1ターミナル 発 → ${P.kaihinMakuhari} 10:25着`), '1,500円')}
      ${row('10:30', `<strong>${icon('talk')}NexTech Week（17:00まで）</strong>${st('確定')}`, `${P.messe}。開場は10:00、着くのは開場の25分後`)}
      ${row('17:22', move(M.train('JR京葉線'), `${P.kaihinMakuhari} 発 → 東京`))}
      ${row('18:30', move(M.train('新幹線'), `東京 発 のぞみ81号 → ${P.chushojima} 21:21着`) + st('仮決め', '新幹線を予約'), '京都から近鉄・京阪。約14,140円')}
      <div class="trip-card-body">
        ${fold('帰りの別の時刻（検討したもの）', table(['海浜幕張 発', '東京 発（新幹線）', '中書島 着', 'コメント'], [
          ['15:02', '16:00 のぞみ267号', '18:50', '早めに切り上げる場合'],
          ['16:05', '17:09 のぞみ463号', '19:57', ''],
          ['17:22', '18:30 のぞみ81号', '21:21', '閉場まで見る場合'],
          ['19:57', '21:03 のぞみ289号', '23:54', '当日中に中書島に着ける最終'],
        ], [2]))}
      </div>
      ${dayNote('1111')}
    </article>

    <article class="trip-card" id="stays">
      <h2 class="trip-card-title">${icon('hotel')}宿泊</h2>
      <div class="trip-card-body">
        <h3>11/6・7　東京（2泊）${st('確定')}</h3>
        <dl class="cf-facts">
          <dt>ホテル</dt><dd>高濃度炭酸泉 梅屋敷の湯 ${P.superHotel}</dd>
          <dt>場所</dt><dd>JR京浜東北線 蒲田駅 西口から徒歩約3分</dd>
          <dt>特徴</dt><dd>男女別の高濃度人工炭酸泉の大浴場、無料の健康朝食、ウェルカムバー（17:00〜21:00）。評価4.4（1,938件）</dd>
          <dt>6日の到着</dt><dd>中書島 14:01発 → 蒲田 17:07着、または中書島 17:02発 → 蒲田 20:10着</dd>
          <dt>会場へ</dt><dd>7日・8日とも蒲田 8:17発 → 尾山台 8:46着（29分、426円）。7日の帰りは尾山台 19:45発 → 蒲田 20:17着</dd>
          <dt>予約</dt><dd>${ext('じゃらん', 'https://www.jalan.net/')}で予約済み</dd>
        </dl>
        ${fold('比較した東京のホテル（検討したもの）', '<p>じゃらんで11/6〜8の2泊・大人1名を検索した結果（10/17時点）。2泊合計、税込、ブロンズ会員料金を含む。</p>' + table(['ホテル', '最寄り駅', '2泊合計', '評価', '会場まで'], [
          ['JR東日本ホテルメッツ 大森', 'JR大森駅 徒歩1分', '50,670円〜', '4.5', '26分'],
          ['アパホテル〈大森駅前〉', 'JR大森駅 徒歩1分', '48,150円〜', '4.5', '26分'],
          ['アパホテル〈大森駅前東〉', 'JR大森駅 徒歩4分', '47,520円〜', '4.4', '26分'],
          ['スーパーホテル東京・JR蒲田西口（決定）', 'JR蒲田駅 徒歩3分', '43,200円〜（朝食付き）', '4.4', '29分'],
          ['グランパークホテル パネックス東京', 'JR蒲田駅 徒歩2分', '43,300円〜', '4.0', '29分'],
          ['ホテルマイステイズ蒲田', 'JR蒲田駅 徒歩5分', '44,400円〜', '4.3', '29分'],
          ['ホテルメトロポリタン 大井町トラックス', '大井町駅 徒歩1分', '101,800円〜', '4.6', '17分'],
          ['新横浜国際ホテル', 'JR新横浜駅 徒歩3分', '37,300円〜', '4.1', '27〜32分'],
          ['スーパーホテル新横浜', 'JR新横浜駅 徒歩3分', '47,600円〜（朝食付き）', '4.4', '27〜32分'],
          ['JR東日本ホテルメッツ 横浜鶴見', 'JR鶴見駅 徒歩1分', '41,220円〜', '4.4', '38〜43分'],
        ], [3]) + '<p>溝の口（会場まで8〜11分）、武蔵小杉（14〜16分）も候補に挙げたが、料金は未調査。</p>')}

        <h3>11/8〜11/11　千歳（3泊）${st('確定')}</h3>
        <dl class="cf-facts">
          <dt>ホテル</dt><dd>天然温泉 鶴舞の湯 ${P.dormy}（2026年6月24日開業）</dd>
          <dt>場所</dt><dd>北海道千歳市幸町4丁目20番地1号。JR千歳駅 西口から徒歩約7分。新千歳空港から車で約10分</dd>
          <dt>電話</dt><dd><a href="tel:0123296050">0123-29-6050</a></dd>
          <dt>チェックイン／アウト</dt><dd>基本は15:00／11:00（プランによって異なる場合あり）</dd>
          <dt>設備</dt><dd>男女別の天然温泉大浴場（オートロウリュサウナ・水風呂、15:00〜翌10:00）、無料Wi-Fi。朝食は「いくらとサーモンの海鮮手まり」など</dd>
          <dt>空港への送迎</dt><dd>なし。11/11の朝はタクシー（6:15ごろ、前日までに手配）かJR（千歳 6:21発）</dd>
          <dt>使い方</dt><dd>8日の夜（22:12）にJRで千歳駅へ → 9日は客室で会議 → 10日は千歳駅 8:00のバスで見学、18:10のバスで戻る → 11日は6:15ごろタクシーで空港へ</dd>
          <dt>注意</dt><dd>朝食の開始時刻は未確認。6:15より前に食べられなければ、空港で朝食</dd>
          <dt>予約</dt><dd>${ext('公式サイト', 'https://dormy-hotels.com/dormyinn/hotels/chitose/')}で予約済み</dd>
        </dl>
        ${fold('比較した千歳のホテル（検討したもの）', '<p>じゃらんで11/8〜11の3泊・大人1名を検索した結果（10/17時点）。3泊合計、税込。</p>' + table(['ホテル', '駅から', '3泊合計（朝食付き）', '評価', '11/11朝の空港へ'], [
          ['千歳ステーションホテル', '駅直結', '25,800円〜', '4.1', 'JR（改札まで1分）'],
          ['ドーミーイン千歳（決定）', '徒歩7分', '32,670円〜', '4.5', 'タクシーかJR'],
          ['ホテルルートイン千歳駅前', '徒歩3分', '36,300円〜', '4.4', '無料シャトル 6:20発（予約制）'],
          ['JRイン千歳', '徒歩30秒', '36,000円〜', '4.3', 'JR'],
          ['エアターミナルホテル', '空港直結', '47,100円〜', '4.2', '徒歩'],
        ], [1]))}
      </div>
    </article>

    <article class="trip-card" id="links">
      <h2 class="trip-card-title">現地で使うリンク</h2>
      <div class="trip-card-body">
        <ul class="cf-food-list" style="padding-left:18px">
          <li>${ext('JAL国内線（予約確認）', 'https://www.jal.co.jp/jp/ja/dom/')}</li>
          <li>${ext('EX予約', 'https://expy.jp/')}　／　${ext('スマートEX', 'https://smart-ex.jp/')}</li>
          <li>${ext('東京空港交通（リムジンバス）', 'https://www.limousinebus.co.jp/')}　羽田第1ターミナル 9:38発、1,500円</li>
          <li>${ext('第69回 自動制御連合講演会', 'https://rengo69.sice.jp/')}</li>
          <li>${ext('NexTech Week【秋】', 'https://www.nextech-week.jp/autumn/ja-jp.html')}</li>
        </ul>
      </div>
    </article>
  </section>`;

// ---- 視察 ----
const venue = `
  <section class="trip-panel" data-trip-panel="venue" aria-label="視察">
    <article class="trip-card">
      <h2 class="trip-card-title">第69回 自動制御連合講演会</h2>
      <div class="trip-card-body">
        <dl class="cf-facts">
          <dt>会期</dt><dd>11/7（土）9:00〜19:30（技術交流会 17:30〜19:30）、11/8（日）9:00〜16:30</dd>
          <dt>会場</dt><dd>${P.venue} 1号館・7号館・9号館（東急大井町線 尾山台駅から徒歩）</dd>
          <dt>資料</dt><dd>プログラム（program_20261005.pdf）、タイムテーブル（timetable_20261005.pdf）</dd>
          <dt>公式</dt><dd>${ext('rengo69.sice.jp', 'https://rengo69.sice.jp/')}</dd>
        </dl>
        ${fold('資料の保存場所', '<p>保存場所：00_技術開発センター\\カンファレンス。どちらも2026/10/05付の暫定版。下のセッション番号はプログラムの番号と同じ。PDFは公開ページには載せていない。</p>')}
        ${fold('聴講の選び方', '<p>物流・搬送に近いもの（クレーン、AGV/AMR、マルチロボットなど）を優先した。「物流・搬送」の札は、物流・搬送機器に特に近いセッション。</p>')}
      </div>
    </article>
    ${sessions.map(sessionRecord).join('\n')}
    ${fold('別候補のセッション（検討したもの）', table(['日付・時間', '別候補'], [
      ['11/7　9:00〜10:30', '1G1 OS02 制御のための基盤モデル I'],
      ['11/7　12:45〜14:15', '1I2 OS15 II（1I2-1 産業用ロボットの負荷側加速度推定（安川電機と共同）、1I2-6 設備レイアウト問題）'],
      ['11/7　14:30〜16:00', '1E3 安全性・制約を考慮した制御（1E3-4 AMRの動的障害物回避）／1I3 SICEの「さいす学」（フィジカルAI）'],
      ['11/8　9:00〜10:30', '2G1 OS11 フィジカルAI時代の制御理論と産業応用 I'],
      ['11/8　13:15〜14:45', '2J2 OS04 モーションコントロール II'],
      ['11/8　15:00〜16:30', '2D3 OS06 II（2D3-4 マルチエージェントによる協調物体運搬）'],
    ]))}

    ${record('meeting-1109', `${icon('meeting')}11/9 会議`, '9:00 WEB会議、13:00〜17:00 会議（ドーミーイン千歳の客室）')}
    ${record('factory-1110', `${icon('factory')}11/10 施設見学`, '終日。朝礼のあとクリーンルームで作業')}

    <article class="trip-card">
      <h2 class="trip-card-title">NexTech Week 2026【秋】</h2>
      <div class="trip-card-body">
        <dl class="cf-facts">
          <dt>会期</dt><dd>11/11（水）〜13（金）10:00〜17:00</dd>
          <dt>会場</dt><dd>${P.messe}</dd>
          <dt>主催</dt><dd>RX Japan</dd>
          <dt>構成展</dt><dd>7展：AI・人工知能 EXPO／ブロックチェーン EXPO／量子コンピューティング EXPO／AI時代の人材・組織改革EXPO／<b>ヒューマノイドロボット EXPO（第1回）</b>／<b>フィジカルAI EXPO（第1回、工場や物流現場へのAI実装がテーマ）</b>／XR産業活用展（第1回）</dd>
          <dt>入場</dt><dd>来場登録済み${st('確定')}</dd>
        </dl>
        ${fold('入場の条件', '<p>事前の来場登録が必要。11/10（火）までは無料、以降は11,000円。部長職以上はVIP登録（無料）もある。</p>')}
      </div>
    </article>
    ${record('nextech', 'NexTech Week 見学', '11/11　10:30〜17:00')}
  </section>`;

// ---- 食事 ----
const scenes = [
  ['11/6（金）', '夜の会食', '飲まない。最初に「アルコールは控えています」と伝える。刺身・焼き魚・鍋・冷奴などを選び、揚げ物と締めの麺・ご飯は避ける'],
  ['11/7（土）', 'スーパーホテル蒲田の朝食ビュッフェ', 'パンは控えめに。卵（1個まで）・野菜・ヨーグルト（無糖）中心'],
  ['11/7（土）', '講演会の昼食（11:45〜12:45）', '下の「昼食の候補」を参照'],
  ['11/7（土）', '技術交流会（17:30〜19:30）', '飲まない（ソフトドリンクで参加）。立食の揚げ物・ローストビーフの脂身・デザートは避け、野菜・魚・豆腐料理を取る'],
  ['11/8（日）', '朝食ビュッフェ・講演会の昼食（11:45〜13:15）', '朝食は7日と同じ。昼食は下の「昼食の候補」を参照'],
  ['11/8（日）', '羽田空港での夕食（第1ターミナル、17:46着〜19:35の保安検査締切まで）', '下の「11/8 羽田の夕食」を参照'],
  ['11/9（月）', '会議の合間の昼食', 'コンビニなら、そばかサラダチキン＋サラダ＋小さめのおにぎり1個など'],
  ['11/9・10', '千歳駅前の飲み屋街', '飲むならこの日に1杯まで（ハイボールか、日本酒をおちょこ1杯。ビールなら小さいグラス1杯）。和らぎ水を一緒に頼む。つまみは焼き魚（ほっけ、鮭）・刺身・サラダ・冷奴・焼き鳥（塩、皮以外）。ザンギ、いくら丼、締めのラーメンは避ける。ジンギスカンは下の「ジンギスカンの食べ方」を参照。10日に飲む場合、11日は5:45ごろ起きる'],
  ['11/9〜11', 'ドーミーインの朝食', '海鮮手まり（ご飯）やいくらは少量に。おかず中心'],
  ['11/10（火）', '見学先の昼食', '内容がわからないので、出たものは主食を少なめに'],
  ['11/11（水）', '朝食（空港）・幕張での昼食・新幹線', '朝は空港でおにぎり1個＋ゆで卵など。昼は会場の揚げ物系の軽食を避ける。新幹線の駅弁は揚げ物が少ないものを選ぶ'],
];

const food = `
  <section class="trip-panel" data-trip-panel="food" aria-label="食事">
    <div class="trip-banner"><span class="line-icon" aria-hidden="true">${svg(SVG.meal)}</span><div>間食なし、揚げ物・衣ものなし。主食は1食に1つ。アルコールは千歳の夕食（11/9か11/10）で1杯まで</div></div>
    ${fold('方針の詳細', '<p>脂身の多い肉・加工肉は控えめに。アルコールは基本は飲まない。飲むとしても千歳の夕食（11/9か11/10）で1杯まで（ハイボール1杯、または日本酒をおちょこ1杯）。10/24の検査結果と主治医の判断しだい。</p>')}

    <article class="trip-card">
      <h2 class="trip-card-title">日ごとの注意点</h2>
      ${scenes.map(([d, s, t]) => `<div class="cf-food-scene"><b>${d}　${s}</b><span>${t}</span></div>`).join('\n      ')}
    </article>

    <article class="trip-card">
      <h2 class="trip-card-title">11/7（土）・11/8（日）昼食の候補（尾山台駅周辺）</h2>
      <div class="trip-card-body">
        <p class="trip-detail">昼休み：11/7は11:45〜12:45（1時間）、11/8は11:45〜13:15（1時間30分）</p>
        ${table(['店', '駅からの距離', 'ひとこと'], [
          ['<b>有楽庵</b>', '約750m', 'そば。営業していれば一番の候補'],
          ['茶月', '約600m', '持ち帰り寿司。8貫くらいまで'],
          ['ロイヤルホスト尾山台店', '約650m', 'グリル料理とサラダを選ぶ'],
          ['ほっともっと', '約570m', '弁当。焼き魚系を選ぶ'],
          ['駅前のコンビニ', '—', 'そば、サラダチキン、サラダ、ゆで卵'],
          ['ランチセッションの弁当（出る場合）', '会場内', '揚げ物を残す'],
          ['避ける', '', '串カツ田中、ラーメン店、松屋'],
        ], [0])}
        ${fold('店の情報の出どころと使い分け', '<p>OpenStreetMapのデータより。土日の営業時間とメニューは未確認。7日は1時間なのでコンビニか持ち帰り、時間に余裕のある8日は有楽庵（そば）まで歩く、という使い分けがおすすめ。</p>')}
      </div>
    </article>

    <article class="trip-card">
      <h2 class="trip-card-title">11/8（日）羽田の夕食</h2>
      <div class="trip-card-body">
        <p class="trip-detail">第1ターミナル。17:46着〜保安検査の締切 19:35。おすすめは保安検査を通ってから月見そば＋わかめ</p>
        ${table(['種類', '店', '場所', 'ひとこと'], [
          ['<b>そば</b>', 'そば処そら（北ウイング店・南ウイング店）', '2F（保安検査の後）', '保安検査を先に通ってゲート側で食べられる'],
          ['<b>そば</b>', '石臼挽き蕎麦 あずみ野', '2F（保安検査の後）', '同上'],
          ['そば', '信州そば あずみ野', '5F（保安検査の前）', ''],
          ['寿司', '羽田寿司幸', '3F（保安検査の前）', '8貫くらいまで。あら汁があれば一緒に'],
          ['寿司', '寿司田', '5F（保安検査の前）', '同上'],
          ['海鮮丼', '海鮮丼 銀座おのでら', 'B1F（保安検査の前）', 'ご飯少なめで'],
          ['避ける', '天丼てんや、乱切り蕎麦と天丼 一の井の天丼、町田商店（ラーメン）、銀座ライオン（ビアホール）', '', ''],
        ], [0, 1])}
        <p class="trip-detail">羽田空港公式サイトの店舗一覧より（10/17時点）</p>
      </div>
    </article>

    <article class="trip-card">
      <h2 class="trip-card-title">ジンギスカンの食べ方（千歳の夜）</h2>
      <div class="trip-card-body">
        ${table(['選ぶ', '避ける'], [
          ['生ラム、ラム肩ロース（赤身が多い）', 'マトン（脂が多め）、脂身の多い部位'],
          ['生ラムに、つけダレを少しつける', '甘いタレに漬け込んだ「味付けジンギスカン」'],
          ['野菜を多めに（もやし、玉ねぎ、ピーマン）', 'かぼちゃ・じゃがいもの食べすぎ（糖質）'],
          ['肉は150gくらいまで。脂身は外して焼く', 'ご飯、締めのうどん'],
          ['飲むならハイボール1杯まで', 'ビールのおかわり'],
        ])}
      </div>
    </article>

    <article class="trip-card">
      <h2 class="trip-card-title">外食のジャンル別の選び方</h2>
      ${[
        ['焼き魚', '鯖・鮭・ほっけ・鯵などの塩焼き、鯖の水煮缶、しめ鯖（少量）', '鯖の味噌煮（砂糖・塩分がやや多い）', 'みりん干し・文化干し（甘い）、鯖の竜田揚げ・フライ'],
        ['寿司', '青魚（鯵、鯖、いわし、さんま、こはだ）、サーモン、白身、赤身、イカ、タコ、ホタテ、エビ。中トロ・玉子は少しなら', 'いくら、うに、数の子、たらこ、白子、煮穴子のタレ', 'マヨネーズ系の軍艦・巻物、天ぷら巻き、揚げ物の軍艦'],
        ['カレー', 'スープカレー（野菜かチキン、皮は外す）、豆・野菜のインドカレー、タンドリーチキン', 'キーマカレー、グリーンカレー、白いスープカレー（牛乳ベース）、ナン（半分くらいに）', '日本式のルーカレー、カツカレー・唐揚げカレー、バターチキン・クリーム系'],
        ['麺', 'そば（十割・二八がより良い）、うどん・きしめん（小盛り）。具はわかめ、とろろ昆布、山菜、きのこ、ねぎ、大根おろし、卵、鶏肉（かしわ）、鴨', '肉うどん・肉そば（甘辛い牛バラ・豚バラ）、きつね（甘い油揚げ）', 'ラーメン全般（塩・醤油も）、天ぷら・かき揚げ・天かす、カレーうどん、鍋焼きうどん（海老天）'],
        ['揚げ物', '—', '—', '全般（天ぷら、フライ、唐揚げ・ザンギ、カツ、コロッケ）'],
      ].map(([g, ok, mid, ng]) => `<div class="cf-food-scene"><b>${g}</b><span><span class="cf-mark-ok">◎・○ 選んでよい</span>　${ok}</span><span><span class="cf-mark-mid">△ 控えめに</span>　${mid}</span><span><span class="cf-mark-ng">× 避ける</span>　${ng}</span></div>`).join('\n      ')}
    </article>

    <article class="trip-card">
      <h2 class="trip-card-title">迷ったときのおすすめ</h2>
      <ul class="cf-food-list">
        <li>鯖の塩焼き定食（ご飯少なめ）</li>
        <li>月見そば＋わかめ</li>
        <li>かしわうどん（小盛り）＋卵</li>
        <li>寿司8貫＋あら汁</li>
        <li>野菜かチキンのスープカレー（ご飯小盛り）</li>
      </ul>
    </article>

    <article class="trip-card">
      <h2 class="trip-card-title">食べ方のコツ</h2>
      <ul class="cf-food-list">
        <li><b>寿司</b>：8貫くらいまで。足りなければ刺身を追加。回転寿司なら「シャリ小」「シャリハーフ」を頼む。シャリは1貫で糖質約7〜8g（10貫で約70〜80g）</li>
        <li><b>スープカレー</b>：ご飯は小盛り。表面に浮いた油は残し、スープは飲み干さない。チーズや揚げ野菜のトッピングはなし</li>
        <li><b>麺</b>：つゆは飲み干さない。丼とのセットにしない。大盛り・おかわりはやめる</li>
        <li><b>焼き魚</b>：1切れ（80〜100g）くらいが適量。週に数回、肉の代わりに選ぶ</li>
        <li><b>共通</b>：味噌汁・サラダ・野菜を先に食べてから主食へ。締めの麺・ご飯・デザートはやめる</li>
      </ul>
    </article>

    <article class="trip-card">
      <h2 class="trip-card-title">控えたいもの</h2>
      ${[
        ['飲み物', 'アルコール全般、ジュース、加糖の缶コーヒー、スポーツドリンク、加糖のカフェラテ', '無糖のお茶、ブラックコーヒー、水、炭酸水、糖質ゼロのノンアルコール飲料'],
        ['甘いもの', '菓子パン、ケーキ、アイス、和菓子、ドライフルーツ、果物の食べすぎ', 'どうしても欲しいときは少量のナッツか無糖ヨーグルト'],
        ['主食', '主食の重ね食べ（うどん＋おにぎり、ラーメン＋ライス）、夜遅い麺・締めの雑炊', '主食は1食に1つ。そば、麦ごはん、玄米も選択肢'],
        ['肉', 'バラ肉・霜降り・ひき肉料理、鶏の皮、ベーコン・ソーセージなどの加工肉', '赤身肉、鶏むね・ささみ、魚'],
        ['油・乳製品', '揚げ物・衣もの（天ぷら、フライ、唐揚げ、カツ）、バター、生クリーム、チーズ、スナック菓子', '焼く・蒸す・煮る料理、低脂肪乳'],
        ['その他', '卵黄・魚卵・内臓類のとりすぎ（いくら、たらこ、レバー）、豚骨ラーメン、カレーのルー', '卵は1日1個くらいまで。和風のだしの料理'],
      ].map(([k, ng, alt]) => `<div class="cf-food-scene"><b>${k}</b><span><span class="cf-mark-ng">控える</span>　${ng}</span><span><span class="cf-mark-ok">代わり</span>　${alt}</span></div>`).join('\n      ')}
    </article>

    <article class="trip-card">
      <h2 class="trip-card-title">積極的にとりたいもの</h2>
      <ul class="cf-food-list">
        <li>青魚（サバ、イワシ、サンマ、サケ、ほっけ）</li>
        <li>大豆製品（豆腐、納豆）</li>
        <li>野菜、海藻、きのこ（先に食べる）</li>
      </ul>
    </article>

    <article class="trip-card">
      <h2 class="trip-card-title">昼食の例（とろろ昆布うどんの場合）</h2>
      <div class="trip-card-body">
        ${table(['組み合わせ', '糖質の目安', 'コメント'], [
          ['とろろ昆布うどん（1玉）＋鮭おにぎり', '約80〜95g', '主食が重なるので多め'],
          ['とろろ昆布うどん（小盛り）＋卵・わかめ＋サラダチキンかゆで卵', '約40〜50g', 'たんぱく質もとれる'],
        ], [1])}
        ${fold('糖質の値について', '<p>糖質の値は一般的な目安で、量や店によって変わる。食事の内容や目標量は主治医・管理栄養士の指示を優先する。</p>')}
      </div>
    </article>
  </section>`;

// ---- 準備（畳む前提。現地で要るものは置かない） ----
const check = (key, deadline, title, detail, done = false) => `
      <div class="cf-check">
        <input type="checkbox" id="prep-${key}" data-trip-store="prep:${key}"${done ? ' checked' : ''}>
        <label for="prep-${key}">${deadline ? `<span class="cf-deadline">${deadline}</span>` : ''}${title}<span class="trip-detail">${detail}</span></label>
      </div>`;

const prep = `
  <section class="trip-panel" data-trip-panel="prep" aria-label="準備">
    <article class="trip-card">
      <h2 class="trip-card-title">予約・申し込み</h2>
      ${check('jal-buy', '10/20（火）21:29', 'JAL529（11/8）・JAL590（11/11）の購入（支払い）', `予約済み・未購入。往復セイバー、合計43,595円。期限を過ぎると自動で取り消される。${ext('JAL国内線', 'https://www.jal.co.jp/jp/ja/dom/')}`)}
      ${check('rengo-reg', '10/23（金）', '自動制御連合講演会 参加登録', `早期登録の締切（以降は値上がり）。技術交流会もあわせて申し込む。${ext('参加申込ウェブサイト', 'https://www.gakkai-web.net/p/rengo/reg/new2.php')}（案内：${ext('rengo69.sice.jp/registration/', 'https://rengo69.sice.jp/registration/')}）`)}
      ${check('shinkansen', '早めに', '新幹線（11/6 京都→東京、11/11 東京→京都）', `11/6：のぞみ416号（14:36発）またはのぞみ462号（17:36発）、11/11：のぞみ81号（18:30発）。${ext('EX予約', 'https://expy.jp/')}／${ext('スマートEX', 'https://smart-ex.jp/')}`)}
      ${check('bus-stop', '事前に', '現地の方への確認', '10日の朝8:00のバスの乗り場（千歳駅のどこか）')}
      ${check('taxi', '11/10（火）まで', '11/11早朝（6:15ごろ）のタクシー', 'ドーミーイン千歳のフロント（TEL 0123-29-6050）に手配を頼むか、タクシー会社に予約')}
      ${check('hotel-tokyo', '', 'スーパーホテル東京・JR蒲田西口 2泊（11/6・7）', '予約済み', true)}
      ${check('hotel-chitose', '', 'ドーミーイン千歳 3泊（11/8 in〜11/11 out）', '予約済み', true)}
      ${check('jal-reserve', '', 'JAL529・JAL590の予約', '予約済み（購入は上の行）', true)}
      ${check('nextech-reg', '', 'NexTech Week 来場登録', `登録済み。${ext('公式サイト', 'https://www.nextech-week.jp/autumn/ja-jp.html')}`, true)}
    </article>
    ${fold('参加費と注意', '<p>自動制御連合講演会の参加費：SICE会員・協賛学会会員は早期12,000円（10/24以降19,000円）、非会員は早期23,000円（28,000円）。技術交流会は早期5,000円（通常6,000円）。クレジットカード払い。予稿集の公開後はキャンセル不可。</p><p>リンク先は10/17に確認。JALと東京空港交通のサイトは自動アクセスが拒否されたため、ページの中身は確認できていない（ブラウザでは通常どおり開けるはず）。</p>')}
  </section>`;

// ---- 記録 ----
const records = `
  <section class="trip-panel" data-trip-panel="records" aria-label="記録">
    <div class="trip-banner"><span class="line-icon" aria-hidden="true">${svg(SVG.note)}</span><div>入力はこの端末に即時保存。PCでクラウドから読み込み、最後にMarkdownとJSONを保存</div></div>
    <div class="trip-actions trip-no-print">
      <button class="trip-button" type="button" data-trip-export-markdown data-title="千歳出張 2026-11 記録">Markdownをコピー</button>
      <button class="trip-button" type="button" data-trip-download-markdown data-title="千歳出張 2026-11 記録">メモをMarkdownでDL</button>
      <button class="trip-button" type="button" data-trip-export-json>バックアップJSONをDL</button>
      <label class="trip-button" for="trip-import">JSONを読み込む</label>
      <input id="trip-import" type="file" accept="application/json,.json" data-trip-import-json hidden>
    </div>
    <details class="trip-card trip-cloud trip-no-print" data-trip-cloud data-endpoint="${cloudEndpoint}">
      <summary class="trip-card-title">Cloudflare同期</summary>
      <div class="trip-card-body">
        <p class="trip-cloud-help">共同メモは1件ずつ追加保存され、同時に送っても上書きしない。自由編集欄は最後の保存が優先</p>
        <label class="trip-cloud-key">記入者名<input type="text" autocomplete="name" data-trip-cloud-author placeholder="例：村上"></label>
        <label class="trip-cloud-key">同期キー<input type="password" autocomplete="current-password" data-trip-cloud-key></label>
        <label class="trip-cloud-remember"><input type="checkbox" data-trip-cloud-remember> この端末に同期キーを保存</label>
        <div class="trip-actions">
          <button class="trip-button" type="button" data-trip-cloud-pull>クラウドから読込</button>
          <button class="trip-button" type="button" data-trip-cloud-push>今すぐ保存</button>
        </div>
        <div class="trip-status" data-trip-cloud-status role="status" aria-live="polite"></div>
      </div>
    </details>
    <div class="trip-status" data-trip-status role="status" aria-live="polite"></div>
    <article class="trip-record">
      <h2 class="trip-card-title">出張全体</h2>
      <div class="trip-field"><label for="trip-aim">持ち帰ること</label><textarea id="trip-aim" data-trip-store="trip:aim"></textarea></div>
      <div class="trip-field"><label for="trip-summary">帰着後の総括</label><textarea id="trip-summary" data-trip-store="trip:summary" data-trip-note="day"></textarea></div>
    </article>
  </section>`;

// ---- タブ（現地で開くものが先、畳むものが後。パネルのDOM順も同じ） ----
const TABS = [
  ['overview', '概要'],
  ['itinerary', '旅程', true],
  ['venue', '視察'],
  ['food', '食事'],
  ['prep', '準備'],
  ['records', '記録'],
];
const DAYS = [['day-1106', '11/6'], ['day-1107', '11/7'], ['day-1108', '11/8'], ['day-1109', '11/9'], ['day-1110', '11/10'], ['day-1111', '11/11'], ['stays', '宿']];

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>千歳出張 2026年11月6日〜11日</title>
<link rel="stylesheet" href="../shared/trip-field/core.css">
<link rel="stylesheet" href="style.css">
</head>
<body class="trip-page" data-trip-key="${tripKey}" data-trip-layout="field-v1">
<!-- 生成物。編集は build.mjs で行い、node 202611_Chitose/build.mjs で再生成する -->
<header class="trip-header">
  <div class="trip-wrap trip-header-inner">
    <div>
      <div class="trip-eyebrow">BUSINESS TRIP</div>
      <h1 class="trip-title">千歳出張　11/6（金）〜11/11（水）</h1>
      <p class="trip-subtitle">自動制御連合講演会（東京）→ 千歳で会議・施設見学 → NexTech Week（幕張）→ 帰宅。JAL優先、出発・帰着は中書島</p>
    </div>
    <div class="cf-header-links trip-no-print">
      <a class="trip-button" href="desk_print.html" aria-label="机上用印刷版">${icon('printer')}印刷版</a>
    </div>
  </div>
</header>

<div class="trip-field-nav">
  <div class="trip-wrap">
    <nav class="trip-tabs" role="tablist" aria-label="主要セクション">
      ${TABS.map(([id, label, def]) => `<button class="trip-tab${def ? ' is-active' : ''}" type="button" data-trip-tab="${id}"${def ? ' data-trip-default' : ''} role="tab" aria-selected="${def ? 'true' : 'false'}">${label}</button>`).join('\n      ')}
    </nav>
    <nav class="trip-date-rail" aria-label="日付">
      <span class="trip-date-label">日付</span>
      ${DAYS.map(([id, label]) => `<a class="trip-date-link" href="#${id}">${label}</a>`).join('\n      ')}
    </nav>
  </div>
</div>

<main class="trip-wrap trip-main">
${overview}
${itinerary}
${venue}
${food}
${prep}
${records}
</main>

<script src="../shared/trip-field/runtime.js"></script>
<script>
(function(){
  var app = TripField.mount({ cloudEndpoint: ${JSON.stringify(cloudEndpoint)} });
  /* 日付のリンクは旅程の日カードを指す。別のタブにいるときは旅程へ切り替えてから飛ぶ */
  document.querySelectorAll('.trip-date-link').forEach(function(link){
    link.addEventListener('click', function(){ app.showTab('itinerary'); });
  });
})();
</script>
</body>
</html>
`;

const onlinePath = path.join(here, 'index.html');
fs.writeFileSync(onlinePath, html, 'utf8');
console.log(`${onlinePath}: ${Buffer.byteLength(html)} bytes`);

const run = spawnSync(process.execPath, [path.join(here, '..', 'shared', 'trip-field', 'build-desk-print.mjs'), onlinePath, path.join(here, 'desk_print.html')], { encoding:'utf8' });
process.stdout.write(run.stdout);
if (run.status !== 0) { process.stderr.write(run.stderr); process.exit(run.status || 1); }
