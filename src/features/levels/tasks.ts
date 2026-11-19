import { BAND_COUNT, WORD_BANK } from "./bank";
import type { Random } from "./placement";

/**
 * The skills part of the level test: the student translates, and writes, and the AI marks it.
 * The tasks live here, on the server side, so the student only sends back an id and an answer and cannot change the question.
 * A teacher should read these sentences once before launch.
 */
export type TaskType = "en2ar" | "ar2en" | "word" | "write";

export interface Task {
  id: string;
  type: TaskType;
  band: number | null;
  /** What the student sees: a sentence, a word, or a writing prompt. */
  prompt: string;
}

const EN_TO_AR: Record<number, string[]> = {
  1: ["My brother likes to play football after school.", "We usually have dinner at seven o'clock."],
  2: ["She decided to change her job because she wanted a better salary.", "The museum is closed on Fridays, so we will visit it tomorrow."],
  3: ["Although the weather was bad, they managed to finish the match.", "He apologised for being late and promised it would not happen again."],
  4: ["The government has introduced new measures to reduce pollution in big cities.", "Had she known about the delay, she would have taken another train."],
  5: ["Despite widespread criticism, the proposal was ultimately endorsed by the committee.", "The findings underscore the need to reconsider how resources are allocated."],
};

const AR_TO_EN: Record<number, string[]> = {
  1: ["أنا أسكن في القاهرة مع أسرتي.", "هل تحب الشاي أم القهوة؟"],
  2: ["ذهبت إلى السوق أمس واشتريت ملابس جديدة.", "أخي أطول مني لكنه لا يحب الرياضة."],
  3: ["إذا ذاكرت بجد فسوف تنجح في الامتحان.", "لم أستطع الاتصال بك لأن هاتفي كان مغلقًا."],
  4: ["على الرغم من أن المشروع كان صعبًا، فقد أنجزناه قبل الموعد المحدد.", "يجب على الحكومة أن تهتم أكثر بالتعليم والصحة."],
  5: ["لو كنت أعلم بحجم المشكلة لتصرفت بطريقة مختلفة تمامًا.", "تؤثر التكنولوجيا الحديثة بشكل كبير على طريقة تواصل الناس."],
};

const WRITING = [
  "Write two or three sentences in English about your daily routine.",
  "Write two or three sentences in English about a place you like and why you like it.",
  "Write two or three sentences in English about what you want to do in the future.",
];

function pick<T>(items: T[], random: Random): T {
  return items[Math.floor(random() * items.length)];
}

/** Two bands to ask about: the estimated one and the next one up (or the one below, at the top). */
function bandsFrom(level: number, direction: "up" | "down"): [number, number] {
  if (direction === "up") return level >= BAND_COUNT ? [BAND_COUNT - 1, BAND_COUNT] : [level, level + 1];
  return level <= 1 ? [1, 2] : [level - 1, level];
}

/**
 * Seven tasks around the vocabulary level the student just got: two sentences into Arabic, two into English,
 * two single words, and one short piece of writing. The ids are stable, so the server can look the question up again.
 */
export function buildSkillTasks(level: number, random: Random = Math.random): Task[] {
  const tasks: Task[] = [];
  for (const band of bandsFrom(level, "up")) {
    const index = Math.floor(random() * EN_TO_AR[band].length);
    tasks.push({ id: `e${band}${index}`, type: "en2ar", band, prompt: EN_TO_AR[band][index] });
  }
  for (const band of bandsFrom(level, "down")) {
    const index = Math.floor(random() * AR_TO_EN[band].length);
    tasks.push({ id: `a${band}${index}`, type: "ar2en", band, prompt: AR_TO_EN[band][index] });
  }
  for (const band of bandsFrom(level, "up")) {
    tasks.push({ id: `w:${pick(WORD_BANK[band], random)}`, type: "word", band, prompt: "" });
  }
  const writeIndex = Math.floor(random() * WRITING.length);
  tasks.push({ id: `p${writeIndex}`, type: "write", band: null, prompt: WRITING[writeIndex] });
  return tasks.map((task) => (task.type === "word" ? { ...task, prompt: task.id.slice(2) } : task));
}

/** Finds a task again from its id, or null if the id is not one of ours. */
export function taskFromId(id: string): Task | null {
  const sentence = /^([ea])([1-5])([01])$/.exec(id);
  if (sentence) {
    const band = Number(sentence[2]);
    const text = (sentence[1] === "e" ? EN_TO_AR : AR_TO_EN)[band][Number(sentence[3])];
    return text ? { id, type: sentence[1] === "e" ? "en2ar" : "ar2en", band, prompt: text } : null;
  }
  if (id.startsWith("w:")) {
    const word = id.slice(2);
    for (let band = 1; band <= BAND_COUNT; band++) if (WORD_BANK[band].includes(word)) return { id, type: "word", band, prompt: word };
    return null;
  }
  const write = /^p([0-9])$/.exec(id);
  return write && WRITING[Number(write[1])] ? { id, type: "write", band: null, prompt: WRITING[Number(write[1])] } : null;
}
