/** The three writing tasks of Year 3 Term 1. The brief and the checklist are ours; only the task types follow the ministry book. */
export interface WritingTask {
  id: string;
  /** The stage whose book the task follows. Missing means third secondary. */
  stage?: "sec1" | "sec2" | "sec3";
  unit: number;
  titleEn: string;
  /** What the student must write, in English, as an exam question would say it. */
  brief: string;
  /** What a good answer contains, in Arabic, shown before writing. */
  planAr: string[];
  /** Sentence starters that help without writing the answer for the student. */
  starters: string[];
  minWords: number;
  maxWords: number;
}

const SEC3: WritingTask[] = [
  {
    id: "w-essay",
    unit: 3,
    titleEn: "Persuasive essay",
    brief: "Write an essay of about 120 words to convince your classmates that everyone should help protect nature. Give at least two reasons.",
    planAr: ["مقدمة: قول رأيك في جملة واضحة.", "فقرة فيها سببين على الأقل، كل سبب بمثال.", "خاتمة: كرر رأيك وادعي القارئ يعمل حاجة."],
    starters: ["In my opinion, ...", "First of all, ...", "Moreover, ...", "For example, ...", "In conclusion, ..."],
    minWords: 60,
    maxWords: 220,
  },
  {
    id: "w-paragraph",
    unit: 4,
    titleEn: "Descriptive paragraph",
    brief: "Write a paragraph of about 80 words describing a sea or a beach you have seen or imagined. Use at least three adjectives and one compound adjective.",
    planAr: ["جملة افتتاحية: المكان فين وعامل إزاي.", "وصف بالحواس: بتشوف إيه وبتسمع إيه.", "جملة ختام: إحساسك تجاه المكان.", "استخدم صفة مركبة زي a two-hour trip أو a well-known beach."],
    starters: ["The beach is ...", "The water looks ...", "I can see ...", "It is a ...-... place."],
    minWords: 40,
    maxWords: 150,
  },
  {
    id: "w-review",
    unit: 6,
    titleEn: "Online review",
    brief: "Write an online review of about 80 words about a place you visited with friends (a cafe, a park, a cinema). Say what you liked, what you did not like, and whether you recommend it.",
    planAr: ["اسم المكان وإيه اللي خلاك تروحه.", "حاجة عجبتك وحاجة ماعجبتكش.", "توصية في الآخر: هتنصح بيه ولا لأ ولمين."],
    starters: ["Last week I went to ...", "What I liked most was ...", "However, ...", "I would recommend it to ..."],
    minWords: 40,
    maxWords: 150,
  },
];

/** Writing tasks of Year 1 and Year 2, one per unit, following each book's Scope and Sequence (the brief and the plan are ours). */
const SEC1: WritingTask[] = [
  { id: "s1-narrative", stage: "sec1", unit: 1, titleEn: "A strange day in my life", brief: "Write a short narrative paragraph of about 90 words called \"A strange day in my life\". Use the past simple for what happened and the past continuous for what was going on.", planAr: ["جملة افتتاحية: اليوم ده حصل إمتى وكنت فين.", "حدث أو اتنين بالماضي البسيط (what happened).", "وصف اللي كان شغال وقتها بالماضي المستمر (was / were + ing).", "ختام: إحساسك بعد اليوم ده."], starters: ["It was a strange day ...", "While I was walking, ...", "Suddenly, ...", "In the end, ..."], minWords: 50, maxWords: 150 },
  { id: "s1-descriptive", stage: "sec1", unit: 2, titleEn: "A descriptive essay about kindness", brief: "Write a descriptive essay of about 120 words about a person who helps others in your community. Describe what he or she does and how it makes people feel. Use must or have to at least once.", planAr: ["مقدمة: مين الشخص ده وإيه علاقتك بيه.", "فقرة: بيعمل إيه ويساعد مين.", "فقرة: تأثيره على الناس وإحساسك.", "ختام قصير. استخدم must أو have to مرة على الأقل."], starters: ["I would like to describe ...", "He / She always ...", "People must ...", "That is why ..."], minWords: 70, maxWords: 200 },
  { id: "s1-fakenews", stage: "sec1", unit: 3, titleEn: "A paragraph about fake news", brief: "Write a paragraph of about 90 words about fake news and fake platforms. Explain how people can protect themselves. Use at least one conditional sentence (If ..., ...).", planAr: ["جملة رئيسية: يعني إيه fake news.", "خطر واحد على الناس.", "طريقة تحمي بيها نفسك بجملة شرطية (If you ..., you will ...).", "جملة ختام."], starters: ["Fake news is ...", "If you see a strange story, ...", "You should always ...", "To sum up, ..."], minWords: 50, maxWords: 150 },
  { id: "s1-email-formal", stage: "sec1", unit: 4, titleEn: "A formal email", brief: "Write a formal email of about 100 words to the manager of a factory asking what it does to protect the environment. Use a greeting, a clear reason for writing, two questions, and a polite ending.", planAr: ["Dear Sir / Madam + سبب الكتابة في جملة.", "سؤالين واضحين عن حماية البيئة.", "شكر وإنهاء رسمي: Yours faithfully / sincerely.", "لغة رسمية بدون اختصارات (I would like, not I wanna)."], starters: ["Dear Sir or Madam,", "I am writing to ask about ...", "Could you please tell me ...", "Thank you for your time. Yours faithfully,"], minWords: 60, maxWords: 150 },
  { id: "s1-essay-language", stage: "sec1", unit: 5, titleEn: "Learning a foreign language", brief: "Write an essay of about 120 words about how learning a foreign language can help students. Give at least two reasons with examples.", planAr: ["مقدمة: رأيك في جملة واضحة.", "السبب الأول بمثال.", "السبب التاني بمثال.", "خاتمة تكرر رأيك."], starters: ["In my opinion, ...", "First, ...", "For example, ...", "In conclusion, ..."], minWords: 70, maxWords: 200 },
  { id: "s1-cv", stage: "sec1", unit: 6, titleEn: "My CV", brief: "Write a short CV for yourself as a school student looking for a summer job. Include personal information, education, skills, and one short sentence about yourself.", planAr: ["بيانات شخصية: الاسم، السن، البريد.", "التعليم: مدرستك وسنتك.", "مهارات حقيقية عندك (languages, computer, teamwork).", "جملة تعريفية قصيرة عن نفسك."], starters: ["Personal information: ...", "Education: ...", "Skills: ...", "About me: ..."], minWords: 40, maxWords: 150 },
];

const SEC2: WritingTask[] = [
  { id: "s2-persuasive", stage: "sec2", unit: 1, titleEn: "Persuasive essay: Egypt and Africa", brief: "Write a persuasive essay of about 150 words to convince young people that cooperation between Egypt and African countries benefits everyone. Use clear persuasive phrases and at least one passive sentence.", planAr: ["مقدمة بجملة تقنع بيها القارئ.", "سبب أول بمثال (تجارة، تعليم، مشروعات).", "سبب تاني بمثال.", "خاتمة بدعوة للتعاون. استخدم جملة مبنية للمجهول مرة على الأقل."], starters: ["It is clear that ...", "There is no doubt that ...", "Moreover, ...", "Therefore, we should ..."], minWords: 90, maxWords: 230 },
  { id: "s2-business-email", stage: "sec2", unit: 2, titleEn: "A business email", brief: "Write a business email of about 120 words to a possible investor about your start-up idea. Introduce the idea, say why it is useful, and ask for a meeting. Use at least two past perfect sentences about what your team had done before writing.", planAr: ["Subject واضح + تحية رسمية.", "فكرة المشروع في جملتين.", "إيه اللي فريقك كان عمله قبل كده (had + p.p.).", "طلب اجتماع وإنهاء مهذب."], starters: ["Dear Mr / Ms ...,", "I am writing to introduce ...", "Before writing, we had ...", "I would be grateful for a meeting. Best regards,"], minWords: 70, maxWords: 190 },
  { id: "s2-blog", stage: "sec2", unit: 3, titleEn: "A blog post: sustainable development", brief: "Write a blog post of about 130 words about one sustainable development goal you care about (clean water, health, education...). Say what the problem is and what young people can do. Use adjectives and adverbs to make it lively.", planAr: ["عنوان جذاب + جملة تشد القارئ.", "المشكلة بوضوح.", "حلول يقدر الشباب يعملوها.", "ختام بسؤال أو دعوة للتعليق. نوّع في الصفات والأحوال adjectives / adverbs."], starters: ["Have you ever thought about ...?", "The biggest problem is ...", "We can easily ...", "Let me know what you think!"], minWords: 75, maxWords: 200 },
  { id: "s2-report", stage: "sec2", unit: 4, titleEn: "A formal report: natural disasters", brief: "Write a formal report of about 140 words for your city council about how the city can prepare for a natural disaster. Use headings (Introduction, Findings, Recommendations) and comparatives or superlatives.", planAr: ["Introduction: الغرض من التقرير.", "Findings: اللي لقيته (الأخطر / الأسرع / أكثر استعدادًا).", "Recommendations: توصيات مرقمة.", "لغة رسمية وعناوين واضحة."], starters: ["Introduction: The aim of this report is ...", "Findings: The most serious risk is ...", "Recommendations: First, ...", "In conclusion, ..."], minWords: 80, maxWords: 210 },
  { id: "s2-opinion", stage: "sec2", unit: 5, titleEn: "Opinion essay: fake news", brief: "Write an opinion essay of about 150 words answering: How can people judge whether a news source is reliable? Give your opinion with reasons. Use at least one tag question in a spoken-style sentence, such as \"It is easy to be fooled, isn't it?\"", planAr: ["مقدمة: رأيك.", "سبب أول بمثال (مصدر معروف، تاريخ، أدلة).", "سبب تاني بمثال.", "خاتمة تأكد فيها رأيك."], starters: ["From my point of view, ...", "I strongly believe that ...", "That is a valid point, but ...", "To sum up, ..."], minWords: 90, maxWords: 230 },
  { id: "s2-descriptive", stage: "sec2", unit: 6, titleEn: "Descriptive essay: my dream career", brief: "Write a descriptive essay of about 150 words about your dream career. Describe the work, the soft skills and hard skills you need, and why it suits you. Use at least one relative clause (who / which / that).", planAr: ["مقدمة: الوظيفة بإيجاز.", "وصف الشغل يوم بيوم.", "المهارات اللازمة soft وhard بجملة موصولة.", "ليه مناسبة ليك وخاتمة."], starters: ["My dream career is ...", "It is a job that ...", "A person who works as ... needs ...", "This career suits me because ..."], minWords: 90, maxWords: 230 },
];

export const WRITING_TASKS: WritingTask[] = [...SEC3, ...SEC1, ...SEC2];

/** The tasks of a stage's book. An account that never chose a stage keeps the third-secondary tasks; general learners have none. */
export function writingTasksFor(stage: string | null): WritingTask[] {
  const wanted = stage === null ? "sec3" : stage;
  return WRITING_TASKS.filter((task) => (task.stage ?? "sec3") === wanted);
}

export function writingTask(id: string): WritingTask | undefined {
  return WRITING_TASKS.find((task) => task.id === id);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
