import type { GrammarUnit } from "./types";

export const UNIT_6: GrammarUnit = {
  id: "g6",
  number: 6,
  topic: "Let's Hang Out!",
  rule: "Reported questions",
  lessonAr: [
    "لما ننقل سؤال بنحوّله لجملة عادية: مفيش علامة استفهام، ومفيش do/does/did، والترتيب فاعل + فعل.",
    "الفعل المساعد بيرجع خطوة لورا زي الـ reported statements: do/does → فعل Past، will → would، can → could، have + V3 → had + V3.",
    "أسئلة الـ wh (what, where, when, why, how) بنحط الكلمة وبعدها الجملة العادية: \"Where do you live?\" → He asked me where I lived.",
    "أسئلة yes/no بنستخدم if أو whether: \"Do you like football?\" → She asked me if I liked football.",
    "الضمائر وكلمات الوقت بتتغير زي ما اتعلمنا: today → that day، tomorrow → the next day، here → there. والفعل asked بيتبعه المفعول أو من غيره: He asked (me) ...",
  ],
  examples: [
    ["\"Where are you going?\" she asked. → She asked where I was going.", "سألت أنا رايح فين."],
    ["\"Do you want to come?\" he asked. → He asked if I wanted to come.", "سألني عايز تيجي ولا لأ."],
    ["\"What did you do yesterday?\" → She asked what I had done the day before.", "سألتني عملت إيه امبارح."],
  ],
  exercises: [
    { kind: "choose", q: "\"Where do you live?\" he asked me. → He asked me where I ___.", options: ["live", "lived", "do live", "did live"], answer: 1, why: "Present Simple بيرجع Past، ومفيش do." },
    { kind: "choose", q: "\"Are you coming to the party?\" she asked. → She asked ___ I was coming to the party.", options: ["that", "if", "what", "do"], answer: 1, why: "سؤال yes/no بيتنقل بـ if أو whether." },
    { kind: "choose", q: "\"What time does the film start?\" → He asked what time the film ___.", options: ["starts", "start", "started", "does start"], answer: 2, why: "ترتيب جملة عادية وزمن Past: started." },
    { kind: "choose", q: "Which sentence is correct?", options: ["She asked me where was I going.", "She asked me where I was going.", "She asked me where did I go.", "She asked me where I am going?"], answer: 1, why: "فاعل + فعل، ومن غير علامة استفهام." },
    { kind: "choose", q: "\"Can you help me?\" he asked. → He asked if I ___ help him.", options: ["can", "could", "will", "would to"], answer: 1, why: "can بتبقى could." },
    { kind: "choose", q: "\"Have you finished?\" the teacher asked. → The teacher asked whether we ___ finished.", options: ["have", "had", "did", "were"], answer: 1, why: "Present Perfect بيبقى Past Perfect: had finished." },
    { kind: "choose", q: "\"Will you join us tomorrow?\" she asked. → She asked if I would join them ___.", options: ["tomorrow", "the next day", "yesterday", "today"], answer: 1, why: "tomorrow بتبقى the next day." },
    { kind: "choose", q: "\"Why are you late?\" he asked us. → He asked us why ___ late.", options: ["are we", "we were", "were we", "we are"], answer: 1, why: "ترتيب جملة عادية وزمن Past: we were." },
    { kind: "choose", q: "\"Did you enjoy the trip?\" she asked me. → She asked me if I ___ the trip.", options: ["had enjoyed", "did enjoy", "enjoy", "have enjoyed"], answer: 0, why: "Past Simple في السؤال بيبقى Past Perfect: had enjoyed." },
    { kind: "type", q: "Report: \"Where is the cafe?\" he asked. → He asked where the cafe ___.", answers: ["was"], why: "is بتبقى was." },
    { kind: "type", q: "Report: \"Do you like pizza?\" she asked me. → She asked me ___ I liked pizza.", answers: ["if", "whether"], why: "yes/no بنستخدم if أو whether." },
    { kind: "type", q: "Report: \"How old are you?\" he asked. → He asked how old I ___.", answers: ["was"], why: "are بتبقى was، والضمير you بقى I." },
    { kind: "type", q: "Report: \"Can I sit here?\" she asked. → She asked if she ___ sit there.", answers: ["could"], why: "can بتبقى could، و here بقت there." },
  ],
};
