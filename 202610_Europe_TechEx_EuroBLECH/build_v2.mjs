import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(root, 'index.html');
const outputPath = join(root, 'index_v2.html');
let html = readFileSync(sourcePath, 'utf8');

const replaceOnce = (pattern, replacement, label) => {
  const matches = html.match(pattern);
  if (!matches) throw new Error(`build_v2: ${label} not found`);
  html = html.replace(pattern, replacement);
};

replaceOnce(
  /<title>[\s\S]*?<\/title>/,
  '<title>ヨーロッパ出張 2026年10月 — フィールドガイド v2</title>',
  'title',
);

replaceOnce(
  /<\/style>\s*<\/head>/,
  `</style>\n<link rel="stylesheet" href="v2.css">\n</head>`,
  'stylesheet insertion point',
);

const header = `<!-- ===== HRS-STYLE FIELD HEADER ===== -->
<header class="hrs-header">
  <div class="field-wrap">
    <div class="hrs-header-row">
      <div>
        <div class="hrs-eyebrow">🇳🇱 TECH EX EUROPE · 🇩🇪 EUROBLECH 2026</div>
        <h1>ヨーロッパ出張 フィールドガイド</h1>
        <p>10/17（土）発 〜 10/25（日）着 ｜ 村上・美馬・金築 ｜ Amsterdam → Göttingen → Hannover → Bremen → Frankfurt</p>
      </div>
      <div class="hrs-header-actions no-print">
        <button type="button" id="detail-toggle" aria-pressed="false">＋詳細</button>
        <button type="button" onclick="window.print()" aria-label="印刷">🖨</button>
      </div>
    </div>
    <div class="trip-status" role="note"><strong>現状：</strong>ホテル3拠点・TechEx Gold Pass・村上／美馬のEuroBLECH券・Bremen工場見学は確保済み。村上のCX往復・KL1791は見積取得済みで未購入。美馬・金築分を含むフライトと鉄道の購入、金築のEuroBLECH券発行を進める。</div>
  </div>
</header>

<div class="field-nav no-print">
  <div class="field-wrap">
    <nav class="primary-tabs" aria-label="主要セクション">
      <button type="button" onclick="switchTab('itinerary')" id="nav-itinerary" class="nav-btn is-active" aria-selected="true"><span>📅</span>旅程</button>
      <button type="button" onclick="switchTab('prep')" id="nav-prep" class="nav-btn" aria-selected="false"><span>✅</span>準備</button>
      <button type="button" onclick="switchTab('events')" id="nav-events" class="nav-btn" aria-selected="false"><span>🏭</span>会場</button>
      <button type="button" onclick="switchTab('rec')" id="nav-rec" class="nav-btn" aria-selected="false"><span>📝</span>記録</button>
      <button type="button" onclick="switchTab('family')" id="nav-family" class="nav-btn" aria-selected="false"><span>🏠</span>家族</button>
    </nav>
  </div>
</div>

<!-- ===== TAB: 旅程 ===== -->`;

replaceOnce(
  /<!-- ===== HEADER ===== -->[\s\S]*?<!-- ===== TAB: 旅程 ===== -->/,
  header,
  'legacy header',
);

const recordsPanel = `
<!-- ===== TAB: 記録 ===== -->
<div id="tab-rec" class="tab-content">
  <main class="records-shell">
    <div class="records-intro">
      <div>
        <div class="section-kicker">FIELD NOTES</div>
        <h2>出張記録</h2>
        <p>狙い・当日メモ・帰国後の所感を日ごとに保存します。入力内容はこの端末のブラウザ内に自動保存されます。</p>
      </div>
      <div class="record-actions no-print">
        <button type="button" id="btn-download-md">MarkdownでDL</button>
        <button type="button" id="btn-export-json">JSONバックアップ</button>
        <label for="import-json" class="record-button">JSON読込</label>
        <input id="import-json" type="file" accept="application/json,.json" hidden>
      </div>
    </div>

    <section class="record-card record-overall">
      <div class="record-heading"><span>出張全体</span><span class="save-state" role="status" aria-live="polite">自動保存</span></div>
      <label><span>今回の狙い</span><textarea data-rec="all:aim" rows="3" placeholder="TechEx / EuroBLECH / 工場見学で確認したいこと"></textarea></label>
      <label><span>帰国後の総括</span><textarea data-rec="all:after" rows="4" placeholder="得られた示唆、社内共有、次のアクション"></textarea></label>
    </section>

    <div id="record-days"></div>

    <section class="secondary-tools no-print">
      <h2>補助資料</h2>
      <div class="secondary-grid">
        <button type="button" onclick="switchTab('prep')"><strong>✅ 準備</strong><span>手配チェックリスト・費用</span></button>
        <button type="button" onclick="switchTab('docs')"><strong>📁 書類</strong><span>チケット・予約・公式リンク</span></button>
        <button type="button" onclick="switchTab('family')"><strong>🏠 家族用</strong><span>宿泊先・緊急連絡・日程表</span></button>
      </div>
    </section>

    <button type="button" id="btn-clear-records" class="danger-button no-print">記録をすべて消す</button>
  </main>
</div>

<!-- ===== FIELD FOOTER ===== -->
<footer class="field-footer">ヨーロッパ出張 2026 · フィールドガイド v2 ｜ 入力はブラウザ内に保存</footer>
`;

replaceOnce(
  /<!-- ===== BOTTOM NAV ===== -->[\s\S]*?<script>/,
  `${recordsPanel}\n<script>`,
  'bottom navigation',
);

replaceOnce(
  /(<div id="tab-prep" class="tab-content">)/,
  `$1\n  <div class="prep-related no-print"><button type="button" onclick="switchTab('docs')"><strong>📁 書類を開く</strong><span>チケット・予約・公式リンク</span></button></div>`,
  'preparation related documents link',
);

const familyFlights = `  <!-- 時差情報（先に確認） -->
  <section class="timezone-early">
    <div class="family-section-head">🕐 現地時刻の見方</div>
    <div class="timezone-body">
      <p class="timezone-lead"><strong>フライト・鉄道・イベントの時刻は、すべてその場所の現地時刻です。</strong></p>
      <div class="timezone-cards">
        <div class="timezone-card zone-japan"><span>🇯🇵 日本</span><strong>JST</strong><b>UTC+9</b><small>基準</small></div>
        <div class="timezone-card zone-europe"><span>🇳🇱🇩🇪 欧州</span><strong>CEST</strong><b>UTC+2</b><small>日本より7時間遅い</small></div>
        <div class="timezone-card zone-hongkong"><span>🇭🇰 香港</span><strong>HKT</strong><b>UTC+8</b><small>日本より1時間遅い</small></div>
      </div>
      <div class="timezone-contact">
        <strong>日本から連絡しやすい時間</strong>
        <span>日本 17:00–20:00<br>＝ 欧州 10:00–13:00</span>
        <span>日本 22:00–24:00<br>＝ 欧州 15:00–17:00</span>
      </div>
      <p class="timezone-note">10/25（日）未明に欧州夏時間が終了。今回の欧州内予定は10/24の出発まで <b>CEST</b> で読みます。</p>
    </div>
  </section>

  <!-- フライト情報 -->
  <section class="family-flights">
    <div class="family-section-head">✈️ フライト情報</div>
    <div class="flight-body">
      <div class="timezone-guide"><strong>各空港の現地時刻で表示</strong><span>JST / HKT / CEST は上の時差表を参照</span></div>
      <div class="flight-spec-guide"><strong>便名の下：</strong>予約クラス ／ キャビンクラス ／ 所要時間</div>
      <div class="carrier-guide"><strong>CX</strong> キャセイパシフィック航空 <span>／</span> <strong>KL</strong> KLMオランダ航空</div>

      <article class="flight-card flight-murakami">
        <header class="flight-card-head">
          <div><span class="flight-label">往路 1</span><h3>村上：日本 → アムステルダム</h3></div>
          <span class="flight-status">見積取得・未購入</span>
        </header>
        <div class="flight-leg">
          <div class="flight-point depart">
            <span class="point-label">出発</span>
            <time datetime="2026-10-17T16:10:00+09:00"><span class="flight-date">10/17（土）</span><strong>16:10</strong><em>JST</em></time>
            <a href="https://maps.google.com/?q=Chubu+Centrair+International+Airport+NGO" target="_blank" rel="noopener">セントレア <b>NGO</b></a>
          </div>
          <div class="flight-route"><strong>CX539</strong><span>✈</span><small>予約クラス B<br>エコノミー<br>所要 4時間20分</small></div>
          <div class="flight-point arrive">
            <span class="point-label">到着</span>
            <time datetime="2026-10-17T19:30:00+08:00"><span class="flight-date">10/17（土）</span><strong>19:30</strong><em>HKT</em></time>
            <a href="https://maps.google.com/?q=Hong+Kong+International+Airport" target="_blank" rel="noopener">香港 <b>HKG</b></a>
          </div>
        </div>
        <div class="layover"><span>乗り換え</span><strong>香港 3時間45分</strong><small>同日中に次便へ</small></div>
        <div class="flight-leg">
          <div class="flight-point depart">
            <span class="point-label">出発</span>
            <time datetime="2026-10-17T23:15:00+08:00"><span class="flight-date">10/17（土）</span><strong>23:15</strong><em>HKT</em></time>
            <a href="https://maps.google.com/?q=Hong+Kong+International+Airport" target="_blank" rel="noopener">香港 <b>HKG</b></a>
          </div>
          <div class="flight-route"><strong>CX271</strong><span>✈</span><small>予約クラス B<br>エコノミー<br>所要 13時間40分</small></div>
          <div class="flight-point arrive">
            <span class="point-label">到着</span>
            <time datetime="2026-10-18T06:55:00+02:00"><span class="flight-date">10/18（日）</span><strong>06:55</strong><em>CEST</em></time>
            <a href="https://maps.google.com/?q=Amsterdam+Airport+Schiphol+AMS" target="_blank" rel="noopener">Amsterdam <b>AMS</b></a>
          </div>
        </div>
        <footer>総移動 約21時間45分</footer>
      </article>

      <article class="flight-card flight-team">
        <header class="flight-card-head">
          <div><span class="flight-label">往路 2</span><h3>美馬・金築：日本 → フランクフルト</h3></div>
          <span class="flight-status">選定済み・未購入</span>
        </header>
        <div class="flight-leg">
          <div class="flight-point depart">
            <span class="point-label">出発</span>
            <time datetime="2026-10-18T16:10:00+09:00"><span class="flight-date">10/18（日）</span><strong>16:10</strong><em>JST</em></time>
            <a href="https://maps.google.com/?q=Chubu+Centrair+International+Airport+NGO" target="_blank" rel="noopener">セントレア <b>NGO</b></a>
          </div>
          <div class="flight-route"><strong>CX539</strong><span>✈</span><small>予約クラス未確認<br>エコノミー<br>所要 4時間20分</small></div>
          <div class="flight-point arrive">
            <span class="point-label">到着</span>
            <time datetime="2026-10-18T19:30:00+08:00"><span class="flight-date">10/18（日）</span><strong>19:30</strong><em>HKT</em></time>
            <a href="https://maps.google.com/?q=Hong+Kong+International+Airport" target="_blank" rel="noopener">香港 <b>HKG</b></a>
          </div>
        </div>
        <div class="layover"><span>乗り換え</span><strong>香港 4時間25分</strong><small>同日中に次便へ</small></div>
        <div class="flight-leg">
          <div class="flight-point depart">
            <span class="point-label">出発</span>
            <time datetime="2026-10-18T23:55:00+08:00"><span class="flight-date">10/18（日）</span><strong>23:55</strong><em>HKT</em></time>
            <a href="https://maps.google.com/?q=Hong+Kong+International+Airport" target="_blank" rel="noopener">香港 <b>HKG</b></a>
          </div>
          <div class="flight-route"><strong>CX289</strong><span>✈</span><small>予約クラス未確認<br>エコノミー<br>所要 13時間20分</small></div>
          <div class="flight-point arrive">
            <span class="point-label">到着</span>
            <time datetime="2026-10-19T07:15:00+02:00"><span class="flight-date">10/19（月）</span><strong>07:15</strong><em>CEST</em></time>
            <a href="https://maps.google.com/?q=Frankfurt+Airport+FRA" target="_blank" rel="noopener">Frankfurt <b>FRA</b></a>
          </div>
        </div>
        <footer>総移動 約22時間5分</footer>
      </article>

      <article class="flight-card flight-europe">
        <header class="flight-card-head">
          <div><span class="flight-label">欧州内</span><h3>村上：アムステルダム → ハノーファー</h3></div>
          <span class="flight-status">見積取得・未購入</span>
        </header>
        <div class="flight-leg">
          <div class="flight-point depart">
            <span class="point-label">出発</span>
            <time datetime="2026-10-20T16:50:00+02:00"><span class="flight-date">10/20（火）</span><strong>16:50</strong><em>CEST</em></time>
            <a href="https://maps.google.com/?q=Amsterdam+Airport+Schiphol+AMS" target="_blank" rel="noopener">Amsterdam <b>AMS</b></a>
          </div>
          <div class="flight-route"><strong>KL1791</strong><span>✈</span><small>予約クラス L<br>エコノミー<br>所要 55分</small></div>
          <div class="flight-point arrive">
            <span class="point-label">到着</span>
            <time datetime="2026-10-20T17:45:00+02:00"><span class="flight-date">10/20（火）</span><strong>17:45</strong><em>CEST</em></time>
            <a href="https://maps.google.com/?q=Hannover+Airport+HAJ" target="_blank" rel="noopener">Hannover <b>HAJ</b></a>
          </div>
        </div>
        <footer>KLM Cityhopper・直行便</footer>
      </article>

      <article class="flight-card flight-return">
        <header class="flight-card-head">
          <div><span class="flight-label">復路</span><h3>全員：フランクフルト → 日本</h3></div>
          <span class="flight-status">村上分見積・未購入</span>
        </header>
        <div class="flight-leg">
          <div class="flight-point depart">
            <span class="point-label">出発</span>
            <time datetime="2026-10-24T13:40:00+02:00"><span class="flight-date">10/24（土）</span><strong>13:40</strong><em>CEST</em></time>
            <a href="https://maps.google.com/?q=Frankfurt+Airport+FRA" target="_blank" rel="noopener">Frankfurt <b>FRA</b></a>
          </div>
          <div class="flight-route"><strong>CX288</strong><span>✈</span><small>村上：予約クラス H<br>美馬・金築：未確認<br>エコノミー・所要 11時間40分</small></div>
          <div class="flight-point arrive">
            <span class="point-label">到着</span>
            <time datetime="2026-10-25T07:20:00+08:00"><span class="flight-date">10/25（日）</span><strong>07:20</strong><em>HKT</em></time>
            <a href="https://maps.google.com/?q=Hong+Kong+International+Airport" target="_blank" rel="noopener">香港 <b>HKG</b></a>
          </div>
        </div>
        <div class="layover"><span>乗り換え</span><strong>香港 2時間15分</strong><small>同日中に次便へ</small></div>
        <div class="flight-leg">
          <div class="flight-point depart">
            <span class="point-label">出発</span>
            <time datetime="2026-10-25T09:35:00+08:00"><span class="flight-date">10/25（日）</span><strong>09:35</strong><em>HKT</em></time>
            <a href="https://maps.google.com/?q=Hong+Kong+International+Airport" target="_blank" rel="noopener">香港 <b>HKG</b></a>
          </div>
          <div class="flight-route"><strong>CX536</strong><span>✈</span><small>村上：予約クラス H<br>美馬・金築：未確認<br>エコノミー・所要 3時間35分</small></div>
          <div class="flight-point arrive">
            <span class="point-label">到着</span>
            <time datetime="2026-10-25T14:10:00+09:00"><span class="flight-date">10/25（日）</span><strong>14:10</strong><em>JST</em></time>
            <a href="https://maps.google.com/?q=Chubu+Centrair+International+Airport+NGO" target="_blank" rel="noopener">セントレア <b>NGO</b></a>
          </div>
        </div>
        <footer>総移動 約17時間30分・全員同便。予約クラスと運賃は村上の見積内容</footer>
      </article>

      <section class="flight-fares" aria-labelledby="flight-fares-title">
        <header>
          <div><span>航空券見積</span><h3 id="flight-fares-title">村上・1名分</h3></div>
          <strong>合計 419,700円</strong>
        </header>
        <div class="fare-card">
          <div class="fare-title"><strong>CX 往復</strong><span>NGO → HKG → AMS ／ FRA → HKG → NGO</span></div>
          <dl><div><dt>運賃</dt><dd>217,600円</dd></div><div><dt>空港諸税等</dt><dd>111,740円</dd></div><div><dt>発券手数料</dt><dd>7,700円</dd></div><div class="fare-total"><dt>合計</dt><dd>337,040円</dd></div></dl>
        </div>
        <div class="fare-card">
          <div class="fare-title"><strong>KL1791</strong><span>AMS → HAJ</span></div>
          <dl><div><dt>運賃</dt><dd>EUR 285.00<br><small>53,200円換算</small></dd></div><div><dt>空港諸税等</dt><dd>21,760円</dd></div><div><dt>発券手数料</dt><dd>7,700円</dd></div><div class="fare-total"><dt>合計</dt><dd>82,660円</dd></div></dl>
        </div>
        <p>未購入。円換算額は見積時点のレートで、発券時に変動する場合があります。</p>
      </section>
    </div>
  </section>

`;

replaceOnce(
  /  <!-- フライト情報 -->[\s\S]*?(?=  <!-- 宿泊先情報 -->)/,
  familyFlights,
  'family flight timeline',
);

replaceOnce(
  /  <!-- 時差情報 -->[\s\S]*?(?=  <!-- 緊急連絡先 -->)/,
  '',
  'late duplicate timezone panel',
);

const familySchedule = `  <!-- 日程詳細（家族向け） -->
  <section class="family-schedule">
    <div class="family-section-head">📅 日程詳細（家族向け）</div>
    <div class="schedule-body">
      <div class="schedule-legend" aria-label="色の意味">
        <strong>色の意味</strong>
        <span class="schedule-tag kind-move">移動・フライト</span>
        <span class="schedule-tag kind-techex">TechEx</span>
        <span class="schedule-tag kind-euro">EuroBLECH</span>
        <span class="schedule-tag kind-visit">工場・企業訪問</span>
        <span class="schedule-tag kind-home">帰着</span>
      </div>

      <article class="family-day-row">
        <header><strong>10/17</strong><span>土</span></header>
        <section><h3>村上</h3>
          <div class="agenda-line"><time>11:30頃</time><span class="schedule-tag kind-move">移動</span><p>京都駅発<br>→ 名古屋 → セントレア</p></div>
          <div class="agenda-line"><time>16:10</time><span class="schedule-tag kind-move">フライト</span><p>セントレア発<br><b>CX539</b> 香港経由</p></div>
        </section>
        <section><h3>美馬・金築</h3><div class="agenda-empty">日本</div></section>
        <aside><h3>宿泊</h3><p>機内泊<br><small>村上</small></p></aside>
      </article>

      <article class="family-day-row">
        <header><strong>10/18</strong><span>日</span></header>
        <section><h3>村上</h3>
          <div class="agenda-line"><time>06:55</time><span class="schedule-tag kind-move">到着</span><p>Amsterdam <b>AMS</b>着</p></div>
          <div class="agenda-line"><time>日中</time><span class="schedule-tag kind-home">休息</span><p>ホテルへ荷物預け<br>時差調整</p></div>
        </section>
        <section><h3>美馬・金築</h3>
          <div class="agenda-line"><time>11:30頃</time><span class="schedule-tag kind-move">移動</span><p>京都駅発<br>→ 名古屋 → セントレア</p></div>
          <div class="agenda-line"><time>16:10</time><span class="schedule-tag kind-move">フライト</span><p>セントレア発<br><b>CX539</b> 香港経由</p></div>
        </section>
        <aside><h3>宿泊</h3><p>Holiday Inn Express Amsterdam<br><small>村上</small></p><p>機内泊<br><small>美馬・金築</small></p></aside>
      </article>

      <article class="family-day-row">
        <header><strong>10/19</strong><span>月</span></header>
        <section><h3>村上</h3>
          <div class="agenda-line"><time>終日</time><span class="schedule-tag kind-techex">TechEx</span><p>TechEx Europe<br>Day 1 フル参加</p></div>
        </section>
        <section><h3>美馬・金築</h3>
          <div class="agenda-line"><time>07:15</time><span class="schedule-tag kind-move">到着</span><p>Frankfurt <b>FRA</b>着</p></div>
          <div class="agenda-line"><time>10:31</time><span class="schedule-tag kind-move">移動</span><p>Göttingen着<br>ホテルへ荷物預け</p></div>
          <div class="agenda-line"><time>日中</time><span class="schedule-tag kind-visit">見学</span><p>Wolfsburg<br>Autostadt見学</p></div>
          <div class="agenda-line"><time>18:45頃</time><span class="schedule-tag kind-move">移動</span><p>Göttingenへ戻る<br>チェックイン</p></div>
        </section>
        <aside><h3>宿泊</h3><p>Holiday Inn Express Amsterdam<br><small>村上</small></p><p>FREIgeist Göttingen<br><small>美馬・金築</small></p></aside>
      </article>

      <article class="family-day-row">
        <header><strong>10/20</strong><span>火</span></header>
        <section><h3>村上</h3>
          <div class="agenda-line"><time>午前〜14:55</time><span class="schedule-tag kind-techex">TechEx</span><p>TechEx Europe<br>Day 2</p></div>
          <div class="agenda-line"><time>16:50</time><span class="schedule-tag kind-move">フライト</span><p>Amsterdam <b>AMS</b>発<br>→ Hannover <b>HAJ</b></p></div>
          <div class="agenda-line"><time>20:25</time><span class="schedule-tag kind-move">到着</span><p>Göttingen着</p></div>
        </section>
        <section><h3>美馬・金築</h3>
          <div class="agenda-line"><time>07:55</time><span class="schedule-tag kind-move">移動</span><p>Göttingen発<br>→ Hannover Messe</p></div>
          <div class="agenda-line"><time>日中</time><span class="schedule-tag kind-euro">EuroBLECH</span><p>EuroBLECH<br>Day 1</p></div>
        </section>
        <aside><h3>宿泊</h3><p>FREIgeist Göttingen<br><small>全員</small></p></aside>
      </article>

      <article class="family-day-row shared-day">
        <header><strong>10/21</strong><span>水</span></header>
        <section class="family-shared"><h3>全員</h3>
          <div class="agenda-line"><time>07:55</time><span class="schedule-tag kind-move">移動</span><p>Göttingen発<br>→ Hannover Messe</p></div>
          <div class="agenda-line"><time>終日</time><span class="schedule-tag kind-euro">EuroBLECH</span><p>EuroBLECH<br>フル参加</p></div>
        </section>
        <aside><h3>宿泊</h3><p>FREIgeist Göttingen<br><small>全員</small></p></aside>
      </article>

      <article class="family-day-row shared-day">
        <header><strong>10/22</strong><span>木</span></header>
        <section class="family-shared"><h3>全員</h3>
          <div class="agenda-line"><time>日帰り</time><span class="schedule-tag kind-move">移動</span><p>Göttingen<br>⇄ Bremen</p></div>
          <div class="agenda-line"><time>12:45–14:00</time><span class="schedule-tag kind-visit">工場見学</span><p>Mercedes-Benz<br>Werk Bremen</p></div>
        </section>
        <aside><h3>宿泊</h3><p>FREIgeist Göttingen<br><small>全員</small></p></aside>
      </article>

      <article class="family-day-row shared-day">
        <header><strong>10/23</strong><span>金</span></header>
        <section class="family-shared"><h3>全員</h3>
          <div class="agenda-line"><time>午前〜午後</time><span class="schedule-tag kind-euro">EuroBLECH</span><p>EuroBLECH<br>最終日</p></div>
          <div class="agenda-line"><time>14:30</time><span class="schedule-tag kind-move">移動</span><p>Hannover Messe発</p></div>
          <div class="agenda-line"><time>17:14</time><span class="schedule-tag kind-move">到着</span><p>Frankfurt中央駅着</p></div>
        </section>
        <aside><h3>宿泊</h3><p>Toyoko Inn Frankfurt<br><small>全員</small></p></aside>
      </article>

      <article class="family-day-row shared-day">
        <header><strong>10/24</strong><span>土</span></header>
        <section class="family-shared"><h3>全員</h3>
          <div class="agenda-line"><time>13:40</time><span class="schedule-tag kind-move">フライト</span><p>Frankfurt <b>FRA</b>発<br><b>CX288</b> 香港経由</p></div>
        </section>
        <aside><h3>宿泊</h3><p>機内泊<br><small>全員</small></p></aside>
      </article>

      <article class="family-day-row shared-day">
        <header><strong>10/25</strong><span>日</span></header>
        <section class="family-shared"><h3>全員</h3>
          <div class="agenda-line"><time>14:10</time><span class="schedule-tag kind-home">帰着</span><p>セントレア <b>NGO</b>着<br>→ 各自帰宅</p></div>
        </section>
        <aside><h3>宿泊</h3><p>帰宅</p></aside>
      </article>
    </div>
  </section>
`;

replaceOnce(
  /  <!-- 日程詳細テーブル -->[\s\S]*?(?=\n<\/div>\n<\/div><!-- \/tab-family -->)/,
  familySchedule,
  'family schedule cards',
);

const familyTransportReplacements = [
  ['<p>京都駅発<br>→ 名古屋 → セントレア</p>', '<p><b>出発：</b>11:30頃 京都駅<br><b>交通：</b>のぞみ 約36分 → 名鉄ミュースカイ 約28分<br><b>到着：</b>13:03 中部国際空港駅</p>'],
  ['<p>セントレア発<br><b>CX539</b> 香港経由</p>', '<p><b>出発：</b>16:10 JST セントレア NGO<br><b>便：</b>CX539・4時間20分 → 香港乗継 → 長距離CX便<br><b>到着：</b>翌朝 CEST 欧州</p>'],
  ['<span class="schedule-tag kind-move">到着</span><p>Amsterdam <b>AMS</b>着</p>', '<span class="schedule-tag kind-home">手続き</span><p>Amsterdam AMSで入国審査・荷物受取</p>'],
  ['<span class="schedule-tag kind-move">到着</span><p>Frankfurt <b>FRA</b>着</p>', '<span class="schedule-tag kind-home">手続き</span><p>Frankfurt FRAで入国審査・荷物受取</p>'],
  ['<time>10:31</time><span class="schedule-tag kind-move">移動</span><p>Göttingen着<br>ホテルへ荷物預け</p>', '<time>08:22</time><span class="schedule-tag kind-move">移動</span><p><b>出発：</b>08:22 Frankfurt空港駅<br><b>列車：</b>RE2＋ICE774・2時間9分<br><b>到着：</b>10:31 Göttingen Hbf</p>'],
  ['<time>日中</time><span class="schedule-tag kind-visit">見学</span><p>Wolfsburg<br>Autostadt見学</p>', '<time>11:00頃</time><span class="schedule-tag kind-visit">見学</span><p><b>出発：</b>11:00頃 Göttingen Hbf<br><b>列車：</b>ICE・約1時間15〜20分<br><b>到着：</b>12:20頃 Wolfsburg Hbf → Autostadt</p>'],
  ['<time>18:45頃</time><span class="schedule-tag kind-move">移動</span><p>Göttingenへ戻る<br>チェックイン</p>', '<time>17:30頃</time><span class="schedule-tag kind-move">移動</span><p><b>出発：</b>17:30頃 Wolfsburg Hbf<br><b>列車：</b>ICE直通・約1時間15〜20分<br><b>到着：</b>18:45頃 Göttingen Hbf</p>'],
  ['<p>Amsterdam <b>AMS</b>発<br>→ Hannover <b>HAJ</b></p>', '<p><b>出発：</b>16:50 CEST Amsterdam AMS<br><b>便：</b>KL1791・55分<br><b>到着：</b>17:45 CEST Hannover HAJ</p>'],
  ['<time>20:25</time><span class="schedule-tag kind-move">到着</span><p>Göttingen着</p>', '<time>19:06</time><span class="schedule-tag kind-move">移動</span><p><b>出発：</b>19:06 Hannover Flughafen<br><b>列車：</b>S5 17分 → 乗換30分 → ICE77 32分<br><b>到着：</b>20:25 Göttingen Hbf</p>'],
  ['<p>Göttingen発<br>→ Hannover Messe</p>', '<p><b>出発：</b>07:55 Göttingen Hbf<br><b>列車：</b>ICE888・28分<br><b>到着：</b>08:23 Hannover Messe/Laatzen</p>'],
  ['<time>日帰り</time><span class="schedule-tag kind-move">移動</span><p>Göttingen<br>⇄ Bremen</p>', '<time>09:00</time><span class="schedule-tag kind-move">移動</span><p><b>出発：</b>09:00 Göttingen Hbf<br><b>列車：</b>ICE1674・1時間45分<br><b>到着：</b>10:45 Bremen Hbf<br><b>復路：</b>時刻・列車・所要時間は未確認</p>'],
  ['<div class="agenda-line"><time>14:30</time><span class="schedule-tag kind-move">移動</span><p>Hannover Messe発</p></div>\n          <div class="agenda-line"><time>17:14</time><span class="schedule-tag kind-move">到着</span><p>Frankfurt中央駅着</p></div>', '<div class="agenda-line"><time>14:30</time><span class="schedule-tag kind-move">移動</span><p><b>出発：</b>14:30 Hannover Messe/Laatzen<br><b>列車：</b>S4 8分 → 乗換15分 → ICE771 2時間21分<br><b>到着：</b>17:14 Frankfurt(Main) Hbf</p></div>'],
  ['<p>Frankfurt <b>FRA</b>発<br><b>CX288</b> 香港経由</p>', '<p><b>出発：</b>13:40 CEST Frankfurt FRA<br><b>便：</b>CX288・11時間40分 → 香港乗継2時間15分 → CX536・3時間35分<br><b>到着：</b>翌日14:10 JST セントレア NGO</p>'],
];
for (const [from, to] of familyTransportReplacements) html = html.replaceAll(from, to);

const genericJapanTransfer = '<p><b>出発：</b>11:30頃 京都駅<br><b>交通：</b>のぞみ 約36分 → 名鉄ミュースカイ 約28分<br><b>到着：</b>13:03 中部国際空港駅</p>';
html = html.replace(genericJapanTransfer, '<p><b>出発：</b>10/17 11:30頃 JST 京都駅<br><b>交通：</b>のぞみ 約36分 → 名鉄ミュースカイ 約28分<br><b>到着：</b>10/17 13:03 JST 中部国際空港駅</p>');
html = html.replace(genericJapanTransfer, '<p><b>出発：</b>10/18 11:30頃 JST 京都駅<br><b>交通：</b>のぞみ 約36分 → 名鉄ミュースカイ 約28分<br><b>到着：</b>10/18 13:03 JST 中部国際空港駅</p>');

const genericCxOutbound = '<p><b>出発：</b>16:10 JST セントレア NGO<br><b>便：</b>CX539・4時間20分 → 香港乗継 → 長距離CX便<br><b>到着：</b>翌朝 CEST 欧州</p>';
html = html.replace(genericCxOutbound, '<p><b>出発：</b>10/17 16:10 JST セントレア NGO<br><b>便：</b>CX539・4時間20分 → 香港乗継3時間45分 → CX271・13時間40分<br><b>到着：</b>10/18 06:55 CEST Amsterdam AMS</p>');
html = html.replace(genericCxOutbound, '<p><b>出発：</b>10/18 16:10 JST セントレア NGO<br><b>便：</b>CX539・4時間20分 → 香港乗継4時間25分 → CX289・13時間20分<br><b>到着：</b>10/19 07:15 CEST Frankfurt FRA</p>');

const genericIce888 = '<p><b>出発：</b>07:55 Göttingen Hbf<br><b>列車：</b>ICE888・28分<br><b>到着：</b>08:23 Hannover Messe/Laatzen</p>';
html = html.replace(genericIce888, '<p><b>出発：</b>10/20 07:55 CEST Göttingen Hbf<br><b>列車：</b>ICE888・28分<br><b>到着：</b>10/20 08:23 CEST Hannover Messe/Laatzen</p>');
html = html.replace(genericIce888, '<p><b>出発：</b>10/21 07:55 CEST Göttingen Hbf<br><b>列車：</b>ICE888・28分<br><b>到着：</b>10/21 08:23 CEST Hannover Messe/Laatzen</p>');

html = html.replace('<b>出発：</b>08:22 Frankfurt空港駅', '<b>出発：</b>10/19 08:22 CEST Frankfurt空港駅');
html = html.replace('<b>到着：</b>10:31 Göttingen Hbf', '<b>到着：</b>10/19 10:31 CEST Göttingen Hbf');
html = html.replace('<b>出発：</b>11:00頃 Göttingen Hbf', '<b>出発：</b>10/19 11:00頃 CEST Göttingen Hbf');
html = html.replace('<b>到着：</b>12:20頃 Wolfsburg Hbf', '<b>到着：</b>10/19 12:20頃 CEST Wolfsburg Hbf');
html = html.replace('<b>出発：</b>17:30頃 Wolfsburg Hbf', '<b>出発：</b>10/19 17:30頃 CEST Wolfsburg Hbf');
html = html.replace('<b>到着：</b>18:45頃 Göttingen Hbf', '<b>到着：</b>10/19 18:45頃 CEST Göttingen Hbf');
html = html.replace('<b>出発：</b>16:50 CEST Amsterdam AMS', '<b>出発：</b>10/20 16:50 CEST Amsterdam AMS');
html = html.replace('<b>到着：</b>17:45 CEST Hannover HAJ', '<b>到着：</b>10/20 17:45 CEST Hannover HAJ');
html = html.replace('<b>出発：</b>19:06 Hannover Flughafen', '<b>出発：</b>10/20 19:06 CEST Hannover Flughafen');
html = html.replace('<b>到着：</b>20:25 Göttingen Hbf', '<b>到着：</b>10/20 20:25 CEST Göttingen Hbf');
html = html.replace('<b>出発：</b>09:00 Göttingen Hbf', '<b>出発：</b>10/22 09:00 CEST Göttingen Hbf');
html = html.replace('<b>到着：</b>10:45 Bremen Hbf', '<b>到着：</b>10/22 10:45 CEST Bremen Hbf');
html = html.replace('<b>出発：</b>14:30 Hannover Messe/Laatzen', '<b>出発：</b>10/23 14:30 CEST Hannover Messe/Laatzen');
html = html.replace('<b>到着：</b>17:14 Frankfurt(Main) Hbf', '<b>到着：</b>10/23 17:14 CEST Frankfurt(Main) Hbf');
html = html.replace('<b>出発：</b>13:40 CEST Frankfurt FRA', '<b>出発：</b>10/24 13:40 CEST Frankfurt FRA');

replaceOnce(
  />🏨 宿泊先情報<\/div>/,
  '>🏨 宿泊先情報（3名）</div>',
  'family lodging heading',
);

replaceOnce(
  />10\/20–10\/23<\/span>/,
  '>10/19–10/23</span>',
  'Goettingen overall stay dates',
);

replaceOnce(
  /村上: 10\/20〜（到着20時25分頃・3泊）· 美馬・金築: 10\/19〜（4泊・先着）/,
  '美馬・金築: 10/19〜（4泊・先着） · 村上: 10/20〜（到着20時25分頃・3泊）',
  'Goettingen traveler-specific stay dates',
);

/* Legacy inline draft retained here for reference; v2.js is loaded instead.
const fieldScript = String.raw`

// ── v2 field UI / records ────────────────────────────────
const FIELD_KEY = 'eurotrip2026-v2';
const PRIMARY_TABS = new Set(['itinerary', 'events', 'rec']);

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const panel = document.getElementById('tab-' + tabId);
  if (!panel) return;
  panel.classList.add('active');

  const selected = PRIMARY_TABS.has(tabId) ? tabId : 'rec';
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
`;

replaceOnce(
  /\/\/ ── Tab switching ─+[\s\S]*?\/\/ ── 日付クイックナビ/,
  `${fieldScript}\n// ── 日付クイックナビ`,
  'legacy tab script',
);
*/

replaceOnce(
  /document\.addEventListener\('DOMContentLoaded', \(\) => \{\s*switchTab\('itinerary'\);\s*loadChecklist\(\);\s*\}\);/,
  `document.addEventListener('DOMContentLoaded', () => {\n  setupFieldUi();\n  switchTab('itinerary');\n  loadChecklist();\n});`,
  'DOMContentLoaded init',
);

replaceOnce(
  /<\/body>/,
  `<script src="v2.js"></script>\n</body>`,
  'v2 script insertion point',
);

// ── 表記統一 ──────────────────────────────────────────────
// 旅程は「その場で次に何をするか」を優先し、予約状態は準備欄に集約する。
// ホテルの「1泊目／2泊目」は使わず、宿泊先情報で日付と泊数を示す。
const itineraryStart = html.indexOf('<!-- ===== TAB: 旅程 ===== -->');
const itineraryEnd = html.indexOf('<!-- ===== TAB: 準備 ===== -->');
if (itineraryStart < 0 || itineraryEnd < 0 || itineraryEnd <= itineraryStart) {
  throw new Error('build_v2: itinerary section not found for terminology normalization');
}

let itinerary = html.slice(itineraryStart, itineraryEnd);
const itineraryReplacements = [
  ['🏨 荷物預け（予約済み）', '🏨 ホテルに荷物を預ける'],
  ['🏨 Holiday Inn Express Amsterdam - Sloterdijk Station泊（1泊目・予約済み）', '🏨 Holiday Inn Express Amsterdam - Sloterdijk Station に宿泊'],
  ['🏨 Holiday Inn Express Amsterdam - Sloterdijk Station泊（2泊目・予約済み）', '🏨 Holiday Inn Express Amsterdam - Sloterdijk Station に宿泊'],
  ['🏨 Hotel FREIgeist Göttingen Innenstadt泊（先着・予約済み）', '🏨 Hotel FREIgeist Göttingen Innenstadt に宿泊'],
  ['🏨 Hotel FREIgeist Göttingen Innenstadt泊（予約済み）', '🏨 Hotel FREIgeist Göttingen Innenstadt に宿泊'],
  ['🏨 Hotel FREIgeist Göttingen Innenstadt泊（全員・予約済み）', '🏨 Hotel FREIgeist Göttingen Innenstadt に宿泊'],
  ['🏨 Toyoko Inn Frankfurt am Main Hauptbahnhof泊（全員・予約済み）', '🏨 Toyoko Inn Frankfurt am Main Hauptbahnhof に宿泊'],
  ['村上より1日早くチェックイン・延泊で予約済み', '村上より1日早くチェックイン'],
  ['🛋 ラウンジは対象外 — カードラウンジを検討', '🛋 美馬・金築：JALサクララウンジは利用不可'],
  ['ラウンジは対象外。<strong>香港らしいものを食べるなら着いてすぐ Level 7 へ</strong>', '美馬・金築は航空会社ラウンジを利用できない。<strong>香港らしいものを食べるなら着いてすぐ Level 7 へ</strong>'],
  ['ラウンジは対象外なので<strong>制限エリア内で夕食を取る</strong>', '美馬・金築は航空会社ラウンジを利用できないため、<strong>制限エリア内で夕食を取る</strong>'],
  ['ゴールドカード以上を持っていれば<strong>出国審査前のカードラウンジ</strong>を無料で使える。使う場合は出国審査前に立ち寄る。', '美馬・金築：対象のゴールドカード以上を持っている場合のみ、<strong>出国審査前のカードラウンジ</strong>を無料で利用できる。利用する場合は出国審査前に立ち寄る。'],
  ['🚶 ブレーメン旧市街を散策（任意）', '🚶 時間と体力に余裕があれば、ブレーメン旧市街を散策'],
  ['Mercedes-Benz Werk Bremen 工場見学（3名分）', 'Mercedes-Benz Werk Bremen 工場見学（全員）'],
  ['村上・美馬・金築 全員参加', '全員で参加'],
];
for (const [from, to] of itineraryReplacements) itinerary = itinerary.replaceAll(from, to);
itinerary = itinerary.replace(/\s*<div class="text-green-700 font-bold text-xs">✅ 予約確定<\/div>/, '');
html = html.slice(0, itineraryStart) + itinerary + html.slice(itineraryEnd);

// 海外の駅は、日本語の役割名に現地表記を添える。ホテル名は正式なアルファベット名に統一する。
const globalReplacements = [
  ['Wolfsburg Hbf', 'ヴォルフスブルク中央駅（Wolfsburg Hbf）'],
  ['Hannover Hbf', 'ハノーファー中央駅（Hannover Hbf）'],
  ['ブレーメンHbf', 'ブレーメン中央駅（Bremen Hbf）'],
  ['Frankfurt(Main)Hbf', 'フランクフルト中央駅（Frankfurt(Main) Hbf）'],
  ['FRA中央駅', 'フランクフルト中央駅（Frankfurt(Main) Hbf）'],
  ['Hannover Messe/Laatzen駅', 'ハノーファー・メッセ／ラーツェン駅（Hannover Messe/Laatzen）'],
  ['ゲッティンゲン中央駅', 'ゲッティンゲン中央駅（Göttingen Hbf）'],
  ['Holiday Inn Express Amsterdam<br>', 'Holiday Inn Express Amsterdam -<br>Sloterdijk Station<br>'],
  ['FREIgeist Göttingen<br>', 'Hotel FREIgeist Göttingen<br>Innenstadt<br>'],
  ['Toyoko Inn Frankfurt<br>', 'Toyoko Inn Frankfurt am Main<br>Hauptbahnhof<br>'],
  ['Frankfurt中央駅着', 'フランクフルト中央駅（Frankfurt(Main) Hbf）着'],
  ['3名全員', '全員'],
  ['全員3名分', '3名分'],
  ['全員3名', '3名分'],
];
for (const [from, to] of globalReplacements) html = html.replaceAll(from, to);

// 家族向け宿泊カードは、日付・泊数・宿泊者だけを表示する。予約状態は「準備」で確認する。
html = html.replaceAll(' · <span class="text-green-600 font-bold">✅ 予約済み</span>', '');
html = html.replace(
  '<div class="text-xs text-slate-600">全員</div>\n          <div class="text-xs text-slate-500">Stuttgarter Straße 35',
  '<div class="text-xs text-slate-600">全員・1泊</div>\n          <div class="text-xs text-slate-500">Stuttgarter Straße 35',
);

// ラウンジ案内は、対象者・利用可否・条件を明示する。
html = html.replace(
  '❌ サクララウンジは対象外。ゴールドカード以上があれば出国審査前のカードラウンジを無料で使える',
  '利用不可：JALサクララウンジ。美馬・金築が対象のゴールドカード以上を持っている場合のみ、出国審査前のカードラウンジを無料で利用できる',
);

// 提示された見積を、未購入の航空券と区別して反映する。
html = html.replace(
  '<td>CX539 / CX271</td><td>村上</td><td>NGO→HKG→AMS</td><td>10/17 16:10発</td>\n            <td class="risk-mid font-bold">✅ 選定済み（未購入）</td>',
  '<td>CX539 / CX271</td><td>村上</td><td>NGO→HKG→AMS</td><td>10/17 16:10発</td>\n            <td class="risk-mid font-bold">見積取得・未購入（B／エコノミー）</td>',
);
html = html.replace(
  '<td>KL1791</td><td>村上</td><td>AMS→HAJ</td><td>10/20 16:50発</td>\n            <td class="risk-mid font-bold">✅ 選定済み（未購入）</td>',
  '<td>KL1791</td><td>村上</td><td>AMS→HAJ</td><td>10/20 16:50発</td>\n            <td class="risk-mid font-bold">見積取得・未購入（L／エコノミー）</td>',
);
html = html.replace(
  '<td>CX288 / CX536</td><td>全員</td><td>FRA→HKG→NGO</td><td>10/24 13:40発</td>\n            <td class="risk-mid font-bold">✅ 選定済み（未購入・NGO着 10/25 14:10）</td>',
  '<td>CX288 / CX536</td><td>全員</td><td>FRA→HKG→NGO</td><td>10/24 13:40発</td>\n            <td class="risk-mid font-bold">村上分は見積取得・未購入（H／エコノミー）。美馬・金築分は選定済み・未購入</td>',
);
html = html.replace(
  '⚠️ 便は全員分 選定済み（中部国際＝セントレア発着）。いずれも未購入のため、EuroBLECH期間は満席・高騰しやすい点をふまえ発券手配を急ぐ。',
  '⚠️ 村上分はCX往復とKL1791の見積を取得済み。美馬・金築分を含め、航空券はすべて未購入のため発券手配を進める。',
);
html = html.replace(
  '<tr style="background:#fef9c3"><td>航空券 CX（村上・往復）</td><td class="font-bold">未見積</td><td class="risk-mid font-bold">選定済み・未購入（往路10/17発。金額は案4に準ずる見込み）</td></tr>',
  '<tr style="background:#fef9c3"><td>航空券 CX（村上・往復・1名分）</td><td class="font-bold">337,040円</td><td class="risk-mid font-bold">見積取得・未購入（運賃217,600円＋空港諸税等111,740円＋発券手数料7,700円）</td></tr>',
);
html = html.replace(
  '<tr style="background:#fef9c3"><td>AMS→HAJ（村上・KL1791）</td><td class="font-bold">未見積</td><td class="risk-mid font-bold">選定済み・未購入</td></tr>',
  '<tr style="background:#fef9c3"><td>AMS→HAJ（村上・KL1791・1名分）</td><td class="font-bold">82,660円</td><td class="risk-mid font-bold">見積取得・未購入（運賃EUR 285.00＝53,200円換算＋空港諸税等21,760円＋発券手数料7,700円）</td></tr>',
);
html = html.replace('✈️ フライト Eチケット', '✈️ 航空券手配状況');
html = html.replace(
  '<span>CX539/CX271 NGO→AMS 10/17発（村上）</span>\n            <span class="text-xs bg-yellow-200 text-yellow-700 rounded px-2 py-0.5">選定済み・未購入</span>',
  '<span>CX539/CX271 NGO→AMS 10/17発（村上）</span>\n            <span class="text-xs bg-yellow-200 text-yellow-700 rounded px-2 py-0.5">見積取得・未購入</span>',
);
html = html.replace(
  '<span>KL1791 AMS→HAJ 10/20発（村上）</span>\n            <span class="text-xs bg-yellow-200 text-yellow-700 rounded px-2 py-0.5">選定済み・未購入</span>',
  '<span>KL1791 AMS→HAJ 10/20発（村上）</span>\n            <span class="text-xs bg-yellow-200 text-yellow-700 rounded px-2 py-0.5">見積取得・未購入</span>',
);

const flightStatusPanel = `<!-- 航空券状況 -->
  <div class="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
    <div class="bg-gray-700 text-white px-5 py-3 font-bold text-base">✈︎ 航空券手配状況</div>
    <div class="p-4">
      <p class="transport-status-note">ここは購入状況だけを確認する欄です。発着日時・便・所要時間は「家族 → フライト情報」に同じ順序で表示しています。</p>
      <table class="transport-table status-only-table">
        <thead><tr><th>対象</th><th>便</th><th>状況</th><th>見積</th></tr></thead>
        <tbody>
          <tr style="background:#fef9c3"><td>村上</td><td>CX539 / CX271 / CX288 / CX536</td><td class="risk-mid font-bold">見積取得・未購入</td><td>337,040円</td></tr>
          <tr style="background:#fef9c3"><td>美馬・金築</td><td>CX539 / CX289 / CX288 / CX536</td><td class="risk-mid font-bold">選定済み・未購入<br><small>予約クラス未確認</small></td><td>約670,920円／2名</td></tr>
          <tr style="background:#fef9c3"><td>村上</td><td>KL1791</td><td class="risk-mid font-bold">見積取得・未購入</td><td>82,660円</td></tr>
        </tbody>
      </table>
      <div class="mt-3 text-sm text-amber-700 bg-amber-50 rounded p-2 border border-amber-200">⚠️ 村上分はCX往復とKL1791の見積を取得済み。美馬・金築分を含め、航空券はすべて未購入です。</div>
    </div>
  </div>

  `;
replaceOnce(
  /<!-- 航空券状況 -->[\s\S]*?(?=<!-- ラウンジ利用可否 -->)/,
  flightStatusPanel,
  'flight status panel normalization',
);

const checklistWording = [
  ['✈️ CX 航空券 村上往路（NGO-HKG-AMS CX539/CX271・10/17 16:10発）購入手配', '✈︎ 航空券購入｜村上｜CX539 / CX271｜NGO → HKG → AMS｜10/17 16:10発'],
  ['✈️ CX 航空券 美馬・金築往路（NGO-HKG-FRA CX539/CX289・10/18 16:10発）手配', '✈︎ 航空券購入｜美馬・金築｜CX539 / CX289｜NGO → HKG → FRA｜10/18 16:10発'],
  ['✈️ 航空券 復路（FRA-HKG-NGO CX288/CX536・10/24発・NGO着 10/25 14:10）購入手配', '✈︎ 航空券購入｜全員｜CX288 / CX536｜FRA → HKG → NGO｜10/24 13:40発'],
  ['✈️ KL1791 AMS→HAJ 航空券購入（村上・10/20 16:50発）', '✈︎ 航空券購入｜村上｜KL1791｜AMS → HAJ｜10/20 16:50発'],
];
for (const [from, to] of checklistWording) html = html.replaceAll(from, to);

// HRSルール：飛行機は絵文字ではなくモノクロ記号に統一し、発着は本文で示す。
html = html.replace(/✈[\uFE0E\uFE0F]?|🛫|🛬/g, '✈︎');

writeFileSync(outputPath, html, 'utf8');
console.log(`Built ${outputPath}`);
