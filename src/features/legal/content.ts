/**
 * The text of the privacy page and the terms page. One place to edit, both languages.
 * It must match PRIVACY.md and what the app really stores: change them together.
 * The contact email is not written here. Set NEXT_PUBLIC_CONTACT_EMAIL in the host if you want one shown;
 * without it the pages point students to the "send us a message" page.
 */
export interface LegalSection {
  title: string;
  lines: string[];
}

export interface LegalPage {
  title: string;
  updated: string;
  sections: LegalSection[];
}

const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const contact = { ar: email ?? "ابعت لنا من صفحة «ابعت لنا» جوه التطبيق.", en: email ?? "Write to us from the Send us a message page inside the app." };

export const PRIVACY: Record<"ar" | "en", LegalPage> = {
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: نوفمبر 2026",
    sections: [
      { title: "مين صاحب التطبيق", lines: ["بو (Booo) مملوك لمعاذ (AlMo). كل الحقوق محفوظة."] },
      { title: "إيه اللي بنخزنه", lines: [
        "الحساب: الإيميل واسمك والأرقام اللي بتتقدم (نقاط، تتابع الأيام، المستوى).",
        "الكلمات اللي بتضيفها وكروتها وسجل المراجعة.",
        "اهتماماتك من قايمة ثابتة، ونتايج التحديات والمسابقات.",
        "الجمل اللي بتكتبها لبو في «اتكلم مع بو»، ومحدش غيرك بيقراها.",
        "لو اشتركت في ترتيب الأسبوع: اسم مستعار اتولد ليك، مش اسمك الحقيقي. وتقدر تخرج منه في أي وقت فيتمسح.",
        "شكل بو (القبعة واللون) بيتخزن على جهازك بس.",
        "الرسائل اللي بتبعتها لنا من صفحة «ابعت لنا».",
      ] },
      { title: "الصور", lines: ["الصور بتتقري في الذاكرة لاستخراج الكلمات ومش بتتحفظ."] },
      { title: "اللي بيتبعت للذكاء الاصطناعي", lines: ["الكلمات والجمل اللي بتكتبها بتتبعت لخدمة Gemini عشان تشتغل المميزات. اسمك وإيميلك عمرهم ما بيتبعتوا."] },
      { title: "رابط التقدم", lines: ["أنت اللي بتقرر. لو عملت رابط لولي الأمر أو المدرس، بيشوفوا اسمك الأول ونقاطك ومستواك ونشاطك آخر 7 أيام بس، وبينتهي بعد 30 يوم وتقدر توقفه في أي وقت."] },
      { title: "حقوقك", lines: ["تقدر تمسح حسابك وكل بياناتك في أي وقت من صفحة «حسابي».", "لو عايز تسأل عن بياناتك، ابعتلنا من صفحة «ابعت لنا»."] },
      { title: "الأعمار", lines: ["التطبيق للطلبة. لو عمرك أقل من 18 سنة، يفضل ولي أمرك يعرف إنك بتستخدمه."] },
      { title: "تواصل", lines: [contact.ar] },
    ],
  },
  en: {
    title: "Privacy policy",
    updated: "Last updated: November 2026",
    sections: [
      { title: "Who owns the app", lines: ["Booo (بو) is owned by Moaz (AlMo). All rights reserved."] },
      { title: "What we store", lines: [
        "Your account: email, name, and your progress numbers (XP, streak, level).",
        "The words you add, their cards, and your review history.",
        "Your interests from a fixed list, and your challenge and contest results.",
        "The sentences you write to Bo in Talk to Bo. Only you can read them.",
        "If you join the weekly board: a made-up name, never your real one. You can leave any time and it is deleted.",
        "Bo's look (hat and color) is kept on your device only.",
        "The messages you send us from the Send us a message page.",
      ] },
      { title: "Photos", lines: ["Photos are read in memory to find words and are not saved."] },
      { title: "What goes to the AI", lines: ["The words and sentences you write are sent to Gemini so the features work. Your name and email are never sent."] },
      { title: "Progress link", lines: ["It is your choice. If you make a link for a parent or teacher, they see your first name, XP, level and the last 7 days only. It expires after 30 days and you can stop it any time."] },
      { title: "Your rights", lines: ["You can delete your account and all your data any time from the Account page.", "To ask about your data, write to us from the Send us a message page."] },
      { title: "Ages", lines: ["The app is for students. If you are under 18, it is best that a parent knows you use it."] },
      { title: "Contact", lines: [contact.en] },
    ],
  },
};

export const TERMS: Record<"ar" | "en", LegalPage> = {
  ar: {
    title: "شروط الاستخدام",
    updated: "آخر تحديث: نوفمبر 2026",
    sections: [
      { title: "الاستخدام", lines: ["بو للتعلم الشخصي. استخدمه لنفسك، ومتشاركش حسابك مع حد."] },
      { title: "السلوك", lines: ["ممنوع تحاول تخترق التطبيق أو تضغط عليه بشكل مبالغ، أو تكتب محتوى مسيء.", "ممكن نوقف أي حساب بيخالف ده."] },
      { title: "المحتوى", lines: ["المحتوى والكود والتصميم ملك صاحب التطبيق ومينفعش نسخه أو إعادة نشره من غير إذن."] },
      { title: "الذكاء الاصطناعي", lines: ["الذكاء الاصطناعي ممكن يغلط. راجع المعلومة المهمة مع مدرسك أو كتابك."] },
      { title: "الخدمة", lines: ["بنحاول نخلي التطبيق شغال دايمًا، لكن ممكن يقف أو يتغير من غير إنذار."] },
      { title: "تواصل", lines: [contact.ar] },
    ],
  },
  en: {
    title: "Terms of use",
    updated: "Last updated: November 2026",
    sections: [
      { title: "Use", lines: ["Booo is for your own learning. Use it for yourself and do not share your account."] },
      { title: "Behavior", lines: ["Do not try to break the app, overload it, or write offensive content.", "We may stop any account that does."] },
      { title: "Content", lines: ["The content, code and design belong to the owner of the app and may not be copied or republished without permission."] },
      { title: "AI", lines: ["The AI can be wrong. Check anything important with your teacher or your book."] },
      { title: "The service", lines: ["We try to keep the app running, but it may stop or change without notice."] },
      { title: "Contact", lines: [contact.en] },
    ],
  },
};
