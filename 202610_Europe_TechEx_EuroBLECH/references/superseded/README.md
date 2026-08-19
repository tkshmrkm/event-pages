# superseded — 旧案の退避先

更新日: 2026-08-14

ここにあるファイルは、いずれも**現行の旅程と矛盾する旧案**である。
実装や旅程確認の基準にしない。

**現行の正は `../../index.html`。** 旅程内容はここから読む。
`../../index.html` が `../../build.mjs` の生成物であり、フォルダの公開入口である。
`../../index.html` は以前の共有URLを `./` へ転送する互換ページで、生成物ではない。

`../rejected/` は「一度採用を検討して却下したレイアウト試作」の置き場で、
このフォルダとは役割が違う。

## 完全に古い旅程（内容の再利用不可）

| ファイル | 旧案の内容 | 現行 |
|---|---|---|
| `Trip_Itinerary_EuroBLECH_2026.md` | 10/18〜10/24・村上1名・イスタンブール経由・Celle/Hamburg泊 | 10/17〜10/25・3名・香港経由・Amsterdam/Göttingen/Frankfurt泊 |
| `europe_oct2026_itinerary.md` | 関西空港発・中華航空・Hampton AMS / Hampton Celle | 中部国際空港発・キャセイ・Holiday Inn Express Sloterdijk / FREIgeist Göttingen |
| `europe_oct2026_itinerary_v4.html` | `index.html` と同じ「v4」を名乗る旧スナップショット。106行が相違 | `index.html` |

## 日付は古いが、調査内容が未取り込みのもの

次の2件は**日付と移動計画が旧案のまま**である。日程としては読まないこと。
一方で、視察テーマとセッション選定の中身は `index.html` にも `index.html` にも
入っていないため、会場タブや準備タブを作り込む際の材料としては参照する価値がある。

| ファイル | 旧案の日付 | 現行の日付 | 未取り込みの内容 |
|---|---|---|---|
| `euroblech_3day_schedule.md` | Day 1〜3 を 10/21・10/22・10/23 とする | EuroBLECHは10/20（美馬・金築）、10/21（全員）、10/23（最終日）。10/22はブレーメン工場見学 | 視察のコアテーマ、ティーチレス溶接、レトロフィット |
| `techex_europe_2day_schedule.md` | Day 1 を 10/20、Day 2 の夜に Celle へ移動 | TechExは10/19（Day 1）・10/20（Day 2）。Celleは旅程から消滅 | セッション単位の選定、Agentic AIトラック |

`Gold Pass` のパス戦略は `index.html` に取り込み済みなので、ここから再度持ち込まない。

内容を現行へ取り込む場合は、`index.html` を直接編集せず、
`../../CLAUDE_HANDOFF.md` の編集ルールに従って `build.mjs` 側で反映する。
