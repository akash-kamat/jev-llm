require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

const { TypeSafeClient } = require("@typesafe-ai/sdk");
const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

const MESSAGE = "so i keep hearing about climate change can you explain what it actually is";

// Generate exactly N candidates from the message
function makeCandidates(n) {
  const all = [
    "climate change", "climate", "change", "hearing", "explain",
    "keep hearing", "about climate", "climate change can", "hearing about",
    "keep", "can", "you", "what", "it", "actually", "is",
    "about climate change", "keep hearing about", "hearing about climate",
    "i keep hearing", "can you explain", "you explain what",
    "explain what it", "what it actually", "it actually is",
    "so i keep", "i keep", "so i", "keep hearing about climate",
    "hearing about climate change", "about climate change can",
    "climate change can you", "change can you explain",
    "can you explain what", "you explain what it",
    "explain what it actually", "what it actually is",
    "so i keep hearing", "i keep hearing about",
    "keep hearing about climate change",
    "hearing about climate change can",
    "about climate change can you",
    "climate change can you explain",
    "change can you explain what",
    "can you explain what it",
    "you explain what it actually",
    "explain what it actually is",
    "so i keep hearing about",
    "i keep hearing about climate",
  ];
  return all.slice(0, Math.min(n, all.length));
}

async function timeJev(candidateCount) {
  const candidates = makeCandidates(candidateCount);
  const criteria = {};
  for (const c of candidates) criteria[c] = `"${c}"`;

  const start = Date.now();
  await client.systemOne({
    state: { user_message: MESSAGE },
    questions: {
      best_query: {
        type: "choice",
        instructions: "Which phrase is the best Wikipedia search query?",
        criteria,
      },
    },
  });
  return Date.now() - start;
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Jev Scaling: Time vs Candidate Count");
  console.log("=".repeat(60));
  console.log(`\nMessage: "${MESSAGE}"\n`);

  const sizes = [3, 5, 8, 10, 15, 20, 30, 40, 48];
  const results = [];

  // Warm up
  await timeJev(3);

  for (const n of sizes) {
    // Run 3 times and average
    const times = [];
    for (let r = 0; r < 3; r++) {
      const t = await timeJev(n);
      times.push(t);
    }
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const min = Math.min(...times);
    const max = Math.max(...times);
    results.push({ n, avg, min, max, times });
    console.log(`  ${String(n).padStart(2)} candidates → avg ${avg}ms (${times.map(t => t + "ms").join(", ")})`);
  }

  // Chart
  console.log("\n=== VISUAL ===\n");
  const maxAvg = Math.max(...results.map((r) => r.avg));
  for (const r of results) {
    const barLen = Math.round((r.avg / maxAvg) * 50);
    const bar = "█".repeat(barLen);
    console.log(`  ${String(r.n).padStart(2)} cands │${bar} ${r.avg}ms`);
  }

  // Is it linear?
  console.log("\n=== ANALYSIS ===\n");
  const first = results[0];
  const last = results[results.length - 1];
  const ratio = last.avg / first.avg;
  const sizeRatio = last.n / first.n;
  console.log(`  ${first.n} candidates: ${first.avg}ms`);
  console.log(`  ${last.n} candidates: ${last.avg}ms`);
  console.log(`  Size increased ${sizeRatio.toFixed(1)}x → Time increased ${ratio.toFixed(1)}x`);

  if (ratio > sizeRatio * 0.8) {
    console.log(`  → Roughly linear or worse (time scales with candidates)`);
  } else if (ratio > sizeRatio * 0.4) {
    console.log(`  → Sub-linear (time grows slower than candidates)`);
  } else {
    console.log(`  → Mostly flat (Jev handles more candidates cheaply)`);
  }

  // ms per candidate
  console.log("\n  Per-candidate cost:");
  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1];
    const curr = results[i];
    const addedCands = curr.n - prev.n;
    const addedTime = curr.avg - prev.avg;
    const perCand = (addedTime / addedCands).toFixed(1);
    console.log(`    ${prev.n} → ${curr.n}: +${addedCands} candidates = +${addedTime}ms (${perCand}ms/candidate)`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
