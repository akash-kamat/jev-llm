function planResponse(classification) {
  const { intents, formality, emotionalIntensity } = classification;
  const intentTypes = intents.map((i) => i.type);

  const segments = [];

  const hasGreeting = intentTypes.includes("greeting");
  const hasFarewell = intentTypes.includes("farewell");
  const hasGratitude = intentTypes.includes("gratitude");

  if (hasGreeting) {
    segments.push({ role: "greeting", priority: 0 });
  }

  if (hasGratitude) {
    segments.push({ role: "gratitude_response", priority: 0 });
  }

  for (const intent of intents) {
    if (["greeting", "farewell", "gratitude"].includes(intent.type)) continue;

    switch (intent.type) {
      case "math_calculation":
        segments.push({ role: "acknowledgment", priority: 1 });
        segments.push({ role: "tool_result_math", toolType: "math", priority: 2 });
        break;
      case "time_query":
        segments.push({ role: "tool_result_datetime", toolType: "datetime", priority: 2 });
        break;
      case "knowledge_question":
        segments.push({ role: "tool_result_knowledge", toolType: "knowledge", priority: 2 });
        break;
      case "capability_query":
        segments.push({ role: "capability_description", priority: 2 });
        break;
      case "personal_question":
        segments.push({ role: "personal_feelings", priority: 2 });
        break;
      case "opinion":
        segments.push({ role: "opinion_response", priority: 2 });
        break;
      case "explanation":
        segments.push({ role: "tool_result_knowledge", toolType: "knowledge", priority: 2 });
        break;
      case "request":
        segments.push({ role: "request_response", priority: 2 });
        break;
      case "complaint":
        segments.push({ role: "empathy", priority: 1 });
        segments.push({ role: "complaint_response", priority: 2 });
        break;
      case "small_talk":
        segments.push({ role: "small_talk_response", priority: 2 });
        break;
      case "humor":
        segments.push({ role: "humor_response", priority: 2 });
        break;
      case "followup":
        segments.push({ role: "followup_response", priority: 2 });
        break;
      case "confusion":
        segments.push({ role: "clarification", priority: 2 });
        break;
      default:
        segments.push({ role: "generic_response", priority: 2 });
    }
  }

  if (hasFarewell) {
    segments.push({ role: "farewell", priority: 10 });
  }

  const needsConnectors = segments.filter((s) => s.priority === 2).length > 1;

  const needsFollowup =
    !hasFarewell &&
    !intentTypes.includes("confusion") &&
    (segments.some((s) => s.priority === 2) || hasGreeting);

  if (needsFollowup) {
    segments.push({ role: "followup_question", priority: 9 });
  }

  // Deduplicate acknowledgments
  const seen = new Set();
  const deduped = segments.filter((s) => {
    const key = s.role + (s.toolType || "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => a.priority - b.priority);

  return {
    segments: deduped,
    needsConnectors,
    formality,
    emotionalIntensity,
    intentCount: intents.length,
  };
}

module.exports = { planResponse };
