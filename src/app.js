const TEST_NUMBERS = Array.from({ length: 10 }, (_, index) => index + 1);

// Static data for grades and blueprints (previously from server.py)
const GRADES_INFO = {
  "grade4": { "label": "4級", "english": "EIKEN GRADE 4", "minutes": 65 },
  "grade3": { "label": "3級", "english": "EIKEN GRADE 3", "minutes": 90 },
  "pre2": { "label": "準2級", "english": "EIKEN GRADE PRE-2", "minutes": 105 },
  "pre2plus": { "label": "準2級プラス", "english": "EIKEN GRADE PRE-2 PLUS", "minutes": 110 },
  "grade2": { "label": "2級", "english": "EIKEN GRADE 2", "minutes": 110 },
  "pre1": { "label": "準1級", "english": "EIKEN GRADE PRE-1", "minutes": 120 },
  "grade1": { "label": "1級", "english": "EIKEN GRADE 1", "minutes": 135 },
};

const BLUEPRINTS = {
  "grade4": [
    ["vocabulary", "短文の語句空所補充", "リーディング", 15, "purple"],
    ["conversation", "会話文の文空所補充", "リーディング", 5, "cyan"],
    ["ordering", "日本文付き短文の語句整序", "リーディング", 5, "amber"],
    ["reading", "長文の内容一致選択", "リーディング", 10, "green"],
    ["listening1", "会話の応答文選択", "リスニング", 10, "pink"],
    ["listening2", "会話の内容一致選択", "リスニング", 10, "pink"],
    ["listening3", "文の内容一致選択", "リスニング", 10, "pink"],
  ],
  "grade3": [
    ["vocabulary", "短文の語句空所補充", "リーディング", 15, "purple"],
    ["conversation", "会話文の空所補充", "リーディング", 5, "cyan"],
    ["reading", "長文の内容一致選択", "リーディング", 10, "green"],
    ["writing_email", "Eメール", "ライティング", 1, "amber"],
    ["writing_essay", "英作文", "ライティング", 1, "amber"],
    ["listening1", "会話の応答文選択", "リスニング", 10, "pink"],
    ["listening2", "会話の内容一致選択", "リスニング", 10, "pink"],
    ["listening3", "文の内容一致選択", "リスニング", 10, "pink"],
  ],
  "pre2": [
    ["vocabulary", "短文の語句空所補充", "リーディング", 15, "purple"],
    ["conversation", "会話文の空所補充", "リーディング", 5, "cyan"],
    ["reading_cloze", "長文の語句空所補充", "リーディング", 2, "green"],
    ["reading", "長文の内容一致選択", "リーディング", 7, "green"],
    ["writing_email", "Eメール", "ライティング", 1, "amber"],
    ["writing_essay", "英作文", "ライティング", 1, "amber"],
    ["listening1", "会話の応答文選択", "リスニング", 10, "pink"],
    ["listening2", "会話の内容一致選択", "リスニング", 10, "pink"],
    ["listening3", "文の内容一致選択", "リスニング", 10, "pink"],
  ],
  "pre2plus": [
    ["vocabulary", "短文の語句空所補充", "リーディング", 17, "purple"],
    ["reading_cloze", "長文の語句空所補充", "リーディング", 6, "green"],
    ["reading", "長文の内容一致選択", "リーディング", 8, "green"],
    ["writing_summary", "英文要約", "ライティング", 1, "amber"],
    ["writing_essay", "英作文", "ライティング", 1, "amber"],
    ["listening1", "会話の内容一致選択", "リスニング", 15, "pink"],
    ["listening2", "文の内容一致選択", "リスニング", 15, "pink"],
  ],
  "grade2": [
    ["vocabulary", "短文の語句空所補充", "リーディング", 17, "purple"],
    ["reading_cloze", "長文の語句空所補充", "リーディング", 6, "green"],
    ["reading", "長文の内容一致選択", "リーディング", 8, "green"],
    ["writing_summary", "英文要約", "ライティング", 1, "amber"],
    ["writing_essay", "英作文", "ライティング", 1, "amber"],
    ["listening1", "会話の内容一致選択", "リスニング", 15, "pink"],
    ["listening2", "文の内容一致選択", "リスニング", 15, "pink"],
  ],
  "pre1": [
    ["vocabulary", "短文の語句空所補充", "リーディング", 18, "purple"],
    ["reading_cloze", "長文の語句空所補充", "リーディング", 6, "green"],
    ["reading", "長文の内容一致選択", "リーディング", 7, "green"],
    ["writing_summary", "英文要約", "ライティング", 1, "amber"],
    ["writing_essay", "英作文", "ライティング", 1, "amber"],
    ["listening1", "会話の内容一致選択", "リスニング", 12, "pink"],
    ["listening2", "文の内容一致選択", "リスニング", 12, "pink"],
    ["listening3", "Real-Life形式の内容一致選択", "リスニング", 5, "pink"],
  ],
  "grade1": [
    ["vocabulary", "短文の語句空所補充", "リーディング", 22, "purple"],
    ["reading_cloze", "長文の語句空所補充", "リーディング", 6, "green"],
    ["reading", "長文の内容一致選択", "リーディング", 7, "green"],
    ["writing_summary", "英文要約", "ライティング", 1, "amber"],
    ["writing_essay", "英作文", "ライティング", 1, "amber"],
    ["listening1", "会話の内容一致選択", "リスニング", 10, "pink"],
    ["listening2", "文の内容一致選択", "リスニング", 10, "pink"],
    ["listening3", "Real-Life形式の内容一致選択", "リスニング", 5, "pink"],
    ["listening4", "インタビューの内容一致選択", "リスニング", 2, "pink"],
  ],
};

function getGradeSummary(gradeKey) {
  const info = GRADES_INFO[gradeKey];
  const blueprint = BLUEPRINTS[gradeKey].map(([key, label, skill, count, pill]) => ({
    key, label, skill, count, pill
  }));
  return {
    key: gradeKey,
    label: info.label,
    english: info.english,
    minutes: info.minutes,
    totalCount: blueprint.reduce((sum, p) => sum + p.count, 0),
    blueprint
  };
}

const state = {
  grades: Object.keys(GRADES_INFO).map(getGradeSummary),
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
  loadDashboard();
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

// LocalStorage helpers
function getStorageKey(grade, testNumber) {
  return `eikenQuest_result_${grade}_${testNumber}`;
}

function getWrongQuestionsKey(grade) {
  return `eikenQuest_wrong_${grade}`;
}

function loadLocalExamList(gradeKey) {
  const exams = [];
  const gradeInfo = getGradeSummary(gradeKey);
  for (let i = 1; i <= 10; i++) {
    const saved = localStorage.getItem(getStorageKey(gradeKey, i));
    if (saved) {
      const data = JSON.parse(saved);
      exams.push({
        testNumber: i,
        completed: true,
        score: data.score,
        totalCount: data.totalCount,
        percent: data.percent,
        sectionScores: data.sectionScores
      });
    } else {
      exams.push({
        testNumber: i,
        completed: false,
        score: null,
        totalCount: gradeInfo.totalCount,
        percent: null,
        sectionScores: {}
      });
    }
  }
  return exams;
}

async function loadDashboard() {
  stopAudio();
  examListEl.innerHTML = '<p class="loading-text">模擬テストを読み込み中...</p>';
  
  state.gradeInfo = getGradeSummary(state.grade);
  state.exams = loadLocalExamList(state.grade);
  
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

// Fisher-Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function prepareTest() {
  stopAudio();
  try {
    // パス候補を順番に試す（Live Server起動ディレクトリの違いに対応）
    const pathCandidates = [
      `data/${state.grade}/test_${state.testNumber}.json`,
    ];
    let response = null;
    for (const path of pathCandidates) {
      const res = await fetch(path);
      if (res.ok) { response = res; break; }
    }
    if (!response) throw new Error(`問題データを取得できませんでした。\n（パス: data/${state.grade}/test_${state.testNumber}.json）`);
    const questions = await response.json();

    // Process questions: shuffle choices
    const processedQuestions = questions.map(q => {
      const choicesWithOriginal = q.choices.map((text, index) => ({ text, original: index }));
      shuffle(choicesWithOriginal);
      const newAnswer = choicesWithOriginal.findIndex(c => c.original === q.answer);
      return {
        ...q,
        choices: choicesWithOriginal.map(c => c.text),
        answer: newAnswer,
        originalAnswer: q.answer
      };
    });

    state.gradeInfo = getGradeSummary(state.grade);
    
    // Select questions based on blueprint
    const selectedQuestions = [];
    state.gradeInfo.blueprint.forEach(part => {
      const pool = processedQuestions.filter(q => q.section === part.key);
      // section を日本語ラベルに変換して表示に使う
      pool.forEach(q => { q.sectionLabel = part.label; });
      selectedQuestions.push(...pool.slice(0, part.count));
    });

    state.questions = selectedQuestions;
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
  } catch (error) {
    sectionStatsEl.innerHTML = `<p class="loading-text">${error.message}</p>`;
  }
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
  sectionLabelEl.textContent = question.sectionLabel || question.section;
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
  resultSaveStatusEl.textContent = "結果を保存中...";
  saveResult(score, percent);
  render();
}

function saveResult(score, percent) {
  const sectionScores = {};
  state.gradeInfo.blueprint.forEach(part => {
    const correct = state.questions.reduce((total, q, idx) => {
      if (q.section !== part.label) return total;
      return total + (state.answers[idx] === q.answer ? 1 : 0);
    }, 0);
    sectionScores[part.label] = { correct, total: part.count };
  });

  const resultData = {
    score,
    percent,
    totalCount: state.questions.length,
    sectionScores,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem(getStorageKey(state.grade, state.testNumber), JSON.stringify(resultData));

  // Save wrong questions to LocalStorage
  const wrongQuestions = state.questions
    .filter((q, idx) => state.answers[idx] !== q.answer)
    .map((q, idx) => ({
      ...q,
      testNumber: state.testNumber,
      selectedAnswer: state.answers[idx] === null ? "未回答" : q.choices[state.answers[idx]],
      correctAnswer: q.choices[q.answer]
    }));

  const existingWrong = JSON.parse(localStorage.getItem(getWrongQuestionsKey(state.grade)) || "[]");
  // Basic de-duplication
  const newWrong = [...existingWrong];
  wrongQuestions.forEach(wq => {
    if (!newWrong.some(e => e.title === wq.title && e.prompt === wq.prompt)) {
      newWrong.unshift(wq);
    }
  });
  localStorage.setItem(getWrongQuestionsKey(state.grade), JSON.stringify(newWrong.slice(0, 100)));

  resultSaveStatusEl.textContent = "結果をブラウザに保存しました。";
}

async function openWrongBook(previousScreen) {
  state.previousScreen = previousScreen;
  showOnly(wrongBookScreenEl);
  wrongBookSummaryEl.textContent = "不正解問題を読み込み中...";
  wrongBookListEl.innerHTML = "";

  const questions = JSON.parse(localStorage.getItem(getWrongQuestionsKey(state.grade)) || "[]");
  wrongBookSummaryEl.textContent = questions.length
    ? `${state.gradeInfo?.label || ""}の保存済み不正解問題 ${questions.length}問を表示しています。`
    : `${state.gradeInfo?.label || ""}の保存済み不正解問題はまだありません。`;
  wrongBookListEl.innerHTML = questions.map((question, index) => wrongBookHtml(question, index)).join("");
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
  loadDashboard();
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
