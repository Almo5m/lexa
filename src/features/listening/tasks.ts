/** Listening tasks for Year 3 Term 1. Scripts and questions are written by us on the topics of the book units; the browser reads them aloud. */
export interface ListeningQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface ListeningTask {
  id: string;
  unit: number;
  title: string;
  script: string;
  questions: ListeningQuestion[];
}

export const LISTENING_TASKS: ListeningTask[] = [
  {
    id: "l1",
    unit: 1,
    title: "A nurse's night shift",
    script:
      "My name is Nadia and I have been a nurse for eight years. I work the night shift at a children's hospital. Tonight I have already checked on twelve patients, and I have been helping a little boy who could not sleep. I read him a story and he finally closed his eyes. Many people think my job is only about medicine, but I believe kindness is just as important. The hardest part is being away from my family, yet I have never regretted choosing this work.",
    questions: [
      { q: "How long has Nadia been a nurse?", options: ["Two years", "Eight years", "Twelve years", "Since last night"], answer: 1, why: "She says: I have been a nurse for eight years." },
      { q: "What did she do for the boy who could not sleep?", options: ["Gave him medicine", "Called his mother", "Read him a story", "Took him home"], answer: 2, why: "I read him a story and he finally closed his eyes." },
      { q: "What does Nadia think is as important as medicine?", options: ["Money", "Kindness", "Speed", "Machines"], answer: 1, why: "I believe kindness is just as important." },
      { q: "What is the hardest part of her job?", options: ["Night patients", "Long stories", "Being away from her family", "Writing reports"], answer: 2, why: "The hardest part is being away from my family." },
    ],
  },
  {
    id: "l3",
    unit: 3,
    title: "A clean river",
    script:
      "Last summer our village river was full of plastic bottles and bags. The water looked grey and the fish had almost disappeared. A group of students decided to act. Every Friday they collected rubbish, and the mayor gave them gloves and bags. After three months the river looked clean again. A farmer said the students should have started years ago, but he was proud of them. Now birds are coming back, and children can play near the water safely.",
    questions: [
      { q: "What was the problem with the river?", options: ["It was too deep", "It was full of plastic", "It was dry", "It was too hot"], answer: 1, why: "It was full of plastic bottles and bags." },
      { q: "When did the students collect rubbish?", options: ["Every morning", "Every Friday", "Only in winter", "Once a year"], answer: 1, why: "Every Friday they collected rubbish." },
      { q: "What did the mayor give them?", options: ["Money", "Boats", "Gloves and bags", "Trees"], answer: 2, why: "The mayor gave them gloves and bags." },
      { q: "What did the farmer think?", options: ["It was a waste of time", "They should have started earlier", "The river was already clean", "Only adults can help"], answer: 1, why: "He said the students should have started years ago." },
    ],
  },
  {
    id: "l4",
    unit: 4,
    title: "Whales and the Red Sea",
    script:
      "Welcome to our ocean podcast. Today we talk about whales. A blue whale is the largest animal on Earth, and its heart is as big as a small car. Whales are not fish. They are mammals, so they breathe air and must come to the surface. Many tourists visit the Red Sea for a two-day diving trip to see colourful coral reefs. But too many boats can damage the reefs, so guides teach visitors to keep a safe distance and never touch the coral.",
    questions: [
      { q: "What is the largest animal on Earth?", options: ["The shark", "The blue whale", "The turtle", "The dolphin"], answer: 1, why: "A blue whale is the largest animal on Earth." },
      { q: "Why must whales come to the surface?", options: ["To find food", "To sleep on the beach", "To breathe air", "To meet tourists"], answer: 2, why: "They are mammals, so they breathe air." },
      { q: "How long is the diving trip mentioned?", options: ["Two days", "Two hours", "Two weeks", "Two months"], answer: 0, why: "A two-day diving trip." },
      { q: "What do guides teach visitors?", options: ["To feed the fish", "To collect coral", "To keep a safe distance", "To swim fast"], answer: 2, why: "Keep a safe distance and never touch the coral." },
    ],
  },
  {
    id: "l5",
    unit: 5,
    title: "Work in the future",
    script:
      "Technology is changing the workplace very fast. Many companies now have robots do simple, repeated jobs, so workers can focus on creative tasks. A manager in our city had her office redesigned to include quiet rooms for thinking. She says people who keep learning new skills will be more successful. Some workers are afraid that machines will take their jobs, but experts say new jobs will appear too. The best advice is to stay curious and learn something new every month.",
    questions: [
      { q: "What do robots do in many companies?", options: ["Manage the staff", "Simple, repeated jobs", "Write all reports", "Drive visitors"], answer: 1, why: "Robots do simple, repeated jobs." },
      { q: "What did the manager do to her office?", options: ["Sold it", "Had it redesigned", "Closed it", "Painted it herself"], answer: 1, why: "She had her office redesigned (a causative sentence)." },
      { q: "Who will be more successful, according to her?", options: ["People who keep learning", "People who work alone", "People who avoid machines", "People who stay silent"], answer: 0, why: "People who keep learning new skills will be more successful." },
      { q: "What is the best advice?", options: ["Avoid technology", "Change jobs every week", "Stay curious and learn every month", "Wait for robots"], answer: 2, why: "Stay curious and learn something new every month." },
    ],
  },
  {
    id: "l6",
    unit: 6,
    title: "Why friends matter",
    script:
      "In today's show we talk about socializing. Doctors say that spending time with friends is good for both body and mind. People who meet friends regularly feel less stressed and sleep better. Last week I asked my listeners what they do together. One girl said she and her friends go for a walk every Saturday. A boy told us he had invited his classmates to his birthday, and he asked if they could bring a game. So, do not wait for a special day. Send an invitation today!",
    questions: [
      { q: "What do doctors say about spending time with friends?", options: ["It wastes time", "It is good for body and mind", "It causes stress", "It is only for adults"], answer: 1, why: "It is good for both body and mind." },
      { q: "What does the girl do with her friends?", options: ["Plays football on Sundays", "Goes for a walk every Saturday", "Studies every night", "Watches films"], answer: 1, why: "They go for a walk every Saturday." },
      { q: "What did the boy ask?", options: ["If they could bring a game", "If the party was free", "If they could stay the night", "If his teacher was coming"], answer: 0, why: "He asked if they could bring a game (a reported question)." },
      { q: "What is the final advice?", options: ["Wait for a special day", "Send an invitation today", "Stay at home", "Call the doctor"], answer: 1, why: "Send an invitation today!" },
    ],
  },
];

export function listeningTask(id: string): ListeningTask | undefined {
  return LISTENING_TASKS.find((task) => task.id === id);
}
