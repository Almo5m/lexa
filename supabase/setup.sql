-- Lexa — complete database setup.
--
-- Run THIS ONE FILE in the Supabase SQL editor. It is safe to run as many times as you like,
-- on an empty database or on one that already has any earlier version of Lexa:
-- it creates what is missing and fixes what is outdated, and never deletes data.

create extension if not exists "pgcrypto";

-- Profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  stage text not null default 'secondary',
  total_xp integer not null default 0 check (total_xp >= 0),
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  streak_last_date date,
  streak_freezes integer not null default 1,
  created_at timestamptz not null default now()
);

-- Columns added in later phases
alter table public.profiles add column if not exists level_band integer check (level_band between 1 and 5);
alter table public.profiles add column if not exists level_tested_at timestamptz;
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists onboarded boolean not null default false;
alter table public.profiles add column if not exists daily_minutes integer not null default 15;
alter table public.profiles drop constraint if exists profiles_daily_minutes_check;
alter table public.profiles add constraint profiles_daily_minutes_check check (daily_minutes in (15, 30, 45));

alter table public.profiles drop constraint if exists profiles_interests_check;
alter table public.profiles add constraint profiles_interests_check
  check (
    cardinality(interests) <= 6
    and interests <@ array['football','gaming','music','movies','social','cooking','cars','travel','drawing','tech','fashion','fitness']
  );

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Word groups --------------------------------------------------------------
create table if not exists public.word_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Words (card content + review state) --------------------------------------
create table if not exists public.words (
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
create index if not exists words_user_due_idx on public.words (user_id, due_at);

-- Words that come from the learning path (source 'path') start with a hand-written card
-- (enriched = false) that the AI later fills with examples and a memory hook.
alter table public.words add column if not exists source text not null default 'own';
alter table public.words add column if not exists unit_id text;
alter table public.words add column if not exists enriched boolean not null default true;
alter table public.words drop constraint if exists words_source_check;
alter table public.words add constraint words_source_check check (source in ('own', 'path', 'school'));

-- Review log ---------------------------------------------------------------
create table if not exists public.review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  mode text not null,
  grade text not null check (grade in ('again', 'hard', 'good', 'easy')),
  created_at timestamptz not null default now()
);
create index if not exists review_logs_user_idx on public.review_logs (user_id, created_at desc);

alter table public.review_logs drop constraint if exists review_logs_mode_check;
alter table public.review_logs add constraint review_logs_mode_check
  check (mode in ('recall', 'write', 'listen', 'sentence', 'quiz', 'translate'));

-- Daily progress -----------------------------------------------------------
create table if not exists public.daily_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  new_words integer not null default 0,
  reviews integer not null default 0,
  xp integer not null default 0,
  goal_reached boolean not null default false,
  primary key (user_id, day)
);

-- AI usage (for limits and the admin dashboard) ----------------------------
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  feature text not null,
  ok boolean not null,
  latency_ms integer not null,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_created_idx on public.ai_usage (created_at desc);
create index if not exists ai_usage_user_day_idx on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage drop constraint if exists ai_usage_feature_check;
alter table public.ai_usage add constraint ai_usage_feature_check
  check (feature in ('extract', 'cards', 'tutor', 'translate', 'review', 'demo', 'talk', 'reading', 'writing'));

-- Reading: one short text a day with three questions. The passage holds the right answers,
-- so students have no policy on this table; only the server reads and writes it.
create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  words text[] not null,
  passage jsonb not null,
  answers jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

-- Path cards: one finished card per word of the curriculum, made once and shared by every student.
-- Students can only read it; the server (service role) writes it from the admin panel.
create table if not exists public.path_cards (
  term text primary key,
  card jsonb not null,
  reviewed boolean not null default false,
  created_at timestamptz not null default now()
);

-- School curriculum: the real words of the student's school book, uploaded by the admin and shown to every student.
-- Students can only read these tables; the server (service role) writes them from the admin panel.
create table if not exists public.school_units (
  id uuid primary key default gen_random_uuid(),
  sort integer not null default 0,
  title_ar text not null check (char_length(title_ar) between 1 and 80),
  title_en text not null default '' check (char_length(title_en) <= 80),
  created_at timestamptz not null default now()
);

create table if not exists public.school_words (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.school_units (id) on delete cascade,
  sort integer not null default 0,
  term text not null check (char_length(term) between 2 and 40),
  pos text not null default '' check (char_length(pos) <= 20),
  meaning_ar text not null check (char_length(meaning_ar) between 1 and 120),
  example_en text not null default '' check (char_length(example_en) <= 200),
  example_ar text not null default '' check (char_length(example_ar) <= 200),
  created_at timestamptz not null default now(),
  unique (unit_id, term)
);
create index if not exists school_words_unit_idx on public.school_words (unit_id, sort);
create index if not exists school_words_term_idx on public.school_words (term);

-- Grammar lesson images: the admin uploads the explanation of each book unit as pictures.
-- The files live in a private storage bucket; students get short-lived signed links from the server.
create table if not exists public.grammar_lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null check (unit_id ~ '^g[0-9]{1,2}$'),
  sort integer not null default 0,
  path text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists grammar_lessons_unit_idx on public.grammar_lessons (unit_id, sort);

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('grammar-lessons', 'grammar-lessons', false, 4000000, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do update
      set public = false, file_size_limit = 4000000, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
  end if;
end
$$;

-- Messages Bo says to the students from time to time. The admin writes them; students can only read the active ones.
create table if not exists public.bo_messages (
  id uuid primary key default gen_random_uuid(),
  text_ar text not null check (char_length(text_ar) between 1 and 200),
  text_en text not null default '' check (char_length(text_en) <= 200),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Daily challenge: the day's questions (the answers stay on the server) and each student's result.
create table if not exists public.daily_challenges (
  day date primary key,
  questions jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.challenge_results (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  score integer not null check (score >= 0),
  max_score integer not null check (max_score > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- Word of the day: the admin writes the word, its meaning and a short story or joke that makes it stick.
create table if not exists public.word_of_day (
  id uuid primary key default gen_random_uuid(),
  term text not null check (char_length(term) between 2 and 40),
  meaning_ar text not null check (char_length(meaning_ar) between 1 and 120),
  story_ar text not null default '' check (char_length(story_ar) <= 400),
  story_en text not null default '' check (char_length(story_en) <= 400),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Weekly board: students who join get a made-up name (never their real one). Only the server reads these.
create table if not exists public.board_members (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 3 and 40),
  joined_at timestamptz not null default now()
);

-- The week's top students by XP, plus the asking student's own row even when he is lower down.
create or replace function public.weekly_board(week_start date, me uuid, max_rows integer)
returns table (rank bigint, user_id uuid, nickname text, xp bigint)
language sql
security definer
set search_path = public
as $$
  with totals as (
    select m.user_id, m.nickname, coalesce(sum(d.xp), 0)::bigint as xp
    from public.board_members m
    left join public.daily_progress d on d.user_id = m.user_id and d.day >= week_start
    group by m.user_id, m.nickname
  ),
  ranked as (
    select rank() over (order by xp desc) as rank, user_id, nickname, xp from totals where xp > 0
  )
  select rank, user_id, nickname, xp from ranked where rank <= max_rows or user_id = me order by rank, nickname;
$$;
revoke all on function public.weekly_board(date, uuid, integer) from public, anon, authenticated;
grant execute on function public.weekly_board(date, uuid, integer) to service_role;

-- Weekly contest the admin writes. Answers stay on the server; one attempt per student.
create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  prize text not null default '' check (char_length(prize) <= 200),
  questions jsonb not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.contest_entries (
  contest_id uuid not null references public.contests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null,
  created_at timestamptz not null default now(),
  primary key (contest_id, user_id)
);

-- Friend duels: a short code, the same questions for everyone who opens it. Server-only.
create table if not exists public.duels (
  code text primary key check (code ~ '^[A-Z2-9]{6}$'),
  creator uuid not null references public.profiles (id) on delete cascade,
  questions jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.duel_entries (
  code text not null references public.duels (code) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null,
  created_at timestamptz not null default now(),
  primary key (code, user_id)
);

-- Talk to Lexa: free writing, analyzed --------------------------------------
create table if not exists public.talk_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic text not null,
  text text not null,
  vocabulary_level integer not null check (vocabulary_level between 1 and 5),
  grammar_level integer not null check (grammar_level between 1 and 5),
  clarity_level integer not null check (clarity_level between 1 and 5),
  mistakes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists talk_sessions_user_idx on public.talk_sessions (user_id, created_at desc);

-- Parent / teacher progress link (only the token hash is stored) -------------
create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists share_links_user_idx on public.share_links (user_id);

-- Public landing-page demo: one counter per day per hashed visitor ----------
create table if not exists public.demo_usage (
  day date not null,
  visitor_hash text not null,
  hits integer not null default 0,
  primary key (day, visitor_hash)
);

create or replace function public.demo_hit(p_day date, p_visitor text)
returns table (visitor_hits integer, total_hits bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.demo_usage (day, visitor_hash, hits) values (p_day, p_visitor, 1)
  on conflict (day, visitor_hash) do update set hits = public.demo_usage.hits + 1;
  return query
    select (select hits from public.demo_usage where day = p_day and visitor_hash = p_visitor),
           (select coalesce(sum(hits), 0) from public.demo_usage where day = p_day);
end;
$$;
revoke all on function public.demo_hit(date, text) from public, anon, authenticated;
grant execute on function public.demo_hit(date, text) to service_role;

-- Admin-editable settings --------------------------------------------------
create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  values jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict do nothing;

-- Row level security -------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.word_groups enable row level security;
alter table public.words enable row level security;
alter table public.review_logs enable row level security;
-- Book practice: the best score of each grammar unit and writing task. Students can only read their own rows;
-- the server checks and writes them.
create table if not exists public.book_scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  kind text not null check (kind in ('grammar', 'writing')),
  score integer not null check (score >= 0),
  max_score integer not null check (max_score > 0 and score <= max_score),
  attempts integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.book_scores drop constraint if exists book_scores_kind_check;
alter table public.book_scores add constraint book_scores_kind_check check (kind in ('grammar', 'writing', 'listening'));

alter table public.daily_progress enable row level security;
alter table public.ai_usage enable row level security;
alter table public.app_settings enable row level security;
alter table public.talk_sessions enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.path_cards enable row level security;
alter table public.grammar_lessons enable row level security;
alter table public.bo_messages enable row level security;
alter table public.duels enable row level security;
alter table public.duel_entries enable row level security;
alter table public.contests enable row level security;
alter table public.contest_entries enable row level security;
alter table public.board_members enable row level security;
alter table public.word_of_day enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.challenge_results enable row level security;
-- daily_challenges and challenge_results have no policies on purpose: only the server (service role) can touch them.
alter table public.school_units enable row level security;
alter table public.school_words enable row level security;
alter table public.book_scores enable row level security;
alter table public.share_links enable row level security;
alter table public.demo_usage enable row level security;
-- demo_usage has no policies on purpose: only the server (service role) can touch it.

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "book scores read own" on public.book_scores;
create policy "book scores read own" on public.book_scores for select to authenticated using (user_id = auth.uid());
revoke all on public.book_scores from anon, authenticated;
grant select on public.book_scores to authenticated;

drop policy if exists "word of day read" on public.word_of_day;
create policy "word of day read" on public.word_of_day for select to authenticated using (active);
drop policy if exists "bo messages read" on public.bo_messages;
create policy "bo messages read" on public.bo_messages for select to authenticated using (active);
drop policy if exists "grammar lessons read" on public.grammar_lessons;
create policy "grammar lessons read" on public.grammar_lessons for select to authenticated using (true);
drop policy if exists "school units read" on public.school_units;
create policy "school units read" on public.school_units for select to authenticated using (true);
drop policy if exists "school words read" on public.school_words;
create policy "school words read" on public.school_words for select to authenticated using (true);

drop policy if exists "path cards read" on public.path_cards;
create policy "path cards read" on public.path_cards for select to authenticated using (true);

drop policy if exists "groups own" on public.word_groups;
create policy "groups own" on public.word_groups for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "words own" on public.words;
create policy "words own" on public.words for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "logs own read" on public.review_logs;
create policy "logs own read" on public.review_logs for select using (user_id = auth.uid());
drop policy if exists "logs own insert" on public.review_logs;
create policy "logs own insert" on public.review_logs for insert with check (user_id = auth.uid());
drop policy if exists "progress own" on public.daily_progress;
create policy "progress own" on public.daily_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "usage admin read" on public.ai_usage;
create policy "usage admin read" on public.ai_usage for select using (public.is_admin());
drop policy if exists "settings read" on public.app_settings;
create policy "settings read" on public.app_settings for select using (true);
drop policy if exists "settings admin write" on public.app_settings;
create policy "settings admin write" on public.app_settings for update using (public.is_admin());

drop policy if exists "talk own read" on public.talk_sessions;
create policy "talk own read" on public.talk_sessions for select using (user_id = auth.uid());
drop policy if exists "talk own insert" on public.talk_sessions;
create policy "talk own insert" on public.talk_sessions for insert with check (user_id = auth.uid());

drop policy if exists "share own read" on public.share_links;
create policy "share own read" on public.share_links for select using (user_id = auth.uid());
drop policy if exists "share own delete" on public.share_links;
create policy "share own delete" on public.share_links for delete using (user_id = auth.uid());

-- Progress columns on profiles are written by trusted server code only.
-- Students can edit just their name, interests and the "onboarded" flag, never XP, streak or role.
revoke all on public.path_cards from anon, authenticated;
grant select on public.path_cards to authenticated;
revoke all on public.daily_challenges, public.challenge_results from anon, authenticated;
revoke all on public.word_of_day from anon, authenticated;
grant select on public.word_of_day to authenticated;
revoke all on public.board_members from anon, authenticated;
revoke all on public.contests from anon, authenticated;
revoke all on public.contest_entries from anon, authenticated;
revoke all on public.duels from anon, authenticated;
revoke all on public.duel_entries from anon, authenticated;
revoke all on public.bo_messages from anon, authenticated;
grant select on public.bo_messages to authenticated;
revoke all on public.grammar_lessons from anon, authenticated;
grant select on public.grammar_lessons to authenticated;
revoke all on public.school_units, public.school_words from anon, authenticated;
grant select on public.school_units, public.school_words to authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, interests, onboarded, daily_minutes) on public.profiles to authenticated;
