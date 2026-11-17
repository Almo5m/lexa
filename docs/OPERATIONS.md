# Running the app after launch

A short routine for the admin. Everything is in the dashboard.

## Every day (5 minutes)
- **Overview:** new students, how many studied today, this week and this month. If the AI success rate is red, open the AI tab and read the error log.
- **Student messages:** answer what students sent, then press "Mark handled". Problems first.

## Every week
- **Weekly contest:** write the next one (questions, dates, prize). The winners show on the contest card with their real names, for you only.
- **Bo messages and word of the day:** keep at least a week ahead.
- **Launch check tab:** a quick look that everything is still green.

## Selling Plus
Plus codes tab: make a batch (name, how many, how many days). The file downloads once, send or sell the codes any way you like. The tab shows how many were used, and you can cancel the unused ones. To gift days to one student, open him in the Students tab. Write the price and how to buy in Settings, group Booo Plus.

## Following a student
Students tab: search by name, open the student to see his level, streak, words, reviews, challenges and the last 7 days. The list shows who studied lately. A student who never studied shows "not yet".

## When a student asks to delete his data
He can do it himself from the Account page. If he asks you: Students tab, open him, "Delete student". It removes the account and everything linked to it for good, and writes a line in the admin log (without his name or email).

## Before every update
Export the database, run `supabase/setup.sql` after deploying, and open the Launch check tab.
