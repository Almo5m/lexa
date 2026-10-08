-- Lexa — database schema. Run once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- Profiles ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  stage text not null default 'secondary',
  total_xp integer not null default 0 check (total_xp >= 0),
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  streak_last_date date,
  streak_freezes integer not null default 1,
  level_band integer check (level_band between 1 and 5),
  level_tested_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Word groups ------------------------------------------------------------
create table public.word_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Words (card content + review state) -------------------------------------
create table public.words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid references public.word_groups (id) on delete set null,
  term text not null check (char_length(term) between 2 and 40),
  card jsonb,
  card_status text not null default 'pending' check (card_status in ('pending', 'ready', 'failed')),
  ease real not null default 2.5,
  interval_days real not null default 0,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, term)
);
create index words_user_due_idx on public.words (user_id, due_at);

-- Review log --------------------------------------------------------------
create table public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  mode text not null check (mode in ('recall', 'write', 'listen', 'quiz', 'translate')),
  grade text not null check (grade in ('again', 'hard', 'good', 'easy')),
  created_at timestamptz not null default now()
);
create index review_logs_user_idx on public.review_logs (user_id, created_at desc);

-- Daily progress ----------------------------------------------------------
create table public.daily_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  new_words integer not null default 0,
  reviews integer not null default 0,
  xp integer not null default 0,
  goal_reached boolean not null default false,
  primary key (user_id, day)
);

-- AI usage (for limits and the admin dashboard) ----------------------------
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  feature text not null check (feature in ('extract', 'cards', 'tutor', 'translate')),
  ok boolean not null,
  latency_ms integer not null,
  error text,
  created_at timestamptz not null default now()
);
create index ai_usage_created_idx on public.ai_usage (created_at desc);
create index ai_usage_user_day_idx on public.ai_usage (user_id, created_at desc);

-- Admin-editable settings ---------------------------------------------------
create table public.app_settings (
  id integer primary key default 1 check (id = 1),
  values jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict do nothing;

-- Row level security -----------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.word_groups enable row level security;
alter table public.words enable row level security;
alter table public.review_logs enable row level security;
alter table public.daily_progress enable row level security;
alter table public.ai_usage enable row level security;
alter table public.app_settings enable row level security;

create policy "profiles read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "groups own" on public.word_groups for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "words own" on public.words for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "logs own read" on public.review_logs for select using (user_id = auth.uid());
create policy "logs own insert" on public.review_logs for insert with check (user_id = auth.uid());
create policy "progress own" on public.daily_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "usage admin read" on public.ai_usage for select using (public.is_admin());
create policy "settings read" on public.app_settings for select using (true);
create policy "settings admin write" on public.app_settings for update using (public.is_admin());

-- Progress columns on profiles are written by trusted server code only.
-- To prevent students from editing their own XP/streak through the public API:
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;
