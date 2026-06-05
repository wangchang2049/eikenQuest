from __future__ import annotations

import json
import random
import re
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "questions.sqlite"
TEST_NUMBERS = tuple(range(1, 11))

GRADES = {
    "grade4": {"label": "4級", "english": "EIKEN GRADE 4", "minutes": 65},
    "grade3": {"label": "3級", "english": "EIKEN GRADE 3", "minutes": 90},
    "pre2": {"label": "準2級", "english": "EIKEN GRADE PRE-2", "minutes": 105},
    "pre2plus": {"label": "準2級プラス", "english": "EIKEN GRADE PRE-2 PLUS", "minutes": 110},
    "grade2": {"label": "2級", "english": "EIKEN GRADE 2", "minutes": 110},
    "pre1": {"label": "準1級", "english": "EIKEN GRADE PRE-1", "minutes": 120},
    "grade1": {"label": "1級", "english": "EIKEN GRADE 1", "minutes": 135},
}

BLUEPRINTS = {
    "grade4": [
        ("vocabulary", "短文の語句空所補充", "リーディング", 15, "purple"),
        ("conversation", "会話文の文空所補充", "リーディング", 5, "cyan"),
        ("ordering", "日本文付き短文の語句整序", "リーディング", 5, "amber"),
        ("reading", "長文の内容一致選択", "リーディング", 10, "green"),
        ("listening1", "会話の応答文選択", "リスニング", 10, "pink"),
        ("listening2", "会話の内容一致選択", "リスニング", 10, "pink"),
        ("listening3", "文の内容一致選択", "リスニング", 10, "pink"),
    ],
    "grade3": [
        ("vocabulary", "短文の語句空所補充", "リーディング", 15, "purple"),
        ("conversation", "会話文の空所補充", "リーディング", 5, "cyan"),
        ("reading", "長文の内容一致選択", "リーディング", 10, "green"),
        ("writing_email", "Eメール", "ライティング", 1, "amber"),
        ("writing_essay", "英作文", "ライティング", 1, "amber"),
        ("listening1", "会話の応答文選択", "リスニング", 10, "pink"),
        ("listening2", "会話の内容一致選択", "リスニング", 10, "pink"),
        ("listening3", "文の内容一致選択", "リスニング", 10, "pink"),
    ],
    "pre2": [
        ("vocabulary", "短文の語句空所補充", "リーディング", 15, "purple"),
        ("conversation", "会話文の空所補充", "リーディング", 5, "cyan"),
        ("reading_cloze", "長文の語句空所補充", "リーディング", 2, "green"),
        ("reading", "長文の内容一致選択", "リーディング", 7, "green"),
        ("writing_email", "Eメール", "ライティング", 1, "amber"),
        ("writing_essay", "英作文", "ライティング", 1, "amber"),
        ("listening1", "会話の応答文選択", "リスニング", 10, "pink"),
        ("listening2", "会話の内容一致選択", "リスニング", 10, "pink"),
        ("listening3", "文の内容一致選択", "リスニング", 10, "pink"),
    ],
    "pre2plus": [
        ("vocabulary", "短文の語句空所補充", "リーディング", 17, "purple"),
        ("reading_cloze", "長文の語句空所補充", "リーディング", 6, "green"),
        ("reading", "長文の内容一致選択", "リーディング", 8, "green"),
        ("writing_summary", "英文要約", "ライティング", 1, "amber"),
        ("writing_essay", "英作文", "ライティング", 1, "amber"),
        ("listening1", "会話の内容一致選択", "リスニング", 15, "pink"),
        ("listening2", "文の内容一致選択", "リスニング", 15, "pink"),
    ],
    "grade2": [
        ("vocabulary", "短文の語句空所補充", "リーディング", 17, "purple"),
        ("reading_cloze", "長文の語句空所補充", "リーディング", 6, "green"),
        ("reading", "長文の内容一致選択", "リーディング", 8, "green"),
        ("writing_summary", "英文要約", "ライティング", 1, "amber"),
        ("writing_essay", "英作文", "ライティング", 1, "amber"),
        ("listening1", "会話の内容一致選択", "リスニング", 15, "pink"),
        ("listening2", "文の内容一致選択", "リスニング", 15, "pink"),
    ],
    "pre1": [
        ("vocabulary", "短文の語句空所補充", "リーディング", 18, "purple"),
        ("reading_cloze", "長文の語句空所補充", "リーディング", 6, "green"),
        ("reading", "長文の内容一致選択", "リーディング", 7, "green"),
        ("writing_summary", "英文要約", "ライティング", 1, "amber"),
        ("writing_essay", "英作文", "ライティング", 1, "amber"),
        ("listening1", "会話の内容一致選択", "リスニング", 12, "pink"),
        ("listening2", "文の内容一致選択", "リスニング", 12, "pink"),
        ("listening3", "Real-Life形式の内容一致選択", "リスニング", 5, "pink"),
    ],
    "grade1": [
        ("vocabulary", "短文の語句空所補充", "リーディング", 22, "purple"),
        ("reading_cloze", "長文の語句空所補充", "リーディング", 6, "green"),
        ("reading", "長文の内容一致選択", "リーディング", 7, "green"),
        ("writing_summary", "英文要約", "ライティング", 1, "amber"),
        ("writing_essay", "英作文", "ライティング", 1, "amber"),
        ("listening1", "会話の内容一致選択", "リスニング", 10, "pink"),
        ("listening2", "文の内容一致選択", "リスニング", 10, "pink"),
        ("listening3", "Real-Life形式の内容一致選択", "リスニング", 5, "pink"),
        ("listening4", "インタビューの内容一致選択", "リスニング", 2, "pink"),
    ],
}

SET_MARK_RE = re.compile(r"\s*(?:\n)?\[Mock \d+-\d+\]\s*$")


def normalize_prompt(prompt: str) -> str:
    return SET_MARK_RE.sub("", prompt).strip()


def blueprint_for(grade: str) -> list[dict]:
    return [
        {"key": key, "label": label, "skill": skill, "count": count, "pill": pill}
        for key, label, skill, count, pill in BLUEPRINTS[grade]
    ]


def grade_summary(grade: str) -> dict:
    info = GRADES[grade]
    blueprint = blueprint_for(grade)
    return {
        "key": grade,
        "label": info["label"],
        "english": info["english"],
        "minutes": info["minutes"],
        "totalCount": sum(part["count"] for part in blueprint),
        "blueprint": blueprint,
    }


def ensure_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    columns = {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}
    if column not in columns:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def ensure_question_schema(conn: sqlite3.Connection) -> None:
    ensure_column(conn, "questions", "grade", "TEXT NOT NULL DEFAULT 'grade4'")
    ensure_column(conn, "questions", "test_number", "INTEGER NOT NULL DEFAULT 1")
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_questions_grade_test_section "
        "ON questions(grade, test_number, section)"
    )


def ensure_result_schema(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            grade TEXT NOT NULL DEFAULT 'grade4',
            test_number INTEGER NOT NULL DEFAULT 1,
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
            grade TEXT NOT NULL DEFAULT 'grade4',
            test_number INTEGER NOT NULL DEFAULT 1,
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
    ensure_column(conn, "attempts", "grade", "TEXT NOT NULL DEFAULT 'grade4'")
    ensure_column(conn, "attempts", "test_number", "INTEGER NOT NULL DEFAULT 1")
    ensure_column(conn, "attempt_answers", "grade", "TEXT NOT NULL DEFAULT 'grade4'")
    ensure_column(conn, "attempt_answers", "test_number", "INTEGER NOT NULL DEFAULT 1")


def parse_grade(query: str) -> str:
    grade = parse_qs(query).get("grade", ["grade4"])[0]
    if grade not in GRADES:
        raise RuntimeError(f"対応していない級です: {grade}")
    return grade


def parse_test_number(query: str) -> int:
    value = parse_qs(query).get("test", ["1"])[0]
    try:
        test_number = int(value)
    except ValueError as exc:
        raise RuntimeError(f"模擬テスト番号が不正です: {value}") from exc
    if test_number not in TEST_NUMBERS:
        raise RuntimeError(f"模擬テスト番号は1〜10で指定してください: {value}")
    return test_number


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
        "sectionKey": row["section"],
        "title": row["title"],
        "prompt": row["prompt"],
        "passage": row["passage"],
        "audioText": row["audio_text"],
        "choices": [choice["text"] for choice in choices],
        "answer": answer,
        "explanation": row["explanation"],
    }


def load_test(grade: str, test_number: int) -> list[dict]:
    questions: list[dict] = []
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        ensure_result_schema(conn)
        ensure_question_schema(conn)

        for part in blueprint_for(grade):
            rows = conn.execute(
                """
                SELECT id, section, title, prompt, passage, audio_text,
                       choices_json, answer_index, explanation
                FROM questions
                WHERE grade = ? AND test_number = ? AND section = ?
                ORDER BY id
                """,
                (grade, test_number, part["key"]),
            ).fetchall()

            groups: dict[str, sqlite3.Row] = {}
            for row in rows:
                base_key = "|".join([
                    row["title"],
                    normalize_prompt(row["prompt"]),
                    row["passage"],
                    row["audio_text"],
                ])
                groups.setdefault(base_key, row)

            if len(groups) < part["count"]:
                raise RuntimeError(
                    f"{GRADES[grade]['label']} 模擬テスト{test_number}の"
                    f"{part['label']}が不足しています。必要数: {part['count']}, 登録数: {len(groups)}"
                )

            selected = list(groups.values())[:part["count"]]
            questions.extend(shuffled_question(row, part["label"]) for row in selected)

    return questions


def load_exam_list(grade: str) -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        ensure_result_schema(conn)
        rows = conn.execute(
            """
            SELECT a.*
            FROM attempts a
            JOIN (
                SELECT test_number, MAX(id) AS latest_id
                FROM attempts
                WHERE grade = ?
                GROUP BY test_number
            ) latest ON latest.latest_id = a.id
            ORDER BY a.test_number
            """,
            (grade,),
        ).fetchall()
        section_rows = conn.execute(
            """
            SELECT a.test_number, aa.section,
                   COUNT(*) AS total,
                   SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END) AS correct
            FROM attempts a
            JOIN (
                SELECT test_number, MAX(id) AS latest_id
                FROM attempts
                WHERE grade = ?
                GROUP BY test_number
            ) latest ON latest.latest_id = a.id
            JOIN attempt_answers aa ON aa.attempt_id = a.id
            GROUP BY a.test_number, aa.section
            """,
            (grade,),
        ).fetchall()

    stats_by_test: dict[int, dict[str, dict]] = {}
    for row in section_rows:
        stats_by_test.setdefault(row["test_number"], {})[row["section"]] = {
            "correct": int(row["correct"] or 0),
            "total": int(row["total"]),
        }

    latest_by_test = {row["test_number"]: row for row in rows}
    exams = []
    for test_number in TEST_NUMBERS:
        attempt = latest_by_test.get(test_number)
        exams.append({
            "testNumber": test_number,
            "completed": attempt is not None,
            "score": None if attempt is None else attempt["score"],
            "totalCount": grade_summary(grade)["totalCount"] if attempt is None else attempt["total_count"],
            "percent": None if attempt is None else attempt["percent"],
            "createdAt": None if attempt is None else attempt["created_at"],
            "sectionScores": stats_by_test.get(test_number, {}),
        })
    return exams


def save_result(payload: dict) -> dict:
    answers = payload.get("answers", [])
    grade = payload.get("grade", "grade4")
    if grade not in GRADES:
        raise RuntimeError(f"対応していない級です: {grade}")
    test_number = int(payload.get("testNumber", 1))
    if test_number not in TEST_NUMBERS:
        raise RuntimeError(f"模擬テスト番号は1〜10で指定してください: {test_number}")

    with sqlite3.connect(DB_PATH) as conn:
        ensure_result_schema(conn)
        score = int(payload.get("score", 0))
        total = int(payload.get("totalCount", len(answers)))
        percent = int(payload.get("percent", 0))
        cursor = conn.execute(
            """
            INSERT INTO attempts (grade, test_number, total_count, score, percent)
            VALUES (?, ?, ?, ?, ?)
            """,
            (grade, test_number, total, score, percent),
        )
        attempt_id = cursor.lastrowid

        rows = []
        for item in answers:
            rows.append({
                "attempt_id": attempt_id,
                "question_id": int(item["questionId"]),
                "grade": grade,
                "test_number": test_number,
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
                (attempt_id, question_id, grade, test_number, section, title, prompt, passage,
                 audio_text, choices_json, selected_index, correct_index, is_correct, explanation)
            VALUES
                (:attempt_id, :question_id, :grade, :test_number, :section, :title, :prompt, :passage,
                 :audio_text, :choices_json, :selected_index, :correct_index, :is_correct, :explanation)
            """,
            rows,
        )

    return {"attemptId": attempt_id}


def load_wrong_questions(grade: str) -> list[dict]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        ensure_result_schema(conn)
        rows = conn.execute(
            """
            SELECT aa.*, a.created_at
            FROM attempt_answers aa
            JOIN attempts a ON a.id = aa.attempt_id
            WHERE aa.grade = ? AND aa.is_correct = 0
            ORDER BY a.created_at DESC, aa.id DESC
            """,
            (grade,),
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
            "testNumber": row["test_number"],
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

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/exams":
            grade = parse_grade(parsed.query)
            self.send_json({
                "grades": [grade_summary(key) for key in GRADES],
                "grade": grade_summary(grade),
                "exams": load_exam_list(grade),
            })
            return
        if parsed.path == "/api/test":
            grade = parse_grade(parsed.query)
            test_number = parse_test_number(parsed.query)
            self.send_json({
                "grade": grade_summary(grade),
                "testNumber": test_number,
                "questions": load_test(grade, test_number),
            })
            return
        if parsed.path == "/api/wrong-questions":
            grade = parse_grade(parsed.query)
            self.send_json({
                "grade": grade_summary(grade),
                "questions": load_wrong_questions(grade),
            })
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
    print(f"Serving eikenQuest on http://127.0.0.1:8001/ with {DB_PATH.name}")
    server.serve_forever()
