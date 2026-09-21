require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { respond } = require("./orchestrator");

const testCases = [
  // Basic intents
  { input: "Hey!", label: "Simple greeting" },
  { input: "Hello there, how are you?", label: "Greeting + personal question" },
  { input: "What can you do?", label: "Capability query" },
  { input: "Thanks a lot!", label: "Gratitude" },
  { input: "Bye!", label: "Farewell" },
  { input: "I'm so frustrated with this!", label: "Complaint with emotion" },
  { input: "asdfghjkl", label: "Gibberish / confusion" },

  // Math tool
  { input: "What's 50*12?", label: "Math: simple multiply", expectTool: "math", expectContains: "600" },
  { input: "Calculate 256 + 744", label: "Math: addition", expectTool: "math", expectContains: "1000" },
  { input: "How much is 100/4?", label: "Math: division", expectTool: "math", expectContains: "25" },
  { input: "What's 2^10?", label: "Math: exponent", expectTool: "math", expectContains: "1024" },
  { input: "What is 15% of 200?", label: "Math: percentage", expectTool: "math" },
  { input: "sqrt(144)", label: "Math: square root", expectTool: "math", expectContains: "12" },

  // Datetime tool
  { input: "What time is it?", label: "Datetime: time", expectTool: "datetime" },
  { input: "What day is it?", label: "Datetime: day", expectTool: "datetime" },
  { input: "What's the date?", label: "Datetime: date", expectTool: "datetime" },

  // Multi-intent with tools
  { input: "Hey! What's 50*12? Also what can you do?", label: "Multi: greeting + math + capability", expectTool: "math", expectContains: "600" },
  { input: "What's 10+5 and what time is it?", label: "Multi: math + datetime", expectTool: "math", expectContains: "15" },
];

async function runTests() {
  console.log("=".repeat(60));
  console.log("  Gen2 Test Suite — Phases 1-4 + Tools");
  console.log("=".repeat(60));
  console.log();

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`--- ${tc.label} ---`);
    console.log(`Input: "${tc.input}"`);
    try {
      const result = await respond(tc.input);
      console.log(`Output: "${result.response}"`);
      console.log(`Intents: ${result.meta.intents.map((i) => `${i.type}(${(i.confidence * 100).toFixed(0)}%)`).join(", ")}`);
      if (result.meta.toolsUsed.length > 0) {
        console.log(`Tools: ${result.meta.toolResults.map((t) => `${t.type}=${t.formatted}`).join(", ")}`);
      }
      console.log(`Timing: ${result.meta.timing.total}ms`);

      let pass = result.response && result.response.length > 0;

      if (tc.expectTool) {
        if (!result.meta.toolsUsed.includes(tc.expectTool)) {
          console.log(`✗ FAIL — expected tool "${tc.expectTool}" not used`);
          pass = false;
        }
      }

      if (tc.expectContains) {
        if (!result.response.includes(tc.expectContains)) {
          console.log(`✗ FAIL — expected response to contain "${tc.expectContains}"`);
          pass = false;
        }
      }

      if (pass) {
        console.log(`✓ PASS`);
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.log(`✗ FAIL — ${err.message}`);
      failed++;
    }
    console.log();
  }

  console.log("=".repeat(60));
  console.log(`Results: ${passed}/${passed + failed} passed`);
  if (failed > 0) console.log(`${failed} test(s) failed`);
  console.log("=".repeat(60));

  // Variety test
  console.log("\n--- Variety Test ---");
  console.log('Input: "Hey!" x5\n');
  const responses = new Set();
  for (let i = 0; i < 5; i++) {
    const result = await respond("Hey!");
    responses.add(result.response);
    console.log(`  Run ${i + 1}: "${result.response}"`);
  }
  console.log(`\nUnique responses: ${responses.size}/5`);
  console.log("=".repeat(60));
}

runTests().catch((err) => {
  console.error("Test suite error:", err);
  process.exit(1);
});
