const TEST_SIZE = 65;
const TEST_SECONDS = 65 * 60;
const GRADES = {
  grade4: { label: "4級", english: "EIKEN GRADE 4 PRACTICE TEST", header: "Grade 4 Mock Test" },
  grade3: { label: "3級", english: "EIKEN GRADE 3 PRACTICE TEST", header: "Grade 3 Mock Test" },
  pre2: { label: "準2級", english: "EIKEN GRADE PRE-2 PRACTICE TEST", header: "Grade Pre-2 Mock Test" },
  pre2plus: { label: "準2級プラス", english: "EIKEN GRADE PRE-2 PLUS PRACTICE TEST", header: "Grade Pre-2 Plus Mock Test" },
  grade2: { label: "2級", english: "EIKEN GRADE 2 PRACTICE TEST", header: "Grade 2 Mock Test" },
  pre1: { label: "準1級", english: "EIKEN GRADE PRE-1 PRACTICE TEST", header: "Grade Pre-1 Mock Test" },
  grade1: { label: "1級", english: "EIKEN GRADE 1 PRACTICE TEST", header: "Grade 1 Mock Test" }
};
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
  grade: "grade4",
  remainingSeconds: TEST_SECONDS,
  previousScreen: "start"
};

const gradeSelectEl = document.getElementById("gradeSelect");
const heroGradeEl = document.getElementById("heroGrade");
const heroGradeEnEl = document.getElementById("heroGradeEn");
const appGradeLabelEl = document.getElementById("appGradeLabel");
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
const resultSummaryEl = document.getElementById("resultSummary");
const resultSaveStatusEl = document.getElementById("resultSaveStatus");
const resultStatsEl = document.getElementById("resultStats");
const reviewListEl = document.getElementById("reviewList");
const resultQuestionNavEl = document.getElementById("resultQuestionNav");
const resultCorrectCountEl = document.getElementById("resultCorrectCount");
const resultTotalCountEl = document.getElementById("resultTotalCount");
const startScreenEl = document.getElementById("startScreen");
const appRootEl = document.getElementById("appRoot");
const resultScreenEl = document.getElementById("resultScreen");
const wrongBookScreenEl = document.getElementById("wrongBookScreen");
const sectionStatsEl = document.getElementById("sectionStats");
const wrongBookSummaryEl = document.getElementById("wrongBookSummary");
const wrongBookListEl = document.getElementById("wrongBookList");

document.getElementById("startBtn").addEventListener("click", () => {
  if (!state.questions.length) return;
  state.started = true;
  showOnly(appRootEl);
  render();
});
gradeSelectEl.addEventListener("change", () => {
  state.grade = gradeSelectEl.value;
  updateGradeLabels();
  prepareNewTest().catch((error) => {
    sectionStatsEl.innerHTML = `<p class="loading-text">${error.message}</p>`;
  });
});
document.getElementById("wrongBookBtn").addEventListener("click", () => openWrongBook("start"));
document.getElementById("resultWrongBookBtn").addEventListener("click", () => openWrongBook("result"));
document.getElementById("wrongBookBackBtn").addEventListener("click", () => {
  showOnly(state.previousScreen === "result" ? resultScreenEl : startScreenEl);
});
document.getElementById("prevBtn").addEventListener("click", () => moveQuestion(-1));
document.getElementById("nextBtn").addEventListener("click", () => moveQuestion(1));
document.getElementById("submitBtn").addEventListener("click", submitTest);
document.getElementById("resetBtn").addEventListener("click", resetTest);
document.getElementById("playAudioBtn").addEventListener("click", playCurrentAudio);
document.getElementById("backToTestBtn").addEventListener("click", () => {
  showOnly(appRootEl);
  render();
});

function showOnly(screen) {
  startScreenEl.hidden = screen !== startScreenEl;
  appRootEl.hidden = screen !== appRootEl;
  resultScreenEl.hidden = screen !== resultScreenEl;
  wrongBookScreenEl.hidden = screen !== wrongBookScreenEl;
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function prepareNewTest() {
  stopAudio();
  sectionStatsEl.innerHTML = '<p class="loading-text">問題を読み込み中...</p>';

  const response = await fetch(`/api/test?grade=${encodeURIComponent(state.grade)}&size=${TEST_SIZE}`, { cache: "no-store" });
  if (!response.ok) throw new Error("問題データを取得できませんでした。");
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);

  state.questions = payload.questions;
  state.current = 0;
  state.answers = Array(state.questions.length).fill(null);
  state.submitted = false;
  state.started = false;
  state.remainingSeconds = TEST_SECONDS;
  totalCountEl.textContent = state.questions.length;
  resultStatsEl.innerHTML = "";
  resultQuestionNavEl.innerHTML = "";
  reviewListEl.innerHTML = "";
  resultSaveStatusEl.textContent = "";
  updateGradeLabels();
  renderStartStats();
  if (!appRootEl.hidden) render();
  updateTimer();
}

function render() {
  const question = state.questions[state.current];
  if (!question) return;

  answeredCountEl.textContent = state.answers.filter((answer) => answer !== null).length;
  sectionLabelEl.textContent = question.section;
  questionNumberEl.textContent = `第${state.current + 1}問`;
  questionTitleEl.textContent = question.title;
  questionPromptEl.textContent = getDisplayPrompt(question);

  if (question.audioText) {
    audioControlsEl.hidden = false;
    audioStatusEl.textContent = "speechSynthesis" in window ? "音声を聞いてから答えてください。" : "このブラウザは音声再生に対応していません。";
  } else {
    audioControlsEl.hidden = true;
  }

  passageEl.hidden = !question.passage;
  passageEl.textContent = question.passage || "";
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
      stopAudio();
      state.current = Number(button.dataset.index);
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

async function submitTest() {
  stopAudio();
  state.submitted = true;
  const score = state.questions.reduce((total, question, index) => {
    return total + (state.answers[index] === question.answer ? 1 : 0);
  }, 0);
  const percent = Math.round((score / state.questions.length) * 100);

  showOnly(resultScreenEl);
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
    button.addEventListener("click", () => scrollToReview(Number(button.dataset.index)));
  });
  reviewListEl.innerHTML = state.questions.map((question, index) => reviewHtml(question, index)).join("");
  resultSaveStatusEl.textContent = "採点結果を保存中...";
  await saveResult(score, percent);
  render();
}

async function saveResult(score, percent) {
  const answers = state.questions.map((question, index) => ({
    questionId: question.id,
    section: question.section,
    title: question.title,
    prompt: question.prompt,
    passage: question.passage,
    audioText: question.audioText,
    choices: question.choices,
    selectedIndex: state.answers[index],
    correctIndex: question.answer,
    isCorrect: state.answers[index] === question.answer,
    explanation: question.explanation
  }));

  try {
    const response = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade: state.grade, totalCount: state.questions.length, score, percent, answers })
    });
    if (!response.ok) throw new Error();
    const payload = await response.json();
    resultSaveStatusEl.textContent = `採点結果を保存しました（ID: ${payload.attemptId}）。`;
  } catch {
    resultSaveStatusEl.textContent = "採点結果を保存できませんでした。";
  }
}

async function resetTest() {
  await prepareNewTest();
  state.started = true;
  showOnly(appRootEl);
  render();
}

async function openWrongBook(previousScreen) {
  state.previousScreen = previousScreen;
  showOnly(wrongBookScreenEl);
  wrongBookSummaryEl.textContent = "不正解問題を読み込み中...";
  wrongBookListEl.innerHTML = "";

  try {
    const response = await fetch(`/api/wrong-questions?grade=${encodeURIComponent(state.grade)}`, { cache: "no-store" });
    if (!response.ok) throw new Error();
    const payload = await response.json();
    const questions = payload.questions;
    wrongBookSummaryEl.textContent = questions.length
      ? `${getGradeLabel()}の保存済み不正解問題 ${questions.length}問を表示しています。`
      : `${getGradeLabel()}の保存済み不正解問題はまだありません。`;
    wrongBookListEl.innerHTML = questions.map((question, index) => wrongBookHtml(question, index)).join("");
  } catch {
    wrongBookSummaryEl.textContent = "不正解問題集を読み込めませんでした。";
  }
}

function reviewHtml(question, index) {
  const isCorrect = state.answers[index] === question.answer;
  const userAnswer = state.answers[index] === null ? "未回答" : question.choices[state.answers[index]];
  const script = question.audioText ? `<p>音声スクリプト: ${question.audioText}</p>` : "";
  return `
    <div class="review-item ${isCorrect ? "correct" : "wrong"}" id="review-${index}">
      <strong>第${index + 1}問 ${isCorrect ? "正解" : "不正解"}</strong>
      <p class="source-text">問題: ${buildSourceText(question)}</p>
      <p>あなたの答え: ${userAnswer}</p>
      <p>正解: ${question.choices[question.answer]}</p>
      ${script}
      <p>${question.explanation}</p>
    </div>
  `;
}

function wrongBookHtml(question, index) {
  const script = question.audioText ? `<p>音声スクリプト: ${question.audioText}</p>` : "";
  return `
    <div class="review-item wrong">
      <strong>不正解問題 ${index + 1}（${question.section}）</strong>
      <p class="source-text">問題: ${buildSourceText(question)}</p>
      <p>前回の答え: ${question.selectedAnswer}</p>
      <p>正解: ${question.correctAnswer}</p>
      ${script}
      <p>${question.explanation}</p>
    </div>
  `;
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

function getDisplayPrompt(question) {
  if (question.section !== "整序") return question.prompt;
  // "Choose the best order:" 以降のみを表示し、正解文を隠す
  const marker = "Choose the best order:";
  const idx = question.prompt.indexOf(marker);
  if (idx === -1) return question.prompt;
  return question.prompt.slice(idx).trim();
}

function buildSourceText(question) {
  return [question.passage, question.audioText, question.prompt].filter(Boolean).join(" / ");
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
  if (percent >= 80) return "よくできました！";
  if (percent >= 60) return "合格ライン到達です";
  return "もう少し頑張りましょう！";
}

function getGradeLabel() {
  return GRADES[state.grade]?.label || "4級";
}

function updateGradeLabels() {
  const grade = GRADES[state.grade] || GRADES.grade4;
  heroGradeEl.textContent = `英検${grade.label}`;
  heroGradeEnEl.textContent = grade.english;
  appGradeLabelEl.textContent = grade.header;
  document.title = `eiken_codex | 英検${grade.label}模擬テスト`;
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
      if (!group.sections.includes(question.section)) return total;
      return total + (state.answers[index] === question.answer ? 1 : 0);
    }, 0);
    const ratio = Math.round((correct / group.total) * 100);
    return `
      <article class="result-stat-card ${group.pill}">
        <span>${group.label}</span>
        <strong>${correct}/${group.total}</strong>
        <div class="stat-bar" aria-hidden="true"><i style="width: ${ratio}%"></i></div>
      </article>
    `;
  }).join("");
}

function renderStartStats() {
  const counts = state.questions.reduce((summary, question) => {
    summary[question.section] = (summary[question.section] || 0) + 1;
    return summary;
  }, {});

  sectionStatsEl.innerHTML = EXAM_BLUEPRINT.map((part) => `
    <div class="section-row">
      <span class="pill ${part.pill}">${part.label}</span>
      <strong>${part.detail}</strong>
      <small>${counts[part.section] || 0}問</small>
    </div>
  `).join("");
}

function scrollToReview(index) {
  const reviewItem = document.getElementById(`review-${index}`);
  if (reviewItem) reviewItem.scrollIntoView({ behavior: "smooth", block: "center" });
}

function stopAudio() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function updateTimer() {
  const minutes = String(Math.floor(state.remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(state.remainingSeconds % 60).padStart(2, "0");
  timerEl.textContent = `${minutes}:${seconds}`;
}

setInterval(() => {
  if (!state.started || !state.questions.length || state.submitted || state.remainingSeconds <= 0) return;
  state.remainingSeconds -= 1;
  updateTimer();
  if (state.remainingSeconds === 0) submitTest();
}, 1000);

totalCountEl.textContent = TEST_SIZE;
updateTimer();
updateGradeLabels();
prepareNewTest().catch((error) => {
  sectionStatsEl.innerHTML = `<p class="loading-text">${error.message}</p>`;
});
