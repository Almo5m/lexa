# Lexa learning design (draft for phase 3)

Goal: after a few months a secondary-school student can understand a short English text, translate both ways, and speak simple correct sentences.

## What is wrong today
Lexa is a toolbox (add words, practice, quiz, translate, talk, level test). The student has to decide what to do, words come from random photos, and the four skills are not connected. Nothing says "do this today".

## Principles
- Frequent words first, in chunks ("make a decision", not only "decision").
- Small daily dose (about 15 minutes), same order every day.
- Retrieval over recognition: the student types, the system judges (already built).
- Input before output: read or hear it, then translate it, then say it.
- Fix Arabic-speaker patterns (be verb, articles, prepositions, plural, agreement).
- Every word is met again in all four skills within the same week.

## The daily session ("Today", becomes the home screen)
1. Review (3-5 min): due words, typed.
2. Learn (6 min): 10-12 new words or chunks from the current unit, with a real-life scene, audio and a memory hook.
3. Understand (3 min): a short text or dialogue using today's words, 3 questions.
4. Translate (3 min): 3 sentences Arabic to English with today's words, then one English to Arabic.
5. Speak (2 min): answer one question aloud or in writing using 2 of today's words; Lexa fixes at most 2 mistakes.
End: what you learned, and what tomorrow brings.

## Path
Levels A1 to B1, each made of units (about 25 words per unit, one topic or function: daily life, school, food, directions, opinions, past events...). A unit lasts about 2-3 days and ends with a short test and a speaking checkpoint. The existing level test places the student.

## Content
Core word list and unit order are curated (not random AI output) and must be reviewed by an English teacher. AI only personalizes (interests, mini-texts, feedback). Generated texts are cached per unit to stay fast.

## Progress
Four meters on the home screen: Words, Understand, Translate, Speak. Achievements and games hang on these, later.

## Photo extraction
Moves to a side "My own words" area (for school homework words). The main path does not depend on it.

## Build order
3.1 Unit content + the Today flow with Learn and Review. 3.2 Understand. 3.3 Translate and Speak inside the session. 3.4 Unit tests and skill meters. Then games and achievements.

## Vocabulary volume (decided)
- Target: about 3000 words by the end of B1, in three tiers: A1 about 800, A2 about 1000 more, B1 about 1200 more. Pace: 10-12 new words a day, about 250 study days.
- Two kinds of knowing: "active" (typed and used in translate and speak) for the core of each unit, and "recognition" (understand when read or heard) for the rest, which is cheaper and grows from the reading texts.
- Review load is capped per day (for example 40 cards); extra due cards wait, so a busy week never becomes a wall of reviews.
- Frequency order, not random: the most common words first, so each new word makes more of real English readable.

## Status
3.1 is built: A1 content (300 words), the Today screen with the 15/30/45 minute choice, and the teach-then-test learn flow. The Understand step (3.2) is built too: a daily text around the newest words with three questions. A2 and B1 lists, translate and speak with today's words (3.3) are built too. The four skill meters, the path map and unit tests (3.4) are built too. Next: the A2 and B1 lists, then games and achievements. 4.5: B1 now 40 units, about 1030 words (body 3, animals 3, cities, ethics, everyday objects, communication 2). 4.4: B1 had 34 units, about 880 words (finance, digital culture, education 2, daily habits, two verb units). 4.3: B1 had 28 units, about 735 words (materials, work 2, home and tech 2, geography 2, cooking 3, adjectives 2, feelings 2). 4.2: B1 had 21 units, about 550 words (politics, history, mind, language, shopping, more verbs). 4.1: level placement: a reliable level test now sets the start unit (band 3-4 skips A1, band 5 skips A1 and A2); skipped units show greyed on the path and do not count against the words meter. 4.0: B1 now 15 units, about 400 words (added travel, environment, medicine, arts, sport, relationships, abstract ideas, linking words). 3.9: B1 started, 7 units (about 180 words: society, media and jobs, science, economy, law, advanced adjectives, advanced verbs). 3.8: A2 is complete, 41 units (about 990 words): feelings and ideas, school and exams, food 3, home and daily life. Before: 3.7 had 37 units (about 890 words): work and communication, shops and leisure, body and health, verbs, transport 2. Before: 3.6 had 32 units: added everyday verbs, thinking/speaking verbs, adjectives, place words, quantity, linking words and city/community.

## 5.0: one clear structure (focus: third secondary)
The app was feeling like many things at once. The structure is now fixed, with one job per place:

- **النهارده (Today)**: the only thing on it is today's session. Four required steps in a fixed order: review, new words, read a text, translate. Speaking with Lexa is a bonus step and never blocks the end of the day. The step to do now is one big card with one button; the others are small rows.
- **المنهج (Plan)**: where the student stands. The four skill bars, his level, and the units grouped by A1, A2 and B1. The level he is working in opens by itself and the current unit is the only big card.
- **تدريب (Practice)**: free exercises outside the session, grouped by skill: your words, understand and translate, speak and write, your level.
- **كلماتي (My words)**: the archive. Adding words from photos moved here, as a button.
- **Lexa**: the chat, always one tap away.

Every exercise that belongs to the session starts with the same strip: step n of 4, and one way back. The session logic is a plain function (`curriculum/today-plan.ts`) with tests.

Not built yet for the third secondary exam: a grammar track (tenses, conditionals, passive, reported speech, relative clauses) with drills, and guided writing practice. Both need content written against the ministry book, so they wait for the teacher.

## 5.1 Shared finished cards
Meanings and chunks of every path word are hand-written; the rest of the card (examples, notes) is generated once by the admin and stored in `path_cards`. A student learning a word gets the finished card instantly. The teacher can export the cards as CSV and mark them reviewed.

## 5.2 Book grammar
One grammar unit per book unit: short Egyptian-Arabic lesson, examples, 13 drills (choose and type) with an instant check and a reason for every answer. Typed answers ignore case, spacing, final dot and curly quotes. Content is original; only the topics follow the ministry book.

## 5.4 Book writing
Plan, starters, then the student's own text. The server fixes the brief, so marks cannot be steered from the client, and a minimum word count stops empty submissions before they cost an AI call. Marks follow the exam rubric: content, organization, grammar, vocabulary.

## 5.8 Badges instead of games
Every badge is earned by something the student already does (words learned, days in a row, texts read, translations, talks, grammar, writing, listening). There is no separate game to open, so motivation never costs study time. Today shows only the badge that is closest, once it is at least halfway there, so the nudge is short and real.
