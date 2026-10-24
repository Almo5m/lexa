import type { GrammarUnit } from "./types";

export const UNIT_2: GrammarUnit = {
  id: "g2",
  number: 2,
  topic: "The Power of Machines",
  rule: "Reported statements and commands",
  lessonAr: [
    "لما بننقل كلام حد (reported speech) غالبًا بنرجّع الزمن خطوة لورا: am/is → was، are → were، Present Simple → Past Simple، will → would، can → could، Present Perfect → Past Perfect.",
    "الضمائر بتتغير حسب مين بيحكي: He said, \"I am tired\" → He said that he was tired.",
    "كلمات الوقت والمكان بتتغير: now → then، today → that day، tomorrow → the next day، yesterday → the day before، here → there.",
    "said من غير مفعول: He said that... ، و told لازم مفعول: He told me that...",
    "الأوامر: told/asked/ordered + المفعول + to + الفعل. والنهي: not to + الفعل. \"Close the door,\" → She told him to close the door. \"Don't touch it,\" → She told him not to touch it.",
  ],
  examples: [
    ["\"The robot works fast,\" he said. → He said that the robot worked fast.", "قال إن الروبوت بيشتغل بسرعة."],
    ["\"I will fix it tomorrow,\" she said. → She said she would fix it the next day.", "قالت إنها هتصلحه تاني يوم."],
    ["\"Turn off the machine,\" the engineer told us. → The engineer told us to turn off the machine.", "المهندس قالنا نطفي الماكينة."],
  ],
  exercises: [
    { kind: "choose", q: "\"I am building a robot,\" Ali said. → Ali said that he ___ a robot.", options: ["is building", "was building", "has built", "builds"], answer: 1, why: "am/is/are + ing بترجع خطوة: was building." },
    { kind: "choose", q: "\"We can finish today,\" they said. → They said that they ___ finish that day.", options: ["can", "could", "will", "may"], answer: 1, why: "can بتبقى could، و today بتبقى that day." },
    { kind: "choose", q: "\"I will call you tomorrow,\" she said to me. → She told me that she ___ call me the next day.", options: ["will", "would", "is going", "can"], answer: 1, why: "will بتبقى would، و tomorrow بتبقى the next day." },
    { kind: "choose", q: "He ___ me that the computer was broken.", options: ["said", "told", "spoke", "talked"], answer: 1, why: "told لازم يجي بعده مفعول (me)." },
    { kind: "choose", q: "\"Don't use your phone here,\" the teacher said. → The teacher told us ___ our phones there.", options: ["don't use", "not use", "not to use", "to not using"], answer: 2, why: "النهي المنقول: told + مفعول + not to + فعل." },
    { kind: "choose", q: "\"Please help me,\" she said to him. → She asked him ___ her.", options: ["help", "to help", "helping", "he helps"], answer: 1, why: "الطلب المنقول: asked + مفعول + to + فعل." },
    { kind: "choose", q: "\"I have repaired the machine,\" the worker said. → The worker said that he ___ the machine.", options: ["has repaired", "repaired", "had repaired", "was repairing"], answer: 2, why: "Present Perfect بيرجع خطوة لـ Past Perfect: had repaired." },
    { kind: "choose", q: "\"I saw it yesterday,\" he said. → He said he had seen it ___.", options: ["yesterday", "the day before", "tomorrow", "the next day"], answer: 1, why: "yesterday بتبقى the day before في الكلام المنقول." },
    { kind: "choose", q: "\"Machines make life easier,\" the speaker said. → The speaker said that machines ___ life easier.", options: ["make", "made", "would make", "have made"], answer: 1, why: "Present Simple بيبقى Past Simple: made. (ويصح كمان نسيب make لو الكلام حقيقة عامة.)" },
    { kind: "type", q: "Report: \"I am tired,\" he said. → He said that he ___ tired.", answers: ["was"], why: "am بتبقى was، والضمير I بقى he." },
    { kind: "type", q: "Report the command: \"Open the window,\" my mother said to me. → My mother told me ___ the window.", answers: ["to open"], why: "told + مفعول + to + فعل." },
    { kind: "type", q: "Report the negative command: \"Don't touch the wires,\" the engineer said to us. → The engineer told us ___ the wires.", answers: ["not to touch"], why: "not to + فعل." },
    { kind: "type", q: "Report: \"We will build a new machine,\" they said. → They said that they ___ build a new machine.", answers: ["would"], why: "will بتبقى would." },
  ],
};
