create extension if not exists "pgcrypto";

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id),
  student_username text not null,
  app_env text not null default 'unknown',
  background text,
  pretest_experience_level text,
  pretest_confidence text,
  posttest_confidence text,
  flow_stage text not null default 'pretest',
  started_at timestamptz not null default now(),
  learning_started_at timestamptz,
  posttest_started_at timestamptz,
  pretest_completed_at timestamptz,
  posttest_completed_at timestamptz,
  completed_at timestamptz,
  pretest_duration_sec integer,
  posttest_duration_sec integer,
  course_duration_sec integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  app_env text not null default 'unknown',
  phase text not null check (phase in ('pretest', 'learning', 'posttest')),
  technique text,
  level integer,
  question_key text not null,
  question_title text,
  prompt_raw text,
  submitted_answer_raw text,
  selected_choice text,
  selected_method text,
  selected_rationale text,
  ai_response text,
  feedback_text text,
  is_correct boolean,
  grading_status text not null default 'pending' check (grading_status in ('pending', 'graded', 'failed')),
  score_total integer,
  score_max integer,
  submitted_at timestamptz not null default now(),
  graded_at timestamptz,
  duration_sec integer,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.criterion_scores (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  criterion_id text not null,
  criterion_label text not null,
  score smallint not null,
  reason text
);

create table if not exists public.llm_jobs (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  job_type text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  app_env text not null default 'unknown',
  event_type text not null,
  technique text,
  level integer,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_student_username on public.sessions(student_username);
create index if not exists idx_sessions_app_env on public.sessions(app_env);
create index if not exists idx_attempts_session_phase on public.attempts(session_id, phase);
create index if not exists idx_attempts_app_env on public.attempts(app_env);
create index if not exists idx_attempts_grading_status on public.attempts(grading_status);
create index if not exists idx_attempts_submitted_at on public.attempts(submitted_at desc);
create index if not exists idx_events_session_created_at on public.events(session_id, created_at desc);
create index if not exists idx_events_app_env on public.events(app_env);

alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.criterion_scores enable row level security;
alter table public.llm_jobs enable row level security;
alter table public.events enable row level security;
