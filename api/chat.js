const { respond } = require("../gen1-selection-based/jev-llm");

const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

const ipRequests = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const entry = ipRequests.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: now + RATE_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRequests) {
    if (now > entry.resetAt) ipRequests.delete(ip);
  }
}, 30000);

module.exports = async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  const limit = rateLimit(ip);

  res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
  res.setHeader("X-RateLimit-Remaining", limit.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(limit.resetAt / 1000));

  if (!limit.allowed) {
    return res.status(429).json({
      error: "Too many requests. Try again in a minute.",
      retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000),
    });
  }

  const { message } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` });
  }

  const cleaned = message.trim();
  if (!cleaned) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  try {
    const result = await respond(cleaned);

    return res.status(200).json({
      response: result.response,
      meta: {
        source: result.source || "jev",
        score: result.finalScore,
        confidence: result.confidenceLevel,
        intent: result.classification?.intent,
        subcategory: result.classification?.subcategory,
        formality: result.classification?.formality,
        emotion: result.classification?.emotionalIntensity,
        timing: result.timing?.total,
      },
    });
  } catch (err) {
    console.error("Chat error:", err.message);
    return res.status(500).json({ error: "Something went wrong. Try again." });
  }
};
