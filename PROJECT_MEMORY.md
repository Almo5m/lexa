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

## 2026-10-13 (phase 2.10: speed, responsive, missing pieces)
- Moaz said the AI is slow and its replies are not good, the site is missing something he can't name, and it must be responsive on any device.
- Tutor now streams; cards generate in parallel; new tutor and card prompts (direct answer, example, mini task); thinking minimized; bidi fix for English inside Arabic; microphone policy fixed; centered desktop layout; review screen keyboard flow; touch targets at least 44px.
- Added forgot/reset password, Account section (change name, delete account and data). PRIVACY.md updated.
- Checked in a real browser at 360, 820 and 1366 widths on all screens: no horizontal overflow. 127 tests pass and the build passes. Not checked against real Supabase or Gemini.
- Next: phase 3 (games, achievements, stats page); teacher review of word bank and hooks; logo; theme.

## 2026-10-14 (phase 3.1: learning path)
- Moaz asked me to rethink the whole system as a veteran English teacher: the student must end up able to understand, translate and speak; many words matter; sessions can be longer (15, 30, 45 minutes or by choice); dropping photo extraction as the main path is fine.
- Wrote docs/LEARNING_DESIGN.md (daily session, unit path A1 to B1, about 3000 words, two kinds of knowing, review cap).
- Built 3.1: curated A1 content (12 units, 300 words), home screen is now Today's session with four steps and a 15/30/45 minute choice, new learn flow (teach 5, test 5, repeat), basic cards from the hand-written list with background AI enrichment, review rounds scale with the chosen time, path words are kept out of the normal review until learned. Database: words.source/unit_id/enriched and profiles.daily_minutes added to setup.sql (tested twice on PostgreSQL 16).
- 138 tests pass, build passes, flow checked in a real browser against a mock server. Not checked against the real Supabase or Gemini.
- Next: 3.2 Understand (short text and questions), 3.3 translate and speak inside the session with today's words, 3.4 unit tests and skill meters; write A2 and B1 lists; teacher review of all lists.

## 2026-10-15 (phase 3.2: understand step)
- Moaz said continue. Found a partly built reading feature on disk (routes, table, tests, a broken component). Finished it: /read page, dictionary texts, step 3 on the home screen (reads the completion flag with the server key), PRIVACY.md and README updated.
- 147 tests pass, build passes, setup.sql run twice on PostgreSQL 16, flow checked in a real browser at 360 and 1366 widths against a mock server. Not checked against the real Supabase or Gemini.
- Next: 3.3 translate and speak inside the session with today's words, 3.4 unit tests and skill meters, A2 and B1 lists, teacher review.

## 2026-10-15 (phase 3.3: translate and speak with today's words)
- Translate from the daily session uses the newest learned words and the text level from the hardest path word; Speak gets a "use at least two of these words" topic built on the server, and the result shows which words were used. Home steps link to /translate?today=1 and /talk?today=1.
- 150 tests pass, build passes, pages checked in a real browser at 360 width. The AI parts (translate generation, talk analysis) were not run against the real Gemini.
- Next: 3.4 unit tests and four skill meters, A2 and B1 lists, teacher review of all lists.

## 2026-10-15 (phase 3.4: skill meters, path map, unit test)
- Four skill bars on the home screen, a /path map with per-unit state, and a unit test (review of one unit's words). No database change; everything comes from review state.
- 160 tests pass, build passes, checked in a real browser at 360 and 1366 widths against a mock server.
- Next: A2 and B1 word lists (the 3000-word target), teacher review of all lists, then games and achievements, then logo and theme.

## 2026-10-15 — Phase 3.5: A2 lists
- Wrote A2 in three files (a2a, a2b, a2c): 24 units, 600 words. Path total is now about 900 words.
- Same rules as A1 (enforced by tests/curriculum.test.ts). Still needs teacher review.
- Next: remaining A2 words (about 400), the B1 lists, level placement that skips A1 for strong students.

## 2026-10-15 — Phase 3.6: more A2
- Added a2d.ts: units a2-25..a2-32 (verbs, adjectives, place words, quantity, linking words, city). About 70 words dropped because they already existed; replaced with new ones.
- A2 is now about 800 words, path total about 1100. Teacher review still needed.

## 2026-10-15 — Phase 3.7: more A2
- Added a2e.ts: units a2-33..a2-37 (128 words). Candidates already on the path were filtered out by script, small topics were merged so every unit has 20-30 words.
- A2 is about 890 words, path total about 1190. Teacher review still needed.

## 2026-10-17 — Phase 3.8: A2 complete
- Added a2f.ts: units a2-38..a2-41 (101 words). A2 is now 41 units, about 990 words; path total about 1290.
- Next: B1 lists (about 1200 words), level placement that skips A1/A2 for strong students, teacher review.

## 2026-10-17 — Phase 3.9: B1 started
- Added b1a.ts: units b1-01..b1-07 (183 words). Path total about 1480.
- Next: more B1 units to reach the 3000 target, level placement that skips lower levels, teacher review.

## 2026-10-17 — Phase 4.0: more B1
- Added b1b.ts: units b1-08..b1-15 (215 words). B1 is 15 units, about 400 words. Path total about 1690.
- Next: about 1300 more words (rest of B1), level placement, teacher review.
