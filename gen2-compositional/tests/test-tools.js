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

async function testMath() {
  console.log("\n=== MATH TOOL ===\n");

  const cases = [
    { input: "What's 50*12?", expect: 600 },
    { input: "Calculate 256 + 744", expect: 1000 },
    { input: "How much is 100/4?", expect: 25 },
    { input: "What's 2^10?", expect: 1024 },
    { input: "What is 15% of 200?", expect: 30 },
    { input: "sqrt(144)", expect: 12 },
    { input: "What's 3.5 * 2?", expect: 7 },
    { input: "9 + 10", expect: 19 },
  ];

  for (const tc of cases) {
    const result = await mathTool.execute(tc.input);
    console.log(`"${tc.input}" → ${result.formatted || result.error}`);
    check("correct answer", result.success && result.answer === tc.expect, `got ${result.answer}`);
  }
}

async function testDatetime() {
  console.log("\n=== DATETIME TOOL ===\n");

  // Local time
  let result = await datetimeTool.execute("What time is it?");
  console.log(`"What time is it?" → ${result.formatted}`);
  check("local time returns value", result.success && result.value.length > 0);

  result = await datetimeTool.execute("What day is it?");
  console.log(`"What day is it?" → ${result.formatted}`);
  check("day returns weekday", result.success && /monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(result.value));

  result = await datetimeTool.execute("What's the date?");
  console.log(`"What's the date?" → ${result.formatted}`);
  check("date returns full date", result.success && /\d{4}/.test(result.value));

  // World time
  result = await datetimeTool.execute("What time is it in Tokyo?");
  console.log(`"What time is it in Tokyo?" → ${result.formatted}`);
  check("world time: Tokyo", result.success && result.details && result.details.city === "Tokyo");

  result = await datetimeTool.execute("What time is it in London?");
  console.log(`"What time is it in London?" → ${result.formatted}`);
  check("world time: London", result.success && result.details);

  result = await datetimeTool.execute("What time is it in New York?");
  console.log(`"What time is it in New York?" → ${result.formatted}`);
  check("world time: New York", result.success && result.details);
}

async function testKnowledge() {
  console.log("\n=== KNOWLEDGE TOOL ===\n");

  const cases = [
    { input: "What is photosynthesis?", expectSource: "wikipedia" },
    { input: "Who is Albert Einstein?", expectSource: "wikipedia" },
    { input: "What is JavaScript?", expectSource: "wikipedia" },
    { input: "Why is the sky blue?", expectSource: "wikipedia" },
    { input: "What is quantum computing?", expectSource: "wikipedia" },
    { input: "Define democracy", expectSource: null },
  ];

  for (const tc of cases) {
    const result = await knowledgeTool.execute(tc.input);
    const preview = result.success
      ? result.formatted.substring(0, 80) + (result.formatted.length > 80 ? "..." : "")
      : result.error;
    console.log(`"${tc.input}"`);
    console.log(`  → [${result.source || "none"}] ${preview}`);
    check("returns answer", result.success && result.formatted.length > 10);
    if (tc.expectSource) {
      check(`source is ${tc.expectSource}`, result.source === tc.expectSource, `got ${result.source}`);
    }
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  Gen2 Tool Tests");
  console.log("=".repeat(60));

  await testMath();
  await testDatetime();
  await testKnowledge();

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed}/${passed + failed} passed`);
  if (failed > 0) console.log(`${failed} test(s) failed`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
