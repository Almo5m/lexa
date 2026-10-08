-- Phase 2: level test, quizzes, translation practice.
-- Run once in the Supabase SQL editor on a database that already has schema.sql.

alter table public.profiles add column if not exists level_band integer check (level_band between 1 and 5);
alter table public.profiles add column if not exists level_tested_at timestamptz;

alter table public.review_logs drop constraint if exists review_logs_mode_check;
alter table public.review_logs add constraint review_logs_mode_check
  check (mode in ('recall', 'write', 'listen', 'quiz', 'translate'));

alter table public.ai_usage drop constraint if exists ai_usage_feature_check;
alter table public.ai_usage add constraint ai_usage_feature_check
  check (feature in ('extract', 'cards', 'tutor', 'translate'));
