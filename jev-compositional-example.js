/**
 * Generative Jev Example: Compositional Response System
 *
 * Instead of selecting ONE complete response from 550 options,
 * this composes responses from ~50 parts into thousands of combinations.
 */

require("dotenv").config();
const { TypeSafeClient } = require("@typesafe-ai/sdk");

const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

// Response building blocks (instead of 550 complete responses)
const responseParts = {
  greetings: [
    { id: "hey_there", text: "Hey there!", formality: 1, tags: ["casual"] },
    { id: "hi", text: "Hi!", formality: 1, tags: ["casual"] },
    { id: "hello", text: "Hello", formality: 3, tags: ["neutral"] },
    { id: "good_day", text: "Good day", formality: 4, tags: ["formal"] },
    { id: "greetings", text: "Greetings", formality: 4, tags: ["formal"] },
  ],

  acknowledgments: [
    { id: "whats_up", text: "What's up?", formality: 1, tags: ["casual"] },
    { id: "how_going", text: "How's it going?", formality: 1, tags: ["casual"] },
    { id: "nice_to_chat", text: "Nice to chat.", formality: 2, tags: ["friendly"] },
    { id: "good_to_see", text: "Good to see you.", formality: 2, tags: ["friendly"] },
  ],

  questions: [
    { id: "whats_mind", text: "What's on your mind?", formality: 1, tags: ["curious", "casual"] },
    { id: "how_help", text: "How can I help?", formality: 2, tags: ["helpful"] },
    { id: "what_need", text: "What do you need?", formality: 2, tags: ["direct"] },
    { id: "how_assist", text: "How may I assist you?", formality: 3, tags: ["formal"] },
    { id: "what_brings", text: "What brings you here today?", formality: 3, tags: ["formal"] },
  ],

  context_specific: [
    { id: "welcome_back", text: "Welcome back!", requires: "returning", tags: ["friendly"] },
    { id: "see_again", text: "Good to see you again!", requires: "returning", tags: ["friendly"] },
    { id: "ready_when", text: "Ready when you are.", tags: ["casual"] },
  ],

  closers: [
    { id: "let_me_know", text: "Let me know!", formality: 1, tags: ["casual"] },
    { id: "here_if_need", text: "I'm here if you need anything.", formality: 2, tags: ["supportive"] },
    { id: "at_service", text: "I'm at your service.", formality: 4, tags: ["formal"] },
  ],
};

/**
 * Round 1: Selection
 * Pick which parts should be in the response
 */
async function selectParts(userMessage, classification) {
  // Filter candidates based on context
  const candidates = [];

  for (const [category, parts] of Object.entries(responseParts)) {
    for (const part of parts) {
      // Skip if required context is missing
      if (part.requires === "returning" && !classification.isReturning) continue;

      // Skip if formality mismatch is too large
      const formalityDiff = Math.abs(part.formality - classification.formality);
      if (formalityDiff > 2) continue;

      candidates.push({
        ...part,
        category,
        description: `${category} part: "${part.text}" (formality: ${part.formality}, tags: ${part.tags.join(", ")})`
      });
    }
  }

  // Build inclusion questions for each candidate
  const questions = {};
  for (const candidate of candidates) {
    questions[`include_${candidate.id}`] = {
      type: "noul", // binary 0-1
      instructions: `Should this part be included in the response to "${userMessage}"? Part: "${candidate.text}"`,
      criteria: {
        true: "This part fits the tone and intent of the response",
        false: "This part doesn't fit or would be redundant"
      }
    };
  }

  const response = await client.systemOne({
    state: {
      user_message: userMessage,
      intent: classification.intent,
      formality: classification.formality,
      emotional_intensity: classification.emotionalIntensity,
      is_returning: classification.isReturning || false,
    },
    questions,
  });

  // Filter selected parts with stricter threshold and category limits
  const selected = [];
  const categoryCount = {};

  // Sort by probability first
  const sortedCandidates = candidates
    .map(c => ({
      ...c,
      inclusionScore: response.answers[`include_${c.id}`]?.noul ?? 0
    }))
    .sort((a, b) => b.inclusionScore - a.inclusionScore);

  for (const candidate of sortedCandidates) {
    // Stricter threshold
    if (candidate.inclusionScore < 0.7) continue;

    // Limit per category to avoid redundancy
    const maxPerCategory = {
      greetings: 1,          // Only ONE greeting opener
      acknowledgments: 1,     // Only ONE acknowledgment
      questions: 1,           // Only ONE question
      context_specific: 2,    // Up to 2 context parts
      closers: 1              // Only ONE closer
    };

    const currentCount = categoryCount[candidate.category] || 0;
    const maxAllowed = maxPerCategory[candidate.category] || 1;

    if (currentCount >= maxAllowed) continue;

    selected.push(candidate);
    categoryCount[candidate.category] = currentCount + 1;
  }

  return selected;
}

/**
 * Round 2: Ordering
 * Arrange selected parts into a coherent sequence
 */
async function orderParts(userMessage, selectedParts, classification) {
  if (selectedParts.length === 0) return [];
  if (selectedParts.length === 1) return selectedParts;

  // Build ordering questions
  const questions = {};
  for (const part of selectedParts) {
    questions[`order_${part.id}`] = {
      type: "score",
      instructions: `How early in the response should this part appear? Part: "${part.text}"`,
      criteria: ["First (opening)", "Early (after opening)", "Middle", "Late (near end)", "Last (closing)"]
    };
  }

  const response = await client.systemOne({
    state: {
      user_message: userMessage,
      selected_parts: selectedParts.map(p => ({ id: p.id, text: p.text, category: p.category })),
    },
    questions,
  });

  // Add order scores and sort
  const ordered = selectedParts.map(part => ({
    ...part,
    orderScore: response.answers[`order_${part.id}`]?.score ?? 2.0
  }));

  ordered.sort((a, b) => a.orderScore - b.orderScore);

  return ordered;
}

/**
 * Compose final response from ordered parts
 */
function composeResponse(orderedParts) {
  if (orderedParts.length === 0) return "I'm not sure how to respond to that.";

  // Join with appropriate punctuation
  let response = "";

  for (let i = 0; i < orderedParts.length; i++) {
    const part = orderedParts[i];
    const isLast = i === orderedParts.length - 1;

    if (i === 0) {
      // First part
      response = part.text;
    } else {
      // Subsequent parts
      const prevEndsWithPunctuation = /[.!?]$/.test(response);

      if (!prevEndsWithPunctuation) {
        // Add comma or period based on category
        if (part.category === "closers" || isLast) {
          response += ".";
        } else {
          response += ",";
        }
      }

      response += " " + part.text;
    }
  }

  // Ensure final punctuation
  if (!/[.!?]$/.test(response)) {
    response += ".";
  }

  return response;
}

/**
 * Main compositional response function
 */
async function respondCompositional(userMessage, classification) {
  const startTime = Date.now();

  // Round 1: Select parts
  const selectStart = Date.now();
  const selectedParts = await selectParts(userMessage, classification);
  const selectTime = Date.now() - selectStart;

  console.log(`\nSelected ${selectedParts.length} parts:`, selectedParts.map(p => p.id));

  // Round 2: Order parts
  const orderStart = Date.now();
  const orderedParts = await orderParts(userMessage, selectedParts, classification);
  const orderTime = Date.now() - orderStart;

  console.log(`Ordered parts:`, orderedParts.map(p => `${p.id}(${p.orderScore.toFixed(2)})`));

  // Compose final response
  const response = composeResponse(orderedParts);

  return {
    response,
    parts: orderedParts,
    timing: {
      select: selectTime,
      order: orderTime,
      total: Date.now() - startTime,
    },
    candidatesEvaluated: Object.keys(responseParts).reduce((sum, cat) => sum + responseParts[cat].length, 0),
    partsSelected: selectedParts.length,
  };
}

// Example usage
async function demo() {
  const userMessage = "hey how are you";

  const classification = {
    intent: "greeting",
    formality: 1.2,
    emotionalIntensity: 0.5,
    isReturning: false,
  };

  console.log(`User: ${userMessage}`);
  console.log(`Classification:`, classification);

  const result = await respondCompositional(userMessage, classification);

  console.log(`\nJev: ${result.response}`);
  console.log(`\nTiming: select=${result.timing.select}ms, order=${result.timing.order}ms, total=${result.timing.total}ms`);
  console.log(`Evaluated ${result.candidatesEvaluated} parts, selected ${result.partsSelected}`);
}

// Uncomment to run demo:
// demo().catch(console.error);

module.exports = {
  respondCompositional,
  selectParts,
  orderParts,
  composeResponse,
  responseParts,
};
