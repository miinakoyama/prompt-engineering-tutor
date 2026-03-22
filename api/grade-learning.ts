import {
  callGeminiWithRetry,
  extractFeedbackText,
  parseGradingResponse,
  type FeedbackScore,
  type Rubric,
} from "./_lib/gemini.js";
import {
  handleOptions,
  isBadRequestError,
  parseJsonBody,
  sendMethodNotAllowed,
  type ApiRequest,
  type ApiResponse,
} from "./_lib/http.js";

type PromptModeBody = {
  mode: "prompt";
  learnerPrompt: string;
  task: string;
  referencePrompt: string;
  rubric: Rubric;
  selectedMethod?: string;
  selectedRationale?: string;
};

type MethodModeBody = {
  mode: "method";
  task: string;
  referenceMethod?: string;
  referenceRationale?: string;
  selectedMethod: string;
  selectedRationale: string;
  rubric: Rubric;
};

type RequestBody = PromptModeBody | MethodModeBody;

function formatCriteriaList(rubric: Rubric) {
  return rubric.criteria.map((c) => `- ${c.id}: ${c.description}`).join("\n");
}

function formatScoreTemplate(rubric: Rubric) {
  return rubric.criteria.map((c) => `    "${c.id}": { "met": true_or_false }`).join(",\n");
}

function toFallbackScore(rubric: Rubric): FeedbackScore {
  return {
    totalScore: 0,
    maxScore: rubric.criteria.length,
    grade: "red",
    criteriaScores: rubric.criteria.map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      score: 0,
      reason: "",
    })),
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (handleOptions(req, res)) {
    return;
  }
  if (req.method !== "POST") {
    sendMethodNotAllowed(res);
    return;
  }

  try {
    const body = parseJsonBody<RequestBody>(req.body);
    if (body.mode === "method") {
      const gradingPrompt = `You are evaluating method selection for prompt engineering.

TASK:
${body.task}

REFERENCE METHOD:
${body.referenceMethod || "N/A"}

REFERENCE RATIONALE:
${body.referenceRationale || "N/A"}

LEARNER METHOD:
${body.selectedMethod}

LEARNER RATIONALE:
${body.selectedRationale}

EVALUATION CRITERIA:
${formatCriteriaList(body.rubric)}

Respond with ONLY valid JSON:
{
  "scores": {
${formatScoreTemplate(body.rubric)}
  },
  "feedback": "2-3 sentences of concise feedback on method choice quality."
}`;

      const gradingResponse = await callGeminiWithRetry(gradingPrompt);
      let feedbackScore: FeedbackScore;
      try {
        feedbackScore = parseGradingResponse(gradingResponse, body.rubric);
      } catch {
        feedbackScore = toFallbackScore(body.rubric);
      }
      const feedbackText = extractFeedbackText(gradingResponse);
      res.status(200).json({
        mode: "method",
        feedbackScore,
        feedbackText:
          feedbackText ||
          "Nice start. Refine your method rationale to align with task structure.",
      });
      return;
    }

    const promptResult = await callGeminiWithRetry(body.learnerPrompt);
    const methodContext = body.selectedMethod
      ? `\nSELECTED METHOD:\n${body.selectedMethod}\n\nLEARNER RATIONALE:\n"""${body.selectedRationale || ""}"""\n`
      : "";

    const gradingPrompt = `You are a warm, encouraging prompt-writing instructor using reference-guided grading.

TASK ASSIGNED TO LEARNER:
${body.task}

REFERENCE PROMPT (gold standard):
"""${body.referencePrompt}"""

LEARNER'S PROMPT:
"""${body.learnerPrompt}"""

AI RESPONSE TO LEARNER'S PROMPT:
"""${promptResult}"""
${methodContext}

EVALUATION CRITERIA:
${formatCriteriaList(body.rubric)}

INSTRUCTIONS:
1. Compare the learner's prompt against the reference prompt
2. For each criterion, determine if the learner's prompt meets it (true/false)
3. Write encouraging, constructive feedback in 2-3 sentences.

Respond with ONLY valid JSON in this exact format:
{
  "scores": {
${formatScoreTemplate(body.rubric)}
  },
  "feedback": "2-3 sentences of warm, constructive feedback."
}`;

    const gradingResponse = await callGeminiWithRetry(gradingPrompt);
    let feedbackScore: FeedbackScore;
    try {
      feedbackScore = parseGradingResponse(gradingResponse, body.rubric);
    } catch {
      feedbackScore = toFallbackScore(body.rubric);
    }

    const feedbackText = extractFeedbackText(gradingResponse);
    res.status(200).json({
      mode: "prompt",
      generatedResponse: promptResult,
      feedbackScore,
      feedbackText:
        feedbackText ||
        "Good effort! Try adding more specific details to make your prompt clearer.",
    });
  } catch (error) {
    if (isBadRequestError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
  }
}
