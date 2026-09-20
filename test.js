require("dotenv").config();
const { respond } = require("./jev-llm");
const { flattenBank } = require("./response-bank");

const testMessages = [
  "hey whats up!",
  "my name is akash kamat, what is your name and how are you?",
  "I'm really frustrated, my order has been wrong three times now",
  "can you help me write a python script?",
  "what is the capital of france?",
  "thanks so much, that was really helpful!",
  "goodbye, have a nice day",
  "asdkjhasd kjhaskd",
  "who are you exactly?",
];

async function runTests() {
  console.log(`Response bank: ${flattenBank()} responses\n`);

  for (const msg of testMessages) {
    console.log("=".repeat(70));
    console.log(`USER: ${msg}`);
    console.log("-".repeat(70));

    const result = await respond(msg);

    console.log(`JEV:  ${result.response}`);
    console.log(`\n  Intent:       ${result.classification.intent} (${(result.classification.intentConfidence * 100).toFixed(1)}% confidence)`);
    console.log(`  Subcategory:  ${result.classification.subcategory} (${((result.classification.subcategoryConfidence ?? 0) * 100).toFixed(1)}% confidence)`);
    console.log(`  Formality:    ${result.classification.formality?.toFixed(2)} / 4.0`);
    console.log(`  Emotion:      ${result.classification.emotionalIntensity?.toFixed(2)} / 4.0`);
    console.log(`  Needs human:  ${(result.classification.needsHuman * 100).toFixed(1)}%`);
    console.log(`  Escalated:    ${result.escalated}`);

    if (result.ranking) {
      console.log(`\n  Top 3 responses (of ${result.ranking.length}):`);
      for (const r of result.ranking.slice(0, 3)) {
        console.log(`    ${r.finalScore} | "${r.text}"`);
      }
    }

    console.log(`\n  Timing: classify=${result.timing.classify}ms  score=${result.timing.score}ms  total=${result.timing.total}ms`);
    console.log();
  }
}

runTests().catch(console.error);
