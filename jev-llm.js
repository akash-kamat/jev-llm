require("dotenv").config();
const { TypeSafeClient } = require("@typesafe-ai/sdk");
const { getResponsesForCategory, getAllSubcategories, flattenBank } = require("./response-bank");

const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

const INTENTS = {
  greeting: "The user is saying hello, hi, hey, or initiating a conversation",
  farewell: "The user is saying goodbye, ending the conversation",
  gratitude: "The user is expressing thanks or appreciation",
  question_knowledge: "The user is asking a factual or knowledge question",
  question_personal: "The user is asking about the assistant, themselves, or feelings",
  request: "The user is asking the assistant to do something or take an action",
  complaint: "The user is complaining, expressing frustration, or reporting a problem",
  small_talk: "The user is making casual conversation, joking, or chatting",
  meta_capabilities: "The user is asking what the assistant can or cannot do, its limitations, or how it works",
  opinion: "The user is asking for the assistant's opinion, recommendation, or perspective on something",
  explanation: "The user is asking how something works, why something is the way it is, or asking for a definition",
  followup: "The user is asking for more detail, to continue, repeat, or elaborate on a previous topic",
  humor: "The user is making a joke, being sarcastic, or saying something absurd or funny",
  confusion: "The user's message is unclear, garbled, or doesn't make sense",
};

const SUBCATEGORIES = {
  greeting: {
    casual: "Informal, friendly greeting",
    formal: "Polite, professional greeting",
    returning: "The user seems to be coming back or referencing a previous interaction",
  },
  farewell: {
    casual: "Informal goodbye",
    formal: "Polite, professional goodbye",
  },
  gratitude: {
    casual: "Informal thanks",
    formal: "Professional gratitude",
  },
  question_knowledge: {
    weather: "Asking about weather or temperature",
    time: "Asking about the time or date",
    coding: "Asking about programming, code, or software development",
    math: "Asking about math, calculations, or numbers",
    general_knowledge: "Any other factual or knowledge question",
  },
  question_personal: {
    about_assistant: "Asking who/what the assistant is, its name, or how it works",
    about_user: "Telling the assistant about themselves or asking the assistant to remember something",
    feelings: "Asking how the assistant is doing or if it has feelings",
  },
  request: {
    can_do: "Something the assistant can reasonably help with",
    need_more_info: "The request is unclear and needs clarification",
    cant_do: "Something the assistant cannot do (physical actions, web browsing, real-time data)",
  },
  complaint: {
    empathetic: "The user is upset and needs emotional acknowledgment first",
    solution_oriented: "The user wants a fix, not sympathy",
    escalation: "The issue is serious enough that a human should handle it",
  },
  small_talk: {
    casual: "Light, fun conversation",
    thoughtful: "Deeper or more reflective conversation",
  },
  meta_capabilities: {
    can_do: "Asking what the assistant is capable of",
    cant_do: "Asking about limitations or what it cannot do",
    how_it_works: "Asking about the technology or mechanism behind the assistant",
  },
  opinion: {
    has_perspective: "A question where multiple viewpoints exist and the user wants a take",
    deflect: "A deeply personal or subjective question the assistant should not answer",
    recommend: "The user wants a practical recommendation or suggestion",
  },
  explanation: {
    how_things_work: "Asking how a system, concept, or process works",
    why: "Asking why something is the way it is",
    definition: "Asking what a term or concept means",
  },
  followup: {
    more_detail: "Wants deeper explanation of something already discussed",
    continue: "Wants to move to the next topic or keep going",
    repeat: "Wants the same thing explained differently",
  },
  humor: {
    playful: "Light jokes, puns, or fun messages",
    sarcasm: "Sarcastic or ironic messages",
    absurd: "Nonsensical, random, or surreal humor",
  },
  confusion: {
    gentle: "Gently ask for clarification",
  },
};

async function classifyMessage(userMessage) {
  const questions = {
    intent: {
      type: "choice",
      instructions: "What is the primary intent of this message?",
      criteria: INTENTS,
    },
    formality: {
      type: "score",
      instructions: "How formal is the tone of this message?",
      criteria: ["Very casual / slang", "Casual", "Neutral", "Formal", "Very formal / professional"],
    },
    emotional_intensity: {
      type: "score",
      instructions: "How emotionally charged is this message?",
      criteria: ["Calm / neutral", "Slightly emotional", "Moderately emotional", "Highly emotional", "Extremely emotional"],
    },
    needs_human: {
      type: "noul",
      instructions: "Does this message require a real human to respond properly? Consider if it involves sensitive personal issues, emergencies, complex complaints, or situations where an AI response would be inadequate.",
      criteria: { true: "A human is needed", false: "An AI can handle this" },
    },
  };

  const speculativeSubcategories = {};
  for (const [intent, subs] of Object.entries(SUBCATEGORIES)) {
    speculativeSubcategories[`sub_${intent}`] = {
      type: "choice",
      instructions: `Assuming the user's intent is "${intent}": which subcategory best fits?`,
      criteria: subs,
    };
  }

  const response = await client.systemOne({
    state: { user_message: userMessage },
    questions: { ...questions, ...speculativeSubcategories },
  });

  const answers = response.answers;
  const intent = answers.intent.choice;
  const subKey = `sub_${intent}`;
  const subcategory = answers[subKey] ? answers[subKey].choice : null;

  return {
    intent,
    intentConfidence: answers.intent.confidence,
    intentProbabilities: answers.intent.probabilities,
    subcategory,
    subcategoryConfidence: answers[subKey]?.confidence ?? null,
    formality: answers.formality.score,
    emotionalIntensity: answers.emotional_intensity.score,
    needsHuman: answers.needs_human.noul,
    raw: answers,
  };
}

async function scoreResponses(userMessage, candidates, classification) {
  const questions = {};

  for (const candidate of candidates) {
    questions[`relevance_${candidate.id}`] = {
      type: "score",
      instructions: `How relevant is this response to the user's message? Response: "${candidate.text}"`,
      criteria: ["Not relevant at all", "Slightly relevant", "Moderately relevant", "Very relevant", "Perfectly relevant"],
    };
    questions[`tone_${candidate.id}`] = {
      type: "score",
      instructions: `How well does the tone of this response match the user's tone? Response: "${candidate.text}"`,
      criteria: ["Completely mismatched tone", "Somewhat off", "Acceptable", "Good match", "Perfect tone match"],
    };
    questions[`helpfulness_${candidate.id}`] = {
      type: "score",
      instructions: `How helpful is this response to the user? Response: "${candidate.text}"`,
      criteria: ["Not helpful", "Slightly helpful", "Moderately helpful", "Very helpful", "Extremely helpful"],
    };
    questions[`answers_question_${candidate.id}`] = {
      type: "noul",
      instructions: `Does this response directly address what the user said or asked? Response: "${candidate.text}"`,
      criteria: { true: "Yes, it addresses the user's message", false: "No, it misses the point" },
    };
  }

  const response = await client.systemOne({
    state: { user_message: userMessage },
    questions,
  });

  return response.answers;
}

function computeWeightedScores(candidates, scores, classification) {
  const emotionalIntensity = classification.emotionalIntensity;
  const isHighEmotion = emotionalIntensity > 2.5;
  const isComplaint = classification.intent === "complaint";

  const weights = isComplaint || isHighEmotion
    ? { relevance: 0.25, tone: 0.35, helpfulness: 0.15, answers: 0.25 }
    : { relevance: 0.30, tone: 0.20, helpfulness: 0.25, answers: 0.25 };

  return candidates.map((candidate) => {
    const relevance = scores[`relevance_${candidate.id}`]?.score ?? 0;
    const tone = scores[`tone_${candidate.id}`]?.score ?? 0;
    const helpfulness = scores[`helpfulness_${candidate.id}`]?.score ?? 0;
    const answersQ = scores[`answers_question_${candidate.id}`]?.noul ?? 0;

    const relevanceNorm = relevance / 4;
    const toneNorm = tone / 4;
    const helpfulnessNorm = helpfulness / 4;

    const finalScore =
      weights.relevance * relevanceNorm +
      weights.tone * toneNorm +
      weights.helpfulness * helpfulnessNorm +
      weights.answers * answersQ;

    return {
      ...candidate,
      scores: { relevance, tone, helpfulness, answersQuestion: answersQ },
      normalizedScores: { relevance: relevanceNorm, tone: toneNorm, helpfulness: helpfulnessNorm, answersQuestion: answersQ },
      weights,
      finalScore,
    };
  });
}

async function respond(userMessage) {
  const startTime = Date.now();

  const classification = await classifyMessage(userMessage);
  const classifyTime = Date.now() - startTime;

  if (classification.needsHuman > 0.8) {
    return {
      response: "[ESCALATE TO HUMAN] This message needs a real person.",
      classification,
      escalated: true,
      timing: { classify: classifyTime, score: 0, total: Date.now() - startTime },
    };
  }

  if (classification.intentConfidence < 0.3) {
    const fallbacks = getResponsesForCategory("fallback", "graceful");
    return {
      response: fallbacks[0].text,
      classification,
      escalated: false,
      lowConfidence: true,
      timing: { classify: classifyTime, score: 0, total: Date.now() - startTime },
    };
  }

  const candidates = getResponsesForCategory(classification.intent, classification.subcategory);

  const scoreStart = Date.now();
  const scores = await scoreResponses(userMessage, candidates, classification);
  const scoreTime = Date.now() - scoreStart;

  const ranked = computeWeightedScores(candidates, scores, classification)
    .sort((a, b) => b.finalScore - a.finalScore);

  const best = ranked[0];

  return {
    response: best.text,
    responseId: best.id,
    finalScore: best.finalScore,
    classification,
    ranking: ranked.map((r) => ({
      id: r.id,
      text: r.text,
      finalScore: r.finalScore.toFixed(4),
      scores: r.scores,
    })),
    escalated: false,
    timing: {
      classify: classifyTime,
      score: scoreTime,
      total: Date.now() - startTime,
    },
  };
}

module.exports = { respond, classifyMessage, scoreResponses, computeWeightedScores, flattenBank };
