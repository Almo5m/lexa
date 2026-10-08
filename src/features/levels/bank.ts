export const BAND_COUNT = 5;

// Starter word bank, written by hand for secondary-school learners.
// Band 1 is the easiest, band 5 the hardest. A teacher should review it before launch.
export const WORD_BANK: Record<number, string[]> = {
  1: [
    "arrive", "borrow", "cheap", "crowded", "daily", "empty", "enjoy", "expensive", "familiar", "farmer",
    "forget", "guess", "guest", "healthy", "holiday", "invite", "kitchen", "lazy", "lend", "lucky",
    "message", "narrow", "neighbour", "noisy", "ordinary", "passenger", "polite", "quiet", "receive", "repair",
    "rubbish", "separate", "serious", "shout", "simple", "spell", "strange", "suddenly", "tidy", "useful",
  ],
  2: [
    "achieve", "advice", "ancient", "argue", "attitude", "avoid", "benefit", "brave", "career", "cancel",
    "damage", "decision", "delay", "describe", "discover", "dangerous", "exchange", "excellent", "explain", "fashion",
    "foreign", "garbage", "generous", "habit", "improve", "include", "journey", "knowledge", "locate", "manage",
    "negative", "opinion", "patient", "prepare", "recommend", "refuse", "scenery", "skill", "suggest", "unusual",
  ],
  3: [
    "accurate", "adapt", "affect", "ambition", "anxious", "appeal", "approach", "assume", "atmosphere", "attract",
    "awkward", "barrier", "boundary", "budget", "capable", "cautious", "challenge", "circumstance", "complain", "concentrate",
    "confident", "consequence", "contribute", "convince", "creative", "curious", "demand", "determined", "device", "distinguish",
    "efficient", "encourage", "environment", "essential", "evidence", "flexible", "genuine", "huge", "identity", "involve",
  ],
  4: [
    "abundant", "acknowledge", "adequate", "ambiguous", "anticipate", "arbitrary", "authentic", "bias", "coherent", "compensate",
    "comprehensive", "consistent", "controversial", "crucial", "deliberate", "diminish", "distinct", "elaborate", "eliminate", "emerge",
    "enhance", "exaggerate", "exploit", "fluctuate", "fundamental", "hypothesis", "implement", "inevitable", "inherent", "interpret",
    "justify", "modify", "obstacle", "perceive", "persist", "preliminary", "reluctant", "restrain", "significant", "vulnerable",
  ],
  5: [
    "aesthetic", "alleviate", "ambivalent", "arduous", "articulate", "austere", "benevolent", "candid", "conducive", "contemplate",
    "discrepancy", "disseminate", "eloquent", "empirical", "ephemeral", "exacerbate", "feasible", "formidable", "hinder", "impartial",
    "inadvertent", "indigenous", "insidious", "meticulous", "mitigate", "nuance", "obsolete", "paradox", "pragmatic", "profound",
    "resilient", "scrutinize", "stringent", "substantiate", "tenacious", "trivial", "ubiquitous", "underlying", "versatile", "whimsical",
  ],
};

// English-looking words that do not exist. Used to catch students who tap "I know it" for everything.
export const PSEUDO_WORDS = [
  "plimber", "frutish", "stanful", "crimble", "dourish", "pleaker", "tronder", "snavely",
  "mistrale", "quomber", "flenther", "gostrick", "wimlock", "prundle", "veshing", "bralded",
];
