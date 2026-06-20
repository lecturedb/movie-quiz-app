const SUPABASE_URL = "https://urntzicqganihcdismkk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_v7ybUffwkp25e2Tz-0-X2g_ar8dTIYA";

const QUESTION_SELECT =
  "id,type_code,difficulty,question,explanation,quiz_options(id,option_order,option_text,is_correct)";
const PAGE_SIZE = 1000;

export async function fetchQuizQuestions() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/quiz_questions`);

  url.searchParams.set("select", QUESTION_SELECT);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("order", "created_at.asc");

  const questions = [];
  let totalCount = null;

  while (totalCount === null || questions.length < totalCount) {
    const rangeStart = questions.length;
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        Prefer: "count=exact",
        Range: `${rangeStart}-${rangeStart + PAGE_SIZE - 1}`,
      },
    });

    if (!response.ok) {
      throw new Error("Supabase에서 퀴즈 데이터를 불러오지 못했습니다.");
    }

    const page = await response.json();

    if (!Array.isArray(page)) {
      throw new Error("Supabase 퀴즈 데이터 형식이 올바르지 않습니다.");
    }

    questions.push(...page);
    totalCount = getTotalCount(response.headers.get("content-range"));

    if (page.length === 0 || (totalCount === null && page.length < PAGE_SIZE)) {
      break;
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("표시할 퀴즈 문제가 없습니다.");
  }

  return questions.map(mapQuestionFromSupabase);
}

function getTotalCount(contentRange) {
  const total = contentRange?.split("/")[1];

  if (!total || total === "*") {
    return null;
  }

  const parsedTotal = Number(total);
  return Number.isFinite(parsedTotal) ? parsedTotal : null;
}

function mapQuestionFromSupabase(question) {
  const options = [...(question.quiz_options ?? [])]
    .sort((a, b) => a.option_order - b.option_order)
    .map((option) => ({
      id: option.id,
      isCorrect: option.is_correct,
      order: option.option_order,
      text: option.option_text,
    }));

  return {
    id: question.id,
    difficulty: question.difficulty,
    explanation: question.explanation,
    options,
    question: question.question,
    typeCode: question.type_code,
  };
}
