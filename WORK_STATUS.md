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

- branch: `main`
- 2026-08-14時点のHEAD: `ded4737`
- `origin/main` へpush済み（`main` と `origin/main` は同位置）
- worktreeはクリーン

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

## EUROBLECHで確定した標準（2026-08-14）

仕様はEUROBLECHフォルダで詰めた。**規約の本体は
`202610_Europe_TechEx_EuroBLECH/CLAUDE_HANDOFF.md`。** 作業前に必ず読む。

確定したのは次の8点。

1. 交通は4列（出発 / 手段アイコン / 所要 / 到着）で、スマートフォンでも崩さない
2. 地図リンクは場所名そのものに張る。「地図」「MAP」という別リンクを出さない
3. 交通手段は全部アイコン。決まっていない手段を決まっているように描かない
4. 帯の色と線種が確定度を表す（オレンジ＝手段や便が未定 / 点線＝時刻が目安）
5. 空港の待ち・乗り継ぎの折り畳みは `やること` と `過ごし方` の2つだけ。
   ラウンジは過ごし方の一案で、専用の見出しを作らない
6. ラウンジの利用資格は準備タブに集約し、旅程には名前と営業時間だけ残す
7. 「◯◯着」と「◯◯で乗り継ぎ」を1行にまとめない
8. 常時表示行は30字程度の事実まで。末尾に句点を付けない

ファイル構成もHRS方式にそろえた。`index.html` が生成物、`index_v1.html` が入力元、
`index_v3.html` が転送ページ。

## 未完了

### 0. HRSへの反映（次にやる）

EUROBLECHで固めた上記の標準を、HRS公開版へ戻す。**まだ1つも入っていない。**

2026-08-14に `202609_HumanoidSummitEurope/index.html` を実測した結果。

| 項目 | HRSの現状 |
| --- | --- |
| 4列交通（`route-four`） | 0件 |
| 場所名の地図リンク（`class="place"`） | 0件 |
| 交通手段アイコン（`mode-icon`） | 0件 |
| フライトマーク（`flight-mark`） | 0件 |
| 日付カードの一括開閉（`day-toolbar`） | 0件 |
| 表の横スクロール（`table-scroll`） | 0件 |
| ラウンジの4系統（`opt-sub`） | 0件 |
| 「地図」という別リンク | 31件（規約違反） |
| 乗り継ぎブロック | 0件 |

**HRSとEUROBLECHはタブ構成が違う。** HRSは `旅程 / 会場 / 記録` の3タブ、
EUROBLECHは `旅程 / 準備 / 会場 / 記録 / 家族` の5タブ。丸ごと寄せる作業ではない。
ラウンジ資格の置き場所（EUROBLECHでは準備タブ）はHRSに該当タブが無いので、
どこへ置くかを先に決める必要がある。

着手順の目安。

1. 「地図」31件を場所名リンクへ置き換える（規約違反の解消。影響が局所で確実）
2. 交通手段のアイコン化と4列交通の導入
3. 日付カードの一括開閉
4. 空港の待ち・乗り継ぎを `やること` / `過ごし方` の2本立てへ
5. ラウンジ資格の置き場所を決めてから集約

HRSの生成物は直接編集しない。`202609_HumanoidSummitEurope/build_v3.mjs` を変更して
再生成する。生成物は `index.html`、`index_v3_offline.html`、`family_print.html`、`v3.css`。

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

### 3. EUROBLECHの積み残し

`202610_Europe_TechEx_EuroBLECH/CLAUDE_HANDOFF.md` の「次にやること」を参照。

- 10/22 復路の二択（早帰り案／市内滞在案）はユーザーの判断待ち
- 10/22・会場タブ・家族タブに `📍` 形式の旧リンクが残っている

## 推奨する次の着手順

1. HRSへEUROBLECHの標準を戻す（上記「未完了 0」）
2. 共通ランタイムに予定の5段階状態を追加する
3. 共通ランタイムに任意の人別フォーカスを追加する
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
