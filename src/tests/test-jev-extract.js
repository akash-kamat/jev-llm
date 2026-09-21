require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

const { TypeSafeClient } = require("@typesafe-ai/sdk");
const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

// Step 1: Generate candidate phrases from the message using simple n-grams
function generateCandidates(userMessage) {
  // Clean up
  let msg = userMessage.toLowerCase().trim();
  msg = msg.replace(/[?.!,'"]+/g, " ");
  msg = msg.replace(/\s+/g, " ").trim();

  // Remove stop words
  const stopWords = new Set([
    "i", "me", "my", "you", "your", "we", "they", "them", "he", "she", "it",
    "is", "are", "was", "were", "am", "be", "been", "being",
    "do", "does", "did", "will", "would", "could", "should", "can", "may", "might",
    "have", "has", "had", "having",
    "a", "an", "the", "this", "that", "these", "those",
    "what", "who", "where", "when", "why", "how", "which",
    "to", "of", "in", "for", "on", "at", "by", "with", "from", "about",
    "not", "no", "nor", "but", "or", "and", "so", "if", "then",
    "yo", "hey", "lol", "hmm", "ok", "okay", "well", "like", "just",
    "pls", "please", "btw", "rn", "tf", "idk", "yk",
    "tell", "explain", "define", "know", "get", "asked", "hearing",
    "actually", "exactly", "really", "even", "something", "some",
    "work", "works", "simple", "terms", "detail",
    "also", "too", "very", "much", "many", "more",
    "there", "here", "its", "s", "t", "don", "dont",
    "keep", "need", "want", "wonder", "wondering",
    "teacher", "homework", "school", "class",
  ]);

  const words = msg.split(" ").filter((w) => w.length >= 2 && !stopWords.has(w));

  const candidates = new Set();

  // Single words
  for (const w of words) candidates.add(w);

  // Bigrams
  for (let i = 0; i < words.length - 1; i++) {
    candidates.add(`${words[i]} ${words[i + 1]}`);
  }

  // Trigrams
  for (let i = 0; i < words.length - 2; i++) {
    candidates.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }

  // Cap at 8 to keep Jev choice manageable
  const arr = [...candidates];
  if (arr.length > 8) {
    // Prefer longer phrases
    arr.sort((a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length);
    return arr.slice(0, 8);
  }
  return arr;
}

// Step 2: Ask Jev to pick the best search query from candidates
async function jevChoiceExtract(userMessage) {
  const candidates = generateCandidates(userMessage);

  if (candidates.length === 0) return { query: userMessage.trim(), candidates: [] };
  if (candidates.length === 1) return { query: candidates[0], candidates };

  const criteria = {};
  for (const c of candidates) {
    criteria[c] = `Search Wikipedia for "${c}"`;
  }

  const response = await client.systemOne({
    state: { user_message: userMessage },
    questions: {
      best_query: {
        type: "choice",
        instructions:
          "The user is asking a knowledge question. Which of these phrases is the BEST Wikipedia search query to answer their question? Pick the most specific and complete topic name.",
        criteria,
      },
    },
  });

  return {
    query: response.answers.best_query.choice,
    confidence: response.answers.best_query.confidence,
    candidates,
  };
}

// === Regex extraction (current) ===
function regexExtract(userMessage) {
  let q = userMessage.trim();
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like|pls|please|btw)\b[,.]?\s*/gi, "");
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like)\b[,.]?\s*/gi, "");
  const aboutTopicMatch = q.match(/\babout\s+(the\s+)?(.+?)\s+(can|could|would|do|but|and|what|who|tell|explain|,)/i);
  if (aboutTopicMatch && aboutTopicMatch[2].length >= 3) return aboutTopicMatch[2].trim().replace(/[?.!]+$/g, "");
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
  console.log("  Jev Choice Extraction vs Regex (35 test cases)");
  console.log("=".repeat(70));

  // Show candidate generation for a few examples first
  console.log("\n=== CANDIDATE GENERATION SAMPLES ===\n");
  const samples = [
    "so i keep hearing about climate change can you explain what it actually is",
    "who tf is elon musk",
    "What is quantum computing?",
    "hey i was wondering what exactly is a black hole and how big are they",
    "what language do they speak in brazil",
  ];
  for (const s of samples) {
    console.log(`"${s}"`);
    console.log(`  candidates: ${JSON.stringify(generateCandidates(s))}\n`);
  }

  let regexPass = 0;
  let jevPass = 0;

  const regexStart = Date.now();
  const regexResults = testCases.map((tc) => {
    const got = regexExtract(tc.input);
    const pass = got.toLowerCase().includes(tc.expected.toLowerCase());
    if (pass) regexPass++;
    return { ...tc, got, pass };
  });
  const regexTime = Date.now() - regexStart;

  console.log(`\nRunning ${testCases.length} Jev choice calls...\n`);
  const jevStart = Date.now();
  const jevResults = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const { query, confidence, candidates } = await jevChoiceExtract(tc.input);
      const pass = query.toLowerCase().includes(tc.expected.toLowerCase());
      if (pass) jevPass++;
      jevResults.push({ ...tc, got: query, confidence, candidates, pass });
    } catch (err) {
      jevResults.push({ ...tc, got: `ERR: ${err.message.substring(0, 30)}`, pass: false });
    }
    process.stdout.write(`  ${i + 1}/${testCases.length}\r`);
  }
  const jevTime = Date.now() - jevStart;

  // Side by side
  console.log(`\n=== SIDE-BY-SIDE ===\n`);
  console.log(
    "Input".padEnd(50) +
    "Expected".padEnd(25) +
    "Regex".padEnd(28) +
    "Jev Choice"
  );
  console.log("-".repeat(140));

  for (let i = 0; i < testCases.length; i++) {
    const r = regexResults[i];
    const j = jevResults[i];
    console.log(
      `${r.input.substring(0, 48).padEnd(50)}${r.expected.padEnd(25)}${(r.pass ? "✓" : "✗") + " " + r.got.substring(0, 25).padEnd(27)}${(j.pass ? "✓" : "✗") + " " + j.got.substring(0, 25)}`
    );
  }

  // Failures
  const jevFails = jevResults.filter((r) => !r.pass);
  if (jevFails.length > 0) {
    console.log(`\n=== JEV CHOICE FAILURES (${jevFails.length}) ===`);
    for (const f of jevFails) {
      console.log(`  "${f.input}"`);
      console.log(`    expected: "${f.expected}" | got: "${f.got}"`);
      console.log(`    candidates were: ${JSON.stringify(f.candidates || [])}`);
    }
  }

  const regexFails = regexResults.filter((r) => !r.pass);
  if (regexFails.length > 0) {
    console.log(`\n=== REGEX FAILURES (${regexFails.length}) ===`);
    for (const f of regexFails) console.log(`  "${f.input}" → "${f.got}" (expected "${f.expected}")`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log(`  Regex:      ${regexPass}/${testCases.length} correct | ${regexTime}ms total | ~${(regexTime / testCases.length).toFixed(2)}ms/call`);
  console.log(`  Jev Choice: ${jevPass}/${testCases.length} correct | ${jevTime}ms total | ~${Math.round(jevTime / testCases.length)}ms/call`);
  console.log(`  Speed diff: Regex is ${Math.round(jevTime / Math.max(regexTime, 1))}x faster`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
