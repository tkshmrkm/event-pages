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

## 編集上の重要事項

- HRS v3の生成物を直接編集しない。
  `202609_HumanoidSummitEurope/build_v3.mjs` を変更して再生成する。
- HRS v3の生成物は `index_v3.html`、`index_v3_offline.html`、
  `family_print.html`、`v3.css`。
- 元資料である `index.html` と `index_v2.html` は、移行元として保存する。
- 共通機能は `shared/trip-field` に置き、HRS固有の外観はHRS側に残す。
- 机上用印刷版は静的で、メモ欄、クラウド同期、実行スクリプトを含めない。
- 飛行機アイコンは色付き絵文字ではなく、モノクロ文字の `✈︎` を使う。
- 担当者ボタンは追加しない。講演メモは `事前の狙い・質問` と
  `当日メモ` の2欄を基本とする。
- iPhone 16相当の393px幅とPixel 7a/8a相当の412px幅で横あふれを確認する。
- PCではクラウドから記録を読み込み、MarkdownとJSONをダウンロードできる
  状態を維持する。

## Cloudflare同期

Cloudflareコードは `cloudflare/trip-notes-worker` にある。

- 同期キーをHTML、JavaScript、設定ファイル、コミットへ書かない。
- Worker Secretの `SYNC_TOKEN` として登録する。
- `wrangler.jsonc` のKV IDは現在プレースホルダーである。
- HRSの `cloudEndpoint` は現在空文字で、同期UIは安全に無効化されている。
- 実デプロイは外部状態を変更するため、ユーザーの確認を得てから行う。
- 現方式は1出張1スナップショットのlast-write-winsであり、複数人の同時編集用
  ではない。

## 次の主要設計

優先順位は `WORK_STATUS.md` を参照する。大きな方向は次の2点。

1. 予定の状態を `未検討 / 候補あり / 仮決め / 確定 / 当日判断` として
   共通部品化する。
2. EUROBLECHでは旅程に `全員 / 村上 / 美馬・金築` の人別フォーカスを
   追加する。これは主要タブや担当割当ではなく、旅程表示の補助フィルター。

選択した人以外の別行動を完全に削除せず折りたたみ、合流後の共通予定は
常に表示する。机上用印刷版は全員分を表示する。

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
