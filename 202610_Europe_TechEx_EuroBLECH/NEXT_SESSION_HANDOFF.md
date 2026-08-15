# TechEx Europe・EuroBLECH 2026 — 初期設計の補足引き継ぎ

更新日: 2026-08-14

## この文書の位置づけ

現在の引き継ぎ本体は `CLAUDE_HANDOFF.md`。このファイルは、HRSから継承した設計判断と4列交通サンプルの経緯を残す補足資料である。

- 作業開始時は、必ず `CLAUDE_HANDOFF.md` を先に読む。
- この文書と `CLAUDE_HANDOFF.md` が異なる場合は、`CLAUDE_HANDOFF.md` とユーザーの最新指示を優先する。
- 過去の旅程値や利用資格の断定は残さず、現在の実装と未完了事項は `CLAUDE_HANDOFF.md` に集約する。

## 基準として確認するファイル

- 現在の引き継ぎ本体: `CLAUDE_HANDOFF.md`
- 採用HRS実装: `../202609_HumanoidSummitEurope/index.html`
- HRS共通CSS: `../202609_HumanoidSummitEurope/v3.css`
- HRS設計文書: `../202609_HumanoidSummitEurope/V3_DESIGN_BRIEF.md`
- HRS共通ランタイム: `../shared/trip-field/runtime.js`
- 承認済み4列サンプル: `transport_actual_1017_1018_sample.html`
- 現在の生成コード: `build_v3.mjs`
- 現在の成果物: `index.html`（フォルダの公開入口。`index_v3.html` は転送ページであって成果物ではない）
- ページ固有検証: `validate_v3.mjs`

`references/rejected/transport_layout_sample.html` は失敗した旧試作。参考用に隔離しているが、実装基準にしない。

`references/superseded/` には、現行と矛盾する旧旅程・旧スケジュールを退避してある。
日程としては読まない。視察テーマとセッション選定だけは未取り込みの材料として残してある。
詳細は `references/superseded/README.md` を見る。

## HRSから継承する設計

- フォントは `BIZ UDPGothic`, `Yu Gothic UI`, `Meiryo`, `system-ui`, `sans-serif`。
- 日カードはHRS型の `<details class="day" open>`。
- stickyタブと横スクロール可能な日付チップを使う。
- 人物色は人物レーン見出しと人物別宿泊に限定する。
- 時差は略号だけでなく「日本より何時間遅い」を主情報として示す。
- 日単位の説明は「本日のトピックス」に置く。
- 実行動は人物レーンまたは共通レーンへ置く。
- 宿泊は人物レーン末尾、合流後は共通レーン末尾に一度だけ置く。
- 旅程、準備、会場、記録の4タブを維持する。
  （2026-08-15に家族タブを廃止し、`family_print.html` を正本にした。
  ヘッダーのリンクから開く。詳細は `CLAUDE_HANDOFF.md`）

## 4列交通表示

交通行は、スマートフォンでも次の4列を維持する。

`行時刻｜出発｜移動手段・所要時間｜到着`

- 出発・到着欄は `出発/到着 → 時刻（TZ） → 場所`。
- 月日・曜日は日カードだけに置き、交通欄で繰り返さない。
- 翌日到着は `06:55 +1` のように表す。
- 中央列は便名または交通手段と時間を簡潔に示す。
- 地上移動は矢印、フライトは共通の単色 `.flight-mark` を使う。
- 黒い四角バッジ、色付き飛行機絵文字、黒塗りアイコンは使わない。
- 長い駅名やホテル名は折り返し、横スクロールを発生させない。
- 別行動日は人物レーン、合流後は共通レーンを使う。

日跨ぎ便は前日の4列交通に到着時刻を残す。加えて、ユーザーの最新指示により、10/18の村上レーンにも `06:55 Amsterdam Airport Schiphol（AMS）着` を明記する。

## 現在確定している表現

- EuroBLECH: 展示会視察
- TechEx Europe: 参加
- Mercedes-Benz Werk Bremen: 工場見学。10/22 12:45〜14:00の見学枠は予約確定
- Autostadt: 見学
- 荷物: `荷物受取`、`ホテルに荷物を預ける`
- 旅程の宿泊欄: `機内`

ラウンジは、航空会社ラウンジ、Priority Pass、一般有料施設を分ける。搭乗クラス、ステータス、会員資格、カード保有を推測で断定しない。最新の調査状況と公式リンクは `CLAUDE_HANDOFF.md` を参照する。

## ファイルのGit管理状態

次の基準ファイルと生成物はGit管理済み。

- `CLAUDE_HANDOFF.md`
- `transport_actual_1017_1018_sample.html`
- `build_v2.mjs`、`index_v2.html`、`v2.css`、`v2.js`
- `build_v3.mjs`、`index.html`、`v3.css`、`v3.js`、`validate_v3.mjs`
- `index_v1.html`（旅程内容の元データ）、`index_v3.html`（転送ページ）
- `references/rejected/transport_layout_sample.html`
- `references/superseded/`（旧旅程・旧スケジュールと `README.md`）

`index.html` と `family_print.html` は現行の正だが、いずれも `build_v3.mjs` の
生成物なので直接変更しない。旅程内容の元データは `index_v1.html`、
家族向けの基準は `index_v2.html` であり、これらも直接上書きしない。
フォルダ直下に置くのは、この引き継ぎ2件、`index.html`、`family_print.html`、
`index_v1.html`、`index_v3.html`、v2一式、v3一式、承認済み4列サンプル、
`references/` だけにする。
旧案が増えたら `references/superseded/` へ移す。

## 次セッションの開始手順

1. `CLAUDE_HANDOFF.md` を全文読む。
2. 本書と承認済み4列サンプル、HRS公開版を確認する。
3. `CLAUDE_HANDOFF.md` の「未完了 — 次に対応する項目」を上から反映する。
4. `build_v3.mjs` を修正し、`index.html` を再生成する。
5. `validate_v3.mjs`、`git diff --check`、390px/デスクトップのブラウザ確認を行う。
