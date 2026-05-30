from __future__ import annotations

import argparse
import csv
import json
import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DEFAULT_CSV = ROOT / "seed_questions.csv"
DEFAULT_DB = ROOT / "questions.sqlite"

REQUIRED_COLUMNS = [
    "title",
    "section",
    "prompt",
    "passage",
    "audio_text",
    "choice_1",
    "choice_2",
    "choice_3",
    "choice_4",
    "answer_index",
    "explanation",
]


def create_schema(conn: sqlite3.Connection) -> None:
    conn.execute("DROP TABLE IF EXISTS questions")
    conn.execute("""
        CREATE TABLE questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            grade TEXT NOT NULL DEFAULT 'grade4',
            section TEXT NOT NULL,
            title TEXT NOT NULL,
            prompt TEXT NOT NULL,
            passage TEXT NOT NULL DEFAULT '',
            audio_text TEXT NOT NULL DEFAULT '',
            choices_json TEXT NOT NULL,
            answer_index INTEGER NOT NULL,
            explanation TEXT NOT NULL
        )
    """)
    conn.execute("CREATE INDEX idx_questions_grade_section ON questions(grade, section)")


def read_rows(csv_path: Path) -> list[dict]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)
        missing = [column for column in REQUIRED_COLUMNS if column not in (reader.fieldnames or [])]
        if missing:
            raise ValueError(f"CSVに必要な列がありません: {', '.join(missing)}")

        rows = []
        for line_number, row in enumerate(reader, start=2):
            grade = (row.get("grade") or "grade4").strip()
            choices = [
                row["choice_1"].strip(),
                row["choice_2"].strip(),
                row["choice_3"].strip(),
                row["choice_4"].strip(),
            ]
            answer_index = int(row["answer_index"])
            if answer_index < 0 or answer_index > 3:
                raise ValueError(f"{line_number}行目: answer_index は0-3で指定してください。")
            if not grade or not row["section"].strip() or not row["prompt"].strip():
                raise ValueError(f"{line_number}行目: grade、section、prompt は必須です。")

            rows.append({
                "grade": grade,
                "section": row["section"].strip(),
                "title": row["title"].strip(),
                "prompt": row["prompt"].strip(),
                "passage": row["passage"].strip(),
                "audio_text": row["audio_text"].strip(),
                "choices_json": json.dumps(choices, ensure_ascii=False),
                "answer_index": answer_index,
                "explanation": row["explanation"].strip(),
            })
    return rows


def import_questions(csv_path: Path, db_path: Path) -> int:
    rows = read_rows(csv_path)
    with sqlite3.connect(db_path) as conn:
        create_schema(conn)
        conn.executemany(
            """
            INSERT INTO questions
                (grade, section, title, prompt, passage, audio_text, choices_json, answer_index, explanation)
            VALUES
                (:grade, :section, :title, :prompt, :passage, :audio_text, :choices_json, :answer_index, :explanation)
            """,
            rows,
        )
    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Eiken questions from CSV into SQLite.")
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    args = parser.parse_args()

    count = import_questions(args.csv, args.db)
    print(f"Imported {count} questions into {args.db}")


if __name__ == "__main__":
    main()
