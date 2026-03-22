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

type AssessmentAnswer = {
  prompt: string;
  method?: string;
  rationale?: string;
};

type AssessmentSubmissionBody = {
  sessionId: string;
  phase: "pre" | "post";
  answers: Record<string, AssessmentAnswer>;
  survey?: {
    skillLevel?: string;
    confidence?: string;
  };
  durationSec?: number;
  submittedAt?: number;
  questionDurationsSec?: Record<string, number>;
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
    const body = parseJsonBody<AssessmentSubmissionBody>(req.body);
    if (!body.sessionId || !body.phase || !body.answers) {
      res.status(400).json({ error: "sessionId, phase, and answers are required" });
      return;
    }

    const submittedAtIso = body.submittedAt
      ? new Date(body.submittedAt).toISOString()
      : new Date().toISOString();
    const attemptRows = Object.entries(body.answers).map(([taskId, answer]) => ({
      session_id: body.sessionId,
      app_env: appEnv,
      phase: body.phase === "pre" ? "pretest" : "posttest",
      question_key: `${body.phase}-task-${taskId}`,
      question_title: `${body.phase.toUpperCase()} task ${taskId}`,
      prompt_raw: answer.prompt || "",
      selected_method: answer.method || null,
      selected_rationale: answer.rationale || null,
      grading_status: "pending",
      score_max: 4,
      submitted_at: submittedAtIso,
      duration_sec: body.questionDurationsSec?.[taskId] ?? body.durationSec ?? null,
      metadata: {
        source: "assessment_submit",
        phaseDurationSec: body.durationSec ?? null,
      },
    }));

    const { error: attemptsError } = await supabaseAdmin
      .from("attempts")
      .insert(attemptRows);

    if (attemptsError) {
      throw attemptsError;
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      flow_stage: body.phase === "pre" ? "learning" : "done",
    };
    if (body.phase === "pre") {
      updatePayload.pretest_completed_at = submittedAtIso;
      updatePayload.pretest_duration_sec = body.durationSec ?? null;
      updatePayload.learning_started_at = new Date().toISOString();
      if (body.survey?.skillLevel !== undefined) {
        updatePayload.pretest_experience_level = body.survey.skillLevel;
      }
      if (body.survey?.confidence !== undefined) {
        updatePayload.pretest_confidence = body.survey.confidence;
      }
    } else {
      updatePayload.posttest_completed_at = submittedAtIso;
      updatePayload.posttest_duration_sec = body.durationSec ?? null;
      updatePayload.completed_at = submittedAtIso;
      if (body.survey?.confidence !== undefined) {
        updatePayload.posttest_confidence = body.survey.confidence;
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("sessions")
      .update(updatePayload)
      .eq("id", body.sessionId);

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    if (isBadRequestError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
  }
}
