const slotData = {
  capabilities: {
    conversations: "having conversations",
    questions: "answering questions",
    brainstorming: "brainstorming ideas",
    decisions: "helping with decisions",
    explanations: "breaking down complex topics",
  },
  limitations: {
    web: "browse the web",
    realtime: "access real-time data",
    code_exec: "run or execute code",
    memory: "remember previous conversations",
    generate: "generate original text",
    actions: "perform physical actions",
    files: "access or modify files",
  },
  alternatives: {
    weather: "your phone's weather app should have you covered",
    time: "check your device's clock or taskbar",
    search: "a quick web search should find what you need",
    calculator: "a calculator app will get that done instantly",
    maps: "try a maps app for directions",
    email: "you'd want to use your email client for that",
  },
  topics: {
    coding: "programming and software development",
    math: "math and calculations",
    science: "science and how things work",
    language: "language and writing",
    general: "general knowledge",
  },
};

function fillTemplate(text, slots) {
  return text.replace(/\{(\w+)(?::(\w+))?\}/g, (match, category, key) => {
    if (key && slotData[category]?.[key]) {
      return slotData[category][key];
    }
    if (slots?.[category]) {
      return slots[category];
    }
    return match;
  });
}

function pickSlots(category, keys) {
  if (!slotData[category]) return "";
  const available = keys
    ? keys.filter((k) => slotData[category][k]).map((k) => slotData[category][k])
    : Object.values(slotData[category]);
  if (available.length === 0) return "";
  if (available.length === 1) return available[0];
  if (available.length === 2) return `${available[0]} and ${available[1]}`;
  return available.slice(0, -1).join(", ") + ", and " + available[available.length - 1];
}

function resolveResponse(candidate, classification) {
  if (!candidate.template) return candidate.text;

  const context = {};

  if (candidate.slots) {
    for (const [key, value] of Object.entries(candidate.slots)) {
      if (typeof value === "object" && value.category) {
        context[key] = pickSlots(value.category, value.keys);
      } else {
        context[key] = value;
      }
    }
  }

  return fillTemplate(candidate.text, context);
}

module.exports = { fillTemplate, pickSlots, resolveResponse, slotData };
