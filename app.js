const TEST_NUMBERS = Array.from({ length: 10 }, (_, index) => index + 1);

const state = {
  grades: [],
  grade: "grade4",
  gradeInfo: null,
  exams: [],
  testNumber: 1,
  questions: [],
  current: 0,
  answers: [],
  submitted: false,
  started: false,
  remainingSeconds: 0,
  previousScreen: "dashboard"
};

const dashboardScreenEl = document.getElementById("dashboardScreen");
const gradeSelectEl = document.getElementById("gradeSelect");
const selectedGradeEnglishEl = document.getElementById("selectedGradeEnglish");
const selectedGradeTitleEl = document.getElementById("selectedGradeTitle");
const selectedGradeMetaEl = document.getElementById("selectedGradeMeta");
const examListEl = document.getElementById("examList");
const heroGradeEl = document.getElementById("heroGrade");
const heroTestNameEl = document.getElementById("heroTestName");
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
const startTotalCountEl = document.getElementById("startTotalCount");
const startMinutesEl = document.getElementById("startMinutes");
const startTestNumberEl = document.getElementById("startTestNumber");

document.getElementById("startBtn").addEventListener("click", () => {
  if (!state.questions.length) return;
  state.started = true;
  showOnly(appRootEl);
  render();
});
document.getElementById("backToDashboardBtn").addEventListener("click", openDashboard);
document.getElementById("backToDashboardFromResultBtn").addEventListener("click", openDashboard);
document.getElementById("dashboardWrongBookBtn").addEventListener("click", () => openWrongBook("dashboard"));
gradeSelectEl.addEventListener("change", () => {
  state.grade = gradeSelectEl.value;
  loadDashboard().catch(showDashboardError);
});
document.getElementById("resultWrongBookBtn").addEventListener("click", () => openWrongBook("result"));
document.getElementById("wrongBookBackBtn").addEventListener("click", () => {
  showOnly(state.previousScreen === "result" ? resultScreenEl : dashboardScreenEl);
});
document.getElementById("prevBtn").addEventListener("click", () => moveQuestion(-1));
document.getElementById("nextBtn").addEventListener("click", () => moveQuestion(1));
document.getElementById("submitBtn").addEventListener("click", submitTest);
document.getElementById("resetBtn").addEventListener("click", () => openTestIntro(state.testNumber));
document.getElementById("playAudioBtn").addEventListener("click", playCurrentAudio);

function showOnly(screen) {
  dashboardScreenEl.hidden = screen !== dashboardScreenEl;
  startScreenEl.hidden = screen !== startScreenEl;
  appRootEl.hidden = screen !== appRootEl;
  resultScreenEl.hidden = screen !== resultScreenEl;
  wrongBookScreenEl.hidden = screen !== wrongBookScreenEl;
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function loadDashboard() {
  stopAudio();
  examListEl.innerHTML = '<p class="loading-text">模擬テストを読み込み中...</p>';
  const response = await fetch(`/api/exams?grade=${encodeURIComponent(state.grade)}`, { cache: "no-store" });
  if (!response.ok) throw new Error("模擬テスト一覧を取得できませんでした。");
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);

  state.grades = payload.grades;
  state.gradeInfo = payload.grade;
  state.exams = payload.exams;
  renderGradeSelect();
  renderDashboard();
}

function renderGradeSelect() {
  if (gradeSelectEl.options.length) return;
  gradeSelectEl.innerHTML = state.grades.map((grade) => (
    `<option value="${grade.key}">${grade.label}</option>`
  )).join("");
  gradeSelectEl.value = state.grade;
}

function renderDashboard() {
  const grade = state.gradeInfo;
  selectedGradeEnglishEl.textContent = grade.english;
  selectedGradeTitleEl.textContent = `${grade.label} 模擬テスト`;
  selectedGradeMetaEl.textContent = `${grade.totalCount}問 / ${grade.minutes}分`;
  examListEl.innerHTML = state.exams.map(examCardHtml).join("");
  examListEl.querySelectorAll("[data-test-number]").forEach((button) => {
    button.addEventListener("click", () => openTestIntro(Number(button.dataset.testNumber)));
  });
}

function examCardHtml(exam) {
  const completed = exam.completed;
  const action = completed ? "再テスト" : "テスト開始";
  const score = completed
    ? `<strong>${exam.score}/${exam.totalCount}点</strong><span>${exam.percent}%</span>`
    : `<strong>未実施</strong><span>${state.gradeInfo.totalCount}問</span>`;
  const sections = completed
    ? Object.entries(exam.sectionScores).map(([section, item]) => (
        `<small>${section}: ${item.correct}/${item.total}</small>`
      )).join("")
    : `<small>実施後にカテゴリー別得点を表示します。</small>`;

  return `
    <article class="exam-card">
      <div>
        <p class="eyebrow">Mock Test ${exam.testNumber}</p>
        <h3>模擬テスト${exam.testNumber}</h3>
      </div>
      <div class="exam-score">${score}</div>
      <div class="exam-section-scores">${sections}</div>
      <button class="primary-btn" type="button" data-test-number="${exam.testNumber}">${action}</button>
    </article>
  `;
}

async function openTestIntro(testNumber) {
  state.testNumber = testNumber;
  showOnly(startScreenEl);
  sectionStatsEl.innerHTML = '<p class="loading-text">問題を読み込み中...</p>';
  await prepareTest();
}

async function prepareTest() {
  stopAudio();
  const response = await fetch(
    `/api/test?grade=${encodeURIComponent(state.grade)}&test=${encodeURIComponent(state.testNumber)}`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error("問題データを取得できませんでした。");
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);

  state.gradeInfo = payload.grade;
  state.questions = payload.questions;
  state.current = 0;
  state.answers = Array(state.questions.length).fill(null);
  state.submitted = false;
  state.started = false;
  state.remainingSeconds = state.gradeInfo.minutes * 60;
  totalCountEl.textContent = state.questions.length;
  resultStatsEl.innerHTML = "";
  resultQuestionNavEl.innerHTML = "";
  reviewListEl.innerHTML = "";
  resultSaveStatusEl.textContent = "";
  updateGradeLabels();
  renderStartStats();
  updateTimer();
}

function renderStartStats() {
  startTotalCountEl.textContent = `${state.gradeInfo.totalCount}問`;
  startMinutesEl.textContent = `${state.gradeInfo.minutes}分`;
  startTestNumberEl.textContent = String(state.testNumber);
  sectionStatsEl.innerHTML = state.gradeInfo.blueprint.map((part) => `
    <div class="section-row">
      <span class="pill ${part.pill}">${part.skill}</span>
      <strong>${part.label}</strong>
      <small>${part.count}問</small>
    </div>
  `).join("");
}

function render() {
  const question = state.questions[state.current];
  if (!question) return;

  answeredCountEl.textContent = state.answers.filter((answer) => answer !== null).length;
  sectionLabelEl.textContent = question.section;
  questionNumberEl.textContent = `第${state.current + 1}問`;
  questionTitleEl.textContent = question.title;
  questionPromptEl.textContent = question.prompt;

  if (question.audioText) {
    audioControlsEl.hidden = false;
    audioStatusEl.textContent = "音声を聞いてから答えてください。";
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
      body: JSON.stringify({
        grade: state.grade,
        testNumber: state.testNumber,
        totalCount: state.questions.length,
        score,
        percent,
        answers
      })
    });
    if (!response.ok) throw new Error();
    const payload = await response.json();
    resultSaveStatusEl.textContent = `採点結果を保存しました（ID: ${payload.attemptId}）。`;
  } catch {
    resultSaveStatusEl.textContent = "採点結果を保存できませんでした。";
  }
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
      ? `${state.gradeInfo?.label || ""}の保存済み不正解問題 ${questions.length}問を表示しています。`
      : `${state.gradeInfo?.label || ""}の保存済み不正解問題はまだありません。`;
    wrongBookListEl.innerHTML = questions.map((question, index) => wrongBookHtml(question, index)).join("");
  } catch {
    wrongBookSummaryEl.textContent = "不正解問題を読み込めませんでした。";
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
      <strong>不正解問題${index + 1}（模擬テスト${question.testNumber} / ${question.section}）</strong>
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
    audioStatusEl.textContent = "再生が終わりました。";
  };
  utterance.onerror = () => {
    audioStatusEl.textContent = "音声を再生できませんでした。";
  };
  window.speechSynthesis.speak(utterance);
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
  if (percent >= 80) return "よくできました。";
  if (percent >= 60) return "合格ラインを意識できる結果です。";
  return "復習してもう一度挑戦しましょう。";
}

function updateGradeLabels() {
  const grade = state.gradeInfo;
  heroGradeEl.textContent = `英検${grade.label}`;
  heroTestNameEl.textContent = `模擬テスト${state.testNumber}`;
  heroGradeEnEl.textContent = `${grade.english} MOCK TEST ${state.testNumber}`;
  appGradeLabelEl.textContent = `${grade.label} Mock Test ${state.testNumber}`;
  document.title = `eikenQuest | 英検${grade.label} 模擬テスト${state.testNumber}`;
}

function buildResultStats() {
  return state.gradeInfo.blueprint.map((part) => {
    const correct = state.questions.reduce((total, question, index) => {
      if (question.section !== part.label) return total;
      return total + (state.answers[index] === question.answer ? 1 : 0);
    }, 0);
    const ratio = Math.round((correct / part.count) * 100);
    return `
      <article class="result-stat-card ${part.pill}">
        <span>${part.label}</span>
        <strong>${correct}/${part.count}</strong>
        <div class="stat-bar" aria-hidden="true"><i style="width: ${ratio}%"></i></div>
      </article>
    `;
  }).join("");
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

async function openDashboard() {
  showOnly(dashboardScreenEl);
  await loadDashboard().catch(showDashboardError);
}

function showDashboardError(error) {
  examListEl.innerHTML = `<p class="loading-text">${error.message}</p>`;
}

setInterval(() => {
  if (!state.started || !state.questions.length || state.submitted || state.remainingSeconds <= 0) return;
  state.remainingSeconds -= 1;
  updateTimer();
  if (state.remainingSeconds === 0) submitTest();
}, 1000);

updateTimer();
openDashboard();
