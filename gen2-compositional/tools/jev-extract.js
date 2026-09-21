// Jev-based extraction functions for all tools.
// Not used in production — regex handles extraction in each tool.
// Kept as tested fallbacks if regex proves insufficient on new edge cases.

const { TypeSafeClient } = require("@typesafe-ai/sdk");

const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

function preClean(msg) {
  let q = msg.trim();
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like|pls|please|btw|bruh|bro|dude|man|omg|wow)\b[,.]?\s*/gi, "");
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like)\b[,.]?\s*/gi, "");
  q = q.replace(/[?.!]+$/g, "");
  return q.trim();
}

async function boundaryExtract(userMessage, task, startInstr, endInstr) {
  const cleaned = preClean(userMessage);
  const words = cleaned.split(/\s+/);
  if (words.length <= 2) return words.join(" ");

  const startCriteria = {};
  const endCriteria = {};
  for (let i = 0; i < words.length; i++) {
    const label = `${i}:${words[i]}`;
    startCriteria[label] = `"${words[i]}" (position ${i})`;
    endCriteria[label] = `"${words[i]}" (position ${i})`;
  }

  const response = await client.systemOne({
    state: { user_message: cleaned, task },
    questions: {
      span_start: {
        type: "choice",
        instructions: startInstr,
        criteria: startCriteria,
      },
      span_end: {
        type: "choice",
        instructions: endInstr,
        criteria: endCriteria,
      },
    },
  });

  const startIdx = parseInt(response.answers.span_start.choice.split(":")[0]);
  const endIdx = parseInt(response.answers.span_end.choice.split(":")[0]);
  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  return words.slice(from, to + 1).join(" ");
}

async function extractTopic(userMessage) {
  return boundaryExtract(
    userMessage,
    "Extract the Wikipedia search topic. Return the SHORTEST phrase naming the specific subject — a person, place, concept, or event.",
    "Which word STARTS the topic name? Pick where the specific subject begins.",
    "Which word ENDS the topic name? The start-to-end span should be a clean Wikipedia search term."
  );
}

async function extractMathExpression(userMessage) {
  return boundaryExtract(
    userMessage,
    "Extract the math expression the user wants calculated. Return ONLY the mathematical expression — numbers, operators, parentheses.",
    "Which word STARTS the math expression? Pick the first number or math function.",
    "Which word ENDS the math expression? Pick the last number or closing parenthesis."
  );
}

async function extractLocation(userMessage) {
  return boundaryExtract(
    userMessage,
    "Extract the location or timezone the user is asking about. Return ONLY the place name or timezone abbreviation.",
    "Which word STARTS the location/timezone name?",
    "Which word ENDS the location/timezone name?"
  );
}

module.exports = { extractTopic, extractMathExpression, extractLocation };
