import type { FeedbackScore } from "../types";

export type AdminSessionRow = {
  id: string;
  app_env: string | null;
  student_username: string | null;
  flow_stage: string | null;
  started_at: string;
};

export type AdminAttemptRow = {
  id: string;
  app_env: string | null;
  session_id: string;
  phase: "pretest" | "learning" | "posttest";
  question_key: string;
  grading_status: "pending" | "graded" | "failed";
  submitted_at: string;
};

export type AdminCriterionScoreRow = {
  id: number;
  attempt_id: string;
  criterion_id: string;
  criterion_label: string;
  score: number;
  reason: string | null;
};

export type AdminDataResponse = {
  ok: true;
  sessions: AdminSessionRow[];
  attempts: AdminAttemptRow[];
  pendingAttempts: AdminAttemptRow[];
  pendingAttemptCriterionScores: AdminCriterionScoreRow[];
};

type LogEventInput = {
  sessionId?: string;
  eventType: string;
  technique?: string;
  level?: number;
  payload?: Record<string, unknown>;
  timestamp?: number;
};

type SessionCreateInput = {
  username: string;
  startedAt?: number;
};

type SessionUpdateInput = {
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

type AttemptInput = {
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
  criteriaScores?: FeedbackScore["criteriaScores"];
};

type AssessmentSubmitInput = {
  sessionId: string;
  phase: "pre" | "post";
  answers: Record<
    string,
    {
      prompt: string;
      selectedChoice?: string;
      method?: string;
      rationale?: string;
    }
  >;
  survey?: {
    skillLevel?: string;
    confidence?: string;
  };
  durationSec?: number;
  submittedAt?: number;
  questionDurationsSec?: Record<string, number>;
};

type LearningGradePromptInput = {
  mode: "prompt";
  learnerPrompt: string;
  task: string;
  referencePrompt: string;
  rubric: {
    criteria: { id: string; label: string; description: string }[];
    thresholds: { green: number; yellow: number };
  };
  selectedMethod?: string;
  selectedRationale?: string;
};

type LearningGradeMethodInput = {
  mode: "method";
  task: string;
  referenceMethod?: string;
  referenceRationale?: string;
  selectedMethod: string;
  selectedRationale: string;
  rubric: {
    criteria: { id: string; label: string; description: string }[];
    thresholds: { green: number; yellow: number };
  };
};

async function postJson<TResponse>(
  url: string,
  payload: unknown,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  return (await response.json()) as TResponse;
}

async function putJson<TResponse>(
  url: string,
  payload: unknown,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  return (await response.json()) as TResponse;
}

export function createSession(input: SessionCreateInput) {
  return postJson<{ sessionId: string; username: string; startedAt: string }>(
    "/api/sessions",
    input,
  );
}

export function updateSession(input: SessionUpdateInput) {
  return putJson<{ ok: true }>("/api/sessions", input);
}

export function logEvent(input: LogEventInput) {
  return postJson<{ ok: true }>("/api/logs", input);
}

export function saveAttempt(input: AttemptInput) {
  return postJson<{ ok: true; attemptId: string }>("/api/attempts", input);
}

export function submitAssessment(input: AssessmentSubmitInput) {
  return postJson<{ ok: true }>("/api/assessments", input);
}

export function gradeLearning(
  input: LearningGradePromptInput | LearningGradeMethodInput,
) {
  return postJson<{
    generatedResponse?: string;
    feedbackScore: FeedbackScore;
    feedbackText: string;
  }>("/api/grade-learning", input);
}

export async function fetchAdminData(passcode: string, limit = 100) {
  const response = await fetch(
    `/api/admin/data?passcode=${encodeURIComponent(passcode)}&limit=${limit}`,
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  return response.json() as Promise<AdminDataResponse>;
}

export function runAdminGrading(
  passcode: string,
  limit = 20,
  appEnv?: "all" | "local" | "production",
) {
  return postJson<{
    ok: boolean;
    gradedCount: number;
    failedCount: number;
  }>("/api/admin/grade", {
    passcode,
    limit,
    appEnv: appEnv && appEnv !== "all" ? appEnv : undefined,
  });
}

export async function fetchAdminExport(
  passcode: string,
  format: "json" | "csv",
  appEnv?: "all" | "local" | "production",
) {
  const response = await fetch("/api/admin/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      passcode,
      format,
      appEnv: appEnv && appEnv !== "all" ? appEnv : undefined,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  return response;
}
