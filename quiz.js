const LEVEL_COUNT = 10;
const QUESTIONS_PER_LEVEL = 10;
const LEVEL_TIME_LIMITS = [30, 28, 26, 24, 22, 20, 18, 16, 14, 12];
const LEVEL_CLEAR_ACCURACY = 0.6;
const DIFFICULTY_POINTS = {
  easy: 10,
  normal: 15,
  hard: 20,
};

export function createQuiz(questions) {
  let level = 1;
  let levelQuestionIndex = 0;
  let totalScore = 0;
  let totalCorrect = 0;
  let totalAnswered = 0;
  let currentLevelQuestions = [];
  let levelAnswers = [];
  let latestLevelResult = null;
  let gameComplete = false;
  let usedQuestionIds = new Set();

  function startGame() {
    level = 1;
    totalScore = 0;
    totalCorrect = 0;
    totalAnswered = 0;
    latestLevelResult = null;
    gameComplete = false;
    usedQuestionIds = new Set();
    startLevel();
  }

  function startLevel() {
    levelQuestionIndex = 0;
    levelAnswers = [];
    latestLevelResult = null;
    currentLevelQuestions = pickQuestionsForLevel(level);
  }

  function getState(remainingTime = getLevelTimeLimit()) {
    return {
      currentQuestion: currentLevelQuestions[levelQuestionIndex],
      gameComplete,
      level,
      levelQuestionIndex,
      levelTimeLimit: getLevelTimeLimit(),
      latestLevelResult,
      questionsPerLevel: QUESTIONS_PER_LEVEL,
      remainingTime,
      totalCorrect,
      totalGameQuestions: LEVEL_COUNT * QUESTIONS_PER_LEVEL,
      totalScore,
    };
  }

  function answer(optionId) {
    if (latestLevelResult || gameComplete) {
      return;
    }

    const currentQuestion = currentLevelQuestions[levelQuestionIndex];
    const selectedOption = currentQuestion.options.find((option) => option.id === optionId);
    const isCorrect = Boolean(selectedOption?.isCorrect);

    levelAnswers.push({
      isCorrect,
      points: isCorrect ? getQuestionPoints(currentQuestion) : 0,
      questionId: currentQuestion.id,
    });
  }

  function moveToNextQuestion() {
    if (levelQuestionIndex < QUESTIONS_PER_LEVEL - 1) {
      levelQuestionIndex += 1;
    }
  }

  function isLevelQuestionComplete() {
    return levelAnswers.length > levelQuestionIndex;
  }

  function isLastQuestionInLevel() {
    return levelQuestionIndex === QUESTIONS_PER_LEVEL - 1;
  }

  function completeLevel(remainingTime) {
    if (latestLevelResult) {
      return latestLevelResult;
    }

    const correctCount = levelAnswers.filter((answer) => answer.isCorrect).length;
    const baseScore = levelAnswers.reduce((sum, answer) => sum + answer.points, 0);
    const accuracy = correctCount / QUESTIONS_PER_LEVEL;
    const timeBonus = Math.floor(Math.max(0, remainingTime) * accuracy);
    const earnedScore = baseScore + timeBonus;
    const isCleared = accuracy >= LEVEL_CLEAR_ACCURACY;
    const gainedScore = isCleared ? earnedScore : 0;

    if (isCleared) {
      totalScore += gainedScore;
      totalCorrect += correctCount;
      totalAnswered += QUESTIONS_PER_LEVEL;
    }

    latestLevelResult = {
      accuracy,
      baseScore,
      correctCount,
      earnedScore,
      gainedScore,
      isCleared,
      isFinalLevel: isCleared && level === LEVEL_COUNT,
      level,
      remainingTime: Math.max(0, remainingTime),
      requiredAccuracy: LEVEL_CLEAR_ACCURACY,
      timeBonus,
      totalQuestions: QUESTIONS_PER_LEVEL,
      totalScore,
    };

    if (isCleared && level === LEVEL_COUNT) {
      gameComplete = true;
    }

    return latestLevelResult;
  }

  function advanceLevel() {
    if (level < LEVEL_COUNT) {
      level += 1;
      startLevel();
    }
  }

  function retryLevel() {
    startLevel();
  }

  function getFinalResult() {
    const accuracy = totalCorrect / (LEVEL_COUNT * QUESTIONS_PER_LEVEL);

    return {
      accuracy,
      message: getFinalMessage(accuracy),
      totalCorrect,
      totalQuestions: LEVEL_COUNT * QUESTIONS_PER_LEVEL,
      totalScore,
    };
  }

  function getLevelTimeLimit() {
    return LEVEL_TIME_LIMITS[level - 1];
  }

  function pickQuestionsForLevel(levelNumber) {
    const selectedQuestions = [];
    const selectedIds = new Set();

    while (selectedQuestions.length < QUESTIONS_PER_LEVEL) {
      let pool = questions.filter(
        (question) => !usedQuestionIds.has(question.id) && !selectedIds.has(question.id),
      );

      if (pool.length === 0) {
        usedQuestionIds = new Set();
        pool = questions.filter((question) => !selectedIds.has(question.id));
      }

      const pickedQuestion = pickWeightedQuestion(pool, levelNumber);
      selectedQuestions.push(shuffleQuestionOptions(pickedQuestion));
      selectedIds.add(pickedQuestion.id);
      usedQuestionIds.add(pickedQuestion.id);
    }

    return selectedQuestions;
  }

  function pickWeightedQuestion(pool, levelNumber) {
    const weightedPool = pool.flatMap((question) => {
      const weight = getDifficultyWeight(question.difficulty, levelNumber);
      return Array.from({ length: weight }, () => question);
    });

    return weightedPool[Math.floor(Math.random() * weightedPool.length)];
  }

  return {
    advanceLevel,
    answer,
    completeLevel,
    getFinalResult,
    getState,
    isLastQuestionInLevel,
    isLevelQuestionComplete,
    moveToNextQuestion,
    retryLevel,
    startGame,
  };
}

function getQuestionPoints(question) {
  return DIFFICULTY_POINTS[question.difficulty] ?? DIFFICULTY_POINTS.normal;
}

function getDifficultyWeight(difficulty, level) {
  const earlyWeights = { easy: 5, normal: 3, hard: 1 };
  const midWeights = { easy: 2, normal: 4, hard: 2 };
  const lateWeights = { easy: 1, normal: 3, hard: 5 };

  if (level <= 3) {
    return earlyWeights[difficulty] ?? earlyWeights.normal;
  }

  if (level <= 7) {
    return midWeights[difficulty] ?? midWeights.normal;
  }

  return lateWeights[difficulty] ?? lateWeights.normal;
}

function shuffleQuestionOptions(question) {
  return {
    ...question,
    options: shuffleArray(question.options),
  };
}

function shuffleArray(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

function getFinalMessage(accuracy) {
  if (accuracy >= 0.8) {
    return "압도적인 플레이였어요. 후반 레벨까지 안정적으로 돌파했습니다.";
  }

  if (accuracy >= 0.5) {
    return "훌륭한 결과예요. 빠른 판단으로 꽤 많은 점수를 쌓았습니다.";
  }

  return "아직 더 올라갈 여지가 있어요. 다음 플레이에서 고득점을 노려보세요.";
}
