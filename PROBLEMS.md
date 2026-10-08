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
