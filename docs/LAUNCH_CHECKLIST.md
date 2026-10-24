# Before going live

Do these in order. Each one takes a few minutes.

1. **Upgrade Next.js.** `npm install next@latest`, then `npm run build`. The older 16.x line stops the build with a security notice, so this comes first.
2. **Run `supabase/setup.sql`** in the Supabase SQL editor. It is safe to run again, and it must be run after every update (new tables and checks arrive with it).
3. **Environment variables.** Fill all four in `.env.local` locally and in the host settings (Vercel). Never commit the real file, and use the service-role key on the server only.
4. **Make yourself admin** with the SQL line in the README.
5. **Generate the finished cards.** Admin, "كروت المسار" tab, press generate and keep the page open until the bar is full. Then download the CSV and give it to the teacher.
6. **Check the AI limits** in the admin settings: model, fallback model and the daily limit per student.
7. **Walk through as a new student:** sign up, take the level test, finish one Today session, open the book grammar, write one text, listen to one text, open the badges.
8. **Phone check.** Open the installed app (PWA) on a real Android phone and an iPhone. Listening depends on the voice of the device, so test it on both.
9. **Teacher pass.** The word lists and the finished cards are reviewed by a teacher, who marks them in the CSV. Fix what the teacher flags before many students use them.
10. **Privacy.** Read `PRIVACY.md` once more and make sure the contact line is yours. Students under 18 will use the app, so the privacy text must match what the app really stores.
11. **Backups.** Turn on the daily backup in Supabase, or at least export the database before every big update.
12. **Region.** Put the Vercel function region next to the Supabase project. It makes every request faster.

If something fails in step 7, write it in `PROBLEMS.md` with what you did and what you saw.
