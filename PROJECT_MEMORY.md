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

## 2026-10-17 — Phase 4.1: level placement
- startUnitIndex(band), nextPathWords(owned, count, fromUnit), pathSizeFrom(fromUnit) in curriculum/index.ts.
- /api/path/learn, home and /path use the student's level_band (only stored when the test is reliable). Skipped units are greyed ("path.skipped"). Words meter counts only words from the start unit on.
- Test added in tests/curriculum.test.ts. No schema change.

## 2026-10-17 — Phase 4.2: more B1
- Added b1c.ts: units b1-16..b1-21 (153 words). B1 is 21 units, about 550 words. Path total about 1840.
- Next: about 1150 more words, teacher review, games and achievements.

## 2026-10-17 — Phase 4.3: more B1
- Added b1d.ts: units b1-22..b1-28 (182 words). B1 is 28 units, about 735 words. Path total about 2025.
- Next: about 975 more words, teacher review, games and achievements.

## 2026-10-17 — Phase 4.4: more B1
- Added b1e.ts: units b1-29..b1-34 (147 words). B1 is 34 units, about 880 words. Path total about 2170.
- Next: about 830 more words, teacher review, games and achievements.

## 2026-10-17 — Phase 4.5: more B1
- Added b1f.ts: units b1-35..b1-40 (150 words). B1 is 40 units, about 1030 words. Path total 2323.
- Next: about 680 more words, teacher review, games and achievements.

## 2026-10-17 — Phase 4.6: teacher review export
- Added scripts/export-curriculum.mjs and the npm script export:curriculum. It writes exports/curriculum-review.csv (2323 words, 93 units, UTF-8 with BOM for Excel). exports/ is git-ignored.
- Decision: stop adding words for now (about 680 short of 3000); the written lists need a teacher pass first.

## 2026-10-23 — Phase 5.0: one clear structure
- Reason: the student said the system was confusing and everything was mixed; focus is third secondary.
- Five tabs: Today, Plan, Practice, My words, Lexa. The center "add words" button is gone (it is a button on My words).
- Today rewritten: only the session. Four required steps + speaking as a bonus. Pure logic in curriculum/today-plan.ts (5 tests).
- Plan page: skill bars + level bar moved here (features/skills/load.ts), units grouped by level in collapsible sections, current unit big, others compact.
- Practice grouped by skill; "read a text" added to it.
- StepBanner (step n of 4 + way back) on learn, read, review?from=today, translate?today=1, talk?today=1.
- Tour updated (path step, add step removed). GoalRing component deleted.
- Checked on phone and desktop with the mock harness (no overflow, no small targets).
- Build: compile passes, but the end of `npm run build` reports a Next.js security advisory for 16.4.0 (see PROBLEMS.md).

## Phase 5.1 — shared finished cards (2026-10-24)
- New table `path_cards` (term, card jsonb, reviewed): one finished card per path word, made once, read by every student. Students read only; writes go through the admin API.
- `/api/path/learn` and `/api/words/enrich` use the stored card first and call Gemini only for words that have none.
- Admin tab "كروت المسار": progress bar, generate/resume/stop (8 cards per request, resumable), CSV download for the teacher.
- setup.sql re-run twice on Postgres 16: no errors; authenticated can select only, anon nothing.
- Tests: 171 passing, tsc clean.

## Phase 5.2 — book grammar, units 1–3 (2026-10-24)
- User sent the ministry book (Year 3, Term 1). Built from its Scope and Sequence only; lessons and exercises are written by us, not copied.
- `src/features/grammar/`: types, normalizeAnswer/isCorrectTyped, unit1 (Present Perfect / Continuous), unit2 (reported statements and commands), unit3 (modals of deduction, regret, blame). 13 exercises each (choose + type), checked by code, no AI call.
- Pages: /grammar (list), /grammar/[unit] (lesson, drills, score). Entry in Practice under "قواعد الكتاب".
- Tests: 174 passing, tsc clean. Units 4–6 (adjectives, causatives, reported questions) and writing tasks come next.

## Phase 5.3 — book grammar, units 4–6 (2026-10-24)
- Added unit4 (adjectives and compound adjectives), unit5 (causative have/get), unit6 (reported questions). Grammar now covers all six units of Year 3 Term 1. Next: writing tasks (persuasive essay, descriptive paragraph, online review).

## Phase 5.4 — book writing tasks (2026-10-24)
- Three tasks from the book's writing types: persuasive essay (unit 3), descriptive paragraph (unit 4), online review (unit 6). Brief, plan and sentence starters are ours.
- /writing and /writing/[task]; POST /api/writing/grade looks the task up by id on the server, checks min/max words before any AI call, then Gemini marks content, organization, grammar and vocabulary (0–5 each, total /20) with up to 6 mistakes and a polished version. New AiFeature "writing" (ai_usage check constraint updated in setup.sql: run it again).
- Results are not stored yet. Tests: 177 passing, tsc clean.

## Phase 5.5 — book link on Today (2026-10-24)
- Today now has a second link card to /grammar (book grammar and writing), above the plan link. Not a required step; progress for the book is not stored yet.

## Phase 5.6 — book results saved (2026-10-24)
- New table `book_scores` (user_id, item_id, kind, score, max_score, attempts): best result of each grammar unit and writing task. Students can only read their own rows; the server writes with the admin client after working out the real maximum (grammar: number of exercises, writing: 20).
- POST /api/book/score for grammar (score clamped to the unit's size); the writing grader saves its total, and a saving failure never hides the feedback.
- Fifth skill bar "قواعد وكتابة" on the plan page (best results, weighted; shows units tried out of 9).
- setup.sql re-run twice on Postgres 16: no errors; authenticated can only select. Tests: 180 passing, tsc clean.
- Known limit: grammar scores come from the browser, so a student could send a false score for his own bar. It affects only his own progress bar, nothing shared.

## Phase 5.7 — book listening and speaking (2026-10-24)
- Listening: 5 original texts (units 1, 3, 4, 5, 6), 4 questions each. The browser reads the script aloud (Web Speech), up to 3 plays, script shown after answering. /listening and /listening/[task].
- Speaking: six new topics from the book units added to the Talk topics (role-play, debate, persuasion, invitation).
- /api/book/score now takes {kind: grammar|listening, itemId, score}; maximum comes from our content. book_scores.kind constraint widened (setup.sql updated, re-run twice on Postgres 16 without errors).
- The fifth skill bar is now "الكتاب" (grammar, writing and listening, 14 items). Tests: 182 passing, tsc clean.
- Known limit: Web Speech voices differ by device; some Android browsers have no English voice. The page says so when speech is unsupported.

## Phase 5.8 — achievements, motivation without lost time (2026-10-25)
- User asked for games that motivate and do not waste time. Decision: no separate mini-games. Badges come only from real study, so every minute stays study.
- /achievements: 9 groups (words, streak, XP level, reading, translation, talking, grammar units ≥80%, writing ≥15/20, listening all right), 3 to 7 targets each, 29 badges in total. Computed from existing data, no new table.
- Today shows one line when a badge is at least halfway (words or streak), linking to /achievements. The plan page links to it too.
- Tests: 186 passing, tsc clean. No setup.sql change in this phase.

## Phase 5.9 — README and launch checklist (2026-10-25)
- README status rewritten to what the app really is now (daily session, path, book content, badges, admin cards). Added the "generate cards" setup step.
- New docs/LAUNCH_CHECKLIST.md: the order of steps before going live (Next upgrade, setup.sql, env, admin, cards, limits, test as a student, phone check, teacher pass, privacy, backups, region).
- Logo and theme are still waiting; they need his decision on the name meaning and are the last step.

## Phase 6.0 — new names (2026-10-25)
- Direction change: full UI rebuild. Decisions from the user: site name "طالب علم" (Talib Ilm), AI name "بو" (Bo), game-style direction, a real 3D robot companion instead of the owl.
- `src/lib/brand.ts` holds both names. The dictionary uses `{app}` and `{ai}`; translate() fills them for the active language, so renaming again is one edit.
- Arabic texts rewritten in the masculine for Bo (the robot), English texts use he/him. AI system prompts say Bo, a friendly little robot, speaking masculine Arabic.
- Layout titles, manifest, README and PRIVACY updated. Code identifiers still named Lexa (LexaMascot, LexaLoader, LexaIcon, lexa-* files, /public/lexa) stay until the new robot and design system replace them (phases 6.1 and 6.2).
- Tests: 186 passing, tsc clean.

## Phase 6.2 — Bo as a real 3D robot (2026-10-25)
- User agreed to start with a robot built in code and swap it later for a stronger Blender model.
- three.js added (dynamic import). `src/features/bo/scene.ts` builds Bo: glossy white shell, glass face with glowing eyes and mouth, ears, antenna bulb, arms, soft floor shadow, studio reflections, and moods happy/neutral/sad/thinking (eyes, mouth, antenna, waving arm, bulb color), blinking, floating, head following the pointer.
- `BoRobot` component: loads only when needed, pauses off screen or when the tab is hidden, still frame for reduced motion, flat CSS face when WebGL is missing. `LexaMascot` now renders Bo (old name kept until the screens are redesigned).
- If `public/bo/bo.glb` exists it replaces the built-in robot (see docs/BO_MODEL.md).
- Checked in headless Chromium (software WebGL): four moods render correctly. Not yet checked on a real phone.
- Known limit: the old owl images and the owl loader are still used for loading screens and the logo until 6.1 and 6.4.

## Phase 6.1 — game-style design system (2026-10-25)
- New tokens in globals.css built from Bo's colors: sky paper #eef6ff, navy ink #10224f, electric blue #3250f0, cyan #25bfff, sun yellow #ffc94a, leaf #12a168, red #ec4558. Token names kept, so no component changed.
- Chunky buttons (16px radius, solid lip, press down 5px), outlined quiet buttons, tile cards (2px border, 5px bottom lip, press effect on links), hero card with dot pattern and blue-to-cyan gradient, thicker progress with a gloss stripe, cyan focus ring, yellow highlighter, `pop-in` for good news (used on grammar feedback).
- The owl wrapper animations were removed, because Bo moves by himself in 3D.
- Checked on a 420px-wide mock of the Today screen in Chromium. The real screens are redone one by one in 6.3; icons and the logo in 6.4.
- Theme color and manifest colors updated.

## Phase 6.3 — first screens in the new look (2026-10-25)
- Built the app and checked the real screens on a phone and a desktop viewport with the mock server (software WebGL): Today and Plan.
- `BoMark`: Bo's face as a flat SVG, used in the headers (app, admin, welcome). Today shows the real 3D Bo (neutral, happy when the session is done).
- Plan page: units are now a path with round nodes joined by a line: green check = learned, yellow = in progress, grey = not yet, big blue node with a cyan ring = the current unit.
- Bottom/side navigation: the active tab is a soft blue pill. Header brand on one line.
- Still to redo in the same style: Practice, My words, the review/quiz/translate sessions, and the welcome page. Loading screens still show the old owl until 6.4.
- Build note: `npm run build` stops once with the Next.js security notice; running it again completes. Upgrade Next before going live.

## Phase 6.4 — loader, icons, app icon, practice tiles (2026-10-25)
- Code renamed from Lexa to Bo: BoLoader, BoMascot, BoChatLauncher, BoIcon, bo-* CSS. Old owl images (`public/lexa`) deleted.
- BoLoader: Bo's face bobbing over three bouncing dots. Auth pages show BoMark and the site name instead of the old logo image.
- Icons: XP is a lightning bolt, the Bo tab is a robot head. App icons (192, 512, apple-touch) are Bo's face on the blue gradient, rendered from the same SVG as BoMark.
- Practice page: each activity is a tile with an icon square. Several tiles still share the same few icons; a distinct icon per activity is a small later job.
- `/bo/` is excluded from the auth redirect so `public/bo/bo.glb` loads on public pages too.
- Remaining screens still in the earlier look: My words detail, the session screens (review, quiz, translate, learn, read), welcome page sections. Colors already follow the new tokens everywhere.
- Tests: 186 passing, tsc clean. Built and checked on phone and desktop with the mock server.

## Phase 6.5 — Session screens polish (2026-10-25)
- New `SessionProgress` component (chunky progress bar + "n of m") used in quiz, review, translate, grammar and level test.
- New `.choice` answer tiles (lip border, press effect, picked / right / wrong states, shake on wrong) used in quiz, grammar and listening. Colors use color-mix so dark mode works. Reduced motion respected.
- Styled the native file button in /add.
- tsc clean, 186 tests passing, build OK, phone and desktop screenshots checked.

## Phase 6.6 — Welcome page polish (2026-10-25)
- Brand name and "have account" link no longer wrap on phones; hero buttons are full width on small screens.
- Reason cards got numbered gradient badges.
- tsc clean, tests passing, screenshots checked.

## Phase 6.7 — Practice tile icons (2026-10-25)
- Eight new line icons (quiz, read, translate, grammar, writing, listen, mic, spark); every practice tile now has its own icon.

## Phase 7.0 — AI speed and reliability (2026-10-25)
- Time limits per attempt and per call, instant switch to the backup model on timeout, stream stall cutoff.
- Shared concurrency limiter (6 at once, 8s queue), new "timeout" error kind in admin.
- Browser helper `fetchAi` (40s wait, one automatic retry on busy), used by every AI screen.
- Tests added: limiter, timeouts, fetchAi. See PROBLEMS.md.

## Phase 7.1 — Flying Bo model and the Bo switch (2026-10-25)
- Added the user's model `public/bo/bo.glb` (Shayan, CC BY 4.0, 5,774 triangles, 290 KB). Inspected first: no textures, 16 animation channels, 3 materials.
- Scene: plays its flight animation, recolored to Bo's palette (pearl shell, navy screen, cyan glow). Moods = glow color, speed, lean, thruster rings. Face glow drawn over the screen because the eyes sit inside it.
- Two Bos: "flyer" (default) and "classic". Student picks in Account (/me), kept in localStorage, every Bo on screen updates live. Missing or broken GLB falls back to classic.
- Fixed a latent bug in classic Bo: the sad head lean made the visor reflect the ceiling and turn white. Removed the lean and lowered the visor reflection.
- Credits: CREDITS.md, public/bo/CREDITS.txt, README, welcome footer line.
- Tested: isolated renders of all moods for both Bos, live switching, missing file, reduced motion. Known: the flying model's face is small by design.

## Phase 7.2 — Bo everywhere, new chat, Bo guides new students (2026-10-26)
- Floating Bo on every app screen (hidden only on Today and Account, which show a big Bo). Tap = menu (chat, free move / dock, replay guide, hide). Free mode: drag anywhere, position kept as fractions of the screen in localStorage. Keyboard: Enter opens the menu, arrows move him in free mode. Page bottom padding on phones keeps content scrollable above him.
- Guide: replaced the old tour. Bo flies to each part of the app with a highlight ring and a speech card. Starts by itself once per account (key per user id) and from the menu. Ends with Bo going home.
- Chat rebuilt (`bo-chat.tsx`): status line and a skeleton with a spinning orb while he reads, thinks, writes; the student's message gets a read sweep and a "read" tick; streamed text with a caret; stop button, copy, retry, new chat, starter questions, Enter to send, growing input. Bo's face and the floating Bo change mood with the chat. Server prompt widened to grammar, writing and translation.
- `fetchAi` now accepts a stop signal. New tests: placement and stored preferences, stop signal.
- Tested with a fake Gemini server through the real route (streaming), plus guide, menu, drag, persistence, hide/restore, stop, retry, phone and desktop.
- Vercel build error found: stale files from the Lexa era in the user's repo. See PROBLEMS.md.

## Phase 7.3 — Tablet and desktop layout (2026-10-27)
- Problem: tablets got the narrow side menu (about a third of the screen), pages used different widths, and desktop pages were one thin column with empty sides.
- Tablets (below 1024px) now use the bottom tab bar like phones, with the content centered. The side menu starts at 1024px.
- Desktop: wider content (up to 5xl). Today is two columns from 1280px (session card + side cards). Practice tiles, skill meters, badges, the word list and the account page use two or three columns from 1024px. Exercise screens stay narrow and centered for focus.
- Header chips and content now share the same width. Floating Bo thresholds moved to 1024px.
- Checked 768, 820, 1024, 1366 and 1920 widths for horizontal overflow.

## Phase 7.4 — Site renamed (2026-10-27)
- Site name changed from "طالب علم / Talib Ilm" to "بو / Booo" in `src/lib/brand.ts` (single source). The robot keeps "بو / Bo".
- Updated: manifest name, landing "why the name" text, README, PRIVACY.md.

## Phase 7.5 — No more underlined text (2026-10-27)
- `.pen-error` no longer draws a wavy red underline. Error messages in their own paragraph now sit in a soft red box; inline verdicts (review answer, translate verdict, weak status) are plain red text.
- All text links and footer buttons lost `underline`; they change color on hover instead (`transition-colors hover:text-indigo`). The AL-MO footer link too.

## Phase 8.0 — School curriculum separated from our path (2026-10-27)
- New tables `school_units` and `school_words` (setup.sql, read-only for students, written by the admin API only). `words.source` now allows 'school'.
- Admin tab "School book": add/rename/move/delete units, import words from pasted text or CSV (`src/features/school/parse.ts`, up to 600 words per import, per-line problems reported).
- Words page has two tabs: School book (progress hero + unit cards) and All my words. New page `/words/unit/[id]` with per-word state, "study this unit" and "test me".
- `/api/path/learn` takes `unit` and `track`. School words lead; path words only with `track=path` or when no school words exist. Enrich keeps the admin's meanings and example for school words.
- Today uses school words for the learn step. Path tab renamed "Boost" and marked optional. Review unit test works for school units.
- Not done: skill meter "words" still counts our path only; admin cannot yet edit one word, only delete and re-import.

## Phase 8.0.1 — Missing school tables no longer break pages (2026-10-29)
- Production showed "This page couldn't load" because setup.sql had not been run for the school tables. Loaders now return empty when the tables are missing. See PROBLEMS.md.

## Phase 8.1 — Flying Bo removed (2026-10-29)
- Only the classic Bo (built in code) is left. Removed: `public/bo/bo.glb`, its credits files (`CREDITS.md`, `public/bo/CREDITS.txt`), the GLB loader and flyer code in `scene.ts`, `variant.ts`, `use-bo-variant.ts`, `bo-picker.tsx`, `tests/bo-variant.test.ts`, the footer credit on the welcome page, and the related texts.
- The Account page keeps a simple "show Bo on every screen" switch (`bo-visibility.tsx`). The old saved choice (`bo-variant-v1` in localStorage) is just ignored.

## Phase 8.2 — Grammar explanation as uploaded pictures (2026-10-29)
- The written grammar explanation was not organized enough, and the teacher already has the explanation as formatted pictures. Admin tab "Grammar explanation" uploads them per book unit (up to 20, ordered, deletable).
- Storage: private bucket `grammar-lessons` + table `grammar_lessons` (setup.sql). Students get signed links (1 hour) made server-side. Upload is one file per request (serverless body limit), shrunk in the browser to 1800px JPEG, type checked by magic bytes, max 3.5 MB.
- Lesson step shows the pictures when they exist, otherwise the built-in text. Exercises unchanged.

## Phase 8.3 — Messages from Bo (2026-10-29)
- Table `bo_messages` (setup.sql), admin tab "Bo messages" (add / edit / switch off / delete, up to 200), two new settings: `boMessageEveryMinutes` (20) and `boMessagesPerDay` (4); 0 turns it off.
- Provider checks every 20 s: tab visible, 90 s since opening, Bo not hidden / guiding / in chat / already speaking, not on Today, Account or exercise pages. Counters in localStorage `bo-messages-v1:<user>`. One message of the day is also a card on Today.
- Tested with a mocked clock: first message at about 100 s, none right after. A missing table means no messages, not an error.
