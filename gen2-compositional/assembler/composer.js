const { smartPunctuate, capitalizeFirst, cleanSpacing } = require("./punctuation");

function assembleResponse(selections, plan, classification, toolResults = []) {
  const { segments, needsConnectors } = plan;
  const parts = [];
  let contentSegmentCount = 0;
  let connectorUsed = false;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const { role, toolType } = segment;

    const isContentSegment = segment.priority === 2;
    if (isContentSegment) contentSegmentCount++;

    if (needsConnectors && isContentSegment && contentSegmentCount === 2 && !connectorUsed) {
      const connector = selections.connector;
      if (connector) {
        parts.push({
          text: smartPunctuate(connector.text, "connector"),
          role: "connector",
        });
        connectorUsed = true;
      }
    }

    let text = resolveSegmentText(role, toolType, selections, toolResults);
    if (!text) continue;

    const phrase = selections[role] || {};
    const energy = phrase.energy || (classification.emotionalIntensity > 2 ? "high" : "medium");
    const punctuated = smartPunctuate(text, role, { energy });

    parts.push({ text: punctuated, role });
  }

  if (parts.length === 0) {
    return "I'm not quite sure what to say to that. Could you rephrase?";
  }

  const assembled = parts.map((p) => capitalizeFirst(p.text)).join(" ");
  return cleanSpacing(assembled);
}

function resolveSegmentText(role, toolType, selections, toolResults) {
  if (role.startsWith("tool_result") && toolType) {
    const toolResult = toolResults.find((t) => t.type === toolType);
    if (!toolResult || !toolResult.success) return null;
    return toolResult.formatted || String(toolResult.answer);
  }

  if (role === "capability_description") {
    const intro = selections.capability_intro;
    const list = selections.capability_list;
    if (intro && list) return `${intro.text} ${list.text}`;
    if (list) return list.text;
    if (intro) return `${intro.text} a variety of things`;
    return "I can help with questions, conversations, and more";
  }

  const phrase = selections[role];
  return phrase ? phrase.text : null;
}

function resolveTemplate(format, data) {
  return format.replace(/\{(\w+)\}/g, (match, key) => {
    if (data[key] !== undefined) return String(data[key]);
    return match;
  });
}

module.exports = { assembleResponse };
