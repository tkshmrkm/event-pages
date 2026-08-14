# WORK STATUS — overseas trip layout

更新日: 2026-08-15

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

**表からdivスタックへ変えた。** EUROBLECHは `.lane` 直下に `.action`（2列）と
`.route-four`（4列）を並べる構造で、両者の第1列が同じ幅だから、
2列の行と4列の行で時刻が縦にそろう。`<table>` の `colspan` ではこの整列が作れない。
最初は表のまま `<td colspan="2">` に4列グリッドを入れたが、
セルの中で浮いたカードになり、他の行と列が合わなかった。

- 旅程タブの18表・106行を `.tl-stack` ＋ `.action` へ変換。
  106行すべてが `<td class="t">X</td><td>Y</td>` の同形で、colspanの例外は無い。
  ビルドは表数・行数・変換漏れを検査し、合わなければ止まる。
- 変換対象は旅程タブだけ。準備タブの8行と飲食店一覧（`.tb`）は本来の表なので残す。
- 記録タブと家族表のJavaScriptは別の表を見ているので影響なし。
- フライト4区間（NGO→HEL、HEL→FRA、FRA→HEL、HEL→NGO）を `.route-four` に。
  補足（機内泊など）は4列に押し込まず、時刻なしの `.action` として下に出す。
- 到着行（`HEL 着` など）は乗継や入国手続きを持つ別の出来事なのでまとめていない。

**時刻列は112px。** 表のときは列が内容に合わせて自動で広がったが、gridは広がらない。
`13:00〜14:00` が112px要るので、そこに合わせたうえで折り返しも許している。

空港名と時間帯は入れた。名称はいずれも元データにあり、地図クエリも既存のものを使った。
時間帯はページ自身の数字で確定する。NGO 22:50発＋13時間5分でHEL 5:55着なら
到着地は6時間遅く、日本がUTC+9なのでHELはUTC+3。同じ計算を4区間で行うと
HEL=UTC+3・FRA=UTC+2 が2回ずつ一致する。9月はEUの夏時間なのでEEST/CEST。

## 2026-08-15の作業

### 「＋詳細」トグルを廃止した

EUROBLECHに無く、補足を既定で隠すのは現地で見落としの元になるため撤去した。
ボタンだけ消すと `.note` と `.dt` が永久に隠れるので、CSSで常時表示にした。
保存値は読み込み時に `store.del('detail')` で落とす。書き出しが除くのは
`ui:` 付きのキーだけなので、残すとバックアップJSONに毎回入り、
読み込んだ端末へも複製されるため。古いJSONから復活しうるので、この処理は常設。

### 家族印刷版を作り直した

家族が最初に知りたいのは「どの日にどこにいて、いつ連絡が取れないか」。
以前は時差の説明と8行の表が同じ重さで並び、それが読み取れなかった。

- セクションを `出張サマリー / 時差・気候 / 日程詳細（家族向け） / 宿泊先情報 / 緊急連絡先` にした。
- `section.family-schedule` をEUROBLECHと同じ構造で追加した
  （`schedule-legend` の7種タグ、`article.family-day-row`、`agenda-line`）。
- 機内（連絡が取れない時間帯）を日本時間で出す。EUROBLECHは現地時刻のみだが、
  HRSは日本時間への換算も残す方針。`.timezone-lead` で読み方を宣言する。
- 気候を入れた。9月同士の比較を主にし、季節感の換算を従にする。
  出典と統計期間が都市ごとに異なることをページに明記する。
- 緊急連絡先を独立させ、公館名そのものに地図リンクを張った。

### 文章の調子を共通文書へ明記した

EUROBLECHの `CLAUDE_HANDOFF.md` にしか無かった規則を、`CLAUDE.md`、
`OVERSEAS_TRIP_LAYOUT_SUMMARY.md`（4.5節）、`shared/trip-field/README.md` へ移した。
規則本文だけでなく**判断の軸**も書いた。字数は目安であって基準ではなく、
分けるのは事実か理屈かである。これが無いと30字で機械的に切られる。

### HRSへ未適用の項目

1. **フライト以外の4列化** — 鉄道37件と徒歩の行は `.action`（2列）のまま。
   これらは出発地・到着地・所要が1つの文に入っており、分解は内容の書き換えになる。
   フライトが先に進んだのは「`X発 → Y（便名・機材・所要）`」という
   一定の形だったため。鉄道行にはこの規則性が無い。
   構造の受け皿は用意できたので、あとは1件ずつ `.route-four` にできる。
   **やるかどうか自体が未決。**
2. **家族向け共通CSSの共有** — 時差カードと日程詳細のCSSはHRSの
   `familyCss` にある。EUROBLECHの家族タブと構造が違う（あちらはタブ、
   HRSは印刷専用ページ）ため共通化していない。両者を寄せるなら次の課題。

### 確認できていない事実

断定を避けて書いていない。埋めるときは一次情報を読んでから。

- **在外公館の管轄区域** — 外務省の在外公館リストに記載が無い。
  シュトゥットガルトとフランクフルトをどの公館が管轄するかは未確認。
  ページには大使館と在フランクフルト総領事館を併記し、管轄は書いていない。
- **シュトゥットガルトの気候の出典が弱い** — 2015–2020の6年値。
  名古屋・京都・フランクフルトは30年平年値なので、期間を揃えた比較ではない。
- **EUROBLECHの `21094-222`（緊急時番号）** — 外務省リストに無く、出どころ不明。
  HRSへは転記していない。EUROBLECH側の扱いは後日。

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
