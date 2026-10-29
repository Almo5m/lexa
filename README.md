# Booo (بو)

Vocabulary learning app for Egyptian secondary-school students. The student uploads photos of English words, and the app turns them into cards, reviews, exercises and a personal AI tutor. It is not a dictionary and not a plain flashcard app.

Stack: Next.js (App Router), TypeScript, Tailwind CSS, Supabase (auth + database), Gemini API.

## What it does

Booo is built around one daily session for third-secondary students (15, 30 or 45 minutes, the student picks). Today shows four steps: review old words, learn new ones, read a short text, translate. Speaking with Bo is a bonus step.

- **Plan:** a path of about 2300 words from A1 to B1 in 93 units. A level test decides where each student starts. Every word has a finished card (meaning, example, note), made once and stored, so learning a word is instant.
- **Skills:** five bars (words, understanding, translation, speaking, book) computed from what the student really did.
- **The school book:** grammar lessons and drills for the six units of Year 3 Term 1, three writing tasks marked by Bo out of 20, and five listening texts. The content is written for this app; only the topics follow the ministry book.
- **Practice:** review, quizzes from the student's own cards, translation both ways, daily reading, talking to Bo with a language profile.
- **Motivation:** XP, levels, a daily streak with a freeze, and 29 badges earned only from real study. No separate games, so no study time is lost.
- **Own words:** the student can still add his own words from photos or by typing, with cards built around his interests.
- **Sharing:** a private progress link for a parent or teacher.
- **Admin:** AI usage and errors, every adjustable setting, and a tab that generates the finished cards of the whole path.
- **Landing page:** a visitor can try a feature before signing up, with strict limits.

Not built yet: the second term of the book, a teacher pass over the word lists, about 680 more words to reach 3000, the final theme and logo work. See `PROJECT_MEMORY.md` for the full history and `PROBLEMS.md` for the hard problems and known limits.

## Look and feel

The product has two names, both in one file (`src/lib/brand.ts`): **Booo** (بو) is the site, and **Bo** (بو) is the robot companion who explains, corrects and talks with the student. Texts use the placeholders `{app}` and `{ai}`, so a rename is one edit.

The look is a game-style app built around Bo's palette: sky paper, deep navy text, electric blue as the main color, cyan for the glow and sun yellow for rewards. Buttons are chunky with a solid lip that presses down, cards are flat tiles with a thicker bottom border, and good news pops in. The colors and radii are tokens at the top of `src/app/globals.css`, so a change there reaches every screen. Bo himself is a real 3D robot, and the student can switch between a flying Bo and a classic Bo from the Account page (see `docs/BO_MODEL.md`).

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

5. Open the admin page, the "كروت المسار" tab, and press generate until every card is ready. Do this once after the first setup (and again when words are added to the path). Until then the app works, only slower.

The full order of steps before going live is in `docs/LAUNCH_CHECKLIST.md`.

## Commands

```bash
npm run dev        # development server
npm run build      # production build
npm run typecheck  # TypeScript check
npm test           # unit tests
npm run export:curriculum   # writes the word lists to a CSV for the teacher
```

## Structure

```
src/app            pages and API routes
src/features       curriculum, grammar, writing, listening, achievements, skills, srs, gamification, words, ai, admin, levels, quiz, translate, talk (logic, no UI)
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

## Bo on every screen

Bo floats above every screen (except Today and Account, which already show a big Bo). Tap him for a small menu: talk to him, let him roam (then drag him anywhere and he stays there), keep him in his corner, replay the guide, or hide him (it can be turned back on in Account). On a new account Bo guides the student himself: he flies to each part of the app and says what it is for. The chat shows what Bo is doing while he answers (reading the question, thinking, writing), has a stop button, copy, retry and quick starter questions. The code is in `src/components/bo-companion.tsx`, `bo-guide.tsx` and `bo-chat.tsx`, and the position maths in `src/features/bo/placement.ts`.

## School curriculum (phase 8.0)

The real words of the student's school book are the base of the site. They are uploaded from the admin dashboard (tab "School book"): add a unit, then paste its words or upload a CSV, one word per line: `word | part of speech | Arabic meaning | example | example translation`. Only the word and the meaning are required. Every student sees the units in **Words > School book**, with progress per unit, a button to study a unit and a button to test himself on it.

Today's session takes its new words from the school curriculum, unit by unit. Our own path moved to the **Boost** tab and is optional: a student can follow it to raise his level, but nothing depends on it. If the admin has not uploaded any school words yet, Today falls back to our path, so the site is never empty.

Code: `src/features/school/` (parsing, picking, progress, cards), `src/app/api/admin/school/route.ts` (admin writes), `src/components/admin-school.tsx`. Run `supabase/setup.sql` again for the two new tables.

## Grammar explanation as pictures (phase 8.2)

The teacher's own explanation of each book unit can be uploaded as pictures from the admin dashboard (tab "Grammar explanation"): pick a unit, upload one or many images, reorder or delete them. Students see those pictures in the lesson step instead of the written explanation, and the exercises stay the same. A unit with no pictures keeps the built-in written explanation.

Pictures are shrunk in the browser before upload (`src/lib/shrink-image.ts`), checked on the server by their real bytes (JPEG, PNG or WebP only), and stored in a private bucket. Students get links that expire after an hour. Code: `src/features/grammar/lesson-images.ts`, `src/app/api/admin/grammar/route.ts`, `src/components/admin-grammar.tsx`. Run `supabase/setup.sql` again for the new table and bucket.

## Messages from Bo (phase 8.3)

Bo says short messages to the students from time to time. The admin writes them in the dashboard (tab "Bo messages"): Arabic text, an optional English version, `{name}` where the student's first name should go, and a switch to turn each one off. The timing is in Settings: the least gap between two messages (default 20 minutes) and the most per day (default 4); 0 turns the messages off.

The message shows in the bubble next to the floating Bo. It waits 90 seconds after the student opens the site, never shows while he is in an exercise, in the chat, during the guide or when Bo is hidden, and goes through all the messages before repeating one. Today shows one message of the day in a small card. The counters live on the student's device only. Code: `src/features/bo/messages.ts` (the rules), `src/components/bo-companion.tsx` (the timer), `src/components/admin-bo-messages.tsx`. Run `supabase/setup.sql` again for the new table.

## License notice

Copyright (c) 2026 Moaz (AlMo). All Rights Reserved.
This project is proprietary. Copying, modification or distribution without written permission is not allowed. See `LICENSE` and `PRIVACY.md`.

## Landing page and the visitor demo

`/welcome` is the first page a visitor sees. Anyone can type a word, get a real Booo card, write a sentence and get it checked, without an account. Because there's no login, the demo is limited: each visitor (by a salted hash of the IP, the raw IP is never saved) gets a few tries a day, and the whole demo closes for the day after a total ceiling. Both numbers, and an on/off switch, are in the dashboard settings under "Visitor demo". Run `004_demo.sql` before using it.

New students also get a short tour on their first visit. It can be replayed from the menu.

## Cards written for the student

In "My interests" (`/me`) the student picks up to six things he likes (football, gaming, music...). New cards then use those worlds for some of the example sentences. The interests are a fixed list of ids, so nothing a student types ever goes into an AI prompt. Every new card also has a "memory hook": a short Arabic sound-alike or a vivid picture that helps the word stick. Old cards don't have one and still work.

## Talk to Bo and the language profile

In Practice, "Talk to Bo" gives a topic (from the student's interests when he picked some). He writes freely in English, or speaks if his browser supports it, and Bo returns: levels for vocabulary, grammar and clarity (A1 to C1), the mistakes that matter with a short Arabic reason, and the whole text said the way a fluent speaker would say it. Every text is saved, and the "language profile" shows the average of the latest texts and the mistakes that keep coming back, with why Arabic speakers make them (missing is/am/are, a/the, prepositions...). The levels are Bo's estimates, not an official certificate, and the page says so. XP is paid for the first three texts a day only.

## Progress link for parents and teachers

From "My interests" (`/me`) a student can make a private link. A parent or teacher opens it with no account and sees a short report: first name, XP, level, streak, word counts, the last seven days, and the language level. The student decides: the link lasts 30 days, making a new one cancels the old one, and he can stop it whenever he wants. The link is shown once when it's made, because only a hash of it is saved. Details of what is and isn't shared are in `PRIVACY.md`.

## Account
Forgot password (/forgot) sends a reset link by email; /reset sets the new one. The Account section in /me changes the name and deletes the account with all its data. In Supabase, add your site address plus `/reset` under Authentication > URL Configuration > Redirect URLs, or the reset link will not work.

## Learning path (phase 3.1)
The home screen is now "Today's session": review, new words, translate, speak, always in this order. The student picks 15, 30 or 45 minutes a day and the number of new words follows it (the dashboard sets the 15-minute base, longer days scale from it).

New words come from a hand-written path in `src/features/curriculum` (level A1 for now: 12 units, 300 words). Each word is taught first (meaning, sound, a short phrase), then tested at once by typing, five words at a time. The hand-written card is usable immediately; the AI adds examples and a memory hook in the background and keeps the written meaning first. To add words, add units to the files in that folder. The tests check that no word repeats and every phrase shows its word.

Words from photos still work, under "More tools".

## Understand step (phase 3.2)
Step 3 of the day is a short reading text (45 to 70 words) that Bo writes around the words the student learned most recently, followed by three questions: a detail question, true or false, and "what does this word mean here". The right answers stay on the server and are shown only after each answer; the Arabic translation opens after the last question, so it cannot replace reading. One text a day per student (table `reading_sessions`), and the XP for finishing it is set in the dashboard.

## Translate and speak with today's words (phase 3.3)
From the daily session, "Translate" writes its sentences around the words the student learned most recently (falling back to his weak and due words if there are fewer than two), and "Speak" asks him to write 3 to 5 sentences using at least two of those words. After the text, Bo shows which of the words he really used. The server picks the words itself; the browser only asks for the "words" topic, so it cannot choose the words.

## Skills and the path map (phase 3.4)
The home screen shows four bars: words (learned from the path), understanding (average of the reading questions), translation (share right in the latest 20) and speaking (the band from the latest texts). A bar with too little data says so instead of showing a made-up number.

`/path` lists every unit with how many of its words are learned and how many are solid (two correct reviews in a row). A unit is "mastered" when 80 percent of its words are solid. "Unit test" opens a review of that unit's words, weakest first. All of this is computed from the review state, so nothing is typed in by the browser and no new table is needed.
