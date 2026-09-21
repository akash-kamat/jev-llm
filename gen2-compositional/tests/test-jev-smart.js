require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { TypeSafeClient } = require("@typesafe-ai/sdk");
const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

// === Approach 1: Boundary detection ===
// Ask Jev: which word starts the topic, which word ends it?
async function jevBoundaryExtract(userMessage) {
  const words = userMessage.trim().replace(/[?.!]+$/g, "").split(/\s+/);
  if (words.length <= 2) return words.join(" ");

  const startCriteria = {};
  const endCriteria = {};
  for (let i = 0; i < words.length; i++) {
    const label = `${i}:${words[i]}`;
    startCriteria[label] = `Topic starts at word "${words[i]}" (position ${i})`;
    endCriteria[label] = `Topic ends at word "${words[i]}" (position ${i})`;
  }

  const response = await client.systemOne({
    state: { user_message: userMessage },
    questions: {
      topic_start: {
        type: "choice",
        instructions:
          "The user is asking a knowledge question. Which word is the FIRST word of the main topic/subject they're asking about? Pick the word where the topic name begins.",
        criteria: startCriteria,
      },
      topic_end: {
        type: "choice",
        instructions:
          "The user is asking a knowledge question. Which word is the LAST word of the main topic/subject they're asking about? Pick the word where the topic name ends.",
        criteria: endCriteria,
      },
    },
  });

  const startChoice = response.answers.topic_start.choice;
  const endChoice = response.answers.topic_end.choice;
  const startIdx = parseInt(startChoice.split(":")[0]);
  const endIdx = parseInt(endChoice.split(":")[0]);

  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  return words.slice(from, to + 1).join(" ");
}

// === Approach 2: Word tagging with nouls ===
// Ask noul per word: "is this part of the topic?"
async function jevTagExtract(userMessage) {
  const words = userMessage.trim().replace(/[?.!]+$/g, "").split(/\s+/);
  if (words.length <= 2) return words.join(" ");

  const questions = {};
  for (let i = 0; i < words.length; i++) {
    questions[`w${i}`] = {
      type: "noul",
      instructions: `Is the word "${words[i]}" (position ${i}) part of the CORE TOPIC or SUBJECT the user is asking about? Only mark true for words that form the topic name itself, not question framing or filler.`,
      criteria: {
        true: `"${words[i]}" is part of the topic name`,
        false: `"${words[i]}" is not part of the topic`,
      },
    };
  }

  const response = await client.systemOne({
    state: { user_message: userMessage },
    questions,
  });

  // Collect words above threshold and find longest consecutive run
  const threshold = 0.5;
  const tagged = words.map((w, i) => ({
    word: w,
    score: response.answers[`w${i}`]?.noul ?? 0,
    isTag: (response.answers[`w${i}`]?.noul ?? 0) > threshold,
  }));

  // Find longest consecutive tagged run
  let bestStart = -1, bestLen = 0;
  let curStart = -1, curLen = 0;
  for (let i = 0; i < tagged.length; i++) {
    if (tagged[i].isTag) {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  if (bestStart === -1) {
    // Fallback: pick the highest scoring word
    const best = tagged.reduce((a, b) => (b.score > a.score ? b : a));
    return best.word;
  }

  return words.slice(bestStart, bestStart + bestLen).join(" ");
}

// === Regex (current) ===
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

async function runMethod(name, extractFn) {
  let pass = 0;
  const results = [];
  const start = Date.now();

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const got = await extractFn(tc.input);
      const ok = got.toLowerCase().includes(tc.expected.toLowerCase());
      if (ok) pass++;
      results.push({ ...tc, got, pass: ok });
    } catch (err) {
      results.push({ ...tc, got: `ERR: ${err.message.substring(0, 40)}`, pass: false });
    }
    process.stdout.write(`  ${name}: ${i + 1}/${testCases.length}\r`);
  }

  const time = Date.now() - start;
  console.log(`  ${name}: ${pass}/${testCases.length} (${Math.round((pass / testCases.length) * 100)}%) in ${time}ms (${Math.round(time / testCases.length)}ms/call)     `);
  return { name, pass, results, time };
}

async function main() {
  console.log("=".repeat(70));
  console.log("  Smart Jev Extraction: Boundary vs Tags vs Regex");
  console.log("=".repeat(70));

  const regex = await runMethod("Regex     ", regexExtract);
  const boundary = await runMethod("Boundary  ", jevBoundaryExtract);
  const tag = await runMethod("Word Tags ", jevTagExtract);

  // Side by side
  console.log(`\n${"Input".padEnd(48)}${"Expected".padEnd(20)}${"Regex".padEnd(24)}${"Boundary".padEnd(24)}${"Tags"}`);
  console.log("-".repeat(140));

  for (let i = 0; i < testCases.length; i++) {
    const r = regex.results[i];
    const b = boundary.results[i];
    const t = tag.results[i];
    console.log(
      `${r.input.substring(0, 46).padEnd(48)}${r.expected.substring(0, 18).padEnd(20)}${(r.pass ? "✓" : "✗") + " " + r.got.substring(0, 21).padEnd(23)}${(b.pass ? "✓" : "✗") + " " + b.got.substring(0, 21).padEnd(23)}${(t.pass ? "✓" : "✗") + " " + t.got.substring(0, 21)}`
    );
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log(`  Regex:      ${regex.pass}/${testCases.length} | ${regex.time}ms`);
  console.log(`  Boundary:   ${boundary.pass}/${testCases.length} | ${boundary.time}ms (${Math.round(boundary.time / testCases.length)}ms/call)`);
  console.log(`  Word Tags:  ${tag.pass}/${testCases.length} | ${tag.time}ms (${Math.round(tag.time / testCases.length)}ms/call)`);
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
