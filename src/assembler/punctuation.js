function smartPunctuate(text, role, context = {}) {
  if (!text || text.length === 0) return text;

  const lastChar = text[text.length - 1];
  if ([".", "!", "?"].includes(lastChar)) return text;

  switch (role) {
    case "greeting":
      return context.energy === "high" ? text + "!" : text + ".";
    case "farewell":
      return text + "!";
    case "acknowledgment":
      return context.energy === "high" ? text + "!" : text + ".";
    case "gratitude_response":
      return text + "!";
    case "empathy":
      return text + ".";
    case "followup_question":
      return text.endsWith("?") ? text : text;
    case "clarification_request":
    case "clarification":
      return text.endsWith("?") ? text : text + "?";
    case "humor_response":
      return text + "!";
    case "connector":
      return text;
    case "tool_result":
    case "tool_result_math":
    case "tool_result_datetime":
    case "tool_result_knowledge":
      return text + ".";
    case "personal_feelings":
      return text + ".";
    case "capability_description":
      return text + ".";
    default:
      return text + ".";
  }
}

function capitalizeFirst(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function cleanSpacing(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s([.,!?;])/g, "$1")
    .replace(/([.!?])([A-Za-z])/g, "$1 $2")
    .trim();
}

module.exports = { smartPunctuate, capitalizeFirst, cleanSpacing };
