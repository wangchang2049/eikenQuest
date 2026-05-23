const TEST_SIZE = 65;
const TEST_SECONDS = 65 * 60;
const EXAM_BLUEPRINT = [
  { section: "語彙", label: "語彙", detail: "短文の語句空所補充", count: 15, pill: "purple" },
  { section: "会話", label: "会話", detail: "会話文の文空所補充", count: 5, pill: "cyan" },
  { section: "整序", label: "整序", detail: "日本文付き短文の語句整序", count: 5, pill: "amber" },
  { section: "読解", label: "読解", detail: "長文の内容一致選択", count: 10, pill: "green" },
  { section: "聴解1", label: "聴解1", detail: "会話の応答文選択", count: 10, pill: "pink" },
  { section: "聴解2", label: "聴解2", detail: "会話の内容一致選択", count: 10, pill: "pink" },
  { section: "聴解3", label: "聴解3", detail: "文の内容一致選択", count: 10, pill: "pink" }
];

const state = {
  questions: [],
  current: 0,
  answers: [],
  submitted: false,
  started: false,
  remainingSeconds: TEST_SECONDS
};

const timerEl = document.getElementById("timer");
const answeredCountEl = document.getElementById("answeredCount");
const totalCountEl = document.getElementById("totalCount");
const questionNavEl = document.getElementById("questionNav");
const sectionLabelEl = document.getElementById("sectionLabel");
const questionNumberEl = document.getElementById("questionNumber");
const questionTitleEl = document.getElementById("questionTitle");
const questionPromptEl = document.getElementById("questionPrompt");
const audioControlsEl = document.getElementById("audioControls");
const audioStatusEl = document.getElementById("audioStatus");
const passageEl = document.getElementById("passage");
const choicesEl = document.getElementById("choices");
const resultPanelEl = document.getElementById("resultPanel");
const resultSummaryEl = document.getElementById("resultSummary");
const resultStatsEl = document.getElementById("resultStats");
const reviewListEl = document.getElementById("reviewList");
const resultQuestionNavEl = document.getElementById("resultQuestionNav");
const resultCorrectCountEl = document.getElementById("resultCorrectCount");
const resultTotalCountEl = document.getElementById("resultTotalCount");
const startScreenEl = document.getElementById("startScreen");
const appRootEl = document.getElementById("appRoot");
const resultScreenEl = document.getElementById("resultScreen");
const sectionStatsEl = document.getElementById("sectionStats");

document.getElementById("startBtn").addEventListener("click", () => {
  if (!state.questions.length) {
    return;
  }
  state.started = true;
  startScreenEl.hidden = true;
  appRootEl.hidden = false;
  render();
  updateTimer();
  window.scrollTo({ top: 0, behavior: "auto" });
});
document.getElementById("prevBtn").addEventListener("click", () => moveQuestion(-1));
document.getElementById("nextBtn").addEventListener("click", () => moveQuestion(1));
document.getElementById("submitBtn").addEventListener("click", submitTest);
document.getElementById("resetBtn").addEventListener("click", resetTest);
document.getElementById("playAudioBtn").addEventListener("click", playCurrentAudio);
document.getElementById("backToTestBtn").addEventListener("click", () => {
  resultScreenEl.hidden = true;
  appRootEl.hidden = false;
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
});

async function prepareNewTest() {
  stopAudio();
  sectionStatsEl.innerHTML = '<p class="loading-text">問題を読み込み中...</p>';

  const response = await fetch(`/api/test?size=${TEST_SIZE}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("問題データを取得できませんでした。");
  }
  const payload = await response.json();

  state.questions = payload.questions;
  state.current = 0;
  state.answers = Array(state.questions.length).fill(null);
  state.submitted = false;
  state.started = false;
  state.remainingSeconds = TEST_SECONDS;
  totalCountEl.textContent = state.questions.length;
  resultScreenEl.hidden = true;
  resultStatsEl.innerHTML = "";
  resultQuestionNavEl.innerHTML = "";
  reviewListEl.innerHTML = "";
  renderStartStats();
  if (!appRootEl.hidden) {
    render();
  }
  updateTimer();
}

function render() {
  const question = state.questions[state.current];
  if (!question) {
    return;
  }

  answeredCountEl.textContent = state.answers.filter((answer) => answer !== null).length;
  sectionLabelEl.textContent = question.section;
  questionNumberEl.textContent = `第${state.current + 1}問`;
  questionTitleEl.textContent = question.title;
  questionPromptEl.textContent = question.prompt;

  if (question.audioText) {
    audioControlsEl.hidden = false;
    audioStatusEl.textContent = "speechSynthesis" in window ? "音声を聞いてから答えてください。" : "このブラウザは音声再生に対応していません。";
  } else {
    audioControlsEl.hidden = true;
  }

  if (question.passage) {
    passageEl.hidden = false;
    passageEl.textContent = question.passage;
  } else {
    passageEl.hidden = true;
    passageEl.textContent = "";
  }

  questionNavEl.innerHTML = buildQuestionNavButtons({ includeCurrent: true });
  choicesEl.innerHTML = question.choices.map((choice, index) => {
    const selected = state.answers[state.current] === index;
    return `
      <label class="choice${selected ? " selected" : ""}">
        <input type="radio" name="choice" value="${index}" ${selected ? "checked" : ""}>
        <span>${choice}</span>
      </label>
    `;
  }).join("");

  document.getElementById("prevBtn").disabled = state.current === 0;
  document.getElementById("nextBtn").textContent = state.current === state.questions.length - 1 ? "見直しへ" : "次へ";

  questionNavEl.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      stopAudio();
      state.current = index;
      render();
    });
  });

  choicesEl.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      state.answers[state.current] = Number(input.value);
      render();
    });
  });
}

function moveQuestion(step) {
  const next = state.current + step;
  if (next >= 0 && next < state.questions.length) {
    stopAudio();
    state.current = next;
    render();
  }
}

function submitTest() {
  stopAudio();
  state.submitted = true;
  const score = state.questions.reduce((total, question, index) => {
    return total + (state.answers[index] === question.answer ? 1 : 0);
  }, 0);
  const percent = Math.round((score / state.questions.length) * 100);

  appRootEl.hidden = true;
  resultScreenEl.hidden = false;
  resultCorrectCountEl.textContent = score;
  resultTotalCountEl.textContent = state.questions.length;
  resultSummaryEl.innerHTML = `
    <span class="score-ring" style="--score-angle: ${Math.round((score / state.questions.length) * 360)}deg"><strong>${score}</strong><small>点</small></span>
    <span class="result-message">${getResultMessage(percent)}</span>
    <span class="result-detail">${state.questions.length}問中 ${score}問正解（正答率 ${percent}%）</span>
  `;
  resultStatsEl.innerHTML = buildResultStats();
  resultQuestionNavEl.innerHTML = buildQuestionNavButtons();
  resultQuestionNavEl.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      scrollToReview(Number(button.dataset.index));
    });
  });
  reviewListEl.innerHTML = state.questions.map((question, index) => {
    const isCorrect = state.answers[index] === question.answer;
    const userAnswer = state.answers[index] === null ? "未回答" : question.choices[state.answers[index]];
    const script = question.audioText ? `<p>音声スクリプト: ${question.audioText}</p>` : "";
    const sourceText = buildSourceText(question);
    return `
      <div class="review-item ${isCorrect ? "correct" : "wrong"}" id="review-${index}">
        <strong>第${index + 1}問 ${isCorrect ? "正解" : "不正解"}</strong>
        <p class="source-text">問題: ${sourceText}</p>
        <p>あなたの答え: ${userAnswer}</p>
        <p>正解: ${question.choices[question.answer]}</p>
        ${script}
        <p>${question.explanation}</p>
      </div>
    `;
  }).join("");
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function resetTest() {
  await prepareNewTest();
  state.started = true;
  render();
}

function playCurrentAudio() {
  const question = state.questions[state.current];
  if (!question.audioText || !("speechSynthesis" in window)) {
    audioStatusEl.textContent = "このブラウザでは音声再生を利用できません。";
    return;
  }

  stopAudio();
  const utterance = new SpeechSynthesisUtterance(question.audioText);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  utterance.pitch = 1;
  utterance.onstart = () => {
    audioStatusEl.textContent = "再生中...";
  };
  utterance.onend = () => {
    audioStatusEl.textContent = "再生が終わりました。もう一度聞くこともできます。";
  };
  utterance.onerror = () => {
    audioStatusEl.textContent = "音声を再生できませんでした。ブラウザの音量や設定を確認してください。";
  };
  window.speechSynthesis.speak(utterance);
}

function buildSourceText(question) {
  const parts = [];
  if (question.passage) {
    parts.push(question.passage);
  }
  if (question.audioText) {
    parts.push(question.audioText);
  }
  parts.push(question.prompt);
  return parts.join(" / ");
}

function buildQuestionNavButtons(options = {}) {
  return state.questions.map((_, index) => {
    const resultClass = state.submitted
      ? state.answers[index] === state.questions[index].answer ? "correct" : "wrong"
      : "";
    const classes = [
      "nav-dot",
      options.includeCurrent && index === state.current ? "current" : "",
      state.answers[index] !== null ? "answered" : "",
      resultClass
    ].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-index="${index}" aria-label="第${index + 1}問">${index + 1}</button>`;
  }).join("");
}

function getResultMessage(percent) {
  if (percent >= 80) {
    return "よくできました！";
  }
  if (percent >= 60) {
    return "合格ライン到達です";
  }
  return "もう少し頑張りましょう！";
}

function buildResultStats() {
  const groups = [
    { label: "語彙・文法", sections: ["語彙"], total: 15, pill: "purple" },
    { label: "会話", sections: ["会話"], total: 5, pill: "cyan" },
    { label: "語句整序", sections: ["整序"], total: 5, pill: "amber" },
    { label: "読解", sections: ["読解"], total: 10, pill: "green" },
    { label: "リスニング", sections: ["聴解1", "聴解2", "聴解3"], total: 30, pill: "pink" }
  ];

  return groups.map((group) => {
    const correct = state.questions.reduce((total, question, index) => {
      if (!group.sections.includes(question.section)) {
        return total;
      }
      return total + (state.answers[index] === question.answer ? 1 : 0);
    }, 0);
    const ratio = group.total === 0 ? 0 : Math.round((correct / group.total) * 100);
    return `
      <article class="result-stat-card ${group.pill}">
        <span>${group.label}</span>
        <strong>${correct}/${group.total}</strong>
        <div class="stat-bar" aria-hidden="true">
          <i style="width: ${ratio}%"></i>
        </div>
      </article>
    `;
  }).join("");
}

function renderStartStats() {
  const counts = state.questions.reduce((summary, question) => {
    summary[question.section] = (summary[question.section] || 0) + 1;
    return summary;
  }, {});

  sectionStatsEl.innerHTML = EXAM_BLUEPRINT.map((part) => {
    const count = counts[part.section] || 0;
    return `
      <div class="section-row">
        <span class="pill ${part.pill}">${part.label}</span>
        <strong>${part.detail}</strong>
        <small>${count}問</small>
      </div>
    `;
  }).join("");
}

function scrollToReview(index) {
  const reviewItem = document.getElementById(`review-${index}`);
  if (reviewItem) {
    reviewItem.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function stopAudio() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function updateTimer() {
  const minutes = String(Math.floor(state.remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(state.remainingSeconds % 60).padStart(2, "0");
  timerEl.textContent = `${minutes}:${seconds}`;
}

setInterval(() => {
  if (!state.started || !state.questions.length || state.submitted || state.remainingSeconds <= 0) {
    return;
  }
  state.remainingSeconds -= 1;
  updateTimer();
  if (state.remainingSeconds === 0) {
    submitTest();
  }
}, 1000);

totalCountEl.textContent = TEST_SIZE;
updateTimer();
prepareNewTest().catch((error) => {
  sectionStatsEl.innerHTML = `<p class="loading-text">${error.message}</p>`;
});
