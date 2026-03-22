import {
  handleOptions,
  isBadRequestError,
  parseJsonBody,
  sendMethodNotAllowed,
  type ApiRequest,
  type ApiResponse,
} from "../_lib/http";
import { supabaseAdmin } from "../_lib/supabase";

type ExportRequestBody = {
  passcode?: string;
  format?: "json" | "csv";
  appEnv?: "local" | "production";
  limit?: number;
};

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
  const headers: string[] = [];
  const headerSet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headerSet.has(key)) {
        headerSet.add(key);
        headers.push(key);
      }
    }
  }
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => toCsvValue(row[header])).join(","));
  }
  return lines.join("\n");
}

function parseTimestamp(value: unknown) {
  if (!value) {
    return 0;
  }
  const timestamp = new Date(String(value)).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getLatestAttemptByQuestion(attempts: any[], phase: "pretest" | "posttest") {
  const latestByQuestion = new Map<string, any>();
  for (const attempt of attempts) {
    if (attempt.phase !== phase) {
      continue;
    }
    const key = String(attempt.question_key || "");
    const existing = latestByQuestion.get(key);
    if (!existing || parseTimestamp(attempt.submitted_at) > parseTimestamp(existing.submitted_at)) {
      latestByQuestion.set(key, attempt);
    }
  }
  return Array.from(latestByQuestion.values());
}

function summarizePhase(attempts: any[], phase: "pretest" | "posttest") {
  const latestAttempts = getLatestAttemptByQuestion(attempts, phase);
  let scoreTotal = 0;
  let scoreMax = 0;
  for (const attempt of latestAttempts) {
    if (typeof attempt.score_total === "number") {
      scoreTotal += attempt.score_total;
    }
    if (typeof attempt.score_max === "number") {
      scoreMax += attempt.score_max;
    }
  }
  const statusCounts = latestAttempts.reduce(
    (acc, attempt) => {
      const status = String(attempt.grading_status || "pending");
      if (status === "graded") acc.graded += 1;
      else if (status === "failed") acc.failed += 1;
      else acc.pending += 1;
      return acc;
    },
    { graded: 0, pending: 0, failed: 0 },
  );
  return {
    scoreTotal,
    scoreMax,
    scorePct: scoreMax > 0 ? Math.round((scoreTotal / scoreMax) * 1000) / 10 : null,
    questionCount: latestAttempts.length,
    ...statusCounts,
  };
}

function toColumnKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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

  let body: ExportRequestBody;
  try {
    body = parseJsonBody<ExportRequestBody>(req.body);
  } catch (error) {
    if (isBadRequestError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
    return;
  }

  const passcode = body.passcode;
  const format = (body.format || "json").toLowerCase();
  const appEnv = (body.appEnv || "").toLowerCase();
  const limit = Math.max(100, Math.min(body.limit || 3000, 10000));
  if (!passcode || passcode !== configuredPasscode) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [{ data: sessions, error: sessionsError }, { data: attempts, error: attemptsError }] =
      await Promise.all([
        supabaseAdmin
          .from("sessions")
          .select(
            "id,app_env,student_username,background,flow_stage,pretest_experience_level,pretest_confidence,posttest_confidence,started_at,pretest_completed_at,posttest_completed_at,completed_at,pretest_duration_sec,posttest_duration_sec,course_duration_sec",
          )
          .order("started_at", { ascending: false })
          .limit(limit),
        supabaseAdmin
          .from("attempts")
          .select(
            "id,app_env,session_id,phase,question_key,question_title,prompt_raw,submitted_answer_raw,selected_choice,selected_method,selected_rationale,feedback_text,grading_status,score_total,score_max,submitted_at,graded_at,duration_sec",
          )
          .order("submitted_at", { ascending: false })
          .limit(limit * 4),
      ]);

    if (sessionsError) throw sessionsError;
    if (attemptsError) throw attemptsError;
    const attemptIds = (attempts || []).map((attempt) => attempt.id);
    const { data: criteria, error: criteriaError } = attemptIds.length
      ? await supabaseAdmin
          .from("criterion_scores")
          .select("attempt_id,criterion_id,criterion_label,score,reason")
          .in("attempt_id", attemptIds)
      : { data: [], error: null };
    if (criteriaError) throw criteriaError;

    const shouldFilterByEnv = appEnv === "local" || appEnv === "production";
    const filteredSessions = shouldFilterByEnv
      ? (sessions || []).filter((session) => (session.app_env || "").toLowerCase() === appEnv)
      : sessions || [];
    const filteredAttempts = shouldFilterByEnv
      ? (attempts || []).filter((attempt) => (attempt.app_env || "").toLowerCase() === appEnv)
      : attempts || [];
    const filteredAttemptIds = new Set(filteredAttempts.map((attempt) => attempt.id));
    const filteredCriteria = shouldFilterByEnv
      ? (criteria || []).filter((criterion) => filteredAttemptIds.has(criterion.attempt_id))
      : criteria || [];

    if (format === "csv") {
      const attemptsBySessionId: Record<string, any[]> = (filteredAttempts || []).reduce(
        (acc: Record<string, any[]>, attempt) => {
          if (!acc[attempt.session_id]) {
            acc[attempt.session_id] = [];
          }
          acc[attempt.session_id].push(attempt);
          return acc;
        },
        {} as Record<string, any[]>,
      );
      const criteriaByAttemptId: Record<string, any[]> = (filteredCriteria || []).reduce(
        (acc: Record<string, any[]>, criterion) => {
          if (!acc[criterion.attempt_id]) {
            acc[criterion.attempt_id] = [];
          }
          acc[criterion.attempt_id].push(criterion);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      const sessionsByUser: Record<string, any[]> = (filteredSessions || []).reduce(
        (acc: Record<string, any[]>, session) => {
          const username = String(session.student_username || "").trim().toLowerCase() || "unknown";
          if (!acc[username]) {
            acc[username] = [];
          }
          acc[username].push(session);
          return acc;
        },
        {} as Record<string, any[]>,
      );

      const userRows = Object.entries(sessionsByUser).map(([username, userSessions]) => {
        const sortedSessions = [...userSessions].sort(
          (a, b) => parseTimestamp(b.started_at) - parseTimestamp(a.started_at),
        );
        const latestSession = sortedSessions[0];
        const userSessionIds = new Set(sortedSessions.map((session) => session.id));
        const attemptsAllSessions = (filteredAttempts || []).filter((attempt) =>
          userSessionIds.has(attempt.session_id),
        );
        const latestSessionAttempts = attemptsBySessionId[latestSession.id] || [];

        const pretest = summarizePhase(latestSessionAttempts, "pretest");
        const posttest = summarizePhase(latestSessionAttempts, "posttest");
        const latestLearningAttempts = latestSessionAttempts.filter(
          (attempt) => attempt.phase === "learning",
        );
        const learningStepsCompleted = new Set(
          latestLearningAttempts.map((attempt) => attempt.question_key).filter(Boolean),
        ).size;

        const row: Record<string, unknown> = {
          app_env_latest: latestSession.app_env,
          student_username: username,
          session_count: sortedSessions.length,
          latest_session_id: latestSession.id,
          latest_started_at: latestSession.started_at,
          background_latest: latestSession.background,
          flow_stage_latest: latestSession.flow_stage,
          pretest_completed_at_latest: latestSession.pretest_completed_at,
          posttest_completed_at_latest: latestSession.posttest_completed_at,
          completed_at_latest: latestSession.completed_at,
          pretest_experience_level_latest: latestSession.pretest_experience_level,
          pretest_confidence_latest: latestSession.pretest_confidence,
          posttest_confidence_latest: latestSession.posttest_confidence,
          pretest_questions_latest: pretest.questionCount,
          pretest_score_total_latest: pretest.scoreTotal,
          pretest_score_max_latest: pretest.scoreMax,
          pretest_score_pct_latest: pretest.scorePct,
          pretest_graded_count_latest: pretest.graded,
          pretest_pending_count_latest: pretest.pending,
          pretest_failed_count_latest: pretest.failed,
          posttest_questions_latest: posttest.questionCount,
          posttest_score_total_latest: posttest.scoreTotal,
          posttest_score_max_latest: posttest.scoreMax,
          posttest_score_pct_latest: posttest.scorePct,
          posttest_graded_count_latest: posttest.graded,
          posttest_pending_count_latest: posttest.pending,
          posttest_failed_count_latest: posttest.failed,
          learning_steps_completed_latest: learningStepsCompleted,
          attempts_total_all_sessions: attemptsAllSessions.length,
          pretest_duration_sec_latest: latestSession.pretest_duration_sec,
          posttest_duration_sec_latest: latestSession.posttest_duration_sec,
          course_duration_sec_latest: latestSession.course_duration_sec,
        };

        for (const attempt of latestSessionAttempts) {
          const questionKey = String(attempt.question_key || "unknown");
          const prefix = `q_${toColumnKey(questionKey)}`;
          row[`${prefix}_phase`] = attempt.phase;
          row[`${prefix}_title`] = attempt.question_title;
          row[`${prefix}_submitted_at`] = attempt.submitted_at;
          row[`${prefix}_graded_at`] = attempt.graded_at;
          row[`${prefix}_duration_sec`] = attempt.duration_sec;
          row[`${prefix}_grading_status`] = attempt.grading_status;
          row[`${prefix}_prompt`] = attempt.prompt_raw;
          row[`${prefix}_submitted_answer`] = attempt.submitted_answer_raw;
          row[`${prefix}_selected_choice`] = attempt.selected_choice;
          row[`${prefix}_selected_method`] = attempt.selected_method;
          row[`${prefix}_selected_rationale`] = attempt.selected_rationale;
          row[`${prefix}_score_total`] = attempt.score_total;
          row[`${prefix}_score_max`] = attempt.score_max;
          row[`${prefix}_score_out_of_4`] =
            typeof attempt.score_total === "number" && typeof attempt.score_max === "number"
              ? `${attempt.score_total}/${attempt.score_max}`
              : "";
          row[`${prefix}_feedback`] = attempt.feedback_text;

          const criteriaRowsForAttempt = criteriaByAttemptId[attempt.id] || [];
          for (const criterion of criteriaRowsForAttempt) {
            const criterionKey = toColumnKey(
              criterion.criterion_label || criterion.criterion_id || "criterion",
            );
            row[`${prefix}_criterion_${criterionKey}_score`] = criterion.score;
            row[`${prefix}_criterion_${criterionKey}_reason`] = criterion.reason;
          }
        }

        return row;
      });

      const csv = toCsvRows(userRows);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="prompt-mentor-users-${Date.now()}.csv"`,
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
      appEnv: shouldFilterByEnv ? appEnv : "all",
      limit,
      sessions: filteredSessions,
      attempts: filteredAttempts,
      criterionScores: filteredCriteria,
    });
  } catch (error) {
    if (isBadRequestError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
  }
}
