from __future__ import annotations

import csv
from pathlib import Path

from server import BLUEPRINTS, GRADES


ROOT = Path(__file__).resolve().parent
CSV_PATH = ROOT / "seed_questions.csv"

FIELDS = [
    "grade",
    "test_number",
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

TOPICS = [
    "school club activities",
    "community libraries",
    "online lessons",
    "local festivals",
    "environmental projects",
    "part-time jobs",
    "science museums",
    "travel planning",
    "healthy meals",
    "new technology",
]

SECTION_LABELS = {
    "vocabulary": "語彙・文法",
    "conversation": "会話文",
    "ordering": "語句整序",
    "reading_cloze": "長文空所補充",
    "reading": "読解",
    "writing_email": "Eメール",
    "writing_summary": "英文要約",
    "writing_essay": "英作文",
    "listening1": "リスニング第1部",
    "listening2": "リスニング第2部",
    "listening3": "リスニング第3部",
    "listening4": "リスニング第4部",
}


def level_word(grade: str) -> str:
    return {
        "grade4": "basic",
        "grade3": "clear",
        "pre2": "practical",
        "pre2plus": "detailed",
        "grade2": "advanced",
        "pre1": "academic",
        "grade1": "sophisticated",
    }[grade]


def make_row(grade: str, test_number: int, section: str, number: int) -> dict:
    label = SECTION_LABELS[section]
    topic = TOPICS[(test_number + number) % len(TOPICS)]
    grade_label = GRADES[grade]["label"]
    serial = f"{grade}-{test_number:02d}-{section}-{number:02d}"
    answer = (test_number + number + len(section)) % 4
    choices = [
        f"{level_word(grade)} answer about {topic}",
        f"unrelated detail about {topic}",
        f"opposite meaning for {topic}",
        f"too narrow idea about {topic}",
    ]
    choices[answer] = f"best {level_word(grade)} choice for {topic}"

    passage = ""
    audio_text = ""
    if section in {"reading", "reading_cloze", "writing_summary"}:
        passage = (
            f"People in a town discussed {topic}. One group wanted a quick solution, "
            f"but another group asked for evidence and a long-term plan. In the end, "
            f"they chose an idea that helped students and local residents."
        )
    if section.startswith("listening"):
        audio_text = (
            f"A speaker talks about {topic}. The speaker explains the main problem, "
            f"compares two possible choices, and recommends the more useful one."
        )

    if section == "ordering":
        prompt = (
            "日本文の意味に合うように語句を並べ替えたとき、最も自然な文を選びなさい。\n"
            f"Topic: {topic}. [Mock {test_number}-{number}]"
        )
    elif section.startswith("writing"):
        prompt = (
            f"{label}の設問です。{topic}について、条件に合う英文を書くための"
            f"最もよい構成を選びなさい。 [Mock {test_number}-{number}]"
        )
    elif section.startswith("listening"):
        prompt = (
            f"音声を聞き、{topic}についての質問に答えなさい。"
            f"最も適切な答えを選びなさい。 [Mock {test_number}-{number}]"
        )
    else:
        prompt = (
            f"Choose the best answer for a {grade_label} {label} question about {topic}. "
            f"[Mock {test_number}-{number}]"
        )

    return {
        "grade": grade,
        "test_number": test_number,
        "title": f"{grade_label} 模擬テスト{test_number} {label} {number}",
        "section": section,
        "prompt": prompt,
        "passage": passage,
        "audio_text": audio_text,
        "choice_1": choices[0],
        "choice_2": choices[1],
        "choice_3": choices[2],
        "choice_4": choices[3],
        "answer_index": answer,
        "explanation": f"{serial}: 文脈と設問条件に最も合う選択肢を選びます。",
    }


def main() -> None:
    rows = []
    for grade in GRADES:
        for test_number in range(1, 11):
            for section, _label, _skill, count, _pill in BLUEPRINTS[grade]:
                for number in range(1, count + 1):
                    rows.append(make_row(grade, test_number, section, number))

    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {CSV_PATH}")


if __name__ == "__main__":
    main()
