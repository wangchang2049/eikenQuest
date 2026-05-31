from __future__ import annotations

import csv
import random
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


def generate_mock_content(grade: str, section: str, topic: str, test_number: int, number: int) -> dict:
    prompt = ""
    passage = ""
    audio_text = ""
    choices = []
    
    rnd = random.Random(f"{grade}-{test_number}-{section}-{number}-{topic}")

    if section == "vocabulary":
        prompt_intro = "次の（　　　）に入れるのに最も適切なものを1, 2, 3, 4の中から一つ選びなさい。"
        sentences = [
            f"The new {topic} project will (      ) next month.",
            f"She was very (      ) about the {topic}.",
            f"Can you (      ) me more about the {topic}?",
            f"I have never (      ) such a beautiful {topic} before.",
            f"Many students are interested in (      ) {topic}."
        ]
        q = rnd.choice(sentences)
        prompt = f"{prompt_intro}\n\n{q}"
        if "(      ) next month" in q:
            correct = "start"
            wrong = ["started", "starting", "starts"]
        elif "very (      )" in q:
            correct = "excited"
            wrong = ["exciting", "excite", "excitement"]
        elif "Can you (      )" in q:
            correct = "tell"
            wrong = ["say", "talk", "speak"]
        elif "never (      )" in q:
            correct = "seen"
            wrong = ["saw", "see", "seeing"]
        else:
            correct = "joining"
            wrong = ["join", "joined", "joins"]
        choices = [correct] + wrong
        
    elif section == "conversation":
        prompt_intro = "次の対話の（　　　）に入れるのに最も適切なものを1, 2, 3, 4の中から一つ選びなさい。"
        convs = [
            f"A: What do you think about the {topic}?\nB: (      ).",
            f"A: I'm planning to join the {topic}.\nB: (      ).",
            f"A: How was the {topic} yesterday?\nB: (      )."
        ]
        q = rnd.choice(convs)
        prompt = f"{prompt_intro}\n\n{q}"
        if "What do you think" in q:
            correct = "I think it's great"
            wrong = ["Yes, I do", "I went there", "It's mine"]
        elif "planning to join" in q:
            correct = "That sounds fun"
            wrong = ["I am a student", "No, thanks", "You're welcome"]
        else:
            correct = "It was amazing"
            wrong = ["I will go", "Yes, it was", "I like it"]
        choices = [correct] + wrong

    elif section == "ordering":
        prompt_intro = "日本文の意味に合うように語句を並べ替えたとき、最も自然な文を選びなさい。"
        orders = [
            (f"私はその{topic}についてもっと知りたいです。", f"I ( 1. know / 2. want / 3. more / 4. to ) about the {topic}.", ["want to know more", "know to want more", "more want to know", "to want more know"]),
            (f"彼女は{topic}のために毎日一生懸命働いています。", f"She ( 1. working / 2. for / 3. is / 4. hard ) the {topic} every day.", ["is working hard for", "working is hard for", "hard is working for", "for is working hard"]),
            (f"彼らは{topic}について話し合いました。", f"They ( 1. about / 2. discussed / 3. issues / 4. the ) {topic}.", ["discussed the issues about", "about discussed the issues", "the issues about discussed", "discussed about the issues"]),
        ]
        q, e, opts = rnd.choice(orders)
        prompt = f"{prompt_intro}\n\n{q}\n{e}"
        choices = opts
        
    elif section == "reading_cloze":
        prompt_intro = "次の英文の（　　　）に入れるのに最も適切なものを1, 2, 3, 4の中から一つ選びなさい。"
        passage = (f"Last week, I participated in a {topic}. It was a great experience. "
                   f"I met many people who were interested in the same things. "
                   f"However, there was one (      ). We didn't have enough time to discuss everything.")
        prompt = prompt_intro
        correct = "problem"
        wrong = ["idea", "success", "story"]
        choices = [correct] + wrong

    elif section == "reading":
        prompt_intro = "次の英文の内容に関して、質問に対する答えとして最も適切なものを1, 2, 3, 4の中から一つ選びなさい。"
        passage = (f"Recently, {topic} has become very popular in our city. Many residents gather on weekends to enjoy it. "
                   f"The mayor said that this activity helps build a strong community. "
                   f"In the future, the city plans to organize more events related to {topic} to attract tourists.")
        questions = [
            (f"Why is the city planning to organize more events?", "Because they want to attract tourists.", ["Because the mayor likes it.", "Because they want to make money.", "Because no one joined the events."]),
            (f"When do residents gather to enjoy the {topic}?", "On weekends.", ["On weekdays.", "Every day.", "Only in summer."]),
        ]
        q, correct, wrong = rnd.choice(questions)
        prompt = f"{prompt_intro}\n\nQuestion: {q}"
        choices = [correct] + wrong

    elif section.startswith("writing"):
        prompt_intro = "次の条件に従って、解答しなさい。（※模擬テストシステム上、最も適切な選択肢を選んでください）"
        if "email" in section:
            prompt = f"{prompt_intro}\n\nあなたは外国人の友達からEメールを受け取りました。{topic}についてあなたの考えを返信しなさい。"
        elif "essay" in section:
            prompt = f"{prompt_intro}\n\n以下のTOPICについて、あなたの意見とその理由を2つ書きなさい。\nTOPIC: Do you think {topic} is important for young people?"
        elif "summary" in section:
            passage = (f"Some people believe that {topic} should be a priority for society. They argue that it provides long-term benefits. "
                       f"On the other hand, others think that it costs too much money. Ultimately, finding a balance is crucial.")
            prompt = f"{prompt_intro}\n\n次の英文の要約として最も適切なものを選びなさい。"
        correct = "与えられたテーマに沿った、適切な構成と内容の解答"
        wrong = ["単語数が不足している不十分な解答", "テーマから外れた無関係な解答", "文法やスペルミスが多数ある解答"]
        choices = [correct] + wrong

    elif section.startswith("listening"):
        if section == "listening1":
            prompt = "対話を聞き、その最後の発言に対する応答として最も適切なものを一つ選びなさい。"
            audio_text = f"A: Did you enjoy the {topic}?\nB: Yes, but it was a bit crowded.\nA: I see. Would you go there again?"
            correct = "Probably yes."
            wrong = ["I went there.", "It was crowded.", "No, I didn't."]
        elif section == "listening2":
            prompt = "対話を聞き、その質問に対して最も適切なものを一つ選びなさい。"
            audio_text = (f"A: I'm thinking of joining the {topic}.\nB: That's a good idea! It starts next Monday.\n"
                          f"A: Oh, really? I should sign up today.\n\nQuestion: What will the man probably do today?")
            correct = "Sign up for the activity."
            wrong = ["Go to the activity.", "Wait until Monday.", "Ask the woman."]
        elif section == "listening3":
            prompt = "英文を聞き、その質問に対して最も適切なものを一つ選びなさい。"
            audio_text = (f"Welcome to the {topic}. We are very happy to see so many people here today. "
                          f"The main event will start at 10 AM. Please make sure to get your tickets before then.\n\n"
                          f"Question: When will the main event start?")
            correct = "At 10 AM."
            wrong = ["At 9 AM.", "At 11 AM.", "In the afternoon."]
        else: # listening4
            prompt = "インタビューを聞き、その質問に対して最も適切なものを一つ選びなさい。"
            audio_text = (f"Interviewer: Why did you start the {topic} project?\n"
                          f"Guest: Well, I wanted to help the community and protect the environment.\n"
                          f"Interviewer: That's wonderful.\n\n"
                          f"Question: Why did the guest start the project?")
            correct = "To help the community."
            wrong = ["To make money.", "To become famous.", "To meet new people."]
        choices = [correct] + wrong

    else:
        prompt = f"Choose the best answer for a {section} question about {topic}."
        choices = ["Correct answer", "Wrong answer 1", "Wrong answer 2", "Wrong answer 3"]

    # 選択肢をシャッフル
    c_list = list(zip(choices, [1, 0, 0, 0]))
    rnd.shuffle(c_list)
    final_choices = [c[0] for c in c_list]
    answer_index = [c[1] for c in c_list].index(1)

    return {
        "prompt": f"{prompt}\n[Mock {test_number}-{number}]",
        "passage": passage,
        "audio_text": audio_text,
        "choices": final_choices,
        "answer_index": answer_index,
    }


def make_row(grade: str, test_number: int, section: str, number: int) -> dict:
    label = SECTION_LABELS[section]
    topic = TOPICS[(test_number + number) % len(TOPICS)]
    grade_label = GRADES[grade]["label"]
    serial = f"{grade}-{test_number:02d}-{section}-{number:02d}"

    content = generate_mock_content(grade, section, topic, test_number, number)

    return {
        "grade": grade,
        "test_number": test_number,
        "title": f"{grade_label} 模擬テスト{test_number} {label} {number}",
        "section": section,
        "prompt": content["prompt"],
        "passage": content["passage"],
        "audio_text": content["audio_text"],
        "choice_1": content["choices"][0],
        "choice_2": content["choices"][1],
        "choice_3": content["choices"][2],
        "choice_4": content["choices"][3],
        "answer_index": content["answer_index"],
        "explanation": f"{serial}: {label}の問題です。文脈と設問条件に最も合う選択肢を選びます。",
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
