from __future__ import annotations

import json
import random
import re
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

SET_MARK_RE = re.compile(r"\s*(?:\n)?\[Set \d+\]\s*$")


def normalize_prompt(prompt: str) -> str:
    return SET_MARK_RE.sub("", prompt).strip()


def ensure_result_schema(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            total_count INTEGER NOT NULL,
            score INTEGER NOT NULL,
            percent INTEGER NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS attempt_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attempt_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            section TEXT NOT NULL,
            title TEXT NOT NULL,
            prompt TEXT NOT NULL,
            passage TEXT NOT NULL DEFAULT '',
            audio_text TEXT NOT NULL DEFAULT '',
            choices_json TEXT NOT NULL,
            selected_index INTEGER,
            correct_index INTEGER NOT NULL,
            is_correct INTEGER NOT NULL,
            explanation TEXT NOT NULL,
            FOREIGN KEY (attempt_id) REFERENCES attempts(id)
        )
    """)


def shuffled_question(row: sqlite3.Row, display_section: str) -> dict:
    choices = [
        {"text": choice, "original": index}
        for index, choice in enumerate(json.loads(row["choices_json"]))
    ]
    random.shuffle(choices)
    answer = next(
        index for index, choice in enumerate(choices)
        if choice["original"] == row["answer_index"]
    )
    return {
        "id": row["id"],
        "section": display_section,
        "title": row["title"],
        "prompt": row["prompt"],
        "passage": row["passage"],
        "audioText": row["audio_text"],
        "choices": [choice["text"] for choice in choices],
        "answer": answer,
        "explanation": row["explanation"],
    }


def load_test() -> list[dict]:
    questions: list[dict] = []
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        ensure_result_schema(conn)

        for section_key, display_section, count in BLUEPRINT:
            rows = conn.execute(
                """
                SELECT id, section, title, prompt, passage, audio_text,
                       choices_json, answer_index, explanation
                FROM questions
                WHERE section = ?
                """,
                (section_key,),
            ).fetchall()

            groups: dict[str, list[sqlite3.Row]] = {}
            for row in rows:
                base_key = "|".join([
                    row["title"],
                    normalize_prompt(row["prompt"]),
                    row["passage"],
                    row["audio_text"],
                ])
                groups.setdefault(base_key, []).append(row)

            if len(groups) < count:
                raise RuntimeError(
                    f"{display_section} の重複しない問題数が不足しています。必要数: {count}, 登録数: {len(groups)}"
                )

            selected_keys = random.sample(list(groups.keys()), count)
            for key in selected_keys:
                questions.append(shuffled_question(random.choice(groups[key]), display_section))

    return questions


def save_result(payload: dict) -> dict:
    answers = payload.get("answers", [])
    with sqlite3.connect(DB_PATH) as conn:
        ensure_result_schema(conn)
        score = int(payload.get("score", 0))
        total = int(payload.get("totalCount", len(answers)))
        percent = int(payload.get("percent", 0))
        cursor = conn.execute(
            "INSERT INTO attempts (total_count, score, percent) VALUES (?, ?, ?)",
            (total, score, percent),
        )
        attempt_id = cursor.lastrowid

        rows = []
        for item in answers:
            rows.append({
                "attempt_id": attempt_id,
                "question_id": int(item["questionId"]),
                "section": item["section"],
                "title": item["title"],
                "prompt": item["prompt"],
                "passage": item.get("passage") or "",
                "audio_text": item.get("audioText") or "",
                "choices_json": json.dumps(item["choices"], ensure_ascii=False),
                "selected_index": item.get("selectedIndex"),
                "correct_index": int(item["correctIndex"]),
                "is_correct": 1 if item["isCorrect"] else 0,
                "explanation": item["explanation"],
            })

        conn.executemany(
            """
            INSERT INTO attempt_answers
                (attempt_id, question_id, section, title, prompt, passage, audio_text,
                 choices_json, selected_index, correct_index, is_correct, explanation)
            VALUES
                (:attempt_id, :question_id, :section, :title, :prompt, :passage, :audio_text,
                 :choices_json, :selected_index, :correct_index, :is_correct, :explanation)
            """,
            rows,
        )

    return {"attemptId": attempt_id}


def load_wrong_questions() -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        ensure_result_schema(conn)
        rows = conn.execute(
            """
            SELECT aa.*, a.created_at
            FROM attempt_answers aa
            JOIN attempts a ON a.id = aa.attempt_id
            WHERE aa.is_correct = 0
            ORDER BY a.created_at DESC, aa.id DESC
            """
        ).fetchall()

    seen: set[str] = set()
    questions = []
    for row in rows:
        key = "|".join([
            row["title"],
            normalize_prompt(row["prompt"]),
            row["passage"],
            row["audio_text"],
        ])
        if key in seen:
            continue
        seen.add(key)
        choices = json.loads(row["choices_json"])
        selected_index = row["selected_index"]
        questions.append({
            "attemptId": row["attempt_id"],
            "createdAt": row["created_at"],
            "questionId": row["question_id"],
            "section": row["section"],
            "title": row["title"],
            "prompt": row["prompt"],
            "passage": row["passage"],
            "audioText": row["audio_text"],
            "choices": choices,
            "selectedIndex": selected_index,
            "selectedAnswer": "未回答" if selected_index is None else choices[selected_index],
            "correctIndex": row["correct_index"],
            "correctAnswer": choices[row["correct_index"]],
            "explanation": row["explanation"],
        })
    return questions


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/test":
            self.send_json({"questions": load_test()})
            return
        if parsed.path == "/api/wrong-questions":
            self.send_json({"questions": load_wrong_questions()})
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/results":
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            self.send_json(save_result(payload))
            return
        self.send_error(404)

    def send_json(self, payload: dict, status: int = 200) -> None:
        try:
            if not DB_PATH.exists():
                raise RuntimeError("questions.sqlite がありません。import_questions.py を実行してください。")
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
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
