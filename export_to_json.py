import sqlite3
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "questions.sqlite"
DATA_DIR = ROOT / "data"

GRADES = ["grade4", "grade3", "pre2", "pre2plus", "grade2", "pre1", "grade1"]
TEST_NUMBERS = range(1, 11)

def export_data():
    if not DB_PATH.exists():
        print("questions.sqlite not found.")
        return

    DATA_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Export exams list per grade
    for grade in GRADES:
        exams = []
        for test_number in TEST_NUMBERS:
            # For static version, we don't have previous attempts from server
            # We just provide the structure. LocalStorage will handle scores.
            exams.append({
                "testNumber": test_number,
                "completed": False,
                "score": None,
                "totalCount": 0, # Will be filled by client if needed or hardcoded
                "percent": None,
                "sectionScores": {}
            })
        
        with open(DATA_DIR / f"exams_{grade}.json", "w", encoding="utf-8") as f:
            json.dump(exams, f, ensure_ascii=False, indent=2)

        # Export questions per test
        for test_number in TEST_NUMBERS:
            rows = conn.execute(
                "SELECT section, title, prompt, passage, audio_text, choices_json, answer_index, explanation FROM questions WHERE grade = ? AND test_number = ?",
                (grade, test_number)
            ).fetchall()

            if not rows:
                continue

            questions = []
            for row in rows:
                questions.append({
                    "section": row["section"],
                    "title": row["title"],
                    "prompt": row["prompt"],
                    "passage": row["passage"],
                    "audioText": row["audio_text"],
                    "choices": json.loads(row["choices_json"]),
                    "answer": row["answer_index"],
                    "explanation": row["explanation"]
                })

            grade_test_dir = DATA_DIR / grade
            grade_test_dir.mkdir(exist_ok=True)
            with open(grade_test_dir / f"test_{test_number}.json", "w", encoding="utf-8") as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)
            print(f"Exported {grade} Test {test_number}")

    conn.close()
    print("Export complete.")

if __name__ == "__main__":
    export_data()
