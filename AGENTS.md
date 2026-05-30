# AGENTS.md

このファイルは、このリポジトリで作業する AI コーディングエージェント向けの指示です。

## 基本方針

- 回答・進捗報告は日本語で行う。
- 変更は依頼範囲に限定し、無関係な修正やリファクタリングは行わない。
- 既存の構成・命名・スタイルに合わせて、最小限で実装する。
- ユーザーの未コミット変更を上書きしない。
- `questions.sqlite` はデータベースファイルのため、明示的な依頼なしに再生成・削除・リセットしない。

## プロジェクト概要

- 英検対策 Web 問題集アプリ。
- Python 標準ライブラリの HTTP サーバーで静的ファイルと API を提供する。
- フロントエンドは `index.html`, `styles.css`, `app.js`。
- サーバーと API は `server.py`。
- 問題データの取り込みは `import_questions.py`。
- 初期データは `seed_questions.csv`。

## 実行・確認

- サーバー起動: `python server.py`
- アクセス先: `http://127.0.0.1:8001/`
- CSV から DB を生成する場合: `python import_questions.py`
- Python の構文確認: `python -m py_compile server.py import_questions.py`
- JavaScript の構文確認が必要な場合: `node --check app.js`

## 編集時の注意

- Python は標準ライブラリ中心の構成を維持する。
- 新しい外部依存は、明示的な必要性がある場合のみ提案する。
- API レスポンス形式を変更する場合は、`app.js` 側の利用箇所も確認する。
- 問題数やセクション構成を変更する場合は、`server.py` の `BLUEPRINT` と `app.js` の `EXAM_BLUEPRINT` の整合性を保つ。
- 文字コードは UTF-8 を前提にする。

