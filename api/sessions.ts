import {
  BadRequestError,
  handleOptions,
  isBadRequestError,
  parseJsonBody,
  sendMethodNotAllowed,
  type ApiRequest,
  type ApiResponse,
} from "./_lib/http";
import { supabaseAdmin } from "./_lib/supabase";
import { getAppEnv } from "./_lib/appEnv";

type CreateSessionBody = {
  username: string;
  startedAt?: number;
  background?: string | null;
  pretestExperienceLevel?: string | null;
  pretestConfidence?: string | null;
};

type UpdateSessionBody = {
  sessionId: string;
  background?: string | null;
  flowStage?: string;
  pretestExperienceLevel?: string | null;
  pretestConfidence?: string | null;
  posttestConfidence?: string | null;
  learningStartedAt?: number | null;
  posttestStartedAt?: number | null;
  pretestCompletedAt?: number | null;
  posttestCompletedAt?: number | null;
  completedAt?: number | null;
  pretestDurationSec?: number | null;
  posttestDurationSec?: number | null;
  courseDurationSec?: number | null;
};

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}
const USERNAME_PATTERN = /^[a-z0-9]{2,16}$/;

function toIsoStringFromMs(value: number, fieldName: string) {
  if (!Number.isFinite(value)) {
    throw new BadRequestError(`${fieldName} must be a finite number`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${fieldName} is invalid`);
  }
  return date.toISOString();
}

function toOptionalIsoStringFromMs(
  value: number | null | undefined,
  fieldName: string,
) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return toIsoStringFromMs(value, fieldName);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const appEnv = getAppEnv();
  if (handleOptions(req, res)) {
    return;
  }

  try {
    if (req.method === "POST") {
      const body = parseJsonBody<CreateSessionBody>(req.body);
      const username = normalizeUsername(body.username || "");
      if (!username || !USERNAME_PATTERN.test(username)) {
        res.status(400).json({
          error:
            "username must be 2-16 characters and include only lowercase letters and numbers",
        });
        return;
      }

      const { data: student, error: studentError } = await supabaseAdmin
        .from("students")
        .upsert({ username }, { onConflict: "username" })
        .select("id, username")
        .single();

      if (studentError || !student) {
        throw studentError || new Error("Failed to upsert student");
      }

      const sessionPayload = {
        student_id: student.id,
        student_username: student.username,
        app_env: appEnv,
        background: body.background || null,
        pretest_experience_level: body.pretestExperienceLevel || null,
        pretest_confidence: body.pretestConfidence || null,
        started_at:
          body.startedAt !== undefined
            ? toIsoStringFromMs(body.startedAt, "startedAt")
            : new Date().toISOString(),
      };

      const { data: session, error: sessionError } = await supabaseAdmin
        .from("sessions")
        .insert(sessionPayload)
        .select("id, student_username, started_at")
        .single();

      if (sessionError || !session) {
        throw sessionError || new Error("Failed to create session");
      }

      res.status(200).json({ sessionId: session.id, username: session.student_username, startedAt: session.started_at });
      return;
    }

    if (req.method === "PUT") {
      const body = parseJsonBody<UpdateSessionBody>(req.body);
      if (!body.sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return;
      }

      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.background !== undefined) payload.background = body.background;
      if (body.flowStage !== undefined) payload.flow_stage = body.flowStage;
      if (body.pretestExperienceLevel !== undefined) payload.pretest_experience_level = body.pretestExperienceLevel;
      if (body.pretestConfidence !== undefined) payload.pretest_confidence = body.pretestConfidence;
      if (body.posttestConfidence !== undefined) payload.posttest_confidence = body.posttestConfidence;
      if (body.learningStartedAt !== undefined) payload.learning_started_at = toOptionalIsoStringFromMs(body.learningStartedAt, "learningStartedAt");
      if (body.posttestStartedAt !== undefined) payload.posttest_started_at = toOptionalIsoStringFromMs(body.posttestStartedAt, "posttestStartedAt");
      if (body.pretestCompletedAt !== undefined) payload.pretest_completed_at = toOptionalIsoStringFromMs(body.pretestCompletedAt, "pretestCompletedAt");
      if (body.posttestCompletedAt !== undefined) payload.posttest_completed_at = toOptionalIsoStringFromMs(body.posttestCompletedAt, "posttestCompletedAt");
      if (body.completedAt !== undefined) payload.completed_at = toOptionalIsoStringFromMs(body.completedAt, "completedAt");
      if (body.pretestDurationSec !== undefined) payload.pretest_duration_sec = body.pretestDurationSec;
      if (body.posttestDurationSec !== undefined) payload.posttest_duration_sec = body.posttestDurationSec;
      if (body.courseDurationSec !== undefined) payload.course_duration_sec = body.courseDurationSec;

      const { error } = await supabaseAdmin.from("sessions").update(payload).eq("id", body.sessionId);
      if (error) {
        throw error;
      }
      res.status(200).json({ ok: true });
      return;
    }

    sendMethodNotAllowed(res);
  } catch (error) {
    if (isBadRequestError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: String(error) });
  }
}
