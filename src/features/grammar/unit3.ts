import type { GrammarUnit } from "./types";

export const UNIT_3: GrammarUnit = {
  id: "g3",
  number: 3,
  topic: "Protect Nature, Protect Future",
  rule: "Modal verbs for deduction, regret and blame",
  lessonAr: [
    "التخمين عن الماضي (Deduction): must have + V3 = متأكد إنه حصل. can't / couldn't have + V3 = متأكد إنه ماحصلش. might / may / could have + V3 = ممكن حصل وممكن لأ.",
    "الندم (Regret): I should have + V3 = كان لازم أعمل كده بس ماعملتش. I shouldn't have + V3 = ماكانش لازم أعمل كده بس عملت.",
    "اللوم (Blame): You should have... / You shouldn't have... بنقولها لحد تاني. وممكن could have لحاجة كانت ممكنة ومااتعملتش: You could have saved the water.",
    "بعد have بنحط الفعل في الصيغة التالتة دايمًا: must have gone، should have helped.",
    "ماتقولش must have + V1 ولا should had. الشكل ثابت: modal + have + V3.",
  ],
  examples: [
    ["The river is dry. It must have rained very little this year.", "النهر ناشف. أكيد المطر كان قليل السنة دي."],
    ["He can't have planted all these trees in one day.", "مستحيل يكون زرع كل الشجر ده في يوم."],
    ["We should have recycled more plastic.", "كان لازم نعمل ريسايكل لبلاستيك أكتر."],
  ],
  exercises: [
    { kind: "choose", q: "The streets are wet. It ___ rained during the night.", options: ["must have", "should have", "can't have", "must"], answer: 0, why: "الشوارع مبلولة، يعني متأكد إن المطر نزل: must have." },
    { kind: "choose", q: "He ___ seen the sign. It was too small to read from there.", options: ["must have", "can't have", "should have", "would have"], answer: 1, why: "متأكد إنه ماشافهاش: can't have seen." },
    { kind: "choose", q: "I don't know where she is. She ___ gone to the park.", options: ["might have", "should have", "can't have", "must"], answer: 0, why: "مجرد احتمال: might have gone." },
    { kind: "choose", q: "We wasted a lot of water. We ___ been more careful.", options: ["must have", "should have", "might", "can't have"], answer: 1, why: "ندم على حاجة مااتعملتش: should have been." },
    { kind: "choose", q: "You ___ thrown that bottle in the sea! It harms the fish.", options: ["should have", "shouldn't have", "can't have", "might have"], answer: 1, why: "لوم على حاجة اتعملت وماكانتش المفروض: shouldn't have thrown." },
    { kind: "choose", q: "She ___ helped us clean the beach, but she stayed home.", options: ["could have", "must have", "can't have", "shouldn't"], answer: 0, why: "كانت ممكنة ومااتعملتش: could have helped." },
    { kind: "choose", q: "Which sentence is correct?", options: ["He should have went home.", "He should have gone home.", "He should had gone home.", "He should have go home."], answer: 1, why: "modal + have + V3: should have gone." },
    { kind: "choose", q: "The lake is full of fish again. The clean-up ___ worked.", options: ["can't have", "must have", "shouldn't have", "might not"], answer: 1, why: "دليل واضح (السمك رجع)، يعني متأكد إنه نجح: must have worked." },
    { kind: "choose", q: "I forgot to turn off the lights. I ___ remembered!", options: ["must have", "should have", "can't have", "might have"], answer: 1, why: "ندم على حاجة نسيتها: should have remembered." },
    { kind: "type", q: "Complete (plant): We should ___ more trees last year.", answers: ["have planted"], why: "should have + V3: have planted." },
    { kind: "type", q: "Complete (be): The air is so clean. It ___ have been a rainy day.", answers: ["must"], why: "الدليل بيخلينا متأكدين: must have been." },
    { kind: "type", q: "Make it negative regret (cut down): They ___ cut down the forest.", answers: ["shouldn't have", "should not have"], why: "ماكانش لازم يعملوها: shouldn't have cut down." },
    { kind: "type", q: "Sure it didn't happen: He was with me all day, so he ___ stolen the bag.", answers: ["can't have", "cannot have", "couldn't have"], why: "متأكد إنه ماعملهاش: can't have stolen." },
  ],
};
