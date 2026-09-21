require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

const { TypeSafeClient } = require("@typesafe-ai/sdk");
const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

// === Current regex extraction (from knowledge.js) ===
function regexExtract(userMessage) {
  let q = userMessage.trim();
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like|pls|please|btw)\b[,.]?\s*/gi, "");
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like)\b[,.]?\s*/gi, "");

  const aboutTopicMatch = q.match(/\babout\s+(the\s+)?(.+?)\s+(can|could|would|do|but|and|what|who|tell|explain|,)/i);
  if (aboutTopicMatch && aboutTopicMatch[2].length >= 3) {
    return aboutTopicMatch[2].trim().replace(/[?.!]+$/g, "");
  }

  q = q.replace(/^.*?(what (?:exactly |actually )?is|what's|whats|what are|who is|who's|whos|who was|who tf is|who invented|who created|who discovered|where is|where are|when was|when did|how tall is|how big is|how old is|how does|how do|how is|why is|why are|why does|why do|what causes|what even is|can you explain (?:what (?:\w+ )?is )?|can you tell me (?:about|something about)|tell me (?:about|abt)|(?:i )?(?:need to |want to )?know about|explain|define)\s+/i, "");

  if (q === userMessage.trim() || q.length > userMessage.length * 0.9) {
    q = userMessage.trim();
    q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like|pls|please|btw)\b[,.]?\s*/gi, "");
    q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like)\b[,.]?\s*/gi, "");
    q = q.replace(/^(tell me about|tell me abt|what about|what is|what's|whats|what are|who is|who's|whos|who was|who are|why is|why are|why does|why do|how does|how do|how is|explain|define)\s+/i, "");
    q = q.replace(/^(what|who|where|when|why|how)\s+/i, "");
  }

  q = q.replace(/\s+and\s+(how|what|who|where|when|why)\s+.*/i, "");
  q = q.replace(/,\s*(but|and|so|because|since|what|who|where|when|tell|can|i ).*$/i, "");
  q = q.replace(/^.*\babout\s+/i, "");
  q = q.replace(/^(the|a|an)\s+/i, "");
  q = q.replace(/[?.!]+$/g, "");
  q = q.replace(/\s+(in simple terms|in detail|exactly|briefly|for me|to me|for my \w+|for school|for homework|for class)$/i, "");
  q = q.replace(/\s+(works?|happens?|occurs?|functions?)$/i, "");
  q = q.replace(/\s+(change|turn|become|go)\s+.+$/i, "");
  q = q.replace(/\s+(rn|tho|though|actually|really|pls|please)$/i, "");
  q = q.replace(/^(how|why|what|where|when)\s+/i, "");
  q = q.replace(/^language\s+(?:do\s+)?they\s+speak\s+in\s+/i, "");
  if (/^invented\s+/i.test(q)) q = q.replace(/^invented\s+(the\s+)?/i, "");
  q = q.replace(/^(tall|big|old|long|heavy|fast|deep|wide)\s+is\s+(the\s+)?/i, "");
  q = q.replace(/\s+(invented|created|discovered|founded|built|made)$/i, "");
  q = q.trim();
  if (!q || q.length < 3 || /^(it|this|that|they|them|he|she|we|me)$/i.test(q)) {
    const aboutMatch = userMessage.match(/\babout\s+(the\s+)?(.+?)(?:\s*[,?.!]|\s+(?:but|and|so|because|can|tell|what|who|where|when|i ))/i);
    if (aboutMatch) return aboutMatch[2].trim();
    return userMessage.replace(/[?.!]+$/g, "").trim();
  }
  return q;
}

// === Jev-based extraction ===
async function jevExtract(userMessage) {
  const response = await client.systemOne({
    state: { user_message: userMessage },
    questions: {
      search_query: {
        type: "text",
        instructions:
          "Extract the core topic or subject the user is asking about. Return ONLY the topic as a short Wikipedia-searchable phrase (1-4 words). Strip all question framing, filler words, slang, and qualifiers. Examples: 'What is photosynthesis?' → 'photosynthesis', 'who tf is elon musk' → 'Elon Musk', 'hey i was wondering what exactly is a black hole' → 'black hole'",
      },
    },
  });
  return (response.answers.search_query.text || "").trim();
}

// === Test cases ===
const testCases = [
  { input: "What is photosynthesis?", expected: "photosynthesis" },
  { input: "Who is Albert Einstein?", expected: "Albert Einstein" },
  { input: "What is JavaScript?", expected: "JavaScript" },
  { input: "Define democracy", expected: "democracy" },
  { input: "What is quantum computing?", expected: "quantum computing" },
  { input: "What is the theory of relativity?", expected: "theory of relativity" },

  { input: "what is photosynthisis?", expected: "photosynthesis" },
  { input: "who tf is elon musk", expected: "elon musk" },
  { input: "whats machine learning", expected: "machine learning" },
  { input: "yo explain blockchain to me", expected: "blockchain" },
  { input: "tell me abt the french revolution", expected: "french revolution" },
  { input: "lol what is a platypus", expected: "platypus" },

  { input: "hey i was wondering what exactly is a black hole and how big are they", expected: "black hole" },
  { input: "so i keep hearing about climate change can you explain what it actually is", expected: "climate change" },
  { input: "my teacher asked about the renaissance but i dont really get it, what is it?", expected: "renaissance" },
  { input: "can you tell me something about the amazon rainforest", expected: "amazon rainforest" },
  { input: "i need to know about world war 2 for my homework", expected: "world war 2" },

  { input: "how tall is mount everest", expected: "mount everest" },
  { input: "when was the internet invented", expected: "internet" },
  { input: "where is the great barrier reef", expected: "great barrier reef" },
  { input: "what language do they speak in brazil", expected: "brazil" },
  { input: "who invented the telephone", expected: "telephone" },

  { input: "what is consciousness", expected: "consciousness" },
  { input: "explain how vaccines work in simple terms", expected: "vaccines" },
  { input: "why do we dream", expected: "dream" },
  { input: "what causes earthquakes", expected: "earthquakes" },
  { input: "define cognitive dissonance", expected: "cognitive dissonance" },

  { input: "ok so like what even is dark matter??", expected: "dark matter" },
  { input: "hmm what about the solar system, tell me about it", expected: "solar system" },

  { input: "What are black holes?", expected: "black holes" },
  { input: "Explain quantum entanglement in simple terms", expected: "quantum entanglement" },
  { input: "Who was Nikola Tesla?", expected: "Nikola Tesla" },
  { input: "How does WiFi work?", expected: "WiFi" },
  { input: "Tell me about the Roman Empire", expected: "Roman Empire" },
  { input: "What is DNA and how does it work?", expected: "DNA" },
];

async function main() {
  console.log("=".repeat(70));
  console.log("  Regex vs Jev — Query Extraction (same 35 test cases)");
  console.log("=".repeat(70));

  const regexResults = [];
  const jevResults = [];
  let regexPass = 0;
  let jevPass = 0;

  // Regex — instant
  const regexStart = Date.now();
  for (const tc of testCases) {
    const result = regexExtract(tc.input);
    const pass = result.toLowerCase().includes(tc.expected.toLowerCase());
    if (pass) regexPass++;
    regexResults.push({ input: tc.input, expected: tc.expected, got: result, pass });
  }
  const regexTime = Date.now() - regexStart;

  // Jev — sequential API calls
  console.log(`\nRunning ${testCases.length} Jev extraction calls...`);
  const jevStart = Date.now();
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const result = await jevExtract(tc.input);
      const pass = result.toLowerCase().includes(tc.expected.toLowerCase());
      if (pass) jevPass++;
      jevResults.push({ input: tc.input, expected: tc.expected, got: result, pass });
      process.stdout.write(`  ${i + 1}/${testCases.length}\r`);
    } catch (err) {
      jevResults.push({ input: tc.input, expected: tc.expected, got: `ERROR: ${err.message}`, pass: false });
    }
  }
  const jevTime = Date.now() - jevStart;

  // Results
  console.log(`\n\n=== SCORES ===`);
  console.log(`Regex: ${regexPass}/${testCases.length} (${Math.round((regexPass / testCases.length) * 100)}%) in ${regexTime}ms`);
  console.log(`Jev:   ${jevPass}/${testCases.length} (${Math.round((jevPass / testCases.length) * 100)}%) in ${jevTime}ms (${Math.round(jevTime / testCases.length)}ms/call avg)`);

  // Side by side
  console.log(`\n=== SIDE-BY-SIDE ===\n`);
  console.log(
    "Input".padEnd(55) +
      "Expected".padEnd(25) +
      "Regex".padEnd(30) +
      "Jev"
  );
  console.log("-".repeat(155));

  for (let i = 0; i < testCases.length; i++) {
    const r = regexResults[i];
    const j = jevResults[i];
    console.log(
      `${r.input.substring(0, 53).padEnd(55)}${r.expected.padEnd(25)}${(r.pass ? "✓" : "✗") + " " + r.got.substring(0, 27).padEnd(28)}${(j.pass ? "✓" : "✗") + " " + j.got.substring(0, 27)}`
    );
  }

  // Show only failures
  const regexFails = regexResults.filter((r) => !r.pass);
  const jevFails = jevResults.filter((r) => !r.pass);

  if (regexFails.length > 0) {
    console.log(`\n=== REGEX FAILURES (${regexFails.length}) ===`);
    for (const f of regexFails) console.log(`  "${f.input}" → "${f.got}" (expected "${f.expected}")`);
  }
  if (jevFails.length > 0) {
    console.log(`\n=== JEV FAILURES (${jevFails.length}) ===`);
    for (const f of jevFails) console.log(`  "${f.input}" → "${f.got}" (expected "${f.expected}")`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log(`  Regex:  ${regexPass}/${testCases.length} correct | ${regexTime}ms total | ~${(regexTime / testCases.length).toFixed(3)}ms/call`);
  console.log(`  Jev:    ${jevPass}/${testCases.length} correct | ${jevTime}ms total | ~${Math.round(jevTime / testCases.length)}ms/call`);
  console.log(`  Speed:  Regex is ${Math.round(jevTime / Math.max(regexTime, 1))}x faster`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
