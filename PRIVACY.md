# Privacy and ownership

## Ownership
Booo (بو) is owned by Moaz (AlMo). All Rights Reserved. See `LICENSE`.

## What the app stores
- Account: email, display name, and the progress numbers (XP, streak).
- Words each student adds, the study cards for them, and the review history.
- Interests the student chose from a fixed list.
- The texts the student writes in "Talk to Bo", with Bo's levels and the mistakes found. Only the student can read them.
- The daily reading text Bo writes for him from the words he learned, with his answers to its three questions. Only the server reads this table.
- A progress link, if the student makes one. Only a hash of its secret is stored, never the secret itself.
- AI usage records: which feature ran, success or failure, how long it took, and the error text if it failed. No message text is stored here.

## Photos
Photos are read in memory to extract the words. They are not saved on the server or in the database.

## What is sent to Gemini
Photos (for word extraction), words, the sentences the student writes to the tutor or in review, the texts he writes in "Talk to Bo", and the words used to write his daily reading text. Interests are sent only as ids from a fixed list. The student's name and email are never sent.
The free Gemini tier may let Google use submitted content to improve its products. Move to the paid tier before opening the app to students.

## Visitors on the landing page
The demo needs no account. Each visitor is counted per day using a salted hash of the IP address, only to limit abuse. The IP itself is never stored. The word or sentence typed in the demo is sent to Gemini and is not saved.

## Progress link for a parent or teacher
The student decides. He makes a private link, and anyone who has it sees: his first name, XP, level and streak, how many words he has (and how many are mastered or weak), the last seven days of activity, and his language level with the kinds of mistakes that repeat. They do not see his words, his texts or his email. The link expires after 30 days, a new link cancels the old one, and the student can stop it at any time. The page is not indexed by search engines.

## Student rights
A student can delete his own account and all related data from the Account page (/me) at any time. Deleting the login removes everything linked to it: words, progress, chats, language texts, reading texts and the progress link. Usage records of the AI stay only without his id, as numbers.
