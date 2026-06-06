eikenQuest — 英検対策 Web 問題集

概要
----
静的なシングルページの英検模擬テストアプリです。ブラウザで index.html を開くか、VS Code の Live Server 等で配信すれば動作します。

最新の更新状況（要点）
-------------------
- data/ 以下の問題データを大規模改修しました。
  - 模擬テスト内／模擬テスト間の表層的なテキスト重複を大幅に削減（字句レベルの厳密フィルタ適用）。
  - 選択肢（choices）のグローバル重複を解消し、アプリは data/ を唯一の問題ソースとして読み込みます（src/data は削除済み）。
- 自動編集・プレビュー用スクリプトを scripts/ に追加しました（paraphrase_*, diversify_*, enforce_global_* など）。
- 自動適用済みの変更は master ブランチへ commit & push 済み。

動作方法
--------
1. ルートの index.html をブラウザで開く、または Live Server で配信してください（例: http://127.0.0.1:5500/index.html）。
2. アプリは data/<grade>/test_<N>.json を参照して問題を読み込みます。

注意事項 / 次の推奨作業
--------------------
- 生成された選択肢は字句レベルでユニークにしていますが、文脈上の自然さや正答の妥当性は自動化だけでは完全ではありません。必ず代表問題の手動レビューを行ってください。
- 意味（セマンティクス）での類似除去が必要なら、埋め込み（embedding）ベースのチェックを導入することを推奨します（外部APIキーまたはローカルモデルが必要）。
- プレビューや差分ファイル:
  - scripts/preview_global_unique_fast/
  - scripts/preview_diverse_strict/
  - scripts/duplicate_report.txt

貢献 / 再現方法
----------------
- scripts/ 内のスクリプトでプレビューを生成し、内容確認後に data/ へ反映しています。再現手順はスクリプト冒頭のコメント参照。

リポジトリ
--------
https://github.com/wangchang2049/eikenQuest

Maintainer: wangchang2049
