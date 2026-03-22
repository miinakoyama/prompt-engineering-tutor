import {
  handleOptions,
  isBadRequestError,
  parseJsonBody,
  sendMethodNotAllowed,
  type ApiRequest,
  type ApiResponse,
} from "./_lib/http";
import { supabaseAdmin } from "./_lib/supabase";
import { getAppEnv } from "./_lib/appEnv";

type CriterionScoreInput = {
  id: string;
  label: string;
  score: 0 | 1;
  reason: string;
};

type AttemptBody = {
  sessionId: string;
  phase: "pretest" | "learning" | "posttest";
  technique?: string;
  level?: number;
  questionKey: string;
  questionTitle?: string;
  promptRaw?: string;
  submittedAnswerRaw?: string;
  selectedChoice?: string;
  selectedMethod?: string;
  selectedRationale?: string;
  aiResponse?: string;
  feedbackText?: string;
  isCorrect?: boolean;
  gradingStatus?: "pending" | "graded" | "failed";
  scoreTotal?: number;
  scoreMax?: number;
  durationSec?: number;
  submittedAt?: number;
  gradedAt?: number;
  metadata?: Record<string, unknown>;
  criteriaScores?: CriterionScoreInput[];
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const appEnv = getAppEnv();
  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    sendMethodNotAllowed(res);
    return;
  }

  try {
    const body = parseJsonBody<AttemptBody>(req.body);
    if (!body.sessionId || !body.phase || !body.questionKey) {
      res.status(400).json({ error: "sessionId, phase and questionKey are required" });
      return;
    }

    const { data: insertedAttempt, error: insertError } = await supabaseAdmin
      .from("attempts")
      .insert({
        session_id: body.sessionId,
        app_env: appEnv,
        phase: body.phase,
        technique: body.technique || null,
        level: body.level || null,
        question_key: body.questionKey,
        question_title: body.questionTitle || null,
        prompt_raw: body.promptRaw || null,
        submitted_answer_raw: body.submittedAnswerRaw || null,
        selected_choice: body.selectedChoice || null,
        selected_method: body.selectedMethod || null,
        selected_rationale: body.selectedRationale || null,
        ai_response: body.aiResponse || null,
        feedback_text: body.feedbackText || null,
        is_correct: body.isCorrect ?? null,
        grading_status: body.gradingStatus || "pending",
        score_total: body.scoreTotal ?? null,
        score_max: body.scoreMax ?? null,
        submitted_at: body.submittedAt
          ? new Date(body.submittedAt).toISOString()
          : new Date().toISOString(),
        graded_at: body.gradedAt ? new Date(body.gradedAt).toISOString() : null,
        duration_sec: body.durationSec ?? null,
        metadata: body.metadata || {},
      })
      .select("id")
      .single();

    if (insertError || !insertedAttempt) {
      throw insertError || new Error("Failed to insert attempt");
    }

    if (body.criteriaScores?.length) {
      const scoreRows = body.criteriaScores.map((criterion) => ({
        attempt_id: insertedAttempt.id,
        criterion_id: criterion.id,
        criterion_label: criterion.label,
        score: criterion.score,
        reason: criterion.reason || "",
      }));
      const { error: scoreError } = await supabaseAdmin
        .from("criterion_scores")
        .insert(scoreRows);
      if (scoreError) {
        throw scoreError;
      }
    }

    res.status(200).json({ ok: true, attemptId: insertedAttempt.id });
  } catch (error) {
    if (isBadRequestError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
  }
}
