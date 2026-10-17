# Lexa

Vocabulary learning app for Egyptian secondary-school students. The student uploads photos of English words, and the app turns them into cards, reviews, exercises and a personal AI tutor. It is not a dictionary and not a plain flashcard app.

Stack: Next.js (App Router), TypeScript, Tailwind CSS, Supabase (auth + database), Gemini API.

## Status

Phases 1 and 2 are built. Phase 1 covers:

- Sign up and login, Arabic and English interface
- Photo upload, word extraction, cleaning, duplicate detection, manual edit before approval
- Word cards: IPA, audio, hidden Arabic meaning, a short everyday sentence, usage note, related words, confusable words
- Archive with filters (new, learning, weak, mastered), search and groups
- Spaced repetition review with three exercise types (recall, write, listen)
- XP, levels, daily goal, streak with freeze
- AI tutor per word (Gemini) with a daily limit per student
- Admin dashboard: AI usage, errors, and every adjustable setting

Phase 2 adds:

- Level test (yes/no test with invented words to catch guessing), level 1 to 5
- Suggested words for the student's level, picked from a hand-written word bank
- Quizzes built from the student's own cards: meaning, word, fill the gap, situation, listening
- Translation practice, Arabic to English and back, corrected by the tutor, with weak words feeding the review
- A Practice page that groups review, quiz and translation

Not built yet: games, achievements, statistics page, story feature. See `PROJECT_MEMORY.md` for the plan.

## Look and feel

The identity comes from the Lexa logo: indigo, violet, blue and cyan, with amber for XP and streaks. Lexa is the owl and also the name of the AI tutor.

- Loading: `LexaLoader` (owl holding a spinner disc)
- Moods: `LexaMascot` with `happy`, `neutral` and `sad`, used for feedback, results and empty states
- Lexa chat opens from the bottom bar on every page
- The admin dashboard keeps a dark theme with the same colors
- Brand images live in `public/lexa` and the app icons in `public/icons`

## Setup

1. Create a Supabase project and run `supabase/setup.sql` in the SQL editor. That's the only database file you need.
   It's safe to run again any time: on an empty database or on one from any earlier version, it adds what's missing and never deletes data. Run it again after every update.
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

لو هتنشره على Vercel، اختار الـFunction Region اللي جنب مشروع Supabase بتاعك. المسافة بينهم بتفرق في سرعة كل طلب.

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
src/features       srs, gamification, words, ai, admin, levels, quiz, translate (logic, no UI)
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

## Landing page and the visitor demo

`/welcome` is the first page a visitor sees. Anyone can type a word, get a real Lexa card, write a sentence and get it checked, without an account. Because there's no login, the demo is limited: each visitor (by a salted hash of the IP, the raw IP is never saved) gets a few tries a day, and the whole demo closes for the day after a total ceiling. Both numbers, and an on/off switch, are in the dashboard settings under "Visitor demo". Run `004_demo.sql` before using it.

New students also get a short tour on their first visit. It can be replayed from the menu.

## Cards written for the student

In "My interests" (`/me`) the student picks up to six things he likes (football, gaming, music...). New cards then use those worlds for some of the example sentences. The interests are a fixed list of ids, so nothing a student types ever goes into an AI prompt. Every new card also has a "memory hook": a short Arabic sound-alike or a vivid picture that helps the word stick. Old cards don't have one and still work.

## Talk to Lexa and the language profile

In Practice, "Talk to Lexa" gives a topic (from the student's interests when he picked some). He writes freely in English, or speaks if his browser supports it, and Lexa returns: levels for vocabulary, grammar and clarity (A1 to C1), the mistakes that matter with a short Arabic reason, and the whole text said the way a fluent speaker would say it. Every text is saved, and the "language profile" shows the average of the latest texts and the mistakes that keep coming back, with why Arabic speakers make them (missing is/am/are, a/the, prepositions...). The levels are Lexa's estimates, not an official certificate, and the page says so. XP is paid for the first three texts a day only.

## Progress link for parents and teachers

From "My interests" (`/me`) a student can make a private link. A parent or teacher opens it with no account and sees a short report: first name, XP, level, streak, word counts, the last seven days, and the language level. The student decides: the link lasts 30 days, making a new one cancels the old one, and he can stop it whenever he wants. The link is shown once when it's made, because only a hash of it is saved. Details of what is and isn't shared are in `PRIVACY.md`.

## Account
Forgot password (/forgot) sends a reset link by email; /reset sets the new one. The Account section in /me changes the name and deletes the account with all its data. In Supabase, add your site address plus `/reset` under Authentication > URL Configuration > Redirect URLs, or the reset link will not work.

## Learning path (phase 3.1)
The home screen is now "Today's session": review, new words, translate, speak, always in this order. The student picks 15, 30 or 45 minutes a day and the number of new words follows it (the dashboard sets the 15-minute base, longer days scale from it).

New words come from a hand-written path in `src/features/curriculum` (level A1 for now: 12 units, 300 words). Each word is taught first (meaning, sound, a short phrase), then tested at once by typing, five words at a time. The hand-written card is usable immediately; the AI adds examples and a memory hook in the background and keeps the written meaning first. To add words, add units to the files in that folder. The tests check that no word repeats and every phrase shows its word.

Words from photos still work, under "More tools".

## Understand step (phase 3.2)
Step 3 of the day is a short reading text (45 to 70 words) that Lexa writes around the words the student learned most recently, followed by three questions: a detail question, true or false, and "what does this word mean here". The right answers stay on the server and are shown only after each answer; the Arabic translation opens after the last question, so it cannot replace reading. One text a day per student (table `reading_sessions`), and the XP for finishing it is set in the dashboard.

## Translate and speak with today's words (phase 3.3)
From the daily session, "Translate" writes its sentences around the words the student learned most recently (falling back to his weak and due words if there are fewer than two), and "Speak" asks him to write 3 to 5 sentences using at least two of those words. After the text, Lexa shows which of the words he really used. The server picks the words itself; the browser only asks for the "words" topic, so it cannot choose the words.

## Skills and the path map (phase 3.4)
The home screen shows four bars: words (learned from the path), understanding (average of the reading questions), translation (share right in the latest 20) and speaking (the band from the latest texts). A bar with too little data says so instead of showing a made-up number.

`/path` lists every unit with how many of its words are learned and how many are solid (two correct reviews in a row). A unit is "mastered" when 80 percent of its words are solid. "Unit test" opens a review of that unit's words, weakest first. All of this is computed from the review state, so nothing is typed in by the browser and no new table is needed.
