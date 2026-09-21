const nlp = require("compromise");

// === Current regex extraction (copied from knowledge.js) ===
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

// === Compromise-based extraction ===
function compromiseExtract(userMessage) {
  const doc = nlp(userMessage);

  // Try topics first (named entities, places, organizations)
  let topics = doc.topics().out("array");
  if (topics.length > 0) {
    return topics.join(" ");
  }

  // Try nouns / noun phrases
  let nouns = doc.nouns().out("array");
  if (nouns.length > 0) {
    // Filter out pronouns and filler
    const filtered = nouns.filter(
      (n) => !/^(i|me|you|it|this|that|they|them|he|she|we|my|your|something|anything|thing)$/i.test(n.trim())
    );
    if (filtered.length > 0) return filtered.join(" ");
  }

  // Fallback: just strip question words and return
  let q = userMessage.trim();
  q = q.replace(/^(what is|what's|who is|who was|how does|how do|why is|why do|where is|when was|explain|define|tell me about)\s+/i, "");
  q = q.replace(/[?.!]+$/g, "");
  return q.trim();
}

// === Hybrid: compromise first, regex fallback ===
function hybridExtract(userMessage) {
  const doc = nlp(userMessage);

  // Topics = named entities (people, places, orgs)
  let topics = doc.topics().out("array");
  if (topics.length > 0) {
    const meaningful = topics.filter((t) => t.length >= 3);
    if (meaningful.length > 0) return meaningful.join(" ");
  }

  // Noun phrases — more aggressive
  let nouns = doc.match("#Noun+").out("array");
  const filtered = nouns.filter(
    (n) =>
      n.length >= 3 &&
      !/^(i|me|you|it|this|that|they|them|he|she|we|my|your|something|anything|thing|way|lot|time|stuff|question|answer|teacher|homework|class|school|terms|people)$/i.test(n.trim())
  );
  if (filtered.length > 0) {
    // Pick the longest noun phrase (most likely the topic)
    filtered.sort((a, b) => b.length - a.length);
    return filtered[0];
  }

  // Fallback to regex
  return regexExtract(userMessage);
}

// === Test cases ===
const testCases = [
  // Basic
  { input: "What is photosynthesis?", expected: "photosynthesis" },
  { input: "Who is Albert Einstein?", expected: "Albert Einstein" },
  { input: "What is JavaScript?", expected: "JavaScript" },
  { input: "Define democracy", expected: "democracy" },
  { input: "What is quantum computing?", expected: "quantum computing" },
  { input: "What is the theory of relativity?", expected: "theory of relativity" },

  // Typos and slang
  { input: "what is photosynthisis?", expected: "photosynthesis" }, // misspelled
  { input: "who tf is elon musk", expected: "elon musk" },
  { input: "whats machine learning", expected: "machine learning" },
  { input: "yo explain blockchain to me", expected: "blockchain" },
  { input: "tell me abt the french revolution", expected: "french revolution" },
  { input: "lol what is a platypus", expected: "platypus" },

  // Long conversational
  { input: "hey i was wondering what exactly is a black hole and how big are they", expected: "black hole" },
  { input: "so i keep hearing about climate change can you explain what it actually is", expected: "climate change" },
  { input: "my teacher asked about the renaissance but i dont really get it, what is it?", expected: "renaissance" },
  { input: "can you tell me something about the amazon rainforest", expected: "amazon rainforest" },
  { input: "i need to know about world war 2 for my homework", expected: "world war 2" },

  // Specific factual
  { input: "how tall is mount everest", expected: "mount everest" },
  { input: "when was the internet invented", expected: "internet" },
  { input: "where is the great barrier reef", expected: "great barrier reef" },
  { input: "what language do they speak in brazil", expected: "brazil" },
  { input: "who invented the telephone", expected: "telephone" },

  // Abstract / complex
  { input: "what is consciousness", expected: "consciousness" },
  { input: "explain how vaccines work in simple terms", expected: "vaccines" },
  { input: "why do we dream", expected: "dream" },
  { input: "what causes earthquakes", expected: "earthquakes" },
  { input: "define cognitive dissonance", expected: "cognitive dissonance" },

  // Filler-heavy
  { input: "ok so like what even is dark matter??", expected: "dark matter" },
  { input: "hmm what about the solar system, tell me about it", expected: "solar system" },

  // More edge cases
  { input: "What are black holes?", expected: "black holes" },
  { input: "Explain quantum entanglement in simple terms", expected: "quantum entanglement" },
  { input: "Who was Nikola Tesla?", expected: "Nikola Tesla" },
  { input: "How does WiFi work?", expected: "WiFi" },
  { input: "Tell me about the Roman Empire", expected: "Roman Empire" },
  { input: "What is DNA and how does it work?", expected: "DNA" },
  { input: "25% of 80", expected: "25% of 80" }, // not a knowledge query — should pass through
];

function score(extractFn, name) {
  let good = 0;
  let bad = 0;
  const failures = [];

  for (const tc of testCases) {
    const result = extractFn(tc.input);
    const pass = result.toLowerCase().includes(tc.expected.toLowerCase());
    if (pass) {
      good++;
    } else {
      bad++;
      failures.push({
        input: tc.input,
        expected: tc.expected,
        got: result,
      });
    }
  }

  console.log(`\n=== ${name} ===`);
  console.log(`Score: ${good}/${testCases.length} (${Math.round((good / testCases.length) * 100)}%)`);
  if (failures.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) {
      console.log(`  "${f.input}"`);
      console.log(`    expected: "${f.expected}" | got: "${f.got}"`);
    }
  }
  return { good, bad, failures };
}

// Run all three
console.log("=".repeat(60));
console.log("  Regex vs Compromise vs Hybrid — Query Extraction");
console.log("=".repeat(60));

const regexResult = score(regexExtract, "REGEX (current)");
const compResult = score(compromiseExtract, "COMPROMISE (pure)");
const hybridResult = score(hybridExtract, "HYBRID (compromise + regex fallback)");

// Timing test
console.log("\n=== TIMING ===");
const iterations = 1000;
const sample = "so i keep hearing about climate change can you explain what it actually is";

let start = Date.now();
for (let i = 0; i < iterations; i++) regexExtract(sample);
const regexTime = Date.now() - start;

start = Date.now();
for (let i = 0; i < iterations; i++) compromiseExtract(sample);
const compTime = Date.now() - start;

start = Date.now();
for (let i = 0; i < iterations; i++) hybridExtract(sample);
const hybridTime = Date.now() - start;

console.log(`Regex:      ${iterations} iterations in ${regexTime}ms (${(regexTime / iterations).toFixed(2)}ms/call)`);
console.log(`Compromise: ${iterations} iterations in ${compTime}ms (${(compTime / iterations).toFixed(2)}ms/call)`);
console.log(`Hybrid:     ${iterations} iterations in ${hybridTime}ms (${(hybridTime / iterations).toFixed(2)}ms/call)`);

// Detail comparison: show every extraction side by side
console.log("\n=== SIDE-BY-SIDE DETAIL ===\n");
console.log("Input".padEnd(70) + "Regex".padEnd(30) + "Compromise".padEnd(30) + "Hybrid");
console.log("-".repeat(160));
for (const tc of testCases) {
  const r = regexExtract(tc.input);
  const c = compromiseExtract(tc.input);
  const h = hybridExtract(tc.input);
  const rMark = r.toLowerCase().includes(tc.expected.toLowerCase()) ? "✓" : "✗";
  const cMark = c.toLowerCase().includes(tc.expected.toLowerCase()) ? "✓" : "✗";
  const hMark = h.toLowerCase().includes(tc.expected.toLowerCase()) ? "✓" : "✗";
  console.log(
    `${tc.input.substring(0, 68).padEnd(70)}${(rMark + " " + r.substring(0, 26)).padEnd(30)}${(cMark + " " + c.substring(0, 26)).padEnd(30)}${hMark + " " + h.substring(0, 26)}`
  );
}
