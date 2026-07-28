import { TestQuestion, TestQuestionType } from "../../types";
import { uid } from "../../lib/utils";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface RawQuestion {
  type: TestQuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string | number;
  points?: number;
}

interface GeneratedTest {
  questions: TestQuestion[];
  sources: { title: string; url: string }[];
}

/**
 * Generates a quiz on `topic` using OpenRouter's web-search plugin (:online)
 * so questions are grounded in current information, not just model memory.
 * Always uses GPT-4o via OpenRouter regardless of the user's chat model
 * selection — Groq has no web-search plugin.
 */
/**
 * Generates a quiz on `userPrompt` using OpenRouter's web-search plugin (:online)
 * so questions are grounded in current information, not just model memory.
 */
export async function generateTestWithWebSearch(
  userPrompt: string,
  questionCount: number,
  mcqCount: number,
): Promise<GeneratedTest> {
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("REACT_APP_OPENROUTER_API_KEY is not configured");

  const shortCount = Math.max(0, questionCount - mcqCount);

  const prompt = [
    `Составь тест из ${questionCount} вопросов по следующему промпту/инструкции: "${userPrompt}".`,
    `${mcqCount} вопросов должны быть с вариантами ответа (type: "mcq", 4 варианта в options, correctAnswer — индекс правильного варианта начиная с 0).`,
    `${shortCount} вопросов должны быть с коротким текстовым ответом (type: "short", correctAnswer — ожидаемый ответ текстом).`,
    `Используй актуальную информацию из интернета по теме, если это уместно (факты, даты, определения).`,
    `Каждому вопросу назначь points от 1 до 5 в зависимости от сложности.`,
    `Ответь СТРОГО в виде JSON объекта вида { "questions": [...] } без каких-либо пояснений вокруг.`,
  ].join(" ");

  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nexo-eos.app",
      "X-Title": "NexoGPT",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",
      messages: [
        {
          role: "system",
          content: "Ты — генератор учебных тестов. Всегда отвечай только валидным JSON, без markdown-разметки и пояснений.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    }),
  });

  if (!resp.ok) {
    throw new Error(`OpenRouter ${resp.status}: ${await resp.text()}`);
  }

  const json = await resp.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "{}";
  const citations: { title?: string; url: string }[] = json?.citations
    ?? json?.choices?.[0]?.message?.annotations?.map((a: any) => a?.url_citation).filter(Boolean)
    ?? [];

  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
  }

  let parsed: { questions: RawQuestion[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON for the test");
  }

  const questions: TestQuestion[] = (parsed.questions ?? []).map((q: any) => parseQuestion(q));

  const sources = citations
    .filter((c) => c?.url)
    .map((c) => ({ title: c.title ?? c.url, url: c.url }));

  return { questions, sources };
}

/**
 * Edits/Refines existing test questions using AI based on a human prompt.
 */
export async function editTestWithAI(
  currentQuestions: TestQuestion[],
  editPrompt: string,
): Promise<TestQuestion[]> {
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("REACT_APP_OPENROUTER_API_KEY is not configured");

  const prompt = [
    `У меня есть существующий тест с вопросами (в формате JSON):`,
    JSON.stringify(currentQuestions, null, 2),
    `Отредактируй или дополни этот тест согласно следующей инструкции пользователя: "${editPrompt}".`,
    `Можешь изменять формулировки вопросов, добавлять/удалять варианты ответов, менять сложность, переводить на другой язык или добавлять новые вопросы.`,
    `Каждому вопросу назначь points от 1 до 5.`,
    `Ответь СТРОГО в виде JSON объекта вида { "questions": [...] } без каких-либо пояснений вокруг.`,
  ].join("\n\n");

  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nexo-eos.app",
      "X-Title": "NexoGPT",
    },
    body: JSON.stringify({
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",
      messages: [
        {
          role: "system",
          content: "Ты — редактор учебных тестов. Всегда отвечай только валидным JSON, без markdown-разметки и пояснений.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    }),
  });

  if (!resp.ok) {
    throw new Error(`OpenRouter ${resp.status}: ${await resp.text()}`);
  }

  const json = await resp.json();
  const content: string = json?.choices?.[0]?.message?.content ?? "{}";

  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
  }

  let parsed: { questions: RawQuestion[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON for edited test");
  }

  return (parsed.questions ?? []).map((q: any) => parseQuestion(q));
}

function parseQuestion(q: any): TestQuestion {
  const type = q.type === "short" ? "short" : (q.options || q.choices || q.variants ? "mcq" : "short");
  const prompt = String(q.prompt || q.question || q.text || "");
  const rawOptions = q.options || q.choices || q.variants || [];
  
  let correctAnswer = q.correctAnswer !== undefined 
    ? q.correctAnswer 
    : (q.correct_answer !== undefined 
        ? q.correct_answer 
        : (q.answer !== undefined ? q.answer : (q.correct !== undefined ? q.correct : 0)));

  if (type === "mcq" && rawOptions.length > 0) {
    if (typeof correctAnswer === "string") {
      const cleanAns = correctAnswer.trim().toLowerCase();
      const idx = rawOptions.findIndex((opt: any) => String(opt).trim().toLowerCase() === cleanAns);
      if (idx !== -1) {
        correctAnswer = idx;
      } else {
        const parsedIdx = parseInt(correctAnswer, 10);
        if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < rawOptions.length) {
          correctAnswer = parsedIdx;
        } else {
          correctAnswer = 0;
        }
      }
    } else if (typeof correctAnswer === "number") {
      if (correctAnswer < 0 || correctAnswer >= rawOptions.length) {
        correctAnswer = 0;
      }
    } else {
      correctAnswer = 0;
    }
  } else {
    correctAnswer = String(correctAnswer ?? "");
  }

  const res: TestQuestion = {
    id: q.id ? String(q.id) : uid("q"),
    type,
    prompt,
    correctAnswer,
    points: Number(q.points || q.score) || 1,
  };
  if (type === "mcq") {
    res.options = rawOptions.map(String);
  }
  return res;
}
