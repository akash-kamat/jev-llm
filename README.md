# Jev LLM

**A conversational AI built without a language model.** No text generation. No hallucination. Responses composed from phrase-level building blocks using non-generative AI.

**[Try the live demo →](https://jevllm.pages.dev)**

<div align="center">

https://github.com/user-attachments/assets/6160944b-b655-4030-8d06-85467e643f14

</div>

[TypeSafe's Jev](https://typesafe.ai) is a non-generative AI — it returns typed judgments, not text. This project turns those judgments into a full conversational agent: ~100 human-authored phrases compose into 10,000+ unique responses, with multi-intent support and integrated tools for math, knowledge, and time.

```
You: Hey! What's 50*12? Also what can you do?

Jev: Hey! Sure! 50 × 12 = 600. I can help with answering questions,
     having conversations, and helping you think through problems.
     Anything else?

     Intents: greeting, math_calculation, capability_query
     Tools: math | API calls: 2 | 806ms
```

Three intents detected, a real calculation performed, and a composed response — no token was generated.

---

## How it works

**2 API calls. ~800ms. ~$0.0001 per message.**

```
                          User message
                               │
                               ▼
              ┌────────────────────────────────┐
              │   LAYER 1: CLASSIFY (400ms)    │
              │                                │
              │  Understand intent & context:   │
              │  ├─ Multiple intents (Choice)   │
              │  ├─ Formality     (Score 0-4)   │
              │  ├─ Emotion       (Score 0-4)   │
              │  ├─ Complexity    (Score 0-4)   │
              │  └─ Tool detection (Nouls)      │
              └───────────────┬────────────────┘
                              │
                     Detect & execute tools:
                     math, knowledge, datetime
                              │
                              ▼
              ┌────────────────────────────────┐
              │   LAYER 2: SELECT (400ms)      │
              │                                │
              │  Pick phrases for each segment: │
              │  ├─ Greeting phrase             │
              │  ├─ Acknowledgment phrase       │
              │  ├─ Tool result presentation    │
              │  ├─ Connector phrase            │
              │  └─ Follow-up phrase            │
              │                                │
              │  Jev scores candidates per slot │
              │  considering tone & formality   │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │   LAYER 3: ASSEMBLE (0ms)      │
              │                                │
              │  Compose phrases into response: │
              │  ├─ Grammar rules              │
              │  ├─ Smart punctuation          │
              │  └─ Multi-intent joining       │
              │                                │
              │  No API call — pure code       │
              └───────────────┬────────────────┘
                              │
                              ▼
                         Response ✓
```

The key insight: **selection works like wisdom, not knowledge.** A wise person doesn't compute novel answers — they draw from collected perspectives and pick the one that fits. ~100 phrases compose into thousands of unique, natural responses.

---

## What is Jev?

Jev (by [TypeSafe](https://typesafe.ai)) is a non-generative AI model. It has three primitives:

| Primitive | Returns | Example |
|-----------|---------|---------|
| **Choice** | Best pick + confidence + distribution over all options | "Which intent?" → `greeting (87%)` |
| **Score** | Position on an ordered scale + distribution | "How formal?" → `3.2 / 4.0` |
| **Noul** | Single 0-1 probability | "Needs human?" → `0.12` |

It cannot write a single word. But it can *judge* — and judgment is all you need for compositional generation.

---

## Jev LLM vs Traditional LLM

| | Jev LLM | Traditional LLM |
|---|---|---|
| **Hallucination** | Impossible — every phrase is human-authored | Inherent risk |
| **Prompt injection** | No attack surface — no generative layer | Ongoing vulnerability |
| **Cost per message** | ~$0.0001 | ~$0.01-0.10 |
| **Latency** | ~800ms (2 API calls) | 1-5s (token streaming) |
| **Brand safety** | Guaranteed — only pre-approved phrases | Needs guardrails |
| **Inspectability** | Full decision chain: intents → tools → phrases → assembly | Black box |
| **Multi-intent** | Handles 3+ intents per message | Usually 1 at a time |
| **Tools** | Math, knowledge (Wikipedia), time — real answers | Depends on implementation |

---

## Tools

Integrated tools give real answers instead of generic deflections:

| Tool | What it does | Example |
|------|-------------|---------|
| **Math** | Evaluates expressions via mathjs | "What's 15% of 200?" → `30` |
| **Knowledge** | Wikipedia + Wikidata + DDG dictionary | "What is photosynthesis?" → actual definition |
| **DateTime** | Local time + world time via DDG | "What time is it in Tokyo?" → real answer |

Each tool uses regex extraction to pull parameters from natural language — tested against 110 cases including typos, slang, and long messy sentences (110/110 passing).

---

## Worked example

User sends: **"Hey! What's 50*12? Also what can you do?"**

**Layer 1 — Classify** (one API call):
```
intents:    math_calculation (98%), greeting (94%), capability_query (91%)
formality:  1.2 / 4.0  (casual)
emotion:    0.3 / 4.0  (calm)
complexity: 2.0 / 4.0  (moderate)
```

**Tool execution** — math detected, regex extracts `50*12`:
```
50 * 12 = 600
```

**Plan response** — planner builds segment structure:
```
greeting → acknowledgment → math_result → capability_intro → followup
```

**Layer 2 — Select phrases** (one API call):
```
greeting:        "Hey!"        (matched casual tone)
acknowledgment:  "Sure!"       (matched energy)
capability_intro: "I can help with"
followup:        "Anything else?"
```

**Layer 3 — Assemble** (no API call):
```
"Hey! Sure! 50 × 12 = 600. I can help with answering questions,
having conversations, and helping you think through problems. Anything else?"
```

All three intents addressed. Real math answer. Composed from 5 phrase selections.

---

## Setup

```bash
git clone https://github.com/akash-kamat/jev-llm.git
cd jev-llm
npm install
```

Create `.env`:
```
TYPESAFE_API_KEY=your_key_here
```

Get your API key at [typesafe.ai](https://typesafe.ai).

```bash
# Interactive chat
node index.js

# Type "debug" to see full decision breakdown
# Type "quit" to exit

# Run test suite (18 cases + variety test)
node src/tests/test.js

# Tool extraction tests (110 cases)
node src/tests/test-tools.js
node src/tests/test-tool-edge.js
node src/tests/test-tool-human.js
```

---

## Architecture

```
src/
├── index.js                 ← Interactive CLI with debug mode
├── orchestrator.js          ← Pipeline: classify → tools → select → assemble
│
├── classification/
│   ├── classifier.js        ← Multi-intent classification (14 intent types)
│   └── planner.js           ← Response structure planning
│
├── phrases/
│   ├── library.js           ← ~100 phrases organized by semantic function
│   └── selector.js          ← Jev-driven phrase selection per segment
│
├── assembler/
│   ├── grammar-rules.js     ← Composition grammar for multi-intent
│   ├── composer.js          ← Main assembly logic
│   └── punctuation.js       ← Smart punctuation engine
│
├── tools/
│   ├── registry.js          ← Tool detection & routing
│   ├── math.js              ← Math calculations (mathjs)
│   ├── knowledge.js         ← Wikipedia + Wikidata + DDG dictionary
│   ├── datetime.js          ← Local + world time (DDG)
│   └── jev-extract.js       ← Jev-based extraction fallback (unused, tested)
│
├── tests/
│   ├── test.js              ← Pipeline integration tests (18 cases)
│   ├── test-tools.js        ← Tool unit tests (25 cases)
│   ├── test-tool-edge.js    ← Edge case extraction tests (32 cases)
│   └── test-tool-human.js   ← Human-style messy input tests (53 cases)
│
└── ARCHITECTURE.md          ← Detailed system design
```

---

## Benchmark results

Tested head-to-head on 25 cases across greetings, math, knowledge, datetime, multi-intent, emotion, humor, and edge cases:

| Metric | Jev LLM | Selection-based (v1) |
|--------|---------|---------------------|
| **Avg latency** | 843ms | 1191ms |
| **Variety** ("Hey!" x10) | 6/10 unique | 1/10 unique |
| **Multi-intent** | 6 messages handled | 0 (picks 1 intent) |
| **Tool answers correct** | 4/4 | 0/4 |
| **Success rate** | 25/25 | 25/25 |

---

## What's next

- [ ] Multi-turn conversation state and memory
- [ ] Code execution tool
- [ ] Response bank expansion (more phrase variety)
- [ ] Adaptive formality calibration

---

## Previous architecture (v1 — selection-based)

The first version used a different approach: 550 pre-written complete responses selected via multi-dimensional scoring.

```
gen1-selection-based/
├── jev-llm.js           ← Engine: classify → shortlist → score → rank
├── response-bank.js     ← 550 responses across 14 intents, 38 subcategories
├── templates.js         ← Dynamic slot filling
├── llm-fallback.js      ← Optional confidence-gated LLM fallback
├── index.js             ← Interactive CLI
└── test.js              ← Test suite
```

**How it worked:** Classify the message (1 API call), fetch 10 candidate responses by intent/subcategory, score each across 6 dimensions (relevance, tone, helpfulness, specificity, answers-question, natural-flow) in 1 API call, pick the highest weighted score.

**Limitations:**
- **Single intent only** — "Hey! What's 50*12?" would pick either greeting OR math, never both
- **No tools** — couldn't actually calculate, tell time, or look things up. Math questions got "I'll try" instead of answers
- **Low variety** — same input always selected the same response from a fixed pool
- **550 complete responses required** — adding a new capability meant writing 10+ full sentences per subcategory
- **No composition** — responses were atomic units, couldn't be mixed or combined

The compositional architecture solves all of these by building responses from ~100 reusable phrases instead of selecting from 550 complete ones.

---

## License

ISC
