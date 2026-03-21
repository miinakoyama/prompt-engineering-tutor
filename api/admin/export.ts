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
  send?: (body: string) => void;
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

function toCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

function toCsvRows(rows: Record<string, unknown>[]) {
  if (!rows.length) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => toCsvValue(row[header])).join(","));
  }
  return lines.join("\n");
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
  const format = (getQueryValue(req.query, "format") || "json").toLowerCase();
  if (!passcode || passcode !== configuredPasscode) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [{ data: sessions, error: sessionsError }, { data: attempts, error: attemptsError }, { data: criteria, error: criteriaError }] =
      await Promise.all([
        supabaseAdmin.from("sessions").select("*").order("started_at", { ascending: false }),
        supabaseAdmin.from("attempts").select("*").order("submitted_at", { ascending: false }),
        supabaseAdmin.from("criterion_scores").select("*"),
      ]);

    if (sessionsError) throw sessionsError;
    if (attemptsError) throw attemptsError;
    if (criteriaError) throw criteriaError;

    if (format === "csv") {
      const attemptRows = (attempts || []).map((attempt) => ({
        app_env: attempt.app_env,
        session_id: attempt.session_id,
        phase: attempt.phase,
        technique: attempt.technique,
        level: attempt.level,
        question_key: attempt.question_key,
        prompt_raw: attempt.prompt_raw,
        selected_method: attempt.selected_method,
        selected_rationale: attempt.selected_rationale,
        score_total: attempt.score_total,
        score_max: attempt.score_max,
        grading_status: attempt.grading_status,
        duration_sec: attempt.duration_sec,
        submitted_at: attempt.submitted_at,
        graded_at: attempt.graded_at,
      }));
      const csv = toCsvRows(attemptRows);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="prompt-mentor-attempts-${Date.now()}.csv"`,
      );
      if (typeof res.send === "function") {
        res.status(200);
        res.send(csv);
      } else {
        res.status(200).json({ csv });
      }
      return;
    }

    res.status(200).json({
      ok: true,
      exportedAt: new Date().toISOString(),
      sessions: sessions || [],
      attempts: attempts || [],
      criterionScores: criteria || [],
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
