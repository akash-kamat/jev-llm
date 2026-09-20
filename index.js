const readline = require("readline");
const { respond } = require("./jev-llm");
const { flattenBank } = require("./response-bank");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("=".repeat(60));
console.log("  Jev LLM — Selection-Based Conversational Agent");
console.log("  Response bank: " + flattenBank() + " pre-authored responses");
console.log("  Two Jev API calls per message (classify + score)");
console.log("=".repeat(60));
console.log('  Type "quit" to exit, "debug" to toggle debug mode\n');

let debugMode = false;

function prompt() {
  rl.question("You: ", async (input) => {
    const trimmed = input.trim();
    if (!trimmed) return prompt();
    if (trimmed.toLowerCase() === "quit") {
      console.log("\nBye!");
      rl.close();
      return;
    }
    if (trimmed.toLowerCase() === "debug") {
      debugMode = !debugMode;
      console.log(`Debug mode: ${debugMode ? "ON" : "OFF"}\n`);
      return prompt();
    }

    try {
      const result = await respond(trimmed);

      console.log(`\nJev: ${result.response}\n`);

      if (debugMode) {
        console.log("--- Debug Info ---");
        console.log(`Intent: ${result.classification.intent} (confidence: ${result.classification.intentConfidence?.toFixed(3)})`);
        console.log(`Subcategory: ${result.classification.subcategory} (confidence: ${result.classification.subcategoryConfidence?.toFixed(3)})`);
        console.log(`Formality: ${result.classification.formality?.toFixed(2)} / 4.0`);
        console.log(`Emotional intensity: ${result.classification.emotionalIntensity?.toFixed(2)} / 4.0`);
        console.log(`Needs human: ${(result.classification.needsHuman * 100).toFixed(1)}%`);
        console.log(`Escalated: ${result.escalated}`);

        if (result.ranking) {
          console.log(`\nResponse ranking (${result.ranking.length} candidates):`);
          for (const r of result.ranking.slice(0, 5)) {
            console.log(`  ${r.finalScore} | ${r.id} | "${r.text.substring(0, 60)}..."`);
          }
        }

        console.log(`\nTiming: classify=${result.timing.classify}ms, score=${result.timing.score}ms, total=${result.timing.total}ms`);
        console.log("--- End Debug ---\n");
      }
    } catch (err) {
      console.error(`\nError: ${err.message}\n`);
    }

    prompt();
  });
}

prompt();
