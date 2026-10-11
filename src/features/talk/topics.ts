export interface Topic {
  id: string;
  /** The prompt Lexa gives, in English, because the student answers in English. */
  prompt: string;
  /** Matches an interest id, or null for a topic anyone can answer. */
  interest: string | null;
}

export const TOPICS: Topic[] = [
  { id: "yesterday", interest: null, prompt: "Tell Lexa about your day yesterday. What did you do, and what was the best part?" },
  { id: "friend", interest: null, prompt: "Describe your best friend. What is he or she like, and why do you like spending time together?" },
  { id: "future", interest: null, prompt: "What do you want to do after school? Explain why." },
  { id: "football", interest: "football", prompt: "Describe your favourite football player or team. Why do you like them?" },
  { id: "gaming", interest: "gaming", prompt: "Explain your favourite game to someone who has never played it." },
  { id: "music", interest: "music", prompt: "What music do you listen to, and when do you listen to it?" },
  { id: "movies", interest: "movies", prompt: "Tell Lexa about a film or series you watched recently. What happened?" },
  { id: "social", interest: "social", prompt: "How do you use your phone every day? Is it good or bad for students?" },
  { id: "cooking", interest: "cooking", prompt: "Explain how to make your favourite meal." },
  { id: "cars", interest: "cars", prompt: "Describe your dream car and say why you would choose it." },
  { id: "travel", interest: "travel", prompt: "Describe a place you would love to visit and what you would do there." },
  { id: "drawing", interest: "drawing", prompt: "Describe something you made or designed, or something you would like to make." },
  { id: "tech", interest: "tech", prompt: "What is one app or program you think every student should use? Explain why." },
  { id: "fashion", interest: "fashion", prompt: "Describe your favourite outfit. When do you wear it?" },
  { id: "fitness", interest: "fitness", prompt: "Tell Lexa about a sport you play or want to try. Why is it good for you?" },
];

export function topicById(id: string): Topic | undefined {
  return TOPICS.find((topic) => topic.id === id);
}

/** Topics that match the student's interests first, then the general ones. */
export function topicsFor(interests: readonly string[]): Topic[] {
  const mine = TOPICS.filter((topic) => topic.interest !== null && interests.includes(topic.interest));
  const general = TOPICS.filter((topic) => topic.interest === null);
  return [...mine, ...general];
}
