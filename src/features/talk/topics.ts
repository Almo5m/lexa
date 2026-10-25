export interface Topic {
  id: string;
  /** The prompt Bo gives, in English, because the student answers in English. */
  prompt: string;
  /** Matches an interest id, or null for a topic anyone can answer. */
  interest: string | null;
}

export const TOPICS: Topic[] = [
  // From the topics of the Year 3 book: role-plays, discussions and debates.
  { id: "book-care", interest: null, prompt: "Imagine you are a nurse or a doctor. Describe your day and say what you have done so far today." },
  { id: "book-machines", interest: null, prompt: "Your friend says machines will do every job one day. Do you agree? Give two reasons." },
  { id: "book-nature", interest: null, prompt: "Persuade a friend to protect nature. What should you both have done earlier, and what can you do now?" },
  { id: "book-sea", interest: null, prompt: "Talk about the advantages and disadvantages of tourism in the Red Sea." },
  { id: "book-work", interest: null, prompt: "Debate: will AI help or hurt workers in the future? Say your opinion and give an example." },
  { id: "book-invite", interest: null, prompt: "Invite a friend to an event. Say what, when and where, and answer if your friend says no." },
  { id: "yesterday", interest: null, prompt: "Tell Bo about your day yesterday. What did you do, and what was the best part?" },
  { id: "friend", interest: null, prompt: "Describe your best friend. What is he or she like, and why do you like spending time together?" },
  { id: "future", interest: null, prompt: "What do you want to do after school? Explain why." },
  { id: "football", interest: "football", prompt: "Describe your favourite football player or team. Why do you like them?" },
  { id: "gaming", interest: "gaming", prompt: "Explain your favourite game to someone who has never played it." },
  { id: "music", interest: "music", prompt: "What music do you listen to, and when do you listen to it?" },
  { id: "movies", interest: "movies", prompt: "Tell Bo about a film or series you watched recently. What happened?" },
  { id: "social", interest: "social", prompt: "How do you use your phone every day? Is it good or bad for students?" },
  { id: "cooking", interest: "cooking", prompt: "Explain how to make your favourite meal." },
  { id: "cars", interest: "cars", prompt: "Describe your dream car and say why you would choose it." },
  { id: "travel", interest: "travel", prompt: "Describe a place you would love to visit and what you would do there." },
  { id: "drawing", interest: "drawing", prompt: "Describe something you made or designed, or something you would like to make." },
  { id: "tech", interest: "tech", prompt: "What is one app or program you think every student should use? Explain why." },
  { id: "fashion", interest: "fashion", prompt: "Describe your favourite outfit. When do you wear it?" },
  { id: "fitness", interest: "fitness", prompt: "Tell Bo about a sport you play or want to try. Why is it good for you?" },
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
