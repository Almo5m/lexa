# Project memory: Lexa

Log of decisions and events, newest at the bottom.

## 2026-10-06
- Idea: a vocabulary learning system, not a dictionary and not flashcards. Words come from photos.
- Decisions: PWA on Next.js + Supabase. Bilingual interface (Arabic and English). First target: secondary school.
- Image reading: Gemini Vision, because no budget and it cleans the words in the same step.
- AI: one Gemini account for now, with an admin dashboard to watch usage and edit settings. Move to the paid tier before opening to students.
- Rejected: rotating several free accounts to skip limits. It risks breaking Google's terms and losing all the accounts.
- Pronunciation: browser speech (Web Speech API) in the first version.
- Photos are deleted after extraction.
- Design: palette A (ink blue, highlighter yellow, warm paper), font Readex Pro, word-tag button, icons drawn for the notebook world. Dark mode only in the admin dashboard.
- Phase 1 built: foundation, schema, AI layer, photo flow, cards, archive, review, tutor, XP, streak, admin. 42 unit tests pass and the production build passes.
- Not tested against real services yet: Supabase and Gemini need real keys.

## Plan
- Phase 2: placement test and suggested words by level, translation practice (Arabic to English and back), quizzes.
- Phase 3: games, achievements, statistics page.
- Later: story feature from the curriculum, pronunciation scoring.

## 2026-10-06 (later)
- First real run. The dashboard showed 503 UNAVAILABLE from Gemini on cards and tutor.
- Added retry with backoff, a fallback model setting in the dashboard, a friendly "busy" message, and cards stay pending when the failure is temporary.
- 49 unit tests pass.
- Fallback model `gemini-2.5-flash-lite` came back 404 (retired for new users). Default changed to `gemini-3.5-flash-lite`, and a retired model is now skipped instead of stopping the chain. 52 unit tests pass.

## 2026-10-07
- Phase 1 confirmed working after the Gemini model fixes. Started phase 2.
- Level test: chose a yes/no test with invented words instead of multiple choice. It needs no AI calls and no translations, takes about a minute, and the invented words expose guessing. Two or more false claims out of five make the result unreliable and it is not saved.
- Word bank: 5 bands of 40 words, written by hand. A teacher should review it before launch.
- Suggested words: 10 at a time from the student's band and the ones next to it, never words the student already has. The student chooses which to add.
- Quizzes use only stored cards, so they cost no AI calls. They need at least 4 ready words.
- Translation: the tutor grades the answer on its own judgement and ignores the reference sentence sent by the browser. The grade feeds the same review system as every other exercise.
- One shared function (`applyAnswer`) now turns any answer into review state, XP and streak. Review, quiz and translation all use it.
- 83 unit tests pass and the production build passes. Not tested against the real services yet.

## 2026-10-07 (identity)
- New identity approved from the logo: indigo, violet, blue, cyan, with amber and cream. The AI assistant is named Lexa and is the brand. The identity preview is in `lexa-identity-preview.html`.
- Icons are being supplied one at a time. The first is the loading icon: Lexa holding a disc with a spinner.
- Loader built: the blank-disc owl image had a checkerboard baked into the pixels, so it was cut out into a transparent WebP (47 KB). Nine bars drawn in SVG over the disc, colors taken from the reference image, chasing clockwise while the owl breathes. Component: `src/components/lexa-loader.tsx`.
- Not yet applied to the app screens. The identity is applied after all icons arrive.

## 2026-10-07 (identity applied)
- Three mascot poses arrived (happy, neutral, sad). They had a checkerboard drawn into the pixels, so they were cut out into transparent WebP files (33 to 43 KB each).
- The identity was applied to the whole app: new color tokens, pill buttons with depth, rounded surfaces, new icons (XP is the logo X), a five-slot bottom bar with a raised Add button and Lexa, a new home screen, and a Lexa chat that opens from any page.
- The AI tutor is now called Lexa everywhere in the interface and in the prompts.
- Old notebook look removed: ruled paper, word-tag button, highlighter and red-pen effects, scrambling-letters loader.
- 83 unit tests pass and the production build passes. The screens have not been checked in a real browser yet.

## 2026-10-07 (env fix)
- Real run failed with "Missing environment variable" in the browser. Moaz fixed `env.ts` by reading each variable by its full name. The fix is right and is now in the project, with a test that blocks computed lookups.

## 2026-10-08 (AI reliability and dashboard)
- Moaz reported that the AI was not working anywhere and that the dashboard looked basic and disorganized. No error text was given, so the code was reviewed. Found: both models can be retired, quota errors were retried, and log writes could break answers.
- AI errors are now classified, handled by kind, and stored readably. New student message when the model or key is wrong.
- Dashboard rebuilt with Overview, AI and Settings tabs. The AI tab runs a live test, a system check, and lists the models the key can use.
- 98 unit tests pass and the production build passes. Not checked against the real services or in a browser.

## 2026-10-09 (speed, formatting, typed review)
- Moaz reported slow responses everywhere, broken formatting in Lexa's replies, and that the Forgot/Remembered review is not a real test.
- Speed: local token check, cached settings, usage logged after the response, Gemini thinking off for 2.5 flash, fewer retries, bigger card batches, loader pages.
- Lexa replies render bold, lists and mixed Arabic/English correctly.
- Review is typed only (word from meaning, word from audio, sentence). The system decides the grade. Migration 003 added.
- 105 unit tests pass and the production build passes. Not checked against the real services or in a browser.

## 2026-10-10 (phase 2.6: landing, demo, tour)
- Moaz set the direction: Lexa is a trusted brand, not a simple app. Needs: talk in the student's own world, language assessment of the student's own English, a landing page with try-before-signup, an in-app tour, features competitors lack. Theme tweaks wait until the end. Name meaning proposed: Lex (Greek lexis, word) + X as the crossing point of the student's language and English.
- Built: `/welcome` landing page, public demo (card + sentence check) with per-visitor and daily limits, dashboard settings for the demo, first-run tour with replay, card prompt now writes from an Egyptian student's daily life.
- Migration 004 added. 111 unit tests pass and the production build passes. Not checked against the real services or in a browser.
- Next: 2.7 student profile and life-context cards, memory hooks; 2.8 Talk to Lexa and language profile.

## 2026-10-10 (phase 2.7: interests and memory hooks)
- Added `/me` where the student picks up to six interests. Cards generated after that use those worlds. Each new card has a memory hook (Arabic sound-alike or vivid picture). Home shows a banner until the student has chosen. Migration 005 added.
- 113 unit tests pass and the production build passes. Not checked against the real services or in a browser.
- Next: 2.8 Talk to Lexa and the language profile (recurring mistakes of Arabic speakers).

## 2026-10-10 (phase 2.8: Talk to Lexa and language profile)
- Added `/talk`: free writing (or voice where the browser allows) on a topic, analyzed by Lexa into three levels, the useful mistakes with Arabic reasons, and a natural rewrite. Saved in `talk_sessions`. The language profile shows the recent average and recurring mistake patterns with why Arabic speakers make them. XP for the first three texts a day (setting in the dashboard). Migration 006 added.
- 119 unit tests pass and the production build passes. Not checked against the real services or in a browser.
- Next: 2.9 parent/teacher progress link, then phase 3 (games, achievements, stats page). Logo and name-meaning to be settled before the theme work.

## 2026-10-10 (phase 2.9: parent/teacher progress link)
- Added the private progress link (`/share/[token]`), managed from `/me`. Migration 007 added. PRIVACY.md updated with the demo, talk texts, interests and the link.
- 124 unit tests pass and the production build passes. Not checked against the real services or in a browser.
- Next: phase 3 (games, achievements, stats page). Logo and name-meaning, then the theme, at the end.

## 2026-10-11 (one re-runnable database file)
- Moaz ran `schema.sql` on a database that already had tables and got "relation profiles already exists", and said he can't remember which SQL ran and wants to run everything every time.
- Replaced `schema.sql` with `supabase/setup.sql`: one idempotent file, safe to run any number of times on any version. Tested on PostgreSQL 16. Migration files made re-runnable too.

## 2026-10-11 (migrations folder removed)
- Moaz asked to delete `supabase/migrations`, since `setup.sql` covers everything. Removed it, and the README and notes now point only to `setup.sql`. The change history stays in the earlier ZIPs and in this file.
