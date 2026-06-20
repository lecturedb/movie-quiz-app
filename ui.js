export function createQuizView() {
  const gameCard = document.querySelector(".game-card");
  const quizView = document.querySelector("#quiz-view");
  const levelResultView = document.querySelector("#level-result-view");
  const finalResultView = document.querySelector("#final-result-view");
  const hudScore = document.querySelector("#hud-score");
  const hudLevel = document.querySelector("#hud-level");
  const hudQuestion = document.querySelector("#hud-question");
  const hudTime = document.querySelector("#hud-time");
  const progressValue = document.querySelector("#progress-value");
  const questionNumber = document.querySelector("#question-number");
  const questionText = document.querySelector("#question-text");
  const choicesContainer = document.querySelector("#choices");
  const levelResultTitle = document.querySelector("#level-result-title");
  const levelResultCorrect = document.querySelector("#level-result-correct");
  const levelGainedScore = document.querySelector("#level-gained-score");
  const levelBreakdown = document.querySelector("#level-breakdown");
  const levelActionButton = document.querySelector("#level-action-button");
  const finalScore = document.querySelector("#final-score");
  const finalCorrect = document.querySelector("#final-correct");
  const finalMessage = document.querySelector("#final-message");
  const restartButton = document.querySelector("#restart-button");

  function renderQuestion(state, onAnswer) {
    const { currentQuestion, level, levelQuestionIndex, questionsPerLevel, remainingTime, totalScore } =
      state;
    const currentNumber = levelQuestionIndex + 1;
    const progress = (currentNumber / questionsPerLevel) * 100;

    showView("quiz");
    gameCard.classList.remove("is-status");
    hudScore.textContent = totalScore;
    hudLevel.textContent = level;
    hudQuestion.textContent = `${currentNumber} / ${questionsPerLevel}`;
    hudTime.textContent = remainingTime;
    questionNumber.textContent = `QUESTION ${String(currentNumber).padStart(2, "0")}`;
    questionText.textContent = currentQuestion.question;
    progressValue.style.width = `${progress}%`;
    progressValue.setAttribute("aria-valuenow", currentNumber);
    progressValue.setAttribute("aria-valuemax", questionsPerLevel);
    choicesContainer.replaceChildren();

    currentQuestion.options.forEach((option, index) => {
      const button = document.createElement("button");
      const indexLabel = document.createElement("span");

      button.className = "choice-button";
      button.type = "button";
      indexLabel.className = "choice-index";
      indexLabel.textContent = String.fromCharCode(65 + index);
      button.append(indexLabel, option.text);
      button.addEventListener("click", () => onAnswer(option.id));
      choicesContainer.append(button);
    });
  }

  function updateTimer(state) {
    hudTime.textContent = state.remainingTime;
    hudScore.textContent = state.totalScore;
  }

  function renderLevelResult(result, onAction) {
    showView("level");
    hudScore.textContent = result.totalScore;
    levelResultTitle.textContent = result.isCleared
      ? `Level ${result.level} Clear`
      : `Level ${result.level} Retry`;
    levelResultCorrect.textContent = `정답 ${result.correctCount} / ${result.totalQuestions} · 정답률 ${Math.round(result.accuracy * 100)}%`;
    levelGainedScore.textContent = `+${result.gainedScore}`;
    levelBreakdown.textContent = result.isCleared
      ? `정답 점수 ${result.baseScore} + 시간 보너스 ${result.timeBonus} (${result.remainingTime}초 × 정답률 ${Math.round(result.accuracy * 100)}%)`
      : `클리어 기준 ${Math.round(result.requiredAccuracy * 100)}% 미만이라 점수는 반영되지 않아요. 다시 도전해보세요.`;
    levelActionButton.textContent = getLevelActionLabel(result);
    levelActionButton.onclick = onAction;
    levelActionButton.focus();
  }

  function renderFinalResult(result, onRestart) {
    showView("final");
    hudScore.textContent = result.totalScore;
    finalScore.textContent = result.totalScore;
    finalCorrect.textContent = `정답 ${result.totalCorrect} / ${result.totalQuestions}`;
    finalMessage.textContent = result.message;
    restartButton.onclick = onRestart;
    restartButton.focus();
  }

  function renderLoading() {
    showView("quiz");
    gameCard.classList.add("is-status");
    hudScore.textContent = "0";
    hudLevel.textContent = "-";
    hudQuestion.textContent = "- / -";
    hudTime.textContent = "-";
    progressValue.style.width = "0%";
    questionNumber.textContent = "LOADING";
    questionText.textContent = "Supabase에서 영화 퀴즈 데이터를 불러오고 있어요.";
    choicesContainer.replaceChildren();
  }

  function renderError(message) {
    showView("quiz");
    gameCard.classList.add("is-status");
    hudScore.textContent = "0";
    hudLevel.textContent = "!";
    hudQuestion.textContent = "- / -";
    hudTime.textContent = "-";
    progressValue.style.width = "0%";
    questionNumber.textContent = "ERROR";
    questionText.textContent = message;
    choicesContainer.replaceChildren();
  }

  function onRestart(handler) {
    restartButton.addEventListener("click", handler);
  }

  function showView(viewName) {
    quizView.hidden = viewName !== "quiz";
    levelResultView.hidden = viewName !== "level";
    finalResultView.hidden = viewName !== "final";
  }

  return {
    onRestart,
    renderError,
    renderFinalResult,
    renderLevelResult,
    renderLoading,
    renderQuestion,
    updateTimer,
  };
}

function getLevelActionLabel(result) {
  if (!result.isCleared) {
    return "다시 도전";
  }

  return result.isFinalLevel ? "최종 결과 보기" : "다음 레벨";
}
