# Jev LLM — Selection-Based Conversational Agent

An "LLM" built entirely on TypeSafe's Jev model. Instead of generating text, it selects the best response from a bank of human-authored candidates using multi-dimensional scoring.

## How It Works

### The Core Idea

```
Humans write the responses  →  Code organizes candidates  →  Jev selects contextually
```

Jev is not a generative model. It returns typed judgments and probabilities. But by giving it candidate responses and asking "which one best fits this message?", we get a conversational agent where:

- Every response was human-written (zero hallucination)
- No prompt injection is possible (no generative surface)
- Responses are guaranteed on-brand and on-tone
- Response time is ~750-1000ms (two API round trips)

### Program Flow

```
User types a message
        │
        ▼
   ┌─────────────────────────────────────────────────────────┐
   │  CALL 1: CLASSIFY (~400-500ms)                          │
   │  One Jev API call with ~15 questions in parallel:       │
   │                                                         │
   │  • intent (Choice) — greeting/complaint/question/...    │
   │  • formality (Score) — casual ←→ formal                 │
   │  • emotional intensity (Score) — calm ←→ extreme        │
   │  • needs_human (Noul) — should a human handle this?     │
   │  • subcategory per intent (speculative fan-out)         │
   │    — asked for ALL intents upfront                      │
   │    — code only reads the winning intent's subcategory   │
   └───────────────────────┬─────────────────────────────────┘
                           │
                    Gate checks:
                    • needs_human > 0.8 → escalate
                    • intentConfidence < 0.3 → fallback
                           │
                           ▼
   ┌─────────────────────────────────────────────────────────┐
   │  FETCH CANDIDATES (pure code, no API call)              │
   │  Look up response bank by intent + subcategory          │
   │  Returns ~5 candidate responses                         │
   └───────────────────────┬─────────────────────────────────┘
                           │
                           ▼
   ┌─────────────────────────────────────────────────────────┐
   │  CALL 2: SCORE (~400-500ms)                             │
   │  One Jev API call with ~20 questions in parallel:       │
   │  For each candidate (5), score on 4 dimensions:         │
   │                                                         │
   │  • relevance (Score) — how relevant to the message?     │
   │  • tone (Score) — does the tone match?                  │
   │  • helpfulness (Score) — how useful is this response?   │
   │  • answers_question (Noul) — does it address the ask?   │
   └───────────────────────┬─────────────────────────────────┘
                           │
                           ▼
   ┌─────────────────────────────────────────────────────────┐
   │  WEIGHTED RANKING (pure code, no API call)              │
   │                                                         │
   │  Context-aware weights:                                 │
   │  • Normal: relevance 30%, tone 20%, help 25%, ans 25%   │
   │  • Complaint/high emotion: relevance 25%, TONE 35%,     │
   │    help 15%, ans 25%                                    │
   │                                                         │
   │  finalScore = weighted sum of normalized scores         │
   │  Pick the highest-scoring candidate                     │
   └───────────────────────┬─────────────────────────────────┘
                           │
                           ▼
                    Return response
```

### File Structure

```
generative-jev/
├── .env                 ← TYPESAFE_API_KEY
├── response-bank.js     ← 103 pre-written responses (9 intents, 23 subcategories)
├── jev-llm.js           ← Classification + scoring + weighted selection engine
├── index.js             ← Interactive CLI with debug mode
└── test.js              ← Batch test runner (9 test cases)
```

### Response Bank Organization (v2)

```
response-bank/
├── greeting/           casual(5), formal(5), returning(3)
├── farewell/           casual(4), formal(4)
├── gratitude/          casual(4), formal(3)
├── question_knowledge/ weather(3), time(2), coding(5), math(3), general(5)
├── question_personal/  about_assistant(5), about_user(3), feelings(4)
├── request/            can_do(5), need_more_info(5), cant_do(5) ← includes templates
├── complaint/          empathetic(5), solution_oriented(4), escalation(3)
├── small_talk/         casual(5), thoughtful(4)
├── meta_capabilities/  can_do(5)★, cant_do(4)★, how_it_works(5)    [NEW]
├── opinion/            has_perspective(5), deflect(4), recommend(4) [NEW]
├── explanation/        how_things_work(5), why(4), definition(4)   [NEW]
├── followup/           more_detail(5), continue(4), repeat(3)      [NEW]
├── humor/              playful(5), sarcasm(4), absurd(4)            [NEW]
├── confusion/          gentle(5)
└── fallback/           graceful(5)

★ = contains template responses with dynamic slot filling
Total: 169 responses across 14 intents and 38 subcategories
```

### Jev Primitives Used

| Primitive | Where Used | What It Does |
|-----------|-----------|--------------|
| **Choice** | Intent classification, subcategory selection | Picks one option from a defined set, returns confidence + probability distribution |
| **Score** | Formality, emotional intensity, relevance, tone, helpfulness, specificity, natural flow | Returns position on a 0-4 scale with probability distribution |
| **Noul** | Needs-human check, answers-question check | Returns single 0-1 probability (yes/no judgment) |

### Cost Per Message

- **Call 1 (classify):** ~19 questions (4 base + 14 speculative subcategories + formality/emotion/needs_human), ~300-400 input tokens
- **Call 2 (score):** ~30 questions (5 candidates × 6 dimensions), ~300-400 input tokens
- **Total:** ~49 questions, ~700 tokens, ~$0.0001 per message
- **With LLM fallback (5-10% of messages):** ~$0.0006 average per message
- **Compared to LLM:** 10-100x cheaper than Claude Haiku/Sonnet

### Usage

```bash
# Interactive mode
node index.js

# Type "debug" to toggle scoring breakdown
# Type "quit" to exit

# Batch test
node test.js
```

---

### File Structure (v2)

```
generative-jev/
├── .env                 ← TYPESAFE_API_KEY (+ optional ANTHROPIC_API_KEY for fallback)
├── response-bank.js     ← 400 pre-written responses (14 intents, 38 subcategories, ~10/subcat)
├── templates.js         ← Template engine with slot data and resolution
├── jev-llm.js           ← Classification + shortlist + 6-dimension scoring + fallback + weighted selection
├── llm-fallback.js      ← Confidence-gated LLM fallback (pluggable, no key required)
├── index.js             ← Interactive CLI with debug mode
└── test.js              ← Batch test runner (23 test cases)
```

---

## Phase 2: Improvements

### 2.1 — Better Response Coverage [DONE]

Add missing intent categories that cause misclassification:

| New Intent | Why Needed |
|-----------|-----------|
| `meta_capabilities` | "what can you do?", "what are your limits?" |
| `opinion` | "what do you think about X?" |
| `explanation` | "how does X work?", "why is Y?" |
| `followup` | "tell me more", "what else?", "and then?" |
| `humor` | jokes, sarcasm, playful messages |

Also expand subcategories within existing intents. Target: **300+ responses across 14 intents and 40+ subcategories**.

Cost impact: **$0 per message** — same ~35 questions, just better routing.

### 2.2 — Template Responses With Slots [DONE]

Replace some static responses with templates that code fills dynamically:

```js
// Static (current):
"I can't check the weather for you."

// Template (improved):
"I can't {action} for you, but {alternative}."
// Filled by code: "I can't check the weather for you, but your phone's weather app should have you covered."
```

Jev picks the template. Code fills the slots from a lookup table. Responses feel tailored instead of canned.

Cost impact: **$0 per message** — slot filling is pure code.

### 2.3 — Deeper Scoring Dimensions [DONE]

Add scoring dimensions for smarter selection:

| New Dimension | What It Measures |
|--------------|-----------------|
| Specificity | How precisely does it address this *exact* message? |
| Humor match | Is the response's humor level appropriate? |
| Completeness | Does it leave the user hanging? |
| Natural flow | Would this feel natural in conversation? |

Cost impact: **+50% on Call 2** (from 20 → 30 questions). Latency barely changes since questions run in parallel.

### 2.4 — Confidence-Gated LLM Fallback [DONE]

When Jev's best score is below a threshold, fall back to a real LLM:

```
best score > 0.7   →  serve Jev response      (80-90% of messages, $0.0001)
best score 0.4-0.7 →  serve Jev + flag review  (5-10%, $0.0001)
best score < 0.4   →  call Claude Haiku         (5-10%, $0.005)
```

Covers everything while keeping costs low. Over time, analyze fallback cases and author new responses to shrink the fallback rate.

Cost impact: **~6x average increase** ($0.0001 → $0.0006), but handles 100% of messages.

### 2.5 — Larger Candidate Pools [DONE]

Scaled every subcategory from ~5 to 10 candidates. Bank grew from 169 to 400 responses.

```
 Candidates/subcat    Call 2 questions    Cost       Quality
 5 (v1)              30                  baseline   decent
 10 (current)        60                  2x         noticeably better
 20 (future)         120 or shortlisted  4x         very natural
```

### 2.6 — Two-Stage Selection [DONE]

Added Noul-based shortlisting for subcategories with >10 candidates. Cheap binary relevance filter narrows to top 5 before deep scoring.

```
Call 1: Classify (~19 questions)
Call 2: Shortlist with Noul (1 question per candidate, cheap) → top 5
Call 3: Deep 6-dimension scoring on top 5 (30 questions)
```

Currently all subcategories have exactly 10 candidates, so shortlisting is bypassed. It activates automatically as banks grow past the threshold.

### Improvement Path (all phases complete)

```
  v1 (initial)      v2 (all phases done)
  ──────────────────────────────────────────────────────────────
  "chatbot"      →  "LLM-grade (with fallback)"
  $0.0001/msg       $0.0001 (Jev) / $0.0006 (avg with fallback)
  103 responses      400 responses + templates + 6 dims + shortlist
  9 intents          14 intents, 38 subcategories
  4 dimensions       6 dimensions + 3 weight profiles
  no fallback        confidence-gated LLM fallback
```
