# WORK STATUS — overseas trip layout

更新日: 2026-08-15

## 文書の役割

- `CLAUDE.md` / `OVERSEAS_TRIP_LAYOUT_SUMMARY.md` / `shared/trip-field/README.md`
  … **全イベント共通のルール**
- この `WORK_STATUS.md` … **リポジトリ全体の今の状態**。どのイベントを触っているか、
  進行中、次、Git状態。イベント固有の詳細は各引き継ぎへ委ね、ここには繰り返さない
- 各イベントの `CLAUDE_HANDOFF.md` … **そのイベントの固有事情**。
  ファイル構成、編集ルール、判断と理由、検証、未確認事項

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

### 旅程をdivスタックにして、フライトを4列にした

HRS固有の実装。判断と理由は `202609_HumanoidSummitEurope/CLAUDE_HANDOFF.md` にある。

## 2026-08-15の作業

HRS固有の判断とその理由は `202609_HumanoidSummitEurope/CLAUDE_HANDOFF.md` に書いた。
ここには繰り返さない。以下はリポジトリ全体に効いた変更だけを残す。

### 文章の調子を共通文書へ明記した

EUROBLECHの `CLAUDE_HANDOFF.md` にしか無かった規則を、`CLAUDE.md`、
`OVERSEAS_TRIP_LAYOUT_SUMMARY.md`（4.5節）、`shared/trip-field/README.md` へ移した。
規則本文だけでなく**判断の軸**も書いた。字数は目安であって基準ではなく、
分けるのは事実か理屈かである。これが無いと30字で機械的に切られる。

### HRSに引き継ぎ文書を作った

`202609_HumanoidSummitEurope/CLAUDE_HANDOFF.md`。EUROBLECHには元からあったが
HRSには無く、判断がコミットメッセージにしか残っていなかった。

`.gitignore` の `**/*.md` により新規Markdownは追跡対象外になる。
残したい文書は `git add -f` でステージする。

## HRSからEUROBLECHへ戻す（HRS確定後）

**2026-08-15以降の進め方**: EUROBLECHを参考にしてHRSを作り込み、
必要なものをEUROBLECHへ戻す。参考にする対象がEUROBLECH、作り込む場所がHRS、
戻す先がEUROBLECHである。2026-08-14まではEUROBLECHで確定してHRSへ戻していた。
作り込む場所が入れ替わっただけで、目的は変わっていない。

着手前に必ずEUROBLECHの実マークアップを読む。要約や記憶で設計しない。
2026-08-15の作業で、読まずに設計して作り直した箇所が4件ある
（`route-four`、`family-where`、`timezone-cards`、`family-schedule`）。

**HRSが固まるまで戻す作業に着手しない。** 途中で当てると二度手間になる。

- 家族タブのセクション構成（HRSで確定した形へ）
- `📍 地図` の別リンク2件 → 場所名そのものへ。引き継ぎに「未着手」と書いてある項目
- 家族向けフライト情報の簡素化 — `予約クラス` 8件。家族には不要
- 時差カードの国旗絵文字17件 — Windowsで `JP` `DE` と表示される
- 緊急連絡先を `family-section` 様式へ — 現在はTailwind風の旧マークアップ（`border-l-4` 28件）
- 黒塗りアイコン `🗺` U+1F5FA — 既定表示が文字のコードポイント
- モバイルの日付列幅 — HRSで58pxでは2桁日付が折り返したため64pxへ広げた。同じ問題が出る
- **緊急時番号 `+49 30 21094-222` の出どころ** — 外務省の在外公館リストに無い。
  代表番号 `210940` は一致する。裏が取れなければ落とす

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

## 表示不具合2件（2026-08-15に発見・修正済み）

コミット `22451d8` の時点で入っていた。**検証は通るが画面が正常でなかった。**
経緯と直した形は `202609_HumanoidSummitEurope/CLAUDE_HANDOFF.md` の同名の節。

1. 家族印刷版の気候表が393pxで潰れていた（出典列168pxが気温を押し出す）
   → 表をやめ、都市ごとの行（`.climate-list`／`.climate-row`）にした
2. オンライン版の `.line-icon` が固定19pxで13〜16pxの文字より大きかった
   → `1.15em` にして文字サイズへ追従させた

**検証の反省**: 横あふれ0件・文字切れ0件だけを見ていた。
数値検査は通るのに読めない状態は捕まえられない。
幅と高さの比、文字サイズとの相対関係も測ること。実機の目視も省かない。
`validate_v3.mjs` に比率の検査を足した（`.line-icon` が `em` を持つこと、
気候が `<table>` でないこと）。

## 推奨する次の着手順

1. HRSが固まったら、上の「HRSからEUROBLECHへ戻す」を実施する
2. 共通ランタイムに予定の5段階状態を追加する
3. 共通ランタイムに任意の人別フォーカスを追加する

## 重要ファイル

- `OVERSEAS_TRIP_LAYOUT_SUMMARY.md`: 設計と実装状況の全体像
- `CLAUDE.md`: Claude Codeの作業ルール
- `shared/trip-field/README.md`: 共通レイアウト仕様
- `shared/trip-field/runtime.js`: 保存、DL、Cloudflare同期
- `shared/trip-field/core.css`: 共通UI
- `shared/trip-field/template.html`: 新規イベント用雛形
- `202609_HumanoidSummitEurope/CLAUDE_HANDOFF.md`: **HRSの引き継ぎ本体**
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
