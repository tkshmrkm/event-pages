# event-pages

## フォルダ案内

| 場所 | 役割 |
|---|---|
| `YYYYMM_イベント名/` | イベント・旅行ごとの公開ページ、入力元、生成処理、設計・引き継ぎ |
| `shared/trip-field/` | 海外出張ページの共通UI・保存処理・テンプレート |
| `cloudflare/trip-notes-worker/` | 共同メモ同期用Worker |
| [docs/](docs/README.md) | イベント横断の設計資料 |
| [travel_top_samples/](travel_top_samples/README.md) | トップページのデザイン試作 |
| [Archive/](Archive/README.md) | イベント別の旧版・過去の検討資料 |

公開入口は [index.html](index.html) です。共有URLを維持するため、日付付きフォルダと公開HTMLの場所は変えません。

イベント固有の参考資料は、そのイベント内の `references/design-samples/`（比較）、`references/rejected/`（却下）、`references/superseded/`（旧案）に分けます。資料の役割が異なるため、単一の保管先へ混ぜません。

## Physical AI俯瞰資料

| ファイル | 役割 |
|---|---|
| [physical_ai_events_overview.html](physical_ai_events_overview.html) | 現行の俯瞰表示 |
| [physical_ai_events.js](physical_ai_events.js) | 現行表示の正本データ |
| [validate_physical_ai_events.mjs](validate_physical_ai_events.mjs) | データ・表示の検査 |
| [physical_ai_2027_candidate_events.html](physical_ai_2027_candidate_events.html) | 2027年候補の検討資料 |
| [physical_ai_2027_candidate_events_v2.html](physical_ai_2027_candidate_events_v2.html) | 上記の別版の検討資料 |

候補の2版は内容・構成が異なるため、両方を保持します。現在の予定は現行の俯瞰資料から確認し、検討資料の古い日程をそのまま採用しません。

## Shared overseas-trip layout

New overseas business-trip pages should start from
[`shared/trip-field/template.html`](shared/trip-field/template.html). The shared
layout keeps the field interaction consistent—`旅程 / 視察 / 記録`, local
autosave, JSON transfer, responsive operation, and a self-contained desk-print
backup—while each event retains its own palette and content structure.

See [`shared/trip-field/README.md`](shared/trip-field/README.md) for the layout
contract and generation workflow.

The current decisions, implemented scope, and next work are summarized in
[`docs/trip-field/OVERSEAS_TRIP_LAYOUT_SUMMARY.md`](docs/trip-field/OVERSEAS_TRIP_LAYOUT_SUMMARY.md).

Claude Code should begin with [`CLAUDE.md`](CLAUDE.md) and the current handoff
in [`WORK_STATUS.md`](WORK_STATUS.md).
