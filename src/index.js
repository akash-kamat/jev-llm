if (!process.env.TYPESAFE_API_KEY) {
  require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
}
const readline = require("readline");
const { respond } = require("./orchestrator");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("=".repeat(60));
console.log("  Jev LLM — Compositional Text Generation");
console.log("  Phrase-level assembly with multi-intent support");
console.log("  2 Jev API calls per message (classify + select)");
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
        console.log(`Intents: ${result.meta.intents.map((i) => `${i.type} (${(i.confidence * 100).toFixed(0)}%)`).join(", ")}`);
        console.log(`Primary: ${result.meta.primaryIntent}`);
        console.log(`Formality: ${result.meta.formality?.toFixed(2)} / 4.0`);
        console.log(`Emotional: ${result.meta.emotionalIntensity?.toFixed(2)} / 4.0`);
        console.log(`Complexity: ${result.meta.complexity?.toFixed(2)} / 4.0`);
        console.log(`Segments: ${result.meta.segments.join(" → ")}`);
        console.log(`\nPhrases used:`);
        for (const p of result.meta.phrasesUsed) {
          console.log(`  ${p.role}: "${p.text}" (${p.id})`);
        }
        if (result.meta.toolsUsed.length > 0) {
          console.log(`\nTools: ${result.meta.toolsUsed.join(", ")}`);
          for (const t of result.meta.toolResults) {
            console.log(`  ${t.type}: ${t.success ? t.formatted : "failed"}`);
          }
        }
        console.log(`\nAPI calls: ${result.meta.apiCalls}`);
        console.log(`Timing: classify=${result.meta.timing.classify}ms, tools=${result.meta.timing.tools}ms, select=${result.meta.timing.select}ms, total=${result.meta.timing.total}ms`);
        console.log("--- End Debug ---\n");
      }
    } catch (err) {
      console.error(`\nError: ${err.message}\n`);
      if (debugMode) console.error(err.stack);
    }

    prompt();
  });
}

prompt();
