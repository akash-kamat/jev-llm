require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

const { TypeSafeClient } = require("@typesafe-ai/sdk");
const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

// Aggressive candidate generation — keep everything, all n-grams
function generateCandidatesMax(userMessage) {
  let msg = userMessage.trim().toLowerCase();
  msg = msg.replace(/[?.!'"]+/g, "");
  msg = msg.replace(/,/g, " ");
  msg = msg.replace(/\s+/g, " ").trim();

  const words = msg.split(" ");
  const candidates = new Set();

  // All single words (skip very short filler only)
  const skipSingle = new Set(["i", "a", "yo", "lol", "ok", "so", "um", "uh", "hmm", "hey", "pls", "btw", "rn", "tf"]);
  for (const w of words) {
    if (w.length >= 2 && !skipSingle.has(w)) candidates.add(w);
  }

  // All bigrams (keep stop words — "theory of", "world war" etc.)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (bigram.length >= 4) candidates.add(bigram);
  }

  // All trigrams
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (trigram.length >= 5) candidates.add(trigram);
  }

  // All 4-grams
  for (let i = 0; i < words.length - 3; i++) {
    const fourgram = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`;
    candidates.add(fourgram);
  }

  // All 5-grams
  for (let i = 0; i < words.length - 4; i++) {
    const fivegram = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]} ${words[i + 4]}`;
    candidates.add(fivegram);
  }

  return [...candidates];
}

async function jevChoiceExtract(userMessage) {
  const candidates = generateCandidatesMax(userMessage);

  if (candidates.length === 0) return { query: userMessage.trim(), candidates: [], candidateCount: 0 };
  if (candidates.length === 1) return { query: candidates[0], candidates, candidateCount: 1 };

  const criteria = {};
  for (const c of candidates) {
    criteria[c] = `"${c}"`;
  }

  try {
    const response = await client.systemOne({
      state: { user_message: userMessage },
      questions: {
        best_query: {
          type: "choice",
          instructions:
            "The user is asking a knowledge question. Which phrase is the BEST Wikipedia search query to answer it? Pick the most specific, complete topic name — not a sentence fragment, not filler words.",
          criteria,
        },
      },
    });

    return {
      query: response.answers.best_query.choice,
      confidence: response.answers.best_query.confidence,
      candidates,
      candidateCount: candidates.length,
    };
  } catch (err) {
    return { query: `ERR: ${err.message.substring(0, 50)}`, candidates, candidateCount: candidates.length, error: true };
  }
}

// Regex (same as before)
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
  console.log("  Jev MAX Candidates vs Regex (35 test cases)");
  console.log("=".repeat(70));

  // Show candidate counts for previous failures
  console.log("\n=== CANDIDATE GENERATION (previously failed) ===\n");
  const debugCases = [
    "What is the theory of relativity?",
    "i need to know about world war 2 for my homework",
    "so i keep hearing about climate change can you explain what it actually is",
    "hey i was wondering what exactly is a black hole and how big are they",
  ];
  for (const s of debugCases) {
    const cands = generateCandidatesMax(s);
    console.log(`"${s}"`);
    console.log(`  ${cands.length} candidates: ${JSON.stringify(cands.slice(0, 15))}${cands.length > 15 ? "..." : ""}\n`);
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

  console.log(`Running ${testCases.length} Jev calls with max candidates...\n`);
  const jevStart = Date.now();
  const jevResults = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const result = await jevChoiceExtract(tc.input);
    const pass = !result.error && result.query.toLowerCase().includes(tc.expected.toLowerCase());
    if (pass) jevPass++;
    jevResults.push({ ...tc, got: result.query, pass, candidateCount: result.candidateCount });
    process.stdout.write(`  ${i + 1}/${testCases.length} (${result.candidateCount} candidates)\r`);
  }
  const jevTime = Date.now() - jevStart;

  // Side by side
  console.log(`\n\n=== SIDE-BY-SIDE ===\n`);
  console.log(
    "#".padEnd(4) +
    "Input".padEnd(48) +
    "Expected".padEnd(22) +
    "Regex".padEnd(26) +
    "Jev (n)".padEnd(28)
  );
  console.log("-".repeat(128));

  for (let i = 0; i < testCases.length; i++) {
    const r = regexResults[i];
    const j = jevResults[i];
    console.log(
      `${String(i + 1).padEnd(4)}${r.input.substring(0, 46).padEnd(48)}${r.expected.substring(0, 20).padEnd(22)}${(r.pass ? "✓" : "✗") + " " + r.got.substring(0, 23).padEnd(25)}${(j.pass ? "✓" : "✗") + " " + j.got.substring(0, 20)} (${j.candidateCount})`
    );
  }

  // Failures
  const jevFails = jevResults.filter((r) => !r.pass);
  if (jevFails.length > 0) {
    console.log(`\n=== JEV FAILURES (${jevFails.length}) ===`);
    for (const f of jevFails) {
      console.log(`  "${f.input}" → "${f.got}" (expected "${f.expected}") [${f.candidateCount} candidates]`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  SUMMARY");
  console.log("=".repeat(70));
  console.log(`  Regex:          ${regexPass}/${testCases.length} (${Math.round((regexPass / testCases.length) * 100)}%) | ${regexTime}ms`);
  console.log(`  Jev Max Cands:  ${jevPass}/${testCases.length} (${Math.round((jevPass / testCases.length) * 100)}%) | ${jevTime}ms (${Math.round(jevTime / testCases.length)}ms/call)`);
  const avgCands = Math.round(jevResults.reduce((s, r) => s + r.candidateCount, 0) / jevResults.length);
  console.log(`  Avg candidates: ${avgCands} per query`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
