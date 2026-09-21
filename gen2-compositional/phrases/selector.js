require("dotenv").config();
const { TypeSafeClient } = require("@typesafe-ai/sdk");
const {
  getPhrasesByRole,
  getPhrasesForFormality,
  getGreetingPhrases,
  getFarewellPhrases,
  getResultPresenters,
} = require("./library");

const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

function shuffleAndSample(arr, maxItems = 4) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(maxItems, shuffled.length));
}

async function selectPhrases(plan, classification, toolResults = []) {
  const { segments, formality } = plan;
  const selections = {};
  const questions = {};
  const candidateMap = {};

  const expandedSegments = [...segments];

  if (segments.some((s) => s.role === "capability_description")) {
    expandedSegments.push({ role: "capability_intro", priority: -1 });
    expandedSegments.push({ role: "capability_list", priority: -1 });
  }

  for (const segment of expandedSegments) {
    const { role, toolType } = segment;

    let candidates;
    if (role === "greeting") {
      candidates = getGreetingPhrases(formality);
    } else if (role === "farewell") {
      candidates = getFarewellPhrases(formality);
    } else if (role.startsWith("tool_result")) {
      continue;
    } else {
      candidates = getPhrasesByRole(role);
    }

    if (!candidates || candidates.length === 0) continue;

    candidates = getPhrasesForFormality(candidates, formality);
    if (candidates.length === 0) continue;

    const sampled = shuffleAndSample(candidates);
    candidateMap[role] = sampled;

    if (sampled.length === 1) {
      selections[role] = sampled[0];
      continue;
    }

    const criteriaObj = {};
    for (const c of sampled) {
      criteriaObj[c.id] = c.text || c.format || c.id;
    }

    questions[`pick_${role}`] = {
      type: "choice",
      instructions: `Pick the best ${role.replace(/_/g, " ")} phrase for this conversation.`,
      criteria: criteriaObj,
    };
  }

  if (segments.some((s) => s.needsConnectors || plan.needsConnectors)) {
    const connectors = getPhrasesByRole("connector");
    if (connectors) {
      const sampled = shuffleAndSample(connectors);
      candidateMap["connector"] = sampled;
      const criteriaObj = {};
      for (const c of sampled) criteriaObj[c.id] = c.text;
      questions["pick_connector"] = {
        type: "choice",
        instructions: "Pick the best connector word to join multiple response parts.",
        criteria: criteriaObj,
      };
    }
  }

  if (Object.keys(questions).length > 0) {
    const toolContext = toolResults.length > 0
      ? ` Tool results available: ${toolResults.map((t) => `${t.type}: ${t.formatted || t.answer || ""}`).join(", ")}`
      : "";

    const response = await client.systemOne({
      state: {
        user_message: classification.userMessage || "",
        context: `Formality: ${formality}/4. Intents: ${classification.intents.map((i) => i.type).join(", ")}.${toolContext}`,
      },
      questions,
    });

    for (const [qKey, answer] of Object.entries(response.answers)) {
      const role = qKey.replace("pick_", "");
      const candidates = candidateMap[role];
      if (!candidates) continue;

      const chosen = candidates.find((c) => c.id === answer.choice);
      if (chosen) {
        selections[role] = chosen;
      }
    }
  }

  for (const segment of expandedSegments) {
    const { role } = segment;
    if (selections[role]) continue;
    const candidates = candidateMap[role];
    if (candidates && candidates.length > 0) {
      selections[role] = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  return selections;
}

module.exports = { selectPhrases };
