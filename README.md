# Jev LLM

**An "LLM" built without a language model.** Zero text generation. Zero hallucination. Every response was written by a human.

[TypeSafe's Jev](https://typesafe.ai) is a non-generative AI — it returns typed judgments, not text. This project turns those judgments into a full conversational agent: 400 human-authored responses, multi-dimensional scoring, and contextual selection that makes it *feel* generative.

```
You: what is the purpose of life?
Jev: That's one of the big questions. I think purpose isn't found — it's built,
     through the things you care about and the people you show up for.

     Source: jev | Score: 0.82 | Intent: explanation/why | 847ms
```

No token was generated. Jev read 10 candidate responses and picked the one that best fit — scoring it across 6 dimensions in parallel.

---

## How it works

**2 API calls. ~800ms. ~$0.0001 per message.**

```
                          User message
                               │
                               ▼
              ┌────────────────────────────────┐
              │     CALL 1: CLASSIFY (400ms)   │
              │                                │
              │  19 questions, 1 Jev call:      │
              │  ├─ Intent    (Choice)          │
              │  ├─ Formality (Score 0-4)       │
              │  ├─ Emotion   (Score 0-4)       │
              │  ├─ Needs human? (Noul 0-1)     │
              │  └─ Subcategory per intent      │
              │     (speculative fan-out)       │
              └───────────────┬────────────────┘
                              │
                     Gate checks:
                     needs_human > 0.8 → escalate
                     confidence < 0.3  → fallback
                              │
                              ▼
              ┌────────────────────────────────┐
              │   FETCH CANDIDATES (0ms)       │
              │   Code looks up 10 responses   │
              │   by intent + subcategory      │
              └───────────────┬────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │     CALL 2: SCORE (400ms)      │
              │                                │
              │  Per candidate, score on:       │
              │  ├─ Relevance      (Score)      │
              │  ├─ Tone match     (Score)      │
              │  ├─ Helpfulness    (Score)      │
              │  ├─ Answers question (Noul)     │
              │  ├─ Specificity    (Score)      │
              │  └─ Natural flow   (Score)      │
              │                                │
              │  Context-aware weighted sum     │
              │  → Pick highest-scoring one     │
              └───────────────┬────────────────┘
                              │
                              ▼
                         Response ✓
```

**Speculative fan-out:** Call 1 asks the subcategory question for *every* intent in parallel — code only reads the answer for the winning intent. This eliminates a round trip without adding cost.

---

## What is Jev?

Jev (by [TypeSafe](https://typesafe.ai)) is a non-generative AI model. It has three primitives:

| Primitive | Returns | Example |
|-----------|---------|---------|
| **Choice** | Best pick + confidence + distribution over all options | "Which intent?" → `greeting (87%)` |
| **Score** | Position on an ordered scale + distribution | "How formal?" → `3.2 / 4.0` |
| **Noul** | Single 0-1 probability | "Needs human?" → `0.12` |

It cannot write a single word. But it can *judge* — and judgment is all you need for selection.

---

## Jev vs LLM

| | Jev LLM | Traditional LLM |
|---|---|---|
| **Hallucination** | Impossible — every response is human-authored | Inherent risk |
| **Prompt injection** | No attack surface — no generative layer | Ongoing vulnerability |
| **Cost per message** | ~$0.0001 | ~$0.01-0.10 |
| **Latency** | ~800ms (2 API calls) | 1-5s (token streaming) |
| **Brand safety** | Guaranteed — only pre-approved text | Needs guardrails |
| **Inspectability** | Full decision chain: intent → subcategory → scores → winner | Black box |
| **Handles anything** | No — needs candidates for each domain | Yes |
| **Factual depth** | Limited by response bank | Limited by training data |
| **Content generation** | Cannot (by design) | Core strength |

**Where Jev LLM wins:** Conversations where trust, consistency, and cost matter more than novelty — customer support, onboarding, game NPCs, FAQ bots, brand-safe assistants.

**Where it can't compete:** Open-ended generation, factual Q&A, writing tasks. (An optional LLM fallback catches these — see below.)

---

## Worked example

User sends: **"I'm really frustrated, my order has been wrong three times now"**

**Call 1 — Classify** (one API call, 19 parallel questions):
```
intent:              complaint        (91% confidence)
subcategory:         empathetic       (speculative fan-out, read after intent wins)
formality:           1.2 / 4.0       (casual)
emotional_intensity: 3.8 / 4.0       (very high)
needs_human:         0.34            (not yet — try first)
```

**Fetch candidates** — code pulls 10 responses from `complaint/empathetic`:
```
1. "I hear you — that's genuinely frustrating. Let me see what I can do."
2. "Three times is way too many. I'm sorry about that, let's sort this out."
3. "That sounds really frustrating. You shouldn't have to deal with that."
4. "I understand your frustration — repeated issues are unacceptable."
5. "I'm sorry this keeps happening. That's not the experience you should be having."
...
```

**Call 2 — Score** (one API call, 60 parallel questions):

| | Relevance | Tone | Helpful | Answers | Specificity | Natural | **Weighted** |
|---|---|---|---|---|---|---|---|
| #1 | 0.78 | 0.85 | 0.72 | 0.69 | 0.71 | 0.82 | **0.77** |
| #2 | 0.88 | 0.82 | 0.80 | 0.75 | 0.85 | 0.79 | **0.82** |
| #3 | 0.72 | 0.90 | 0.55 | 0.52 | 0.60 | 0.88 | **0.70** |

Because `emotional_intensity` is high, weight profile shifts: **tone gets 30% weight** instead of 20%.

**Winner:** Response #2 — *"Three times is way too many. I'm sorry about that, let's sort this out."*

Acknowledges the specific issue ("three times"), validates emotion, and offers to help. Jev picked it because it scored highest on specificity *and* tone — exactly what a frustrated user needs.

---

## The insight

> Selection works like wisdom, not knowledge.
> 
> A wise person doesn't compute novel answers — they draw from collected perspectives and pick the one that fits. Jev does the same thing: 400 human-written responses, contextually selected.
>
> This is why philosophical questions work *remarkably well* — philosophy has always been about selecting the right framing, not generating new information.

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

# Type "debug" to see scoring breakdown
# Type "quit" to exit

# Run test suite
node test.js
```

Optional: add `ANTHROPIC_API_KEY` in `.env` for LLM fallback on low-confidence responses.

---

## Architecture

```
generative-jev/
├── jev-llm.js           ← Engine: classify → shortlist → score → rank
├── response-bank.js     ← 400 responses across 14 intents, 38 subcategories
├── templates.js         ← Dynamic slot filling for template responses
├── llm-fallback.js      ← Optional confidence-gated LLM fallback
├── index.js             ← Interactive CLI with debug mode
└── test.js              ← 23 test cases
```

**14 intents:** greeting, farewell, gratitude, question, request, complaint, small talk, meta (capabilities/limits), opinion, explanation, followup, humor, confusion, fallback

**3 weight profiles:** default (balanced), complaint/high-emotion (tone-heavy), casual/humor (natural-flow-heavy)

**2-stage selection:** When a subcategory has >10 candidates, a cheap Noul shortlist narrows to 5 before deep scoring.

---

## What's next

- [ ] Factual answer templates with data-backed slot filling
- [ ] Honest limitation routing ("I can't write that, but here's what I can do")
- [ ] Adaptive fallback threshold tuning
- [ ] Response bank expansion to 1000+ candidates
- [ ] Multi-turn conversation state

---

## License

ISC
