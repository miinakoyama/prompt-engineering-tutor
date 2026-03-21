import { GoogleGenAI } from "@google/genai";

export type RubricCriterion = {
  id: string;
  label: string;
  description: string;
};

export type Rubric = {
  criteria: RubricCriterion[];
  thresholds: { green: number; yellow: number };
};

export type CriterionScore = {
  id: string;
  label: string;
  score: 0 | 1;
  reason: string;
};

export type FeedbackScore = {
  totalScore: number;
  maxScore: number;
  grade: "green" | "yellow" | "red";
  criteriaScores: CriterionScore[];
};

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  throw new Error("Missing GEMINI_API_KEY");
}

const ai = new GoogleGenAI({ apiKey: geminiKey });
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";

export async function callGeminiWithRetry(prompt: string, maxRetries = 3) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });
      return response.text || "No response received.";
    } catch (error) {
      lastError = error as Error;
      const errorMessage = String(error);
      if (
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED")
      ) {
        const waitTime = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("Gemini failed after retries");
}

export function parseGradingResponse(response: string, rubric: Rubric): FeedbackScore {
  const parsed = extractJsonObject(response);
  const criteriaScores: CriterionScore[] = rubric.criteria.map((criterion) => {
    const criterionScore = parsed.scores?.[criterion.id];
    return {
      id: criterion.id,
      label: criterion.label,
      score: criterionScore?.met ? 1 : 0,
      reason: criterionScore?.reason || "",
    };
  });

  const totalScore = criteriaScores.reduce((sum, current) => sum + current.score, 0);
  const maxScore = criteriaScores.length;
  const grade =
    totalScore >= rubric.thresholds.green
      ? "green"
      : totalScore >= rubric.thresholds.yellow
        ? "yellow"
        : "red";

  return { totalScore, maxScore, grade, criteriaScores };
}

export function extractFeedbackText(response: string) {
  try {
    const parsed = extractJsonObject(response);
    return String(parsed.feedback || "");
  } catch {
    return "";
  }
}

function extractJsonObject(response: string): any {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Model response did not contain JSON");
  }
  return JSON.parse(jsonMatch[0]);
}
