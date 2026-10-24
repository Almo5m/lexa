import type { GrammarUnit } from "./types";

export const UNIT_1: GrammarUnit = {
  id: "g1",
  number: 1,
  topic: "Inside the World of Care",
  rule: "Present Perfect and Present Perfect Continuous",
  lessonAr: [
    "Present Perfect = have/has + الفعل في الصيغة التالتة. بنستخدمه لحاجة حصلت ولها أثر دلوقتي، أو لتجربة من غير ما نحدد وقتها: I have finished my homework.",
    "Present Perfect Continuous = have/has been + فعل بـ ing. بنستخدمه لحاجة بدأت في الماضي ولسه مستمرة أو لسه واقفة قريب وليها أثر: She has been studying for two hours.",
    "for + مدة (for two hours)، since + نقطة بداية (since 2020). دول الاتنين بيجوا مع الاتنين.",
    "Present Perfect بيركّز على النتيجة أو العدد (I have read three books). Continuous بيركّز على المدة والاستمرار (I have been reading all day).",
    "ماينفعش تحط وقت محدد منتهي معاهم زي yesterday أو last week. ده مكانه Past Simple.",
  ],
  examples: [
    ["The nurse has helped hundreds of patients.", "الممرضة ساعدت مئات المرضى."],
    ["He has been working at the hospital since 2019.", "هو بيشتغل في المستشفى من سنة 2019."],
    ["They have just arrived.", "هم لسه واصلين."],
  ],
  exercises: [
    { kind: "choose", q: "She ___ in this hospital for ten years.", options: ["works", "has worked", "worked", "is worked"], answer: 1, why: "for ten years ومستمرة لحد دلوقتي، يعني Present Perfect: has worked." },
    { kind: "choose", q: "I ___ my keys. Can you help me look for them?", options: ["have lost", "lost", "am losing", "had lost"], answer: 0, why: "الأثر دلوقتي (لسه مش لاقيهم)، يعني Present Perfect." },
    { kind: "choose", q: "They have lived here ___ 2018.", options: ["for", "since", "ago", "during"], answer: 1, why: "2018 نقطة بداية، يبقى since." },
    { kind: "choose", q: "We have known each other ___ five years.", options: ["since", "from", "for", "in"], answer: 2, why: "five years مدة، يبقى for." },
    { kind: "choose", q: "My eyes are red because I ___ for hours.", options: ["have studied", "have been studying", "studied", "study"], answer: 1, why: "التركيز على الاستمرار في المدة (for hours) وفي أثر واضح، يعني Continuous." },
    { kind: "choose", q: "He ___ three emails this morning.", options: ["has been writing", "has written", "is written", "wrote"], answer: 1, why: "فيه عدد (three emails) فبنركّز على النتيجة: Present Perfect." },
    { kind: "choose", q: "How long ___ you ___ English?", options: ["have / learned", "did / learn", "have / been learning", "are / learning"], answer: 2, why: "How long مع استمرار لحد دلوقتي: have you been learning." },
    { kind: "choose", q: "Which sentence is correct?", options: ["I have seen him yesterday.", "I saw him yesterday.", "I have seeing him yesterday.", "I see him yesterday."], answer: 1, why: "yesterday وقت محدد منتهي، فمكانه Past Simple مش Present Perfect." },
    { kind: "choose", q: "It ___ for three days, and the streets are still wet.", options: ["has rained", "has been raining", "rained", "is rain"], answer: 1, why: "المطر استمر مدة (three days) فنستخدم Continuous." },
    { kind: "type", q: "Complete with the correct form of (finish): She ___ her shift already.", answers: ["has finished"], why: "الفاعل she يبقى has + finished." },
    { kind: "type", q: "Complete with the correct form of (wait): We ___ for the doctor since nine o'clock.", answers: ["have been waiting"], why: "since + استمرار: have been waiting." },
    { kind: "type", q: "Rewrite with Present Perfect: He began working here in 2020, and he still works here. → He ___ here since 2020.", answers: ["has worked", "has been working"], why: "الاتنين صح مع since: has worked أو has been working." },
    { kind: "type", q: "Make it negative: She has visited her grandmother this month. → She ___ her grandmother this month.", answers: ["has not visited", "hasn't visited"], why: "النفي: has not / hasn't + V3." },
  ],
};
