const { TypeSafeClient } = require("@typesafe-ai/sdk");

const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

const INTENT_DESCRIPTIONS = {
  greeting: "Saying hello, hi, hey, or starting a conversation",
  farewell: "Saying goodbye or ending the conversation",
  gratitude: "Expressing thanks or appreciation",
  math_calculation: "Asking for a math calculation or arithmetic",
  knowledge_question: "Asking a factual or knowledge question",
  personal_question: "Asking about the assistant or about themselves/feelings",
  capability_query: "Asking what the assistant can do, its limitations, or how it works",
  request: "Asking the assistant to do something or take an action",
  opinion: "Asking for an opinion, recommendation, or perspective",
  explanation: "Asking how something works, why, or for a definition",
  small_talk: "Making casual conversation, joking, or chatting",
  complaint: "Complaining, expressing frustration, or reporting a problem",
  followup: "Asking for more detail, to continue, or elaborate",
  humor: "Making a joke, being sarcastic, or saying something absurd",
  time_query: "Asking about the current time, date, or day",
  confusion: "Message is unclear, garbled, or doesn't make sense",
};

async function classifyMessage(userMessage) {
  const intentKeys = Object.keys(INTENT_DESCRIPTIONS);

  const questions = {
    primary_intent: {
      type: "choice",
      instructions: "What is the PRIMARY intent of this message?",
      criteria: INTENT_DESCRIPTIONS,
    },
    formality: {
      type: "score",
      instructions: "How formal is the tone?",
      criteria: ["Very casual / slang", "Casual", "Neutral", "Formal", "Very formal"],
    },
    emotional_intensity: {
      type: "score",
      instructions: "How emotionally charged is this message?",
      criteria: ["Calm / neutral", "Slightly emotional", "Moderate", "Highly emotional", "Extremely emotional"],
    },
    complexity: {
      type: "score",
      instructions: "How complex or multi-layered is this message?",
      criteria: ["Very simple / one thing", "Slightly complex", "Moderate", "Complex / multiple parts", "Very complex / many parts"],
    },
  };

  for (const key of intentKeys) {
    questions[`has_${key}`] = {
      type: "noul",
      instructions: `Does this message EXPLICITLY and DISTINCTLY contain a "${key}" intent? Only mark true if this is a clearly separate intent — not just loosely related to the primary intent. ${INTENT_DESCRIPTIONS[key]}`,
      criteria: {
        true: `Yes, message explicitly contains a distinct ${key} intent`,
        false: `No, ${key} is not a distinct intent in this message`,
      },
    };
  }

  const response = await client.systemOne({
    state: { user_message: userMessage },
    questions,
  });

  const answers = response.answers;
  const primaryIntent = answers.primary_intent.choice;

  const complexity = answers.complexity.score;
  const maxIntents = complexity <= 0.5 ? 2 : complexity <= 1.5 ? 3 : complexity <= 2.5 ? 4 : 6;
  const threshold = 0.75;

  const candidates = [];
  for (const key of intentKeys) {
    const noulValue = answers[`has_${key}`]?.noul ?? 0;
    if (noulValue > threshold) {
      candidates.push({
        type: key,
        confidence: noulValue,
        isPrimary: key === primaryIntent,
      });
    }
  }

  candidates.sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return b.confidence - a.confidence;
  });

  let intents = candidates.slice(0, maxIntents);

  if (!intents.find((i) => i.type === primaryIntent)) {
    intents.unshift({
      type: primaryIntent,
      confidence: answers.primary_intent.confidence ?? 0.8,
      isPrimary: true,
    });
    if (intents.length > maxIntents) intents.pop();
  }

  intents = pruneRedundantIntents(intents);

  return {
    intents,
    primaryIntent,
    formality: answers.formality.score,
    emotionalIntensity: answers.emotional_intensity.score,
    complexity: answers.complexity.score,
    raw: answers,
  };
}

const SUPERSEDED_BY = {
  personal_question: ["capability_query"],
  knowledge_question: ["explanation", "math_calculation", "time_query"],
  explanation: ["knowledge_question"],
  small_talk: ["greeting", "humor"],
  request: ["math_calculation", "time_query"],
};

function pruneRedundantIntents(intents) {
  const types = new Set(intents.map((i) => i.type));
  return intents.filter((intent) => {
    const supersedors = SUPERSEDED_BY[intent.type];
    if (!supersedors) return true;
    if (intent.isPrimary) return true;
    return !supersedors.some((s) => types.has(s));
  });
}

module.exports = { classifyMessage, INTENT_DESCRIPTIONS };
