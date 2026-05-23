from __future__ import annotations

import json
import random
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "questions.sqlite"

BLUEPRINT = [
    ("vocabulary", "語彙", 15),
    ("conversation", "会話", 5),
    ("ordering", "整序", 5),
    ("reading", "読解", 10),
    ("listening1", "聴解1", 10),
    ("listening2", "聴解2", 10),
    ("listening3", "聴解3", 10),
]


def load_test() -> list[dict]:
    questions: list[dict] = []
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        for section_key, display_section, count in BLUEPRINT:
            rows = conn.execute(
                """
                SELECT id, section, title, prompt, passage, audio_text,
                       choices_json, answer_index, explanation
                FROM questions
                WHERE section = ?
                ORDER BY RANDOM()
                LIMIT ?
                """,
                (section_key, count),
            ).fetchall()
            if len(rows) < count:
                raise RuntimeError(
                    f"{display_section} の問題数が不足しています。必要数: {count}, 登録数: {len(rows)}"
                )
            for row in rows:
                choices = [
                    {"text": choice, "original": index}
                    for index, choice in enumerate(json.loads(row["choices_json"]))
                ]
                random.shuffle(choices)
                answer = next(
                    index for index, choice in enumerate(choices)
                    if choice["original"] == row["answer_index"]
                )
                questions.append({
                    "id": row["id"],
                    "section": display_section,
                    "title": row["title"],
                    "prompt": row["prompt"],
                    "passage": row["passage"],
                    "audioText": row["audio_text"],
                    "choices": [choice["text"] for choice in choices],
                    "answer": answer,
                    "explanation": row["explanation"],
                })
    return questions


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/test":
            self.send_test()
            return
        super().do_GET()

    def send_test(self) -> None:
        try:
            if not DB_PATH.exists():
                raise RuntimeError("questions.sqlite がありません。import_questions.py を実行してください。")
            payload = {"questions": load_test()}
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
        except Exception as exc:
            body = json.dumps({"error": str(exc)}, ensure_ascii=False).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8001), Handler)
    print(f"Serving eiken_codex on http://127.0.0.1:8001/ with {DB_PATH.name}")
    server.serve_forever()
