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
