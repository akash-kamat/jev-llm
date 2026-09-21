const LLM_API_KEY = process.env.ANTHROPIC_API_KEY;
const LLM_MODEL = process.env.LLM_FALLBACK_MODEL || "claude-haiku-4-5-20251001";

const SCORE_THRESHOLDS = {
  high: 0.7,
  medium: 0.4,
};

function classifyConfidence(bestScore) {
  if (bestScore >= SCORE_THRESHOLDS.high) return "high";
  if (bestScore >= SCORE_THRESHOLDS.medium) return "medium";
  return "low";
}

async function callLLM(userMessage) {
  if (!LLM_API_KEY) {
    return {
      text: null,
      used: false,
      reason: "no_api_key",
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": LLM_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: 256,
      system: "You are Jev, a helpful conversational assistant. Keep responses concise (1-3 sentences), friendly, and natural. You are powered by a selection-based AI system but occasionally fall back to generation for unusual questions.",
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return {
      text: null,
      used: false,
      reason: "api_error",
      error: err,
    };
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;

  return {
    text,
    used: true,
    reason: "llm_fallback",
    model: LLM_MODEL,
    usage: data.usage,
  };
}

function shouldFallback(bestScore, intentConfidence) {
  const level = classifyConfidence(bestScore);
  if (level === "low") return true;
  if (level === "medium" && intentConfidence < 0.5) return true;
  return false;
}

module.exports = { callLLM, shouldFallback, classifyConfidence, SCORE_THRESHOLDS };
