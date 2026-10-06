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
