import type { GrammarUnit } from "./types";

export const UNIT_4: GrammarUnit = {
  id: "g4",
  number: 4,
  topic: "Marine Life",
  rule: "Adjectives and compound adjectives",
  lessonAr: [
    "الصفة بتيجي قبل الاسم، وماتتغيرش للجمع: a beautiful reef, beautiful reefs. وبعد verb to be: The water is clear.",
    "لو فيه أكتر من صفة، الترتيب: الرأي، الحجم، السن، الشكل، اللون، الأصل، الخامة، وبعدين الاسم. a lovely small old round blue Egyptian ceramic bowl. في الكلام العادي بنستخدم اتنين أو تلاتة بس.",
    "الصفة المركبة (compound adjective) = كلمتين أو أكتر متوصلين بشرطة وبيشتغلوا كصفة واحدة: well-known, eye-catching, man-made.",
    "رقم + اسم بيتحول لصفة مركبة، والاسم دايمًا مفرد من غير s: a ten-minute walk (مش ten-minutes)، a five-star hotel، a two-hour trip.",
    "ممكن تركّب: صفة/ظرف + اسم/صيغة تالتة أو ing: a heart-breaking story, a well-protected reef, a fast-growing city.",
  ],
  examples: [
    ["We took a three-hour boat trip to the reef.", "خدنا رحلة مركب مدتها تلات ساعات للشعاب."],
    ["The whale is a huge, gentle animal.", "الحوت حيوان ضخم ووديع."],
    ["It is a well-known diving spot in the Red Sea.", "ده مكان غطس مشهور في البحر الأحمر."],
  ],
  exercises: [
    { kind: "choose", q: "We stayed in a ___ hotel by the sea.", options: ["five-stars", "five-star", "five stars", "fives-star"], answer: 1, why: "رقم + اسم مفرد قبل اسم تاني: five-star." },
    { kind: "choose", q: "It was a ___ walk to the beach.", options: ["ten-minutes", "ten minute", "ten-minute", "tens-minute"], answer: 2, why: "ten-minute: الاسم مفرد وبشرطة." },
    { kind: "choose", q: "Which order is correct?", options: ["a red big fish", "a big red fish", "a fish big red", "a red fish big"], answer: 1, why: "الحجم (big) قبل اللون (red)." },
    { kind: "choose", q: "She wore a ___ dress.", options: ["silk beautiful", "beautiful silk", "silk-beautiful", "beautifuls silk"], answer: 1, why: "الرأي (beautiful) قبل الخامة (silk)." },
    { kind: "choose", q: "Coral reefs are ___ places that need protection.", options: ["well-known", "well known by", "know-well", "knowing well"], answer: 0, why: "well-known صفة مركبة مشهورة بمعنى مشهور." },
    { kind: "choose", q: "The tourists took a ___ trip around the island.", options: ["two-day", "two-days", "two days", "second-day"], answer: 0, why: "two-day: مفرد وبشرطة." },
    { kind: "choose", q: "That documentary was a ___ story about a lost whale.", options: ["heart-breaking", "heart-break", "broken-hearting", "breaking-heart"], answer: 0, why: "heart-breaking = مفجع، اسم + ing." },
    { kind: "choose", q: "Which sentence is correct?", options: ["It is a four-years-old turtle.", "It is a four-year-old turtle.", "It is a four year olds turtle.", "It is a four-year-olds turtle."], answer: 1, why: "four-year-old: كل الأجزاء مفردة." },
    { kind: "choose", q: "I saw a ___ turtle near the reef.", options: ["green small", "small green", "smalls green", "green smalls"], answer: 1, why: "الحجم (small) قبل اللون (green)، والصفة ماتتجمعش." },
    { kind: "type", q: "Write a compound adjective: We spent a trip that lasted six hours. → We took a ___ trip.", answers: ["six-hour"], why: "six-hour بدون s." },
    { kind: "type", q: "Complete with one word: A problem caused by humans is a ___-made problem.", answers: ["man"], why: "man-made = من صنع الإنسان." },
    { kind: "type", q: "Write the compound adjective: a boy who is twelve years old → a ___ boy.", answers: ["twelve-year-old"], why: "twelve-year-old." },
    { kind: "type", q: "Write the compound adjective: a lesson that lasts forty-five minutes → a ___ lesson.", answers: ["forty-five-minute"], why: "forty-five-minute، والاسم مفرد." },
  ],
};
