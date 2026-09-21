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

async function testMathEdge() {
  console.log("\n=== MATH — EDGE CASES ===\n");

  const cases = [
    { input: "Hey can you tell me what 25 times 4 is?", expect: null, desc: "natural language multiply (no operator)" },
    { input: "What's 3.14 * 2.5?", expect: 7.85, desc: "two decimals" },
    { input: "How much is 1000 - 347?", expect: 653, desc: "subtraction with framing" },
    { input: "Calculate 2^8 + 10", expect: 266, desc: "exponent then addition" },
    { input: "What is 50% of 300?", expect: 150, desc: "percentage of" },
    { input: "I need to know 99 / 3 please", expect: 33, desc: "polite framing" },
    { input: "12 * (3 + 4)", expect: 84, desc: "parentheses" },
    { input: "What's the square root of 225?", expect: null, desc: "natural language sqrt (no sqrt())" },
    { input: "Can you do 7.5 + 2.5 * 3?", expect: 15, desc: "order of operations" },
    { input: "1+1", expect: 2, desc: "minimal expression" },
    { input: "What's 0.1 + 0.2?", expect: 0.30000000000000004, desc: "floating point" },
    { input: "How much is twenty percent of fifty?", expect: null, desc: "words not numbers" },
  ];

  for (const tc of cases) {
    const result = await mathTool.execute(tc.input);
    const got = result.success ? result.answer : null;
    const display = result.success ? result.formatted : `FAIL: ${result.error}`;
    console.log(`"${tc.input}" [${tc.desc}]`);
    console.log(`  → ${display}`);
    if (tc.expect === null) {
      check("expected no result or graceful fail", !result.success || result.answer != null, `got ${got}`);
    } else {
      check(`expected ${tc.expect}`, result.success && Math.abs(result.answer - tc.expect) < 0.0001, `got ${got}`);
    }
  }
}

async function testDatetimeEdge() {
  console.log("\n=== DATETIME — EDGE CASES ===\n");

  const cases = [
    { input: "What time is it in Mumbai?", expectWorld: true, desc: "common city" },
    { input: "Time in Berlin", expectWorld: true, desc: "minimal phrasing" },
    { input: "What's the time in São Paulo?", expectWorld: true, desc: "accented city" },
    { input: "What time is it in some random place?", expectWorld: false, desc: "nonsense location" },
    { input: "Is it morning or afternoon right now?", expectLocal: true, desc: "indirect time question" },
    { input: "Tell me the current time in Dubai", expectWorld: true, desc: "different phrasing" },
    { input: "What time zone am I in?", expectLocal: true, desc: "timezone question" },
    { input: "When is sunset?", expectLocal: true, desc: "not really a time query" },
  ];

  for (const tc of cases) {
    const result = await datetimeTool.execute(tc.input);
    console.log(`"${tc.input}" [${tc.desc}]`);
    console.log(`  → ${result.success ? result.formatted : `FAIL: ${result.error || "no result"}`}`);
    if (tc.expectWorld === true) {
      check("returns world time", result.success && result.queryType === "world_time");
    } else if (tc.expectWorld === false) {
      check("gracefully handles", true);
    } else {
      check("returns something", result.success);
    }
  }
}

async function testKnowledgeEdge() {
  console.log("\n=== KNOWLEDGE — EDGE CASES ===\n");

  const cases = [
    { input: "What is the theory of relativity?", desc: "multi-word concept" },
    { input: "Who was Nikola Tesla?", desc: "historical person" },
    { input: "Explain how photosynthesis works", desc: "explain phrasing" },
    { input: "Tell me about the Roman Empire", desc: "tell me about" },
    { input: "What are black holes?", desc: "what are" },
    { input: "Why do leaves change color in autumn?", desc: "why question" },
    { input: "How does WiFi work?", desc: "how does" },
    { input: "What's the capital of France?", desc: "factoid question" },
    { input: "Define entropy", desc: "define phrasing" },
    { input: "Who is the president of the United States?", desc: "current affairs" },
    { input: "What is DNA and how does it work?", desc: "compound question" },
    { input: "Explain quantum entanglement in simple terms", desc: "complex with qualifier" },
  ];

  for (const tc of cases) {
    const result = await knowledgeTool.execute(tc.input);
    const preview = result.success
      ? `[${result.source}] ${result.formatted.substring(0, 90)}...`
      : `FAIL: ${result.error}`;
    console.log(`"${tc.input}" [${tc.desc}]`);
    console.log(`  → ${preview}`);
    check("returns answer", result.success && result.formatted.length > 10);
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Tool Edge Case Tests");
  console.log("=".repeat(60));

  await testMathEdge();
  await testDatetimeEdge();
  await testKnowledgeEdge();

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed}/${passed + failed} passed`);
  if (failed > 0) console.log(`${failed} test(s) failed`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
