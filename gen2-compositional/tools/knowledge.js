const https = require("https");
const DDG = require("duck-duck-scrape");

const USER_AGENT = "GenerativeJev/2.0 (https://github.com/akash; gen2-compositional)";

function detect(classification) {
  return classification.intents.some(
    (i) =>
      i.type === "knowledge_question" ||
      i.type === "explanation"
  );
}

function extractQuery(userMessage) {
  let q = userMessage.trim();

  // Strip filler prefixes humans add
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like|pls|please|btw)\b[,.]?\s*/gi, "");
  q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like)\b[,.]?\s*/gi, "");

  // Try extracting topic from "about X" clause first (e.g., "i keep hearing about climate change can you explain...")
  const aboutTopicMatch = q.match(/\babout\s+(the\s+)?(.+?)\s+(can|could|would|do|but|and|what|who|tell|explain|,)/i);
  if (aboutTopicMatch && aboutTopicMatch[2].length >= 3) {
    return aboutTopicMatch[2].trim().replace(/[?.!]+$/g, "");
  }

  // Strip conversational lead-ins before the actual question
  q = q.replace(/^.*?(what (?:exactly |actually )?is|what's|whats|what are|who is|who's|whos|who was|who tf is|who invented|who created|who discovered|where is|where are|when was|when did|how tall is|how big is|how old is|how does|how do|how is|why is|why are|why does|why do|what causes|what even is|can you explain (?:what (?:\w+ )?is )?|can you tell me (?:about|something about)|tell me (?:about|abt)|(?:i )?(?:need to |want to )?know about|explain|define)\s+/i, "");

  // If nothing matched above, try simpler patterns
  if (q === userMessage.trim() || q.length > userMessage.length * 0.9) {
    q = userMessage.trim();
    q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like|pls|please|btw)\b[,.]?\s*/gi, "");
    q = q.replace(/^(yo|hey|lol|hmm+|ok|okay|so|well|um+|uh+|like)\b[,.]?\s*/gi, "");
    q = q.replace(/^(tell me about|tell me abt|what about|what is|what's|whats|what are|who is|who's|whos|who was|who are|why is|why are|why does|why do|how does|how do|how is|explain|define)\s+/i, "");
    q = q.replace(/^(what|who|where|when|why|how)\s+/i, "");
  }

  // Handle "about X" remaining from "hearing about X", "asked about X", etc.
  q = q.replace(/^.*\babout\s+/i, "");

  // Truncate at compound question boundaries
  q = q.replace(/\s+and\s+(how|what|who|where|when|why)\s+.*/i, "");
  // Truncate at comma + second clause
  q = q.replace(/,\s*(but|and|so|because|since|what|who|where|when|tell|can|i ).*$/i, "");

  // Strip articles
  q = q.replace(/^(the|a|an)\s+/i, "");

  // Strip punctuation
  q = q.replace(/[?.!]+$/g, "");

  // Strip trailing qualifiers and verb remnants
  q = q.replace(/\s+(in simple terms|in detail|exactly|briefly|for me|to me|for my \w+|for school|for homework|for class)$/i, "");
  q = q.replace(/\s+(works?|happens?|occurs?|functions?)$/i, "");
  q = q.replace(/\s+(change|turn|become|go)\s+.+$/i, "");

  // Strip trailing filler
  q = q.replace(/\s+(rn|tho|though|actually|really|pls|please)$/i, "");

  // Strip orphaned leading question words left after verb stripping
  q = q.replace(/^(how|why|what|where|when)\s+/i, "");

  // Strip "do they speak in" → just the country
  q = q.replace(/^language\s+(?:do\s+)?they\s+speak\s+in\s+/i, "");
  // "invented the X" → "X"
  if (/^invented\s+/i.test(q)) {
    q = q.replace(/^invented\s+(the\s+)?/i, "");
  }
  // "tall is X" / "big is X" → "X"
  q = q.replace(/^(tall|big|old|long|heavy|fast|deep|wide)\s+is\s+(the\s+)?/i, "");
  // "internet invented" → "internet"
  q = q.replace(/\s+(invented|created|discovered|founded|built|made)$/i, "");

  q = q.trim();

  // Guard: if extracted query is a pronoun or too short, try pulling noun phrases from the original
  if (!q || q.length < 3 || /^(it|this|that|they|them|he|she|we|me)$/i.test(q)) {
    const aboutMatch = userMessage.match(/\babout\s+(the\s+)?(.+?)(?:\s*[,?.!]|\s+(?:but|and|so|because|can|tell|what|i ))/i);
    if (aboutMatch) return aboutMatch[2].trim();
    return userMessage.replace(/[?.!]+$/g, "").trim();
  }

  return q;
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": USER_AGENT, ...headers } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location, headers).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function searchWikipedia(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json`;
  const data = await httpGet(url);
  if (!data || !data[1] || data[1].length === 0) return null;
  return data[1][0];
}

async function getWikipediaSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const data = await httpGet(url);
  if (!data || !data.extract) return null;

  let extract = data.extract;
  // Trim to first 2 sentences for conciseness
  const sentences = extract.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 2) {
    extract = sentences.slice(0, 2).join("").trim();
  }

  return {
    title: data.title,
    description: data.description || null,
    extract,
    source: "wikipedia",
  };
}

async function getWikidataDescription(query) {
  const token = process.env.WIKIDATA_ACCESS_TOKEN;
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&limit=1&format=json`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const data = await httpGet(url, headers);

  if (!data || !data.search || data.search.length === 0) return null;

  const entity = data.search[0];
  return {
    title: entity.label,
    description: entity.description || null,
    entityId: entity.id,
    source: "wikidata",
  };
}

async function getDDGDefinition(word) {
  try {
    const defs = await DDG.dictionaryDefinition(word);
    if (!defs || defs.length === 0) return null;

    const first = defs[0];
    let text = first.text || "";
    text = text.replace(/<[^>]+>/g, "").trim();

    return {
      word: first.word,
      definition: text,
      partOfSpeech: first.partOfSpeech || null,
      source: "dictionary",
    };
  } catch {
    return null;
  }
}

async function execute(userMessage) {
  const query = extractQuery(userMessage);
  if (!query) {
    return { type: "knowledge", success: false, error: "Couldn't extract a query" };
  }

  // Try Wikipedia first (best prose answers)
  try {
    const title = await searchWikipedia(query);
    if (title) {
      const summary = await getWikipediaSummary(title);
      if (summary && summary.extract) {
        return {
          type: "knowledge",
          success: true,
          query,
          answer: summary.extract,
          title: summary.title,
          description: summary.description,
          source: "wikipedia",
          formatted: summary.extract,
        };
      }
    }
  } catch {}

  // Fallback: Wikidata short description
  try {
    const wikidata = await getWikidataDescription(query);
    if (wikidata && wikidata.description) {
      return {
        type: "knowledge",
        success: true,
        query,
        answer: `${wikidata.title} — ${wikidata.description}`,
        title: wikidata.title,
        description: wikidata.description,
        source: "wikidata",
        formatted: `${wikidata.title} — ${wikidata.description}`,
      };
    }
  } catch {}

  // Fallback: DDG dictionary definition
  try {
    const def = await getDDGDefinition(query);
    if (def && def.definition) {
      return {
        type: "knowledge",
        success: true,
        query,
        answer: def.definition,
        title: def.word,
        source: "dictionary",
        formatted: def.definition,
      };
    }
  } catch {}

  return {
    type: "knowledge",
    success: false,
    query,
    error: "No answer found",
  };
}

module.exports = { detect, execute };
