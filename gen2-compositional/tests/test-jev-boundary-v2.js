require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { TypeSafeClient } = require("@typesafe-ai/sdk");
const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });

// === V1: Original boundary (baseline) ===
async function v1_original(userMessage) {
  const words = userMessage.trim().replace(/[?.!]+$/g, "").split(/\s+/);
  if (words.length <= 2) return words.join(" ");

  const startCriteria = {};
  const endCriteria = {};
  for (let i = 0; i < words.length; i++) {
    const label = `${i}:${words[i]}`;
    startCriteria[label] = `Topic starts at "${words[i]}"`;
    endCriteria[label] = `Topic ends at "${words[i]}"`;
  }

  const response = await client.systemOne({
    state: { user_message: userMessage },
    questions: {
      topic_start: {
        type: "choice",
        instructions: "Which word is the FIRST word of the main topic/subject?",
        criteria: startCriteria,
      },
      topic_end: {
        type: "choice",
        instructions: "Which word is the LAST word of the main topic/subject?",
        criteria: endCriteria,
      },
    },
  });

  const startIdx = parseInt(response.answers.topic_start.choice.split(":")[0]);
  const endIdx = parseInt(response.answers.topic_end.choice.split(":")[0]);
  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  return words.slice(from, to + 1).join(" ");
}

// === V2: Better instructions + richer state ===
async function v2_betterInstructions(userMessage) {
  const words = userMessage.trim().replace(/[?.!]+$/g, "").split(/\s+/);
  if (words.length <= 2) return words.join(" ");

  const startCriteria = {};
  const endCriteria = {};
  for (let i = 0; i < words.length; i++) {
    const label = `${i}:${words[i]}`;
    startCriteria[label] = `"${words[i]}" (position ${i})`;
    endCriteria[label] = `"${words[i]}" (position ${i})`;
  }

  const response = await client.systemOne({
    state: {
      user_message: userMessage,
      task: "Extract the Wikipedia search topic from this message. The topic is the specific thing the user wants to know about — a person, place, concept, or event name. It should be the SHORTEST phrase that uniquely identifies the subject.",
      words: words.join(" | "),
    },
    questions: {
      topic_start: {
        type: "choice",
        instructions: "Which word is where the topic NAME begins? Pick the first word of the specific subject name (e.g., for 'what language in brazil' → 'brazil', NOT 'language'). Choose the word that starts the SHORTEST complete topic name.",
        criteria: startCriteria,
      },
      topic_end: {
        type: "choice",
        instructions: "Which word is where the topic NAME ends? Pick the last word of the specific subject name. The span from start to end should be a searchable topic name like 'black hole', 'climate change', 'Albert Einstein' — not a sentence fragment.",
        criteria: endCriteria,
      },
    },
  });

  const startIdx = parseInt(response.answers.topic_start.choice.split(":")[0]);
  const endIdx = parseInt(response.answers.topic_end.choice.split(":")[0]);
  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  return words.slice(from, to + 1).join(" ");
}

// === V3: Pre-clean + better instructions ===
function preClean(msg) {
  let q = msg.trim();
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like|pls|please|btw)\b[,.]?\s*/gi, "");
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like)\b[,.]?\s*/gi, "");
  q = q.replace(/[?.!]+$/g, "");
  return q.trim();
}

async function v3_preClean(userMessage) {
  const cleaned = preClean(userMessage);
  const words = cleaned.split(/\s+/);
  if (words.length <= 2) return words.join(" ");

  const startCriteria = {};
  const endCriteria = {};
  for (let i = 0; i < words.length; i++) {
    const label = `${i}:${words[i]}`;
    startCriteria[label] = `"${words[i]}" (position ${i})`;
    endCriteria[label] = `"${words[i]}" (position ${i})`;
  }

  const response = await client.systemOne({
    state: {
      user_message: cleaned,
      task: "Extract the Wikipedia search topic. Return the SHORTEST phrase that names the specific subject — a person, place, concept, or event.",
    },
    questions: {
      topic_start: {
        type: "choice",
        instructions: "Which word STARTS the topic name? Pick where the specific subject begins. For 'what language in brazil' → 'brazil'. For 'tell me about climate change' → 'climate'.",
        criteria: startCriteria,
      },
      topic_end: {
        type: "choice",
        instructions: "Which word ENDS the topic name? The start-to-end span should be a clean Wikipedia search term.",
        criteria: endCriteria,
      },
    },
  });

  const startIdx = parseInt(response.answers.topic_start.choice.split(":")[0]);
  const endIdx = parseInt(response.answers.topic_end.choice.split(":")[0]);
  const from = Math.min(startIdx, endIdx);
  const to = Math.max(startIdx, endIdx);
  return words.slice(from, to + 1).join(" ");
}

// === V4: Pre-clean + 3 questions (start, end, length validation) ===
async function v4_threeQuestions(userMessage) {
  const cleaned = preClean(userMessage);
  const words = cleaned.split(/\s+/);
  if (words.length <= 2) return words.join(" ");

  const startCriteria = {};
  const endCriteria = {};
  for (let i = 0; i < words.length; i++) {
    const label = `${i}:${words[i]}`;
    startCriteria[label] = `"${words[i]}"`;
    endCriteria[label] = `"${words[i]}"`;
  }

  const response = await client.systemOne({
    state: {
      user_message: cleaned,
      task: "Extract the core topic/subject as a Wikipedia search term.",
    },
    questions: {
      topic_start: {
        type: "choice",
        instructions: "Which word STARTS the topic name?",
        criteria: startCriteria,
      },
      topic_end: {
        type: "choice",
        instructions: "Which word ENDS the topic name?",
        criteria: endCriteria,
      },
      topic_length: {
        type: "score",
        instructions: "How many words long is the topic name?",
        criteria: ["1 word (e.g., 'photosynthesis', 'brazil')", "2 words (e.g., 'black hole', 'climate change')", "3 words (e.g., 'world war 2', 'great barrier reef')", "4 words (e.g., 'theory of relativity')", "5+ words"],
      },
    },
  });

  const startIdx = parseInt(response.answers.topic_start.choice.split(":")[0]);
  const endIdx = parseInt(response.answers.topic_end.choice.split(":")[0]);
  const expectedLen = response.answers.topic_length.score + 1; // score 0=1word, 1=2words, etc.

  let from = Math.min(startIdx, endIdx);
  let to = Math.max(startIdx, endIdx);

  // If span is way longer than expected length, trust the end and walk back
  const spanLen = to - from + 1;
  if (spanLen > expectedLen + 1) {
    from = Math.max(from, to - expectedLen + 1);
  }

  return words.slice(from, to + 1).join(" ");
}

// === V5: Two-pass (rough locate → refine) ===
async function v5_twoPass(userMessage) {
  const cleaned = preClean(userMessage);
  const words = cleaned.split(/\s+/);
  if (words.length <= 2) return words.join(" ");

  // Pass 1: rough location with noul per word
  const pass1Q = {};
  for (let i = 0; i < words.length; i++) {
    pass1Q[`w${i}`] = {
      type: "noul",
      instructions: `Is "${words[i]}" part of the core topic/subject the user wants to learn about?`,
      criteria: {
        true: `"${words[i]}" is part of the topic name`,
        false: `"${words[i]}" is filler/framing`,
      },
    };
  }

  const pass1 = await client.systemOne({
    state: { user_message: cleaned, task: "Identify which words form the topic name." },
    questions: pass1Q,
  });

  // Find the hot zone — words scoring above 0.5
  const scores = words.map((w, i) => ({
    word: w,
    idx: i,
    score: pass1.answers[`w${i}`]?.noul ?? 0,
  }));

  const hotWords = scores.filter((s) => s.score > 0.5);
  if (hotWords.length === 0) {
    // Fallback: pick highest scoring word
    scores.sort((a, b) => b.score - a.score);
    return scores[0].word;
  }

  if (hotWords.length <= 3) {
    // Small enough, just return them
    const minIdx = Math.min(...hotWords.map((h) => h.idx));
    const maxIdx = Math.max(...hotWords.map((h) => h.idx));
    return words.slice(minIdx, maxIdx + 1).join(" ");
  }

  // Pass 2: refine with boundary on just the hot zone ± 1
  const minHot = Math.max(0, Math.min(...hotWords.map((h) => h.idx)) - 1);
  const maxHot = Math.min(words.length - 1, Math.max(...hotWords.map((h) => h.idx)) + 1);
  const zoneWords = words.slice(minHot, maxHot + 1);

  const startCriteria = {};
  const endCriteria = {};
  for (let i = 0; i < zoneWords.length; i++) {
    const label = `${i}:${zoneWords[i]}`;
    startCriteria[label] = `"${zoneWords[i]}"`;
    endCriteria[label] = `"${zoneWords[i]}"`;
  }

  const pass2 = await client.systemOne({
    state: { user_message: cleaned, topic_zone: zoneWords.join(" ") },
    questions: {
      topic_start: {
        type: "choice",
        instructions: "Within this zone, which word STARTS the topic name?",
        criteria: startCriteria,
      },
      topic_end: {
        type: "choice",
        instructions: "Within this zone, which word ENDS the topic name?",
        criteria: endCriteria,
      },
    },
  });

  const s = parseInt(pass2.answers.topic_start.choice.split(":")[0]);
  const e = parseInt(pass2.answers.topic_end.choice.split(":")[0]);
  const from = Math.min(s, e);
  const to = Math.max(s, e);
  return zoneWords.slice(from, to + 1).join(" ");
}

// === Regex baseline ===
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

async function runMethod(name, fn) {
  let pass = 0;
  const results = [];
  const start = Date.now();
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const got = await fn(tc.input);
      const ok = got.toLowerCase().includes(tc.expected.toLowerCase());
      if (ok) pass++;
      results.push({ ...tc, got, pass: ok });
    } catch (err) {
      results.push({ ...tc, got: `ERR: ${err.message.substring(0, 30)}`, pass: false });
    }
    process.stdout.write(`  ${name}: ${i + 1}/${testCases.length}\r`);
  }
  const time = Date.now() - start;
  console.log(`  ${name}: ${pass}/${testCases.length} (${Math.round((pass / testCases.length) * 100)}%) | ${time}ms (${Math.round(time / testCases.length)}ms/call)          `);
  return { name, pass, results, time };
}

async function main() {
  console.log("=".repeat(70));
  console.log("  Boundary V2: Optimizing Jev Extraction");
  console.log("=".repeat(70));
  console.log();

  const methods = [
    ["Regex         ", regexExtract],
    ["V1 Original   ", v1_original],
    ["V2 BetterInstr", v2_betterInstructions],
    ["V3 PreClean   ", v3_preClean],
    ["V4 3Questions ", v4_threeQuestions],
    ["V5 TwoPass    ", v5_twoPass],
  ];

  const allResults = [];
  for (const [name, fn] of methods) {
    allResults.push(await runMethod(name, fn));
  }

  // Side by side for failures only
  console.log(`\n=== DIFFERENCES (where methods disagree) ===\n`);
  console.log(`${"Input".padEnd(48)}${"Expected".padEnd(18)}${allResults.map((r) => r.name.trim().substring(0, 10).padEnd(12)).join("")}`);
  console.log("-".repeat(48 + 18 + allResults.length * 12));

  for (let i = 0; i < testCases.length; i++) {
    const marks = allResults.map((r) => r.results[i].pass);
    if (marks.some((m) => m !== marks[0])) {
      const tc = testCases[i];
      let line = `${tc.input.substring(0, 46).padEnd(48)}${tc.expected.substring(0, 16).padEnd(18)}`;
      for (const r of allResults) {
        const ri = r.results[i];
        line += `${ri.pass ? "✓" : "✗"} ${ri.got.substring(0, 9).padEnd(11)}`;
      }
      console.log(line);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  FINAL SCORES");
  console.log("=".repeat(70));
  for (const r of allResults) {
    console.log(`  ${r.name}: ${r.pass}/${testCases.length} (${Math.round((r.pass / testCases.length) * 100)}%) | ${r.time}ms`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
