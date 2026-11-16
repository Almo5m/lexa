# Before going live

Do these in order. Each one takes a few minutes. Most of the checking is done for you: open the admin, tab "جاهزية النشر" (Launch check). It looks at the real project and shows what is missing.

1. **Run `supabase/setup.sql`** in the Supabase SQL editor. It is safe to run again, and it must be run after every update (new tables and functions arrive with it).
2. **Environment variables**, locally in `.env.local` and in the host settings (Vercel). Never commit the real file, and keep the service-role key on the server only.
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` (required)
   - `NEXT_PUBLIC_SITE_URL` (your final address, for robots and sitemap)
   - `NEXT_PUBLIC_CONTACT_EMAIL` (optional: shown on the privacy and terms pages. Without it the pages send students to the "Send us a message" page)
3. **Make yourself admin** with the SQL line in the README.
4. **Open the Launch check tab.** Every "essential" line must be green. Fix them in the tab it names.
5. **Fill the content:** school words, grammar pictures, at least 3 Bo messages, 7 words of the day, one contest, and generate the path cards (keep the page open until the bar is full, then give the CSV to the teacher).
6. **Check the AI limits** in the admin settings: model, fallback model and the daily limit per student. Move Gemini to the paid tier before many students use it (the free tier may let Google use the content).
7. **Walk through as a new student:** sign up, take the level test, finish one Today session, join the weekly board, play the daily challenge and one duel, send a message from "Send us a message", then delete that test account from the Account page.
8. **Phone check.** Open the installed app (PWA) on a real Android phone and an iPhone. Listening depends on the voice of the device, so test it on both.
9. **Teacher pass.** The word lists and the finished cards are reviewed by a teacher, who marks them in the CSV. Fix what the teacher flags before many students use them.
10. **Privacy.** Read the in-app Privacy and Terms pages (`/privacy`, `/terms`) and `PRIVACY.md` once more. They must match what the app really stores. The text lives in `src/features/legal/content.ts`.
11. **Backups.** Turn on the daily backup in Supabase, or at least export the database before every big update.
12. **Region.** Put the Vercel function region next to the Supabase project. It makes every request faster.
13. **Domain.** Connect it, then update `NEXT_PUBLIC_SITE_URL` and the Supabase auth redirect URLs.

If something fails in step 7, write it in `PROBLEMS.md` with what you did and what you saw.
