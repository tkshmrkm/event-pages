# Claude Code instructions for event-pages

このリポジトリで海外出張ページの続きを行う場合は、作業を始める前に
次の順序で読むこと。

1. `OVERSEAS_TRIP_LAYOUT_SUMMARY.md`
2. `WORK_STATUS.md`
3. `shared/trip-field/README.md`
4. 対象イベントの設計文書と生成スクリプト

## プロジェクトの目的

海外出張ページは、確定旅程の清書ではなく、仮案から当日の行動計画へ
育てるためのツールである。現地ではスマートフォン、帰国後はPC、
机上では静的な印刷版を使う。

オンライン版の主要タブは `旅程 / 会場 / 記録` の3つに保つ。
イベントごとの配色と情報構造は維持し、操作、保存、スマートフォン対応、
印刷時の役割だけを共通化する。

この基盤は今後の展示会、講演会、カンファレンス、工場見学、企業訪問に
原則適用する。記録単位は講演、出展社・ブース、訪問先、面談などへ変更して
よいが、`事前の狙い・質問 / 当日メモ / PCでのMarkdown・JSON保存` は
共通契約として維持する。

## 編集上の重要事項

- HRS v3の生成物を直接編集しない。
  `202609_HumanoidSummitEurope/build_v3.mjs` を変更して再生成する。
- HRS v3の生成物は `index.html`、`index_v3_offline.html`、
  `family_print.html`、`v3.css`。
- 旧版の `index_v1.html` と元資料の `index_v2.html` は、移行元として保存する。
- `index_v3.html` は、以前の共有URLを `index.html` へ転送する互換ページ。
- EUROBLECH（`202610_Europe_TechEx_EuroBLECH`）も2026-08-14に同じ並びへそろえた。
  `index.html` が生成物、`index_v1.html` が入力元、`index_v3.html` が転送ページ。
  詳細は `202610_Europe_TechEx_EuroBLECH/CLAUDE_HANDOFF.md` を読む。
- 共通機能は `shared/trip-field` に置き、HRS固有の外観はHRS側に残す。
- 机上用印刷版は静的で、メモ欄、クラウド同期、実行スクリプトを含めない。
- 交通手段のアイコンはEUROBLECH方式を標準とする。カラー絵文字と
  モノクロ文字の `✈︎` は、いずれも使わない。
  フライトは共通の `.flight-mark`（SVGマスク）、それ以外は
  `.mode-icon mode-icon-{train|walk|car|unknown}`（インラインSVG）を使う。
  フライトだけ絵で他が矢印、という不揃いにしない。中央列は必ずアイコンにする。
  手段そのものが未定のときだけ `unknown`（?）にし、色も要検討のオレンジにする。
- **アイコンの寸法は置き場所で決める。** 専用の列に入って行の高さを決める
  `.flight-mark` と `.mode-icon` は固定20px。見出し・ボタン・本文の中に置く
  `.line-icon` は文字サイズ基準（`1.15em`）にする。固定pxで持つと、13〜14pxの
  文字の中に文字より大きい箱が並ぶ。定義は `shared/trip-field/core.css` にあり、
  イベント側で寸法を上書きしない。上書きしてよいのは色だけ。
- **生成物に絵文字を1文字も置かない。** 交通手段だけでなく、行動の区分（食事・観光・
  宿・工場見学）も、操作ボタン（DL・削除・コピー）も、見出しの飾りも、すべて
  モノクロSVGの `.line-icon` にする。理由は2つ。既定表示が文字の絵文字（🍽 🏛 ℹ など）は
  Windowsで黒い輪郭グリフになること。カラー絵文字を混ぜるとモノクロSVGと並んで
  不揃いに見えること。国旗（🇩🇪🇯🇵）はアイコンにせず落とす（合成されず「DE」「JP」と出る）。
  検査は絵文字を列挙せず、Unicodeの `Extended_Pictographic` が0件であることを見る。
  3文字だけ数える検査では、残り49箇所を素通りさせた実績がある。
- 現地で見るフィールドガイドであって読み物ではない。
  **常時表示の補足は30字程度までの事実に留め、理由・判断材料・条件は
  折り畳み（`details.fold`）の中へ入れる。** 地の文で理屈を説明しない。
  折り畳みの `summary` は中身を示す語にする（`やること` `過ごし方` など）。
  「続きを読む」のような中身を示さない語は使わない。
- **常時表示行の末尾に句点を付けない。** ラベルであって文ではない。
  複数文になる場合だけ文間に句点を使い、末尾には付けない。折り畳みの中は対象外。
- 担当者ボタンは追加しない。講演メモは `事前の狙い・質問` と
  `当日メモ` の2欄を基本とする。
- `当日メモ` は記入者名、端末のローカル時刻、UTCオフセットを付け、1件ずつ
  独立したCloudflareデータとして共同追記できること。事前準備欄には共同追記を付けない。
- iPhone 16相当の393px幅とPixel 7a/8a相当の412px幅で横あふれを確認する。
- PCではクラウドから記録を読み込み、MarkdownとJSONをダウンロードできる
  状態を維持する。

## Cloudflare同期

Cloudflareコードは `cloudflare/trip-notes-worker` にある。

- 同期キーをHTML、JavaScript、設定ファイル、コミットへ書かない。
- Worker Secretの `SYNC_TOKEN` として登録する。
- Workers KV、Worker Secret、Workerは2026-08-13に配備済み。
- Worker URLは `https://trip-field-sync.mrkn55.workers.dev`。
- HRSの `cloudEndpoint` は配備URLへ設定済み。
- 同期キーの値はユーザーのみが保持し、リポジトリには存在しない。
- GitHub Pagesのスマートフォン・PC表示と認証付きPUT/GETは受入完了。
- 旅程選択と自由編集欄は1出張1スナップショットのlast-write-wins。
- 共同メモは追記1件ごとに一意IDで保存し、複数人の同時追記で上書きしない。

## 次の主要設計

優先順位は `WORK_STATUS.md` を参照する。

1. 予定の状態は `未検討 / 候補あり / 仮決め / 確定 / 当日判断` の5つだけを使う。
   共通部品は `shared/trip-field/core.css` の `.plan-state`。**状態を持つ単位は予定1件。**
   イベントごとに別の言い回し（予約済・要検討・未発表など）を作らない。
   **進み具合の軸と、未確定の理由の軸を混ぜない。** 理由（未発表＝先方が出していない／
   要確認＝調べれば分かる／要検討＝こちらが決める）は折り畳みと本文に書く。
   確定に必要な条件は `.state-note` で札の隣に添える。
   残作業は「次に決めること」（期限・第一候補・確定条件・予約状態・最終確認日）の表示。

**人別フォーカス（`全員 / 村上 / 美馬・金築` の表示フィルター）は作らない。**
2026-08-15にユーザーが不要と決めた。別行動は静的なレーン表示のまま扱う。
提案として復活させない。

## 検証コマンド

リポジトリルートから実行する。

```powershell
node .\cloudflare\trip-notes-worker\validate-worker.mjs
node .\shared\trip-field\validate-template.mjs
node .\202609_HumanoidSummitEurope\build_v3.mjs
node .\202609_HumanoidSummitEurope\validate_v3.mjs
git diff --check
```

生成後はローカルサーバーで、393px、412px、PC幅をブラウザー確認する。
DOM構造、横あふれ、コンソールエラー、表示内容、机上用印刷版のスクリプト0件を
確認してから完了とする。

## Gitでの引き継ぎ

- 作業開始時と終了時に `git status --short` を確認する。
- ユーザーの既存変更を上書きしない。
- 区切りごとに内容が分かるコミットを作る。
- pushはユーザーの指示があるまで行わない。
- Claude CodeとCodexが同時に作業する場合は、同じcheckoutを共有せず、
  別branch/worktreeを使う。意図と進捗は `WORK_STATUS.md` を更新して渡す。
