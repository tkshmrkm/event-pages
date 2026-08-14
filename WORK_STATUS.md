# WORK STATUS — overseas trip layout

更新日: 2026-08-14

## 現在の目的

HRS Europe 2026で作ったスマートフォン向け出張ページを、イベント固有の
配色と構成を保ったまま、EUROBLECHなど今後の海外出張へ再利用できる基盤にする。

今後作る展示会、講演会、カンファレンス、工場見学、企業訪問のメモは、
原則としてこの形式を使う。

このページは仮案から作り始め、候補比較、仮決め、確定、当日参照、現地メモ、
PC保存までを一続きで支える。

## 現在のGit状態

- branch: `claude/euroblech-folder-handover-check-666081`（worktree）
- 2026-08-14にEUROBLECH方式をHRSと共通基盤へ反映
- 未push

作業再開時は、上記を現状と思い込まず、必ず次を実行すること。

```powershell
git status --short
git log -5 --oneline
git status --branch --short
```

## 完了済み

- HRS v3オンライン版: `旅程 / 会場 / 記録` の3セクション
- HRS全8日の日カードと、候補選択・確定の分離
- 講演ごとの `事前の狙い・質問` と `当日メモ`
- 日別・講演別メモへの記入者名・ローカル時刻・UTCオフセット付き共同追記
- localStorageへの即時保存
- Markdownコピー、Markdownダウンロード、JSON書出し・読込み
- iPhone 16、Pixel 7a/8a相当幅への対応
- 机上用の静的印刷版
- 家族向け予定表
- 共通テンプレート、CSS、ランタイム、机上印刷ビルダー
- Cloudflare Worker/KVのコードとローカル検証
- HRS画面のCloudflare同期UI
- 海外出張ページの総括文書

## HRS v3完了状態

2026-08-13に次を配備済み。

- 専用Workers KV
- Worker Secret `SYNC_TOKEN`
- `trip-field-sync` Worker
- `https://trip-field-sync.mrkn55.workers.dev`
- HRS `cloudEndpoint` の設定
- キーなしアクセスが401になることの確認
- GitHub Pages公開版の393px・PC幅確認
- ユーザー保持キーによる認証付きPUT/GETとデータ一致確認

HRS v3は、オンライン版、机上用印刷版、家族向け印刷版、ローカル保存、
Cloudflare同期、PCダウンロード、二人の上書きなし共同追記まで実装済み。
同期キーはユーザーが保持し、リポジトリには保存しない。

## EUROBLECH方式の標準化（2026-08-14）

EUROBLECHで固めた表示規約を標準に格上げし、HRSと共通基盤へ反映した。

反映済み。

- 交通手段のアイコン。カラー絵文字とモノクロ文字 `✈︎` は両方とも廃止。
  フライトは `.flight-mark`（SVGマスク）、それ以外は `.mode-icon`。
  定義は `shared/trip-field/core.css` にあり、`v3.css` へ連結される。
- 地図リンクは場所名そのものに張る。`地図` `（地図）` の別リンクは作らない。
  `.place` も `core.css` が持つ（`#2A5FA0`・太さ600・下線なし）。
- 日付カードの一括開閉。ラベルは現在の状態を示し、個別開閉にも追随する。
- 規定文書3件（`CLAUDE.md`、`OVERSEAS_TRIP_LAYOUT_SUMMARY.md`、
  `shared/trip-field/README.md`）と `shared/trip-field/template.html` を新方式へ更新。
- HRSフォルダ直下の比較サンプル3件を `references/design-samples/` へ退避。
- `index_v3.html` を生成物と誤記していた5箇所を訂正（HRSとEUROBLECHの両方）。

HRSの実測値。`index.html` はフライト12・鉄道37・タクシー2、机上用印刷版は
フライト11で他は同数。`.place` 28件、`地図` の別リンク0件、交通用の絵文字0件。
393px・412px・1280pxで横あふれ0件、コンソールエラー0件、机上用印刷版のスクリプト0件。

### HRSへ未適用の2項目

いずれも**旅程の内容そのものを書き換える作業**なので、仕組みの移植とは分けてある。

1. **4列交通表示** — EUROBLECHは `時刻 / 発 / 手段 / 着` の4列。HRSは2列
   （時刻＋説明文）で、出発地・到着地・所要時間が1つの文に入っている。
   4列化はこの文を分解する作業になる。
2. **文章の調子** — EUROBLECHの基準は常時表示30字程度・末尾に句点を付けない。
   HRSの旅程タブは15行・平均176字・末尾句点13行。

## 未完了

### 1. 予定状態の共通部品

設計済みだが未実装。

- `未検討`
- `候補あり`
- `仮決め`
- `確定`
- `当日判断`

「次に決めること」には、期限、第一候補、確定条件、予約状態、最終確認日を
表示する。候補を確定しても代替案を削除しない。

### 2. EUROBLECHの人別フォーカス

未実装。既存ページは `202610_Europe_TechEx_EuroBLECH` にある。

旅程表示の候補:

- `全員`
- `村上`
- `美馬・金築`

10/17〜10/20は別行動が長いため、人別表示が必要。10/21以降の合流予定は
常に共通表示する。人別フォーカスは端末ごとに記憶する。

## 推奨する次の着手順

1. HRS家族印刷版をEUROBLECHの家族タブ方式へ寄せる
   （`どこにいるか` の都市名最大文字、時差の数字を38px）
2. 共通ランタイムに予定の5段階状態を追加する
3. 共通ランタイムに任意の人別フォーカスを追加する
4. EUROBLECHの既存内容を新基盤へ移す
5. 393px、412px、PC、机上印刷を検証する

HRSの4列化と文章の調子は、上のどれよりも影響範囲が大きい。
着手するなら内容の書き換えとして独立させ、旅程の事実を変えないことを
`validate_v3.mjs` で担保してから進める。

## 重要ファイル

- `OVERSEAS_TRIP_LAYOUT_SUMMARY.md`: 設計と実装状況の全体像
- `CLAUDE.md`: Claude Codeの作業ルール
- `shared/trip-field/README.md`: 共通レイアウト仕様
- `shared/trip-field/runtime.js`: 保存、DL、Cloudflare同期
- `shared/trip-field/core.css`: 共通UI
- `shared/trip-field/template.html`: 新規イベント用雛形
- `202609_HumanoidSummitEurope/index.html`: HRS v3の正式公開入口
- `202609_HumanoidSummitEurope/index_v1.html`: HRS旧版の退避ファイル
- `202609_HumanoidSummitEurope/build_v3.mjs`: HRS v3の編集元
- `202609_HumanoidSummitEurope/validate_v3.mjs`: HRS受入検証
- `cloudflare/trip-notes-worker/src/index.js`: Worker本体
- `202610_Europe_TechEx_EuroBLECH/index.html`: EUROBLECH v3の正式公開入口
- `202610_Europe_TechEx_EuroBLECH/index_v1.html`: EUROBLECH旧版の退避ファイル
- `202610_Europe_TechEx_EuroBLECH/build_v3.mjs`: EUROBLECH v3の編集元
- `202610_Europe_TechEx_EuroBLECH/CLAUDE_HANDOFF.md`: EUROBLECHの引き継ぎ本体

## 検証

次の検証は直近の実装コミットで合格済み。変更後はすべて再実行する。

```powershell
node .\cloudflare\trip-notes-worker\validate-worker.mjs
node .\shared\trip-field\validate-template.mjs
node .\202609_HumanoidSummitEurope\build_v3.mjs
node .\202609_HumanoidSummitEurope\validate_v3.mjs
git diff --check
```

## 直近の主要コミット

- `ad872b6` Document overseas trip layout decisions
- `d386361` Add PC download for final trip notes
- `8672d69` Add optional Cloudflare trip note sync
- `49e8677` Add reusable overseas trip field layout
