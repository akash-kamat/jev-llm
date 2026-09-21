require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

const { TypeSafeClient } = require("@typesafe-ai/sdk");
const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

function preClean(msg) {
  let q = msg.trim();
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like|pls|please|btw|bruh|bro|dude|man|omg|wow)\b[,.]?\s*/gi, "");
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like)\b[,.]?\s*/gi, "");
  q = q.replace(/[?.!]+$/g, "");
  return q.trim();
}

async function jevBoundary(userMessage, doPreClean) {
  const input = doPreClean ? preClean(userMessage) : userMessage.trim().replace(/[?.!]+$/g, "");
  const words = input.split(/\s+/);
  if (words.length <= 2) return words.join(" ");

  const startCriteria = {};
  const endCriteria = {};
  for (let i = 0; i < words.length; i++) {
    const label = `${i}:${words[i]}`;
    startCriteria[label] = `"${words[i]}" (position ${i})`;
    endCriteria[label] = `"${words[i]}" (position ${i})`;
  }

  const state = doPreClean
    ? { user_message: input, task: "Extract the Wikipedia search topic. Return the SHORTEST phrase naming the specific subject." }
    : { user_message: input };

  const startInstr = doPreClean
    ? "Which word STARTS the topic name? Pick where the specific subject begins."
    : "Which word is the FIRST word of the main topic/subject?";
  const endInstr = doPreClean
    ? "Which word ENDS the topic name? The start-to-end span should be a clean Wikipedia search term."
    : "Which word is the LAST word of the main topic/subject?";

  const response = await client.systemOne({
    state,
    questions: {
      topic_start: { type: "choice", instructions: startInstr, criteria: startCriteria },
      topic_end: { type: "choice", instructions: endInstr, criteria: endCriteria },
    },
  });

  const startIdx = parseInt(response.answers.topic_start.choice.split(":")[0]);
  const endIdx = parseInt(response.answers.topic_end.choice.split(":")[0]);
  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  return words.slice(from, to + 1).join(" ");
}

const testCases = [
  // === Basic (10) ===
  { input: "What is photosynthesis?", expected: "photosynthesis" },
  { input: "Who is Albert Einstein?", expected: "Albert Einstein" },
  { input: "What is JavaScript?", expected: "JavaScript" },
  { input: "Define democracy", expected: "democracy" },
  { input: "What is quantum computing?", expected: "quantum computing" },
  { input: "What is the theory of relativity?", expected: "theory of relativity" },
  { input: "What are black holes?", expected: "black holes" },
  { input: "Who was Nikola Tesla?", expected: "Nikola Tesla" },
  { input: "How does WiFi work?", expected: "WiFi" },
  { input: "Tell me about the Roman Empire", expected: "Roman Empire" },

  // === Typos and slang (10) ===
  { input: "what is photosynthisis?", expected: "photosynthesis" },
  { input: "who tf is elon musk", expected: "elon musk" },
  { input: "whats machine learning", expected: "machine learning" },
  { input: "yo explain blockchain to me", expected: "blockchain" },
  { input: "tell me abt the french revolution", expected: "french revolution" },
  { input: "lol what is a platypus", expected: "platypus" },
  { input: "bruh what is an electron", expected: "electron" },
  { input: "omg who is taylor swift", expected: "taylor swift" },
  { input: "dude whats the bermuda triangle", expected: "bermuda triangle" },
  { input: "ok so like explain gravity", expected: "gravity" },

  // === Long conversational (10) ===
  { input: "hey i was wondering what exactly is a black hole and how big are they", expected: "black hole" },
  { input: "so i keep hearing about climate change can you explain what it actually is", expected: "climate change" },
  { input: "my teacher asked about the renaissance but i dont really get it, what is it?", expected: "renaissance" },
  { input: "can you tell me something about the amazon rainforest", expected: "amazon rainforest" },
  { input: "i need to know about world war 2 for my homework", expected: "world war 2" },
  { input: "so my friend mentioned something about stoicism and i want to understand it better", expected: "stoicism" },
  { input: "i saw this documentary about the mariana trench and now im curious what is it exactly", expected: "mariana trench" },
  { input: "okay so basically i need to write an essay about the industrial revolution can you help", expected: "industrial revolution" },
  { input: "wait so what even is cryptocurrency i keep seeing it everywhere", expected: "cryptocurrency" },
  { input: "hey quick question, whats the difference between alligators and crocodiles", expected: "alligators" },

  // === Factual questions (10) ===
  { input: "how tall is mount everest", expected: "mount everest" },
  { input: "when was the internet invented", expected: "internet" },
  { input: "where is the great barrier reef", expected: "great barrier reef" },
  { input: "what language do they speak in brazil", expected: "brazil" },
  { input: "who invented the telephone", expected: "telephone" },
  { input: "what is the largest ocean on earth", expected: "ocean" },
  { input: "how far is the moon from earth", expected: "moon" },
  { input: "what is the speed of light", expected: "speed of light" },
  { input: "who painted the mona lisa", expected: "mona lisa" },
  { input: "what is the population of japan", expected: "japan" },

  // === Abstract / complex (10) ===
  { input: "what is consciousness", expected: "consciousness" },
  { input: "explain how vaccines work in simple terms", expected: "vaccines" },
  { input: "why do we dream", expected: "dream" },
  { input: "what causes earthquakes", expected: "earthquakes" },
  { input: "define cognitive dissonance", expected: "cognitive dissonance" },
  { input: "what is the meaning of existentialism", expected: "existentialism" },
  { input: "explain natural selection", expected: "natural selection" },
  { input: "what is supply and demand", expected: "supply and demand" },
  { input: "how does memory work in the brain", expected: "memory" },
  { input: "what is the greenhouse effect", expected: "greenhouse effect" },

  // === Messy / filler-heavy (10) ===
  { input: "ok so like what even is dark matter??", expected: "dark matter" },
  { input: "hmm what about the solar system, tell me about it", expected: "solar system" },
  { input: "What is DNA and how does it work?", expected: "DNA" },
  { input: "Explain quantum entanglement in simple terms", expected: "quantum entanglement" },
  { input: "well i guess i should probably learn about the cold war or whatever", expected: "cold war" },
  { input: "yo so basically what is artificial intelligence and why is everyone talking about it", expected: "artificial intelligence" },
  { input: "umm can you like tell me what mitochondria is or something", expected: "mitochondria" },
  { input: "hey so i was reading and i came across this word antibiotics what does it mean", expected: "antibiotics" },
  { input: "pls explain what the ozone layer is im confused", expected: "ozone layer" },
  { input: "okay okay okay what is string theory i need to know right now", expected: "string theory" },
];

async function runMethod(name, doPreClean) {
  let pass = 0;
  const results = [];
  const start = Date.now();
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const got = await jevBoundary(tc.input, doPreClean);
      const ok = got.toLowerCase().includes(tc.expected.toLowerCase());
      if (ok) pass++;
      results.push({ ...tc, got, pass: ok });
    } catch (err) {
      results.push({ ...tc, got: `ERR: ${err.message.substring(0, 40)}`, pass: false });
    }
    process.stdout.write(`  ${name}: ${i + 1}/${testCases.length}\r`);
  }
  const time = Date.now() - start;
  console.log(`  ${name}: ${pass}/${testCases.length} (${Math.round((pass / testCases.length) * 100)}%) | ${time}ms (${Math.round(time / testCases.length)}ms/call)          `);
  return { name, pass, results, time };
}

async function main() {
  console.log("=".repeat(70));
  console.log(`  V1 vs V3 — ${testCases.length} test cases`);
  console.log("=".repeat(70));
  console.log();

  const v1 = await runMethod("V1 Original", false);
  const v3 = await runMethod("V3 PreClean", true);

  // Side by side — show all
  console.log(`\n${"#".padEnd(4)}${"Input".padEnd(52)}${"Expected".padEnd(22)}${"V1".padEnd(26)}${"V3"}`);
  console.log("-".repeat(130));

  for (let i = 0; i < testCases.length; i++) {
    const r1 = v1.results[i];
    const r3 = v3.results[i];
    const highlight = r1.pass !== r3.pass ? " <<<" : "";
    console.log(
      `${String(i + 1).padStart(2). padEnd(4)}${r1.input.substring(0, 50).padEnd(52)}${r1.expected.substring(0, 20).padEnd(22)}${(r1.pass ? "✓" : "✗") + " " + r1.got.substring(0, 23).padEnd(25)}${(r3.pass ? "✓" : "✗") + " " + r3.got.substring(0, 23)}${highlight}`
    );
  }

  // Failures
  const v1Fails = v1.results.filter((r) => !r.pass);
  const v3Fails = v3.results.filter((r) => !r.pass);

  if (v1Fails.length > 0) {
    console.log(`\n=== V1 FAILURES (${v1Fails.length}) ===`);
    for (const f of v1Fails) console.log(`  "${f.input}" → "${f.got}" (expected "${f.expected}")`);
  }
  if (v3Fails.length > 0) {
    console.log(`\n=== V3 FAILURES (${v3Fails.length}) ===`);
    for (const f of v3Fails) console.log(`  "${f.input}" → "${f.got}" (expected "${f.expected}")`);
  }

  // Where they disagree
  const disagree = [];
  for (let i = 0; i < testCases.length; i++) {
    if (v1.results[i].pass !== v3.results[i].pass) {
      disagree.push({ idx: i, tc: testCases[i], v1: v1.results[i], v3: v3.results[i] });
    }
  }
  if (disagree.length > 0) {
    console.log(`\n=== WHERE THEY DISAGREE (${disagree.length}) ===`);
    for (const d of disagree) {
      const v1Mark = d.v1.pass ? "✓" : "✗";
      const v3Mark = d.v3.pass ? "✓" : "✗";
      console.log(`  #${d.idx + 1} "${d.tc.input}"`);
      console.log(`       V1: ${v1Mark} "${d.v1.got}" | V3: ${v3Mark} "${d.v3.got}" | expected "${d.tc.expected}"`);
    }
  } else {
    console.log("\n  No disagreements — both methods gave identical pass/fail on every case.");
  }

  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log(`  V1 Original: ${v1.pass}/${testCases.length} (${Math.round((v1.pass / testCases.length) * 100)}%) | ${v1.time}ms (${Math.round(v1.time / testCases.length)}ms/call)`);
  console.log(`  V3 PreClean: ${v3.pass}/${testCases.length} (${Math.round((v3.pass / testCases.length) * 100)}%) | ${v3.time}ms (${Math.round(v3.time / testCases.length)}ms/call)`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
