alter table if exists public.sessions
  add column if not exists app_env text not null default 'unknown';

alter table if exists public.attempts
  add column if not exists app_env text not null default 'unknown';

alter table if exists public.events
  add column if not exists app_env text not null default 'unknown';

create index if not exists idx_sessions_app_env on public.sessions(app_env);
create index if not exists idx_attempts_app_env on public.attempts(app_env);
create index if not exists idx_events_app_env on public.events(app_env);
