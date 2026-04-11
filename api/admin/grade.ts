import {
  callGeminiWithRetry,
  extractFeedbackText,
  parseGradingResponse,
  type FeedbackScore,
  type Rubric,
} from "../_lib/gemini.js";
import {
  handleOptions,
  isBadRequestError,
  parseJsonBody,
  sendMethodNotAllowed,
  type ApiRequest,
  type ApiResponse,
} from "../_lib/http.js";
import { supabaseAdmin } from "../_lib/supabase.js";
import { METHOD_RATIONALE_RUBRIC, POST_TEST_TASKS, PRE_TEST_TASKS } from "../../src/constants.js";
import type { AssessmentTask } from "../../src/types.js";
import { isMcqAssessmentTask } from "../../src/assessmentTasks.js";

type GradeRequestBody = {
  passcode?: string;
  limit?: number;
  appEnv?: "local" | "production";
};

type AttemptRow = {
  id: string;
  question_key: string;
  phase: "pretest" | "posttest";
  prompt_raw: string | null;
  selected_choice: string | null;
  selected_method: string | null;
  selected_rationale: string | null;
};

function formatCriteriaList(rubric: Rubric) {
  return rubric.criteria.map((c) => `- ${c.id}: ${c.description}`).join("\n");
}

function formatScoreTemplate(rubric: Rubric) {
  return rubric.criteria.map((c) => `    "${c.id}": { "met": true_or_false }`).join(",\n");
}

function getTask(phase: "pretest" | "posttest", questionKey: string): AssessmentTask | null {
  const match = questionKey.match(/(pre|post)-task-(\d+)/);
  if (!match) {
    return null;
  }
  const taskId = Number(match[2]);
  const taskList = phase === "pretest" ? PRE_TEST_TASKS : POST_TEST_TASKS;
  return taskList.find((task) => task.id === taskId) || null;
}

function fallbackScore(rubric: Rubric): FeedbackScore {
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

async function scorePrompt(task: AssessmentTask, prompt: string, rubric: Rubric) {
  const gradingPrompt = `You are a prompt-writing evaluator.

SCENARIO:
${task.scenario}

REQUIREMENT:
${task.requirement}

REFERENCE PROMPT:
"""${task.referencePrompt}"""

LEARNER PROMPT:
"""${prompt}"""

EVALUATION CRITERIA:
${formatCriteriaList(rubric)}

For each criterion, return met true/false.
Respond with ONLY valid JSON:
{
  "scores": {
${formatScoreTemplate(rubric)}
  },
  "feedback": "1-2 concise evaluator notes."
}`;
  const response = await callGeminiWithRetry(gradingPrompt);
  let feedbackScore: FeedbackScore;
  try {
    feedbackScore = parseGradingResponse(response, rubric);
  } catch {
    feedbackScore = fallbackScore(rubric);
  }
  return { feedbackScore, feedbackText: extractFeedbackText(response) };
}

async function scoreMethod(task: AssessmentTask, method: string, rationale: string) {
  const gradingPrompt = `You are evaluating method selection for prompt engineering.

TASK:
${task.requirement}

REFERENCE METHOD:
${task.referenceMethod || "N/A"}

REFERENCE RATIONALE:
${task.referenceRationale || "N/A"}

LEARNER METHOD:
${method}

LEARNER RATIONALE:
${rationale}

EVALUATION CRITERIA:
${formatCriteriaList(METHOD_RATIONALE_RUBRIC)}

Respond with ONLY valid JSON:
{
  "scores": {
${formatScoreTemplate(METHOD_RATIONALE_RUBRIC)}
  },
  "feedback": "1-2 concise evaluator notes."
}`;
  const response = await callGeminiWithRetry(gradingPrompt);
  let feedbackScore: FeedbackScore;
  try {
    feedbackScore = parseGradingResponse(response, METHOD_RATIONALE_RUBRIC);
  } catch {
    feedbackScore = fallbackScore(METHOD_RATIONALE_RUBRIC);
  }
  return { feedbackScore, feedbackText: extractFeedbackText(response) };
}

function scoreMcq(task: AssessmentTask, selectedChoice: string | null) {
  const isCorrect = Boolean(
    selectedChoice && task.correctChoiceId && selectedChoice === task.correctChoiceId,
  );
  const feedbackScore: FeedbackScore = {
    totalScore: isCorrect ? 1 : 0,
    maxScore: 1,
    grade: isCorrect ? "green" : "red",
    criteriaScores: [
      {
        id: "mcq_correctness",
        label: "MCQ Correctness",
        score: isCorrect ? 1 : 0,
        reason: isCorrect
          ? "Selected the correct option."
          : `Selected ${selectedChoice || "no option"}. Correct option is ${task.correctChoiceId || "N/A"}.`,
      },
    ],
  };
  return {
    feedbackScore,
    feedbackText: isCorrect
      ? "Correct answer."
      : `Incorrect answer. Correct option: ${task.correctChoiceId || "N/A"}.`,
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

  const configuredPasscode = process.env.ADMIN_DASHBOARD_PASSCODE;
  if (!configuredPasscode) {
    res.status(500).json({ error: "Missing ADMIN_DASHBOARD_PASSCODE" });
    return;
  }

  try {
    const body = parseJsonBody<GradeRequestBody>(req.body);
    if (!body.passcode || body.passcode !== configuredPasscode) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const limit = Math.max(1, Math.min(body.limit || 20, 200));
    const appEnvFilter =
      body.appEnv === "local" || body.appEnv === "production"
        ? body.appEnv
        : null;

    let attemptsQuery = supabaseAdmin
      .from("attempts")
      .select(
        "id,question_key,phase,prompt_raw,selected_choice,selected_method,selected_rationale",
      )
      .in("phase", ["pretest", "posttest"])
      // Include failed rows so "Needs retry" can be re-graded from admin.
      .in("grading_status", ["pending", "failed"])
      .order("submitted_at", { ascending: true });
    if (appEnvFilter) {
      attemptsQuery = attemptsQuery.eq("app_env", appEnvFilter);
    }
    const { data: attempts, error } = await attemptsQuery.limit(limit);

    if (error) throw error;
    const pendingAttempts = (attempts || []) as AttemptRow[];

    const gradedAttemptIds: string[] = [];
    const failedAttemptIds: string[] = [];

    for (const attempt of pendingAttempts) {
      const { data: job, error: jobError } = await supabaseAdmin
        .from("llm_jobs")
        .insert({
          attempt_id: attempt.id,
          job_type: "assessment_grading",
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (jobError || !job) {
        failedAttemptIds.push(attempt.id);
        continue;
      }

      try {
        const task = getTask(attempt.phase, attempt.question_key);
        if (!task) {
          throw new Error(`Missing task for ${attempt.id}`);
        }

        const isMcqTask = isMcqAssessmentTask(task);
        let promptResult: { feedbackScore: FeedbackScore; feedbackText: string };
        if (isMcqTask) {
          promptResult = scoreMcq(task, attempt.selected_choice);
        } else {
          if (!attempt.prompt_raw?.trim()) {
            throw new Error(`Missing prompt for ${attempt.id}`);
          }
          promptResult = await scorePrompt(task, attempt.prompt_raw, task.rubric);
        }
        let methodResult:
          | { feedbackScore: FeedbackScore; feedbackText: string }
          | undefined;
        if (task.requiresMethodSelection && attempt.selected_method) {
          methodResult = await scoreMethod(
            task,
            attempt.selected_method,
            attempt.selected_rationale || "",
          );
        }

        const totalScore =
          promptResult.feedbackScore.totalScore +
          (methodResult?.feedbackScore.totalScore || 0);
        const maxScore =
          promptResult.feedbackScore.maxScore +
          (methodResult?.feedbackScore.maxScore || 0);

        const feedbackText = [
          promptResult.feedbackText,
          methodResult?.feedbackText,
        ]
          .filter(Boolean)
          .join("\n\n");

        const criteriaRows = [
          ...promptResult.feedbackScore.criteriaScores.map((criterion) => ({
            attempt_id: attempt.id,
            criterion_id: criterion.id,
            criterion_label: criterion.label,
            score: criterion.score,
            reason: criterion.reason,
          })),
          ...(methodResult
            ? methodResult.feedbackScore.criteriaScores.map((criterion) => ({
                attempt_id: attempt.id,
                criterion_id: `method_${criterion.id}`,
                criterion_label: `Method: ${criterion.label}`,
                score: criterion.score,
                reason: criterion.reason,
              }))
            : []),
        ];

        await supabaseAdmin.from("criterion_scores").delete().eq("attempt_id", attempt.id);
        if (criteriaRows.length) {
          const { error: scoreInsertError } = await supabaseAdmin
            .from("criterion_scores")
            .insert(criteriaRows);
          if (scoreInsertError) throw scoreInsertError;
        }

        const { error: updateError } = await supabaseAdmin
          .from("attempts")
          .update({
            grading_status: "graded",
            score_total: totalScore,
            score_max: maxScore,
            feedback_text: feedbackText || null,
            graded_at: new Date().toISOString(),
          })
          .eq("id", attempt.id);
        if (updateError) throw updateError;

        await supabaseAdmin
          .from("llm_jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        gradedAttemptIds.push(attempt.id);
      } catch (jobFailure) {
        await supabaseAdmin
          .from("attempts")
          .update({ grading_status: "failed" })
          .eq("id", attempt.id);
        await supabaseAdmin
          .from("llm_jobs")
          .update({
            status: "failed",
            error_message: String(jobFailure),
            completed_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        failedAttemptIds.push(attempt.id);
      }
    }

    res.status(200).json({
      ok: true,
      appEnv: appEnvFilter || "all",
      requestedLimit: limit,
      gradedCount: gradedAttemptIds.length,
      failedCount: failedAttemptIds.length,
      gradedAttemptIds,
      failedAttemptIds,
    });
  } catch (error) {
    if (isBadRequestError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
  }
}
