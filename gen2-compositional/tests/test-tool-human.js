require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mathTool = require("./tools/math");
const datetimeTool = require("./tools/datetime");
const knowledgeTool = require("./tools/knowledge");

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label} ${detail}`);
    failed++;
  }
}

async function testMathHuman() {
  console.log("\n=== MATH — REAL HUMAN INPUTS ===\n");

  const cases = [
    // Typos and messy input
    { input: "whats 45 * 3?", expect: 135, desc: "no apostrophe" },
    { input: "hey whats 100 + 250??", expect: 350, desc: "double question mark" },
    { input: "can u calculate 88 / 11", expect: 8, desc: "u instead of you" },
    { input: "hmm ok so what is 999 - 1", expect: 998, desc: "casual lead-in" },
    { input: "do 15 * 15 for me", expect: 225, desc: "do X for me" },
    { input: "pls tell me 200 / 8", expect: 25, desc: "pls shorthand" },

    // Longer conversational sentences
    { input: "hey so i was wondering if you could tell me what 144 / 12 is", expect: 12, desc: "long casual ask" },
    { input: "i need to split a $450 bill between 6 people, whats 450/6?", expect: 75, desc: "real-world context + math" },
    { input: "ok one more thing, 2^16", expect: 65536, desc: "continuation vibe" },
    { input: "quickly tell me 7 * 8 * 9", expect: 504, desc: "chained multiply" },

    // Edge expressions
    { input: "what is 0 * 99999?", expect: 0, desc: "multiply by zero" },
    { input: "whats 1000000 + 1?", expect: 1000001, desc: "large number" },
    { input: "10 - -5", expect: 15, desc: "double negative" },
    { input: "what's 33.33 + 66.67?", expect: 100, desc: "decimals adding to whole" },
    { input: "25% of 80", expect: 20, desc: "percentage no question" },

    // Should fail gracefully
    { input: "what's the meaning of life times two", expect: null, desc: "nonsense math" },
    { input: "add some numbers idk", expect: null, desc: "vague request" },
    { input: "multiply that by 5", expect: null, desc: "reference without number" },
  ];

  for (const tc of cases) {
    const result = await mathTool.execute(tc.input);
    const got = result.success ? result.answer : null;
    const display = result.success ? result.formatted : `FAIL: ${result.error}`;
    console.log(`"${tc.input}" [${tc.desc}]`);
    console.log(`  → ${display}`);
    if (tc.expect === null) {
      check("graceful fail", !result.success || typeof result.answer !== "number", `got ${got}`);
    } else {
      check(`= ${tc.expect}`, result.success && Math.abs(result.answer - tc.expect) < 0.001, `got ${got}`);
    }
  }
}

async function testDatetimeHuman() {
  console.log("\n=== DATETIME — REAL HUMAN INPUTS ===\n");

  const cases = [
    // Casual / typos
    { input: "yo what time is it", type: "local", desc: "yo prefix" },
    { input: "whats the time rn", type: "local", desc: "rn shorthand" },
    { input: "hey what day is it today", type: "local", desc: "redundant today" },
    { input: "tell me the date pls", type: "local", desc: "pls" },

    // World time — messy
    { input: "whats the time in tokyo rn", type: "world", desc: "tokyo lowercase rn" },
    { input: "time in los angeles", type: "world", desc: "two-word city" },
    { input: "hey what time is it in paris right now?", type: "world", desc: "right now qualifier" },
    { input: "can you tell me time in singapore", type: "world", desc: "polite framing" },
    { input: "what time in moscow??", type: "world", desc: "double question mark" },
    { input: "time in IST", type: "world", desc: "timezone abbreviation" },

    // Ambiguous
    { input: "is it late?", type: "local", desc: "vague time reference" },
    { input: "what month are we in", type: "local", desc: "month question" },
  ];

  for (const tc of cases) {
    const result = await datetimeTool.execute(tc.input);
    console.log(`"${tc.input}" [${tc.desc}]`);
    console.log(`  → ${result.success ? result.formatted : `FAIL: ${result.error || "no result"}`}`);
    if (tc.type === "world") {
      check("world time detected", result.success && result.queryType === "world_time", `got ${result.queryType}`);
    } else {
      check("returns value", result.success && result.value.length > 0);
    }
  }
}

async function testKnowledgeHuman() {
  console.log("\n=== KNOWLEDGE — REAL HUMAN INPUTS ===\n");

  const cases = [
    // Typos and casual
    { input: "what is photosynthisis?", desc: "misspelled" },
    { input: "who tf is elon musk", desc: "slang" },
    { input: "whats machine learning", desc: "no apostrophe" },
    { input: "yo explain blockchain to me", desc: "yo + to me" },
    { input: "tell me abt the french revolution", desc: "abt shorthand" },

    // Long natural sentences
    { input: "hey i was wondering what exactly is a black hole and how big are they", desc: "long compound casual" },
    { input: "so i keep hearing about climate change can you explain what it actually is", desc: "conversational lead-in" },
    { input: "my teacher asked about the renaissance but i dont really get it, what is it?", desc: "personal context" },
    { input: "can you tell me something about the amazon rainforest", desc: "something about" },
    { input: "i need to know about world war 2 for my homework", desc: "homework context" },

    // Specific factual
    { input: "how tall is mount everest", desc: "measurable fact" },
    { input: "when was the internet invented", desc: "when question" },
    { input: "where is the great barrier reef", desc: "where question" },
    { input: "what language do they speak in brazil", desc: "factoid" },
    { input: "who invented the telephone", desc: "who invented" },

    // Harder / abstract
    { input: "what is consciousness", desc: "abstract concept" },
    { input: "explain how vaccines work in simple terms", desc: "how + qualifier" },
    { input: "why do we dream", desc: "why question" },
    { input: "what causes earthquakes", desc: "what causes" },
    { input: "define cognitive dissonance", desc: "psychology term" },

    // Should still work despite noise
    { input: "ok so like what even is dark matter??", desc: "filler words" },
    { input: "hmm what about the solar system, tell me about it", desc: "hmm + what about" },
    { input: "lol what is a platypus", desc: "lol prefix" },
  ];

  for (const tc of cases) {
    const result = await knowledgeTool.execute(tc.input);
    const preview = result.success
      ? `[${result.source}] ${result.formatted.substring(0, 80)}...`
      : `FAIL: ${result.error}`;
    console.log(`"${tc.input}" [${tc.desc}]`);
    console.log(`  → ${preview}`);
    check("returns answer", result.success && result.formatted.length > 10);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Tool Tests — Real Human Inputs");
  console.log("=".repeat(60));

  await testMathHuman();
  await testDatetimeHuman();
  await testKnowledgeHuman();

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed}/${passed + failed} passed`);
  if (failed > 0) console.log(`${failed} test(s) failed`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
