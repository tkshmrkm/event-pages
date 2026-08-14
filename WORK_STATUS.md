# WORK STATUS — overseas trip layout

更新日: 2026-08-13

## 現在の目的

HRS Europe 2026で作ったスマートフォン向け出張ページを、イベント固有の
配色と構成を保ったまま、EUROBLECHなど今後の海外出張へ再利用できる基盤にする。

今後作る展示会、講演会、カンファレンス、工場見学、企業訪問のメモは、
原則としてこの形式を使う。

このページは仮案から作り始め、候補比較、仮決め、確定、当日参照、現地メモ、
PC保存までを一続きで支える。

## 現在のGit状態

- branch: `main`
- この引き継ぎ文書作成前のHEAD: `ad872b6`
- `origin/main` より6コミット先の状態から引き継ぎ文書を追加
- 未push
- 文書作成開始時のworktreeはクリーン

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

1. 共通ランタイムに予定の5段階状態を追加する
2. 共通ランタイムに任意の人別フォーカスを追加する
3. EUROBLECHの既存内容を新基盤へ移す
4. 393px、412px、PC、机上印刷を検証する

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
