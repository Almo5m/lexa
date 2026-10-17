# Complex problems and decisions

## Students could farm XP by repeating the same word
Review XP is counted only when the word is new or due. A word that is not due can still be practiced, but it changes nothing and earns nothing. The server decides this, not the browser.

## Students could edit their own XP through the public API
Updating the profiles table is revoked for logged-in users, except `display_name`. XP, streak and role are written only by server code with the service key.

## Typed answers must be checked on the server
In write and listen exercises the browser sends the typed text, and the server compares it with the word. The browser never decides whether it was correct.

## Gemini sometimes returns broken JSON
`callGeminiJson` strips code fences, validates with zod, and retries once. A failed batch marks its cards as `failed`, and the student can retry from the word page.

## Card generation can exceed a serverless time limit
Cards are generated five words at a time. The browser calls the route again until nothing is pending, and shows progress.

## Known limits
- The daily AI limit resets at midnight UTC (3 AM Cairo), not at midnight Cairo.
- Streak freeze refills on the first activity of a Saturday. A student who skips Saturdays refills later.
- The admin dashboard reads usage rows directly. It is fine for hundreds of students. For thousands, move the counting into a database view.
- The AL-MO signature is text for now. Replace `src/components/almo-signature.tsx` with the logo file when it is ready.

## Gemini returns 503 "high demand" (UNAVAILABLE)
Seen on the free tier with the main model during busy hours. Fix: each call retries the main model twice with growing waits, then tries a fallback model (set in the dashboard, default `gemini-2.5-flash-lite`). Overload and quota errors (429, 500, 502, 503, 504) count as temporary. Other errors stop at once.
If everything is busy, the student sees "AI is busy, try again in a minute". Cards stay `pending` instead of `failed`, so they are not lost and can be generated again from the word page.

## Retired Gemini models (404 "no longer available")
Google retires model names, and new accounts lose access first. The first default fallback, `gemini-2.5-flash-lite`, returned 404. A 404 now means "skip this model" and the next one is tried, with no retries on the dead one. The default fallback is now `gemini-3.5-flash-lite`.
Model names live in the dashboard, not in the code. If a saved value in the database is old, change it there. If both models fail with 404, update both names.

## Guessing on the level test
The first scoring formula divided the hit rate by (1 - false alarm rate). A student who answered "I know it" to every real word and missed some invented words still scored a perfect level 5 as reliable. The score now loses the false alarm rate directly, and two invented words out of five already mark the result unreliable. A unit test covers this case.

## Cheating on quiz and translation answers
The browser sees which quiz option is correct, and could send a made-up reference sentence for translation. Two limits keep this harmless: XP and review progress only count when a word is due, and the translation grade ignores the browser's reference and uses the tutor's own judgement. A student can only fool themselves.

## One place for answers
Review, quiz and translation first risked three copies of the XP and streak logic. They all call `applyAnswer` now, so the rules cannot drift apart.

## Known limits (phase 2)
- The word bank has 200 words. After a student uses the suggestions for a while the list runs out. It needs more words, reviewed by a teacher.
- The yes/no test measures what the student says they know, not what they can prove. It is a starting point for the level, not an exam. The daily reviews correct the real level over time.
- Translation exercises are generated fresh each time and are not stored, so a student cannot reopen an old exercise.

## The owl image had a fake transparent background
The blank-disc image came with a checkerboard drawn into the pixels, not real transparency. A simple "remove light pixels" would also have cut the cream eyes and the white disc. Fix: flood fill from the image border only, so enclosed light areas stay, then fill holes, soften the edge and pull edge colors from the inside to avoid a gray halo.

## Placing the spinner on a different image
The finished loader image and the blank-disc image have different owl sizes and positions. The disc center and size were measured on the finished one and mapped onto the blank one by the owl's own bounds. The spinner is drawn in the image's own pixel space, so it stays glued to the disc at any display size.

## Brand pictures must load before login
The login page shows the logo, but the proxy sends every visitor without a session to the login page, including requests for images. The proxy now skips `/lexa/`. Without that the logo would fail to load on the very page that needs it.

## Chat sheet accessibility
Lexa's chat uses the native dialog element, so focus stays inside, Escape closes it, and the page behind is inert. A custom sheet would have needed all of that written by hand.

## Not verified in a browser
The build and tests pass, but nothing could be rendered here. Layout, spacing, the raised Add button, and the animations still need a look on a phone and a desktop.

## Environment variables empty in the browser
`env.ts` first read variables by a computed name. Next.js replaces `process.env.NEXT_PUBLIC_...` only when it is written out in full, so the browser code got `undefined` and threw "Missing environment variable". It was found when the app ran for real. The build with dummy values did not catch it because the build never runs the browser code. Fix: each variable is passed by its literal name. A unit test now fails if any file in `src` looks a variable up by a computed name.

## AI not working anywhere on the site
Reading the code found real causes that all end in the same useless message for the student:
- If the main model and the fallback were both retired (404), the raw error escaped and every feature showed a generic failure. A bad key did the same.
- A quota error (429) was retried on the same model, which spends more quota and makes the free tier worse.
- A failed log write could hide the real error or turn a good answer into an error.
Fix: errors are now sorted into busy, quota, model, key and other. Busy waits and retries, then tries the fallback. Quota and retired models move to the fallback at once. A bad key stops at once. The student sees a clear message ("busy" or "not available, tell the admin"), and the real Google message is stored for the admin. A failed log write is ignored.
The AI tab in the dashboard tests both models live, lists the models Google allows for the key (with one-click "make main" and "make fallback"), and checks the keys and the database.

## Dashboard tabs and what to look at first
The old dashboard was one long page. It now has three tabs: Overview (numbers, chart, errors with a plain-language hint), AI (connection test and model list), Settings (grouped, each with a short explanation, save bar appears only when something changed).

## Everything felt slow
Several small costs added up on every request: the proxy and the route both asked Supabase "who is this" over the network, the settings table was read on every call, the usage log was written before the answer was sent, Gemini was "thinking" before short vocabulary answers, and failed calls were retried up to three times with long waits.
Fix: the login token is checked locally (`getClaims`), settings are cached for 30 seconds (and cleared when the admin saves), usage is logged after the response, thinking is turned off for the 2.5 flash models, retries are one per model with a short wait, card batches are 8 words instead of 5, and pages show the Lexa loader while they load. Not measured against the real services yet, so compare the Latency numbers in the dashboard before and after.

## Lexa's replies showed raw asterisks
The model writes `**word**` and the chat printed it as plain text. Fix: Lexa's replies go through a small safe parser (bold, italic, lists, headings turned into bold) that never builds HTML, and English words inside Arabic lines keep their direction. The prompt also tells Lexa how to format.

## "Forgot / Remembered" was not a real test
The student graded himself, so the schedule depended on honesty. Review is now typed only: write the word from its meaning, write it from audio, or write a sentence with it. The server decides. Words are checked exactly (a hint lowers the grade). Sentences are first checked for the word locally, then Lexa judges meaning and grammar and explains the mistake. If the AI is down the student can skip a sentence without a penalty. Needs the database update (`supabase/setup.sql`).

## A free demo is an open door to the AI bill
The landing-page demo has no login, so anyone (or a script) can call it. Counting per account is impossible. Fix: each request is counted per day per salted IP hash in one atomic database function, there is a daily ceiling for the whole demo, requests from other websites are refused, and the input is limited to one English word or one short sentence. The counter table has no public policies, so only the server can read or write it. Known limit: IPs can be rotated, so the daily ceiling is the real protection. A bot check (Cloudflare Turnstile) is the next step if abuse shows up in the dashboard.

## Dashboard stats test expected four AI features
Adding the "review" and "demo" features made the old stats tests fail. The tests now list all six. The dashboard tables show them too.

## Personalizing the prompt without opening it to injection
Sending the student's own text ("I like...") into the card prompt would let anyone change what the AI writes. Interests are picked from a fixed list of twelve ids, checked on the server and again by a database constraint, and only the ids are put in the prompt. The student can edit his interests, but the grant covers only `display_name`, `interests` and `onboarded`. XP, streak and role stay locked.

## Memory hooks can be forced
A sound-alike trick only works for some words, and a bad one teaches the wrong thing. The prompt says to use a vivid picture when there is no natural sound-alike, to never force a false link, and allows an empty hook. Needs a teacher to read a sample of hooks before launch.

## Levels from an AI are noisy
One text can score high or low by luck. The profile shows the average of the latest three texts instead of the last one, the levels are shown as bands (A1 to C1) and not fake-precise percentages, and the page says they are estimates. The prompt asks for fair judging for a secondary student and says not to give the top level easily. Needs real student texts checked by a teacher before the numbers are trusted.

## The AI can invent a mistake label
If the model returned a label outside the fixed list, the whole answer would fail validation and the student would lose his result. Unknown labels now become "other", and "other" is left out of the "mistakes that keep coming back" list because it says nothing useful.

## Farming XP with fake texts
Anyone could paste text again and again for XP. Only text that is mostly English letters is accepted, the length is capped, and XP is paid for the first three texts a day. The AI daily limit applies too.

## A progress link for a minor must be safe by design
Most students here are under 18, so a public link to their progress is a real risk. Decisions: the student creates it himself (opt-in), the token is 256 random bits, only its hash is stored (a leaked database gives no working links), it expires after 30 days, one active link per student (a new one cancels the old), he can stop it at any time, the page is `noindex` and never cached, and a wrong or expired link shows the same message so nobody can tell which tokens exist. The report is built on the server with a fixed list of fields: first name only, no words, no texts, no email. Known limit: whoever gets the link can forward it, so the page says clearly what it shows and the student sees the same list before making it.

## Running the SQL twice failed ("relation profiles already exists")
`schema.sql` was written to run once on an empty database, so running it again, or on a database from an earlier phase, stopped with an error, and Moaz could not tell which updates had been applied. Fix: one file, `supabase/setup.sql`, that can be run any number of times. Every table and index uses `if not exists`, new columns use `add column if not exists`, constraints and policies are dropped and recreated, and nothing deletes data. The old `schema.sql` was removed so there is no second file to mix up. It was tested on a real PostgreSQL 16 with Supabase-like roles: an empty database run three times; a database built from the phase 2.4 schema with a student's data in it, upgraded and run twice; the exact error reproduced and then fixed; and all migration files run twice. After upgrading, the student's XP was untouched, a student can edit his interests but not his XP or role, and the demo counter table is invisible to students. Not tested on Supabase itself (its own auth and storage schemas were stubbed).

## The AI felt slow
The student waited for the whole reply before seeing anything. Fixes: the tutor streams its answer word by word (first text in about 1 second against 2.3 for the full reply on the test server), thinking is turned off or kept minimal in the Gemini call, the token is checked locally, settings are cached for 30 seconds, queries run in parallel, history is cut to 8 turns, and cards are generated in groups of 4 with 3 running together. Not measured on the real Gemini yet. What can still make it slow in production: the model chosen in the dashboard, and a hosting region far from Supabase (choose the function region next to the Supabase project).

## English sentences came out scrambled in Arabic chat
When bold split an English sentence into pieces inside an Arabic line, the pieces were reordered. The renderer now puts each English run inside one left-to-right isolate, and the student's own messages use auto direction.

## The microphone was blocked by our own header
The security header said `microphone=()`, so voice in /talk could never work. Changed to `microphone=(self)`. Camera and location stay blocked.

## Things the site was missing
Found by walking through it as a student: no way to reset a forgotten password, no place to change the name, and no way to delete the account although the privacy page promised it. All three added (/forgot, /reset, and the Account section in /me). The reset form never says whether an email is registered. Deleting needs typing a confirmation word and is checked on the server for same-origin.

## New words were tested before they were taught
In the old review, a word the student had never seen went straight into "type this word" with only the Arabic meaning. A student cannot recall what he never met. New path words now go through a teaching card first (word, sound, meaning, a short phrase), then a typed test of the same five words, then the next five. Path words that were not learned yet never enter the normal review.

## Waiting for the AI before the first word
Cards used to be generated by the AI before the student could start. Path words start from a hand-written card, so learning begins at once, and the AI fills the examples and the memory hook in the background. If the AI is busy or the daily limit is reached, the basic card stays and nothing is lost. The teacher-written meaning is always kept first, so the AI cannot contradict the path.

## Same words across days without losing any
If a student opens the learn page and leaves, the words he already received but did not learn come first the next time, and they count toward the day's quota, so he never skips words and never gets more than his time allows. "10 more words" adds extra on top of the quota.

## Coverage
A1 (300), A2 (about 990) and B1 so far (40 units, about 1030 words) are written; about 2320 in total. About 680 more words are still missing for the 3000 target, and a teacher should review every list before launch.

## The reading text could cheat or be useless
Two risks: the browser getting the right answers before answering, and a generated text that ignores the target words. The passage (with answers) lives in a table students have no policy on; the browser gets the question and options only, and the correct option and the Arabic explanation come back one question at a time after the server grades it. Answers must come in order and repeated requests change nothing. A text that uses fewer than 60 percent of the target words (any common form counts) is thrown away and asked for again, twice at most. The Arabic translation is hidden until the last answer.

## A half-finished reading feature was found on disk
When starting 3.2, the API routes, the table, the tests and a component for the reading text already existed (written after the 3.1 package), but the component did not compile, there was no page, no texts in the dictionary and no step on the home screen. I kept that design (one text a day per student), cleaned the component, and finished the page, the texts and the home step. The home screen reads the completion flag with the server key, because students have no read policy on that table.

## The speak step must not trust the browser for its words
The "use today's words" topic carries the words in its prompt, and a student could change them to make an easy task. The browser sends only the topic id "words"; the server finds the words again from his latest learned words, builds the prompt, and counts which ones appear in his text. A word counts in common forms (plural, -ed, -ing). If he has fewer than two recent words the topic is refused and the normal topics are used.

## A unit test that the student could fake
A saved "unit passed" mark sent by the browser could be forged. Instead of storing a result, the state of a unit is computed from the words' own review state (learned, and solid after two correct reviews in a row), which only the server changes. The unit test is a practice review of the unit's words, weakest first; it does not change the schedule of words that are not due, so it cannot be used to farm progress.

## Meters that look precise with little data
Showing 100 percent after one correct translation would mislead. A meter needs at least three translations, one finished reading text, or one analyzed speaking text before it shows a number; the speaking meter follows the average of the latest three texts, the same smoothing as the language profile.

## Level placement is coarse
The start unit comes only from the 5-band vocabulary test (3-4 skip A1, 5 skips A1 and A2). A student who skips can still go back by opening a skipped unit's test. A finer placement (a short test per unit) is a later step. Band 5 starts at B1, which is only partly written for now.

## Teacher review of the word lists
`npm run export:curriculum` writes `exports/curriculum-review.csv` with every word, its meaning, the example sentences and two empty columns (teacher_ok, teacher_correction). The teacher fills the file, and the corrections are applied to the unit files by hand. The script needs Node 22.13 or newer.
