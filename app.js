import { createQuiz } from "./quiz.js";
import { fetchQuizQuestions } from "./supabase.js";
import { createQuizView } from "./ui.js";

const view = createQuizView();
let quiz;
let remainingTime = 0;
let timerId = null;

async function startGame() {
  stopTimer();
  view.renderLoading();

  try {
    const questions = await fetchQuizQuestions();
    quiz = createQuiz(questions);
    quiz.startGame();
    startLevel();
  } catch (error) {
    view.renderError(error.message);
  }
}

function startLevel() {
  remainingTime = quiz.getState().levelTimeLimit;
  renderQuestion();
  startTimer();
}

function renderQuestion() {
  view.renderQuestion(quiz.getState(remainingTime), handleAnswer);
}

function handleAnswer(optionId) {
  quiz.answer(optionId);

  if (quiz.isLastQuestionInLevel()) {
    showLevelResult();
    return;
  }

  quiz.moveToNextQuestion();
  renderQuestion();
}

function showLevelResult() {
  stopTimer();
  const levelResult = quiz.completeLevel(remainingTime);

  if (levelResult.isFinalLevel) {
    view.renderLevelResult(levelResult, showFinalResult);
    return;
  }

  view.renderLevelResult(
    levelResult,
    levelResult.isCleared ? handleNextLevel : handleRetryLevel,
  );
}

function handleNextLevel() {
  quiz.advanceLevel();
  startLevel();
}

function handleRetryLevel() {
  quiz.retryLevel();
  startLevel();
}

function showFinalResult() {
  stopTimer();
  view.renderFinalResult(quiz.getFinalResult(), startGame);
}

function startTimer() {
  stopTimer();

  timerId = window.setInterval(() => {
    remainingTime = Math.max(0, remainingTime - 1);
    view.updateTimer(quiz.getState(remainingTime));

    if (remainingTime === 0) {
      showLevelResult();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

view.onRestart(startGame);
startGame();
