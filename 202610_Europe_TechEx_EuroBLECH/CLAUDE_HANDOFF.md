# Claude 引き継ぎ — TechEx Europe・EuroBLECH 2026 field guide v3

更新日: 2026-08-14

## 目的

`index_v3.html` を、HRS公開版と承認済み4列サンプルに沿った現地用ページとして完成させる。

このチェックポイントは、ユーザーとの対話で行った体裁・粒度・家族タブの修正を保存したもの。ただし、末尾の「未完了」を反映するまでは完成扱いにしない。

## 最初に全文確認するファイル

1. `NEXT_SESSION_HANDOFF.md` — 初期要件と禁止事項
2. `transport_actual_1017_1018_sample.html` — 4列交通表示の承認サンプル
3. `../202609_HumanoidSummitEurope/index.html` — HRS公開版の構造
4. `../202609_HumanoidSummitEurope/v3.css`
5. `../202609_HumanoidSummitEurope/v3.js`
6. `index.html` — 旅程内容の元データ。直接編集しない
7. `index_v2.html` — 家族タブの内容・情報構造の基準
8. `build_v3.mjs`、`v3.css`、`v3.js`、`validate_v3.mjs` — 現在のv3実装

`references/rejected/transport_layout_sample.html` は無効な旧試作。参考用に隔離しているが、基準にしない。

## 編集ルール

- 原則として `build_v3.mjs` を修正し、`node build_v3.mjs` で `index_v3.html` を再生成する。
- `index.html`、`index_v2.html`、各サンプルを直接上書きしない。
- 交通はスマートフォンでも必ず4列のままにする。
- 日付ナビ、タブ、フォントはHRS方式を維持する。
- フォントは `BIZ UDPGothic`, `Yu Gothic UI`, `Meiryo`, `system-ui`, `sans-serif`。
- 飛行機はカラー絵文字ではなく共通の `.flight-mark` を使う。
- 日単位の説明は「本日のトピックス」、動作は人物レーン、宿泊はレーン末尾に置く。
- 家族タブはv2の情報構造を維持し、会社経費や航空券見積もりを載せない。
- 不明事項は推測で断定せず、確定済みの事実と要検討事項を分ける。

## 用語の決定

- EuroBLECH: **展示会視察**。`工場見学`とは書かない。
- TechEx Europe: **参加**。
- Mercedes-Benz Werk Bremen: **工場見学**。見学枠 `10/22 12:45〜14:00` は予約確定。
- Bremen Hbfから工場までの交通手段と、復路案は未確定。
- Autostadt: **見学**。
- 荷物: `荷物受取`、`ホテルに荷物を預ける` に統一する。
- 宿泊欄: `機内泊`ではなく `機内`。家族タブの文章内はv2踏襲なら `機内泊`でもよい。

## 現在までに反映済み

- HRS型の5タブ、日付ナビ、BIZ UDPGothic、4列交通表示。
- 人物別レーン、日トピックス、宿泊の配置。
- 10/18村上のホテルチェックイン。
- TechEx Day 1/Day 2の時間、10/20村上の20:30頃ホテル着。
- 10/20・10/21のEuroBLECH後の戻り目安。
- 10/23のフランクフルト中央駅17:14着、17:30頃チェックイン、18:30頃夕食。
- 10/24の手続き配置、10/25香港着・セントレア到着後の入国/税関・Visit Japan Web。
- 家族タブの冗長な日時を整理し、フライト、地上移動、到着/乗り継ぎ、手続き、要検討を区別。
- 表記監査で指摘されたゼロ埋め、`Day 1`/`Day 2`、`VIP Networking Drinks`、`荷物受取`、`機内`、日本語区切りの多くを生成時に統一。

## 未完了 — 次に対応する項目

### 1. 10/17 香港ラウンジを公式情報で確定して書き直す

現行は「営業時間未確認」と書いており古い。航空会社ラウンジ、Priority Pass、一般有料施設を混ぜない。

確認済みの公式情報:

- oneworld Sapphireは、対象便利用時にキャセイのビジネスクラスラウンジへ本人＋同伴1名で入室可。ファーストクラスラウンジは対象外。
  - <https://www.cathaypacific.com/cx/en_GB/destinations/lounges/all-lounges-admittance.html>
- The Deck: Gate 6付近、毎日05:30〜00:30、シャワー8室。
  - <https://www.cathaypacific.com/cx/en_CA/destinations/lounges/hong-kong-hkg/the-deck.html>
- The Pier, Business: Gate 65付近、毎日05:30〜00:30。
  - <https://www.cathaypacific.com/cx/en_CA/destinations/lounges/hong-kong-hkg/the-pier.accessibility.html>
- The Bridge: Gate 35付近、05:00から最終キャセイ便まで（00:30〜03:20の範囲）、シャワーあり。
  - <https://www.cathaypacific.com/cx/en_SG/destinations/lounges/hong-kong-hkg/the-bridge.html>
- The Wing, Businessは改装休業中で、2027年再開予定。
  - <https://www.cathaypacific.com/cx/en_IN/destinations/lounges/hong-kong-hkg/the-wing.html>
- 香港空港の無料シャワー: Gate 12/Gate 43付近、L5、24時間。
  - <https://www.hongkongairport.com/en/passenger-guide/airport-facilities-services/shower-facilities>
- Plaza Premium一般有料: Gate 1とGate 60は24時間、Gate 35は06:00〜01:00。料金と空席は利用時に再確認。
  - <https://www.plazapremiumlounge.com/en-uk/find/china-regions/hong-kong/hong-kong>

Priority Passで現在利用できる香港空港ラウンジ名・営業時間は、Priority Pass公式ページ/アプリでまだ確認できていない。Plaza PremiumをPP対象と断定しないこと。

### 2. 10/18村上の到着を主旅程にも明記

10/17のフライト4列には `06:55 +1 AMS着` があるが、10/18村上レーンの先頭は現在 `入国審査・荷物受取`だけ。

`06:55 Amsterdam Airport Schiphol（AMS）着` と `入国審査・荷物受取` が同日欄で分かるようにする。家族タブにはすでに到着表示がある。

### 3. CX539のチェックイン表現

中部国際空港の公式航空会社案内では、CX539/CX531のカウンターは出発3時間前に開始、T1 Iカウンター。

- <https://www.centrair.jp/en/flight/airline/cathaypacific.html>

CX539で自動手荷物預けが使えるかは未確認。公式の対象航空会社を確認できるまでは、`有人カウンターで預ける前提` とし、自動手荷物預け対応を断定しない。

10/17村上と10/18美馬・金築の両方を同じ表現にそろえる。

### 4. 10/22の色と確定/未確定の区別

工場見学自体は予約確定。未確定なのは次の2点だけ。

- Bremen Hbf → Mercedes-Benz Werk Bremenの交通手段
- 早帰り案/18:00頃まで滞在案の選択と復路列車

現在の10/22日ヘッダーは `data-kind="visit"` のラベンダー。HRS契約上は「工場・企業訪問」の色だが、ユーザーには「未定色」に見える。未定帯に見えない色へ変更するか、凡例を `工場見学（予約確定）` と明示し、オレンジの `要検討` 行だけを未定として見せる。ユーザー意図を優先する。

### 5. EuroBLECHの文言

主旅程・会場タブ・家族タブを横断し、説明語として `参加` や工場アイコンが残っている箇所を `展示会視察` に統一する。イベント固有名のラベル `EuroBLECH` はそのままでよい。

### 6. アイコン最終監査

- Font Awesomeは読み込まない。
- 空表示の `fa-*` が残っていないか確認する。
- 航空券/フライトは共通 `.flight-mark`。
- 黒い塗りつぶし絵文字ではなく、既存の線画 `.line-icon` を使う。

## 検証

変更後は次を実行する。

```powershell
node .\202610_Europe_TechEx_EuroBLECH\build_v3.mjs
node .\202610_Europe_TechEx_EuroBLECH\validate_v3.mjs
git diff --check
```

`scripts/validate_event_page.mjs` はこのチェックアウトには存在しない。追加されている環境では併用する。

その後、localhostで `index_v3.html` を開き、390pxと約1200pxで次を実機確認する。

- 横はみ出しが0件
- 4列交通が崩れない
- 長い駅名/ホテル名/時刻が欠けない
- フライトアイコンが黒いカラー絵文字にならない
- 5タブと日付チップが動く
- 10/22の確定/未定の色が誤解を生まない
- 家族タブの時刻とタグが読みやすい

最終的に、再生成した `index_v3.html` とブラウザ確認したファイルが同一であることを確認する。

## Gitの注意

- この引き継ぎ作成時点のブランチは `main`。
- `references/rejected/transport_layout_sample.html` は無効な旧試作として隔離。対象フォルダ直下へ戻さない。
- `index.html` は変更しない。
- ワークツリーに別作業の変更があれば巻き込まない。
