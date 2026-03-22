import {
  getQueryValue,
  handleOptions,
  sendMethodNotAllowed,
  type ApiRequest,
  type ApiResponse,
} from "../_lib/http";
import { supabaseAdmin } from "../_lib/supabase";

type SessionRow = {
  id: string;
  app_env: string | null;
  student_username: string | null;
  flow_stage: string | null;
  started_at: string;
};

type AttemptRow = {
  id: string;
  app_env: string | null;
  session_id: string;
  phase: "pretest" | "learning" | "posttest";
  question_key: string;
  grading_status: "pending" | "graded" | "failed";
  submitted_at: string;
};

type CriterionScoreRow = {
  id: number;
  attempt_id: string;
  criterion_id: string;
  criterion_label: string;
  score: number;
  reason: string | null;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (handleOptions(req, res)) {
    return;
  }
  if (req.method !== "GET") {
    sendMethodNotAllowed(res);
    return;
  }

  const configuredPasscode = process.env.ADMIN_DASHBOARD_PASSCODE;
  if (!configuredPasscode) {
    res.status(500).json({ error: "Missing ADMIN_DASHBOARD_PASSCODE" });
    return;
  }

  const passcode = getQueryValue(req.query, "passcode");
  const limitValue = Number(getQueryValue(req.query, "limit") || "100");
  const limit = Math.max(1, Math.min(Number.isFinite(limitValue) ? limitValue : 100, 500));

  if (!passcode || passcode !== configuredPasscode) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [{ data: sessions, error: sessionsError }, { data: pendingAttempts, error: pendingError }] =
      await Promise.all([
        supabaseAdmin
          .from("sessions")
          .select("id,app_env,student_username,flow_stage,started_at")
          .order("started_at", { ascending: false })
          .limit(limit),
        supabaseAdmin
          .from("attempts")
          .select("id,app_env,session_id,phase,question_key,grading_status,submitted_at")
          .in("phase", ["pretest", "posttest"])
          .eq("grading_status", "pending")
          .order("submitted_at", { ascending: true })
          .limit(limit),
      ]);

    if (sessionsError) throw sessionsError;
    if (pendingError) throw pendingError;

    const sessionRows = (sessions || []) as SessionRow[];
    const pendingAttemptRows = (pendingAttempts || []) as AttemptRow[];
    const sessionIds = sessionRows.map((session) => session.id);
    const attemptIds = pendingAttemptRows.map((attempt) => attempt.id);

    const [{ data: attempts, error: attemptsError }, { data: criterionScores, error: criteriaError }] =
      await Promise.all([
        sessionIds.length
          ? supabaseAdmin
              .from("attempts")
              .select("id,app_env,session_id,phase,question_key,grading_status,submitted_at")
              .in("session_id", sessionIds)
              .order("submitted_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        attemptIds.length
          ? supabaseAdmin
              .from("criterion_scores")
              .select("id,attempt_id,criterion_id,criterion_label,score,reason")
              .in("attempt_id", attemptIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (attemptsError) throw attemptsError;
    if (criteriaError) throw criteriaError;

    const attemptRows = (attempts || []) as AttemptRow[];
    const criterionRows = (criterionScores || []) as CriterionScoreRow[];

    res.status(200).json({
      ok: true,
      sessions: sessionRows,
      attempts: attemptRows,
      pendingAttempts: pendingAttemptRows,
      pendingAttemptCriterionScores: criterionRows,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
