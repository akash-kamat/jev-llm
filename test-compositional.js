/**
 * Test runner for compositional response system
 */

const {
  respondCompositional,
  selectParts,
  orderParts,
  composeResponse,
  responseParts,
} = require("./jev-compositional-example");

async function runDemo() {
  console.log("=".repeat(60));
  console.log("  Jev Compositional Response Demo");
  console.log("  Building responses from", Object.keys(responseParts).length, "categories");
  console.log("=".repeat(60));
  console.log("");

  // Test 1: Casual greeting
  console.log("TEST 1: Casual greeting");
  console.log("-".repeat(60));
  await testMessage("hey how are you", {
    intent: "greeting",
    formality: 1.2,
    emotionalIntensity: 0.5,
    isReturning: false,
  });

  console.log("\n\n");

  // Test 2: Formal greeting
  console.log("TEST 2: Formal greeting");
  console.log("-".repeat(60));
  await testMessage("Hello, I require assistance", {
    intent: "greeting",
    formality: 3.8,
    emotionalIntensity: 0.3,
    isReturning: false,
  });

  console.log("\n\n");

  // Test 3: Returning user
  console.log("TEST 3: Returning user");
  console.log("-".repeat(60));
  await testMessage("hi again", {
    intent: "greeting",
    formality: 1.5,
    emotionalIntensity: 0.6,
    isReturning: true,
  });

  console.log("\n\n");

  // Test 4: Super casual
  console.log("TEST 4: Super casual");
  console.log("-".repeat(60));
  await testMessage("yo", {
    intent: "greeting",
    formality: 0.8,
    emotionalIntensity: 0.4,
    isReturning: false,
  });
}

async function testMessage(userMessage, classification) {
  console.log(`User: "${userMessage}"`);
  console.log(`Classification:`, classification);
  console.log("");

  try {
    const result = await respondCompositional(userMessage, classification);

    console.log(`\n✓ Jev: ${result.response}`);
    console.log("");
    console.log(`Parts used (${result.partsSelected}):`);
    for (const part of result.parts) {
      console.log(`  - ${part.id}: "${part.text}" (order: ${part.orderScore.toFixed(2)}, inclusion: ${part.inclusionScore.toFixed(2)})`);
    }
    console.log("");
    console.log(`Timing: select=${result.timing.select}ms, order=${result.timing.order}ms, total=${result.timing.total}ms`);
    console.log(`Evaluated ${result.candidatesEvaluated} parts, selected ${result.partsSelected}`);
  } catch (error) {
    console.error(`\n✗ Error:`, error.message);
  }
}

// Run it
runDemo().catch((err) => {
  console.error("\n\nFATAL ERROR:", err);
  process.exit(1);
});
