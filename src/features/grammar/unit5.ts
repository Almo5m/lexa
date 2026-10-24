import type { GrammarUnit } from "./types";

export const UNIT_5: GrammarUnit = {
  id: "g5",
  number: 5,
  topic: "From Muscles to Mindset",
  rule: "Causative verbs: have and get",
  lessonAr: [
    "الـ causative بنستخدمه لما حد تاني بيعمل الشغل بدالنا، أو بنطلب من حد يعمله.",
    "have + مفعول + V3 = حد عمل حاجة لنا: I had my car repaired. (الفاعل مش مهم أو معروف).",
    "get + مفعول + V3 بنفس المعنى وأقل رسمية: I got my hair cut.",
    "لو عايز تذكر الشخص اللي عمل الشغل: have + شخص + فعل من غير to: She had the mechanic fix the car. و get + شخص + to + فعل: She got the mechanic to fix the car.",
    "الزمن بيتغير على have/get بس، والفعل التاني يفضل زي ما هو: He is having his house painted. / They will have the room cleaned. / She has had her phone fixed.",
  ],
  examples: [
    ["I had my laptop repaired yesterday.", "صلّحت اللابتوب امبارح (حد صلّحهولي)."],
    ["She is getting her photo taken.", "بتتصور دلوقتي (حد بيصورها)."],
    ["He got his brother to help him with the project.", "خلّى أخوه يساعده في المشروع."],
  ],
  exercises: [
    { kind: "choose", q: "I ___ my hair cut every month.", options: ["have", "am", "make", "do"], answer: 0, why: "have + مفعول + V3." },
    { kind: "choose", q: "She had her car ___ last week.", options: ["repair", "repairing", "repaired", "to repair"], answer: 2, why: "بعد المفعول (her car) بنحط V3 لأن حد تاني صلّحها." },
    { kind: "choose", q: "We are going to ___ the windows cleaned.", options: ["have", "having", "had", "has"], answer: 0, why: "going to + الفعل الأساسي have." },
    { kind: "choose", q: "He got his brother ___ him with the homework.", options: ["help", "helped", "to help", "helping"], answer: 2, why: "get + شخص + to + فعل." },
    { kind: "choose", q: "The manager had the employees ___ the report.", options: ["to write", "wrote", "write", "writing"], answer: 2, why: "have + شخص + فعل من غير to." },
    { kind: "choose", q: "Which sentence means someone else cut the tree?", options: ["I cut the tree.", "I had the tree cut.", "I was cutting the tree.", "I will cut the tree."], answer: 1, why: "had the tree cut = حد قطعه لي." },
    { kind: "choose", q: "She ___ her portrait painted at the moment.", options: ["has", "is having", "had", "will having"], answer: 1, why: "الحاضر المستمر: is having + V3." },
    { kind: "choose", q: "I need to ___ my passport renewed before the trip.", options: ["have", "making", "do", "to have"], answer: 0, why: "need to + have." },
    { kind: "choose", q: "Which sentence is correct?", options: ["She got her nails to do.", "She got her nails done.", "She got done her nails.", "She got her nails doing."], answer: 1, why: "get + مفعول + V3: got her nails done." },
    { kind: "type", q: "Complete (fix): Ahmed had his bike ___ by a mechanic.", answers: ["fixed"], why: "have + مفعول + V3." },
    { kind: "type", q: "Complete (take): I got my photo ___ in front of the pyramids.", answers: ["taken"], why: "get + مفعول + V3: taken." },
    { kind: "type", q: "Rewrite with causative: Someone delivered our pizza. → We had our pizza ___.", answers: ["delivered"], why: "had + مفعول + V3." },
    { kind: "type", q: "Complete: She got her sister ___ her with the cooking. (help)", answers: ["to help"], why: "get + شخص + to + فعل." },
  ],
};
