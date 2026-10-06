# Lexa

Vocabulary learning app for Egyptian secondary-school students. The student uploads photos of English words, and the app turns them into cards, reviews, exercises and a personal AI tutor. It is not a dictionary and not a plain flashcard app.

Stack: Next.js (App Router), TypeScript, Tailwind CSS, Supabase (auth + database), Gemini API.

## Status

Phase 1 is built. It covers:

- Sign up and login, Arabic and English interface
- Photo upload, word extraction, cleaning, duplicate detection, manual edit before approval
- Word cards: IPA, audio, hidden Arabic meaning, a short everyday sentence, usage note, related words, confusable words
- Archive with filters (new, learning, weak, mastered), search and groups
- Spaced repetition review with three exercise types (recall, write, listen)
- XP, levels, daily goal, streak with freeze
- AI tutor per word (Gemini) with a daily limit per student
- Admin dashboard: AI usage, errors, and every adjustable setting

Not built yet: placement test and suggested words, translation practice, quizzes, games, achievements, statistics page, story feature. See `PROJECT_MEMORY.md` for the plan.

## Setup

1. Create a Supabase project. Run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in the four values.
3. Install and run:

```bash
npm install
npm run dev
```

4. Sign up in the app, then make yourself admin in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'your@email.com');
```

## Commands

```bash
npm run dev        # development server
npm run build      # production build
npm run typecheck  # TypeScript check
npm test           # unit tests
```

## Structure

```
src/app            pages and API routes
src/features       srs, gamification, words, ai, admin (logic, no UI)
src/components     shared UI
src/lib            env, auth, settings, i18n, Supabase clients
supabase           database schema
tests              unit tests
```

Server and client code are separate. All Gemini calls happen on the server.

## Security notes

- The Gemini key and the Supabase service key live in environment variables only.
- Row level security is on for every table. Students cannot edit their own XP, streak or role.
- Admin pages and APIs check the admin role on the server.
- Images are validated by type and size and are never stored.

## License notice

Copyright (c) 2026 Moaz (AlMo). All Rights Reserved.
This project is proprietary. Copying, modification or distribution without written permission is not allowed. See `LICENSE` and `PRIVACY.md`.
