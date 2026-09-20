const { classifyMessage, scoreResponses, computeWeightedScores, shortlistCandidates, SHORTLIST_THRESHOLD, SHORTLIST_TOP_N, INTENTS, SUBCATEGORIES } = require("../jev-llm");
const { getResponsesForCategory } = require("../response-bank");
const { resolveResponse } = require("../templates");
const { classifyConfidence, shouldFallback } = require("../llm-fallback");

const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

const ipRequests = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  if (entry.count >= RATE_LIMIT) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

function questionMeta() {
  const qs = [
    { id: "intent", type: "choice", label: "What is the primary intent?", options: Object.keys(INTENTS).length },
    { id: "formality", type: "score", label: "How formal is the tone?", levels: 5 },
    { id: "emotional_intensity", type: "score", label: "How emotionally charged?", levels: 5 },
    { id: "needs_human", type: "noul", label: "Does this require a real human?" },
  ];
  for (const intent of Object.keys(SUBCATEGORIES)) {
    qs.push({ id: `sub_${intent}`, type: "choice", label: `If intent is ${intent}: which subcategory?`, speculative: true });
  }
  return qs;
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
  const limit = rateLimit(ip);
  if (!limit.allowed) return res.status(429).json({ error: "Too many requests. Try again in a minute." });

  const { message } = req.body || {};
  if (!message || typeof message !== "string") return res.status(400).json({ error: "Message is required" });
  if (message.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` });

  const cleaned = message.trim();
  if (!cleaned) return res.status(400).json({ error: "Message cannot be empty" });

  try {
    const pipelineStart = Date.now();

    // Stage 1: Classify
    const classifyStart = Date.now();
    const classification = await classifyMessage(cleaned);
    const classifyTime = Date.now() - classifyStart;

    const classifyResult = {
      timing: classifyTime,
      state: { user_message: cleaned },
      questions: questionMeta(),
      intent: classification.intent,
      intentConfidence: classification.intentConfidence,
      intentProbabilities: classification.intentProbabilities,
      subcategory: classification.subcategory,
      subcategoryConfidence: classification.subcategoryConfidence,
      formality: classification.formality,
      emotionalIntensity: classification.emotionalIntensity,
      needsHuman: classification.needsHuman,
      raw: classification.raw,
      gates: {
        needsHuman: { value: classification.needsHuman, threshold: 0.8, pass: classification.needsHuman <= 0.8 },
        intentConfidence: { value: classification.intentConfidence, threshold: 0.3, pass: classification.intentConfidence >= 0.3 },
      },
    };

    // Early exits
    if (classification.needsHuman > 0.8) {
      return res.status(200).json({
        classify: classifyResult,
        earlyExit: "needs_human",
        timing: { classify: classifyTime, total: Date.now() - pipelineStart },
      });
    }
    if (classification.intentConfidence < 0.3) {
      return res.status(200).json({
        classify: classifyResult,
        earlyExit: "low_confidence",
        timing: { classify: classifyTime, total: Date.now() - pipelineStart },
      });
    }

    // Stage 2: Candidates
    const allCandidates = getResponsesForCategory(classification.intent, classification.subcategory);
    let candidates = allCandidates;
    let shortlisted = false;
    let shortlistTime = 0;

    if (allCandidates.length > SHORTLIST_THRESHOLD) {
      const slStart = Date.now();
      candidates = await shortlistCandidates(cleaned, allCandidates, classification);
      shortlistTime = Date.now() - slStart;
      shortlisted = true;
    }

    const resolvedCandidates = candidates.map((c) => ({
      ...c,
      resolvedText: c.resolvedText || resolveResponse(c, classification),
    }));

    const candidatesResult = {
      intent: classification.intent,
      subcategory: classification.subcategory,
      totalInBank: allCandidates.length,
      scored: resolvedCandidates.length,
      shortlisted,
      shortlistTime,
      items: resolvedCandidates.map((c) => ({ id: c.id, text: c.resolvedText || c.text })),
    };

    // Stage 3: Score
    const scoreStart = Date.now();
    const scores = await scoreResponses(cleaned, resolvedCandidates, classification);
    const ranked = computeWeightedScores(resolvedCandidates, scores, classification).sort((a, b) => b.finalScore - a.finalScore);
    const scoreTime = Date.now() - scoreStart;

    const scoringResult = {
      timing: scoreTime,
      totalQuestions: resolvedCandidates.length * 6,
      dimensions: ["relevance", "tone", "helpfulness", "answersQuestion", "specificity", "naturalFlow"],
      ranked: ranked.map((r, i) => ({
        rank: i + 1,
        id: r.id,
        text: r.resolvedText || r.text,
        scores: r.scores,
        normalizedScores: r.normalizedScores,
        weights: r.weights,
        finalScore: r.finalScore,
      })),
    };

    // Stage 4: Output
    const best = ranked[0];
    const confidenceLevel = classifyConfidence(best.finalScore);
    const wouldFallback = shouldFallback(best.finalScore, classification.intentConfidence);

    const outputResult = {
      response: best.resolvedText || best.text,
      responseId: best.id,
      score: best.finalScore,
      confidence: confidenceLevel,
      source: wouldFallback ? "would_fallback_to_llm" : "jev",
    };

    return res.status(200).json({
      classify: classifyResult,
      candidates: candidatesResult,
      scoring: scoringResult,
      output: outputResult,
      timing: {
        classify: classifyTime,
        shortlist: shortlistTime,
        score: scoreTime,
        total: Date.now() - pipelineStart,
      },
    });
  } catch (err) {
    console.error("Pipeline error:", err.message);
    return res.status(500).json({ error: "Pipeline failed. Try again." });
  }
};
