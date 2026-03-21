import { handleOptions, sendMethodNotAllowed } from "../_lib/http";
import { supabaseAdmin } from "../_lib/supabase";

type ApiRequest = {
  method?: string;
  query?: Record<string, string | string[]>;
};
type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function getQueryValue(
  query: Record<string, string | string[]> | undefined,
  key: string,
) {
  const value = query?.[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

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
          .select("*")
          .order("started_at", { ascending: false })
          .limit(limit),
        supabaseAdmin
          .from("attempts")
          .select("*")
          .in("phase", ["pretest", "posttest"])
          .eq("grading_status", "pending")
          .order("submitted_at", { ascending: true })
          .limit(limit),
      ]);

    if (sessionsError) throw sessionsError;
    if (pendingError) throw pendingError;

    const sessionIds = (sessions || []).map((session) => session.id);
    const attemptIds = (pendingAttempts || []).map((attempt) => attempt.id);

    const [{ data: attempts, error: attemptsError }, { data: criterionScores, error: criteriaError }] =
      await Promise.all([
        sessionIds.length
          ? supabaseAdmin
              .from("attempts")
              .select("*")
              .in("session_id", sessionIds)
              .order("submitted_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        attemptIds.length
          ? supabaseAdmin
              .from("criterion_scores")
              .select("*")
              .in("attempt_id", attemptIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (attemptsError) throw attemptsError;
    if (criteriaError) throw criteriaError;

    res.status(200).json({
      ok: true,
      sessions: sessions || [],
      attempts: attempts || [],
      pendingAttempts: pendingAttempts || [],
      pendingAttemptCriterionScores: criterionScores || [],
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
