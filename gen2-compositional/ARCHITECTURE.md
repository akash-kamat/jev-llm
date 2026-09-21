  # Gen2: Compositional Generation Architecture

## Overview

**Generation 2** is a compositional text generation system that builds responses dynamically from semantic decisions and phrase-level building blocks, rather than selecting from pre-written complete responses.

### Key Improvements Over Gen1

| Feature | Gen1 (Selection) | Gen2 (Compositional) |
|---------|------------------|---------------------|
| **Response Pool** | 550 pre-written responses | ~100 phrases → 10,000+ unique combinations |
| **Variety** | Limited to what's written | Infinite compositional variety |
| **Multi-Intent** | Picks one intent only | Handles multiple intents in one response |
| **Customization** | Requires writing complete responses | Add phrases, automatically combines |
| **Context Depth** | Surface-level matching | Deep semantic understanding + tools |
| **Extensibility** | Hard (write full responses) | Easy (add building blocks) |
| **Tool Integration** | None | Math, knowledge, time, code execution |

---

## Core Architecture

### Three-Layer System

```
┌─────────────────────────────────────────────┐
│   Layer 1: Semantic Planning (Jev)          │
│   - Understand intent, context, emotion     │
│   - Decide WHAT to say (not HOW)           │
│   - Determine if tools needed               │
│   API Calls: 1-2                            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   Layer 2: Phrase Selection (Jev)           │
│   - Pick phrases matching semantic plan     │
│   - Consider formality, tone, context       │
│   API Calls: 1-2 (can batch with Layer 1)  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│   Layer 3: Assembly (Code + Grammar)        │
│   - Smart joining with punctuation          │
│   - Handle multi-intent composition         │
│   - No API calls (instant)                  │
└─────────────────────────────────────────────┘
```

**Total: 2-3 API calls (~300-450ms) vs Gen1's 2 calls**

---

## Implementation Phases

### ✅ Phase 1: Core Classification & Planning

**Goal:** Build the semantic understanding layer

**Components:**
- [x] Intent classifier (supports multiple intents per message)
- [x] Context analyzer (formality, emotion, complexity)
- [x] Response structure planner
- [x] Multi-intent detection and prioritization

**Jev Questions:**
```javascript
{
  primary_intent: "choice",      // Main intent
  secondary_intents: "noul×N",   // Other intents present
  formality: "score",            // 0-4 scale
  emotional_intensity: "score",  // 0-4 scale
  complexity: "score",           // How complex is the query
  response_structure: "choice"   // How to organize response
}
```

**Example Input:** "Hey! What's 50*12? Also what can you do?"

**Classification Output:**
```javascript
{
  intents: [
    { type: "greeting", priority: 2, confidence: 0.94 },
    { type: "math_calculation", priority: 1, confidence: 0.98 },
    { type: "capability_query", priority: 1, confidence: 0.91 }
  ],
  formality: 1,
  emotional_intensity: 0,
  complexity: 2,
  response_structure: "sequential_address" // Address each intent in order
}
```

**Files:**
- `gen2-compositional/classifier.js`
- `gen2-compositional/planner.js`

---

### ✅ Phase 2: Phrase Library & Selection

**Goal:** Build compositional phrase library and selection logic

**Components:**
- [x] Phrase library (organized by semantic function)
- [x] Phrase selector (Jev-driven)
- [x] Formality/tone filtering
- [x] Context-aware phrase matching

**Phrase Library Structure:**
```javascript
const phrases = {
  greetings: {
    casual: [
      { id: "hey", text: "Hey", formality: 0, energy: "high" },
      { id: "hey_there", text: "Hey there", formality: 1, energy: "high" },
      { id: "hi", text: "Hi", formality: 1, energy: "medium" }
    ],
    neutral: [
      { id: "hello", text: "Hello", formality: 3, energy: "low" }
    ]
  },
  
  acknowledgments: [
    { id: "sure", text: "Sure!", formality: 1, context: "accepting_request" },
    { id: "got_it", text: "Got it", formality: 1, context: "understanding" },
    { id: "absolutely", text: "Absolutely", formality: 2, context: "affirming" }
  ],
  
  capability_intros: [
    { id: "i_can", text: "I can help you", formality: 1 },
    { id: "i_help_with", text: "I help with", formality: 2 },
    { id: "my_capabilities", text: "My capabilities include", formality: 3 }
  ],
  
  questions: {
    clarifying: [
      { id: "what_need", text: "What do you need?", formality: 1 },
      { id: "what_specific", text: "What specifically?", formality: 1 },
      { id: "how_help", text: "How can I help?", formality: 2 }
    ],
    followup: [
      { id: "anything_else", text: "Anything else?", formality: 1 },
      { id: "what_else", text: "What else can I do?", formality: 1 }
    ]
  },
  
  connectors: [
    { id: "also", text: "Also", formality: 1, usage: "adding_info" },
    { id: "and", text: "And", formality: 1, usage: "continuing" },
    { id: "plus", text: "Plus", formality: 1, usage: "adding_info" },
    { id: "additionally", text: "Additionally", formality: 3, usage: "adding_info" }
  ],
  
  result_presenters: {
    math: [
      { id: "direct", format: "{expression} = {answer}", formality: 1 },
      { id: "explained", format: "That's {answer}", formality: 1 },
      { id: "formal", format: "The result is {answer}", formality: 3 }
    ],
    knowledge: [
      { id: "is_definition", format: "{term} is {definition}", formality: 2 },
      { id: "explained", format: "{term} means {definition}", formality: 1 }
    ]
  }
};
```

**Selection Logic:**
```javascript
// Jev picks phrases based on semantic plan
const selectedPhrases = await selectPhrases({
  structure: ["greeting", "acknowledgment", "result", "followup"],
  formality: 1,
  context: { has_calculation: true, has_question: true }
});

// Result:
{
  greeting: "Hey",
  acknowledgment: "Sure!",
  result_intro: null,
  followup: "Anything else?"
}
```

**Files:**
- `gen2-compositional/phrases/library.js`
- `gen2-compositional/phrases/selector.js`

---

### ✅ Phase 3: Grammar-Based Assembly

**Goal:** Intelligently combine phrases into natural responses

**Components:**
- [x] Grammar rules for composition
- [x] Punctuation engine
- [x] Multi-intent response assembler
- [x] Natural language flow optimizer

**Assembly Rules:**
```javascript
const grammarRules = {
  // Single intent responses
  simple_greeting: {
    structure: ["{greeting}{punctuation}"],
    punctuation: { greeting: "!" }
  },
  
  greeting_with_question: {
    structure: ["{greeting}{punct}", "{question}{punct}"],
    punctuation: { greeting: "!", question: "?" }
  },
  
  // Multi-intent responses
  multi_intent_sequential: {
    structure: [
      "{greeting}{punct}",
      "{response_part_1}{punct}",
      "{connector}",
      "{response_part_2}{punct}",
      "{followup}{punct}"
    ],
    join: " ",
    punctuation: "smart" // Analyze context
  },
  
  // Tool result integration
  with_calculation: {
    structure: [
      "{greeting?}{punct}",
      "{acknowledgment?}{punct}",
      "{result_presentation}",
      "{followup?}{punct}"
    ]
  }
};
```

**Smart Punctuation:**
```javascript
function smartPunctuate(phrase, position, context) {
  // End of response
  if (position === "end") {
    return phrase.endsWith("?") ? "" : ".";
  }
  
  // After greeting
  if (context.type === "greeting") {
    return context.energy === "high" ? "!" : ".";
  }
  
  // After acknowledgment
  if (context.type === "acknowledgment") {
    return context.formality <= 1 ? "!" : ".";
  }
  
  // Default
  return ".";
}
```

**Multi-Intent Assembly Example:**

Input: "Hey! What's 50*12? What can you do?"

Intents: [greeting, math, capability_query]

Assembly:
```javascript
const parts = [
  { type: "greeting", text: "Hey", punct: "!" },
  { type: "acknowledgment", text: "Sure", punct: "!" },
  { type: "math_result", text: "50 × 12 = 600", punct: "." },
  { type: "connector", text: "Also", punct: "" },
  { type: "capability_intro", text: "I can help with", punct: "" },
  { type: "capability_list", text: "calculations, questions, and planning", punct: "." },
  { type: "followup", text: "What else?", punct: "?" }
];

// Assembled: "Hey! Sure! 50 × 12 = 600. Also, I can help with calculations, questions, and planning. What else?"
```

**Files:**
- `gen2-compositional/assembler/grammar-rules.js`
- `gen2-compositional/assembler/composer.js`
- `gen2-compositional/assembler/punctuation.js`

---

### ✅ Phase 4: Response Orchestration

**Goal:** Tie everything together into the main response pipeline

**Components:**
- [x] Main `respond()` function
- [x] Pipeline orchestrator
- [x] Error handling and fallbacks
- [x] Response validation

**Pipeline Flow:**
```javascript
async function respond(userMessage) {
  // Step 1: Classify (Layer 1)
  const classification = await classifyMessage(userMessage);
  
  // Step 2: Plan response structure (Layer 1)
  const plan = await planResponse(userMessage, classification);
  
  // Step 3: Select phrases (Layer 2)
  const phrases = await selectPhrases(plan, classification);
  
  // Step 4: Assemble (Layer 3 - code)
  const response = assembleResponse(phrases, plan, classification);
  
  return {
    response,
    meta: {
      intents: classification.intents,
      structure: plan.structure,
      phrases_used: phrases,
      api_calls: 3,
      timing: { /* ... */ }
    }
  };
}
```

**Error Handling:**
```javascript
// If classification confidence is low
if (classification.confidence < 0.3) {
  return fallbackResponse(userMessage);
}

// If response seems incomplete
if (!validateResponse(response)) {
  return addSafetyPhrase(response);
}
```

**Files:**
- `gen2-compositional/index.js`
- `gen2-compositional/orchestrator.js`

---

### ✅ Phase 5: Testing & Comparison Suite

**Goal:** Prove gen2 is better than gen1

**Components:**
- [ ] Test cases covering all scenarios
- [ ] Gen1 vs Gen2 comparison
- [ ] Variety measurement
- [ ] Multi-intent test cases

**Test Scenarios:**
```javascript
const testCases = [
  // Simple greeting
  {
    input: "Hey!",
    expected_intents: ["greeting"],
    gen1_possible_responses: 8,  // Limited to greeting subcategory
    gen2_possible_responses: "50+" // Combinatorial
  },
  
  // Multi-intent
  {
    input: "Hi! How are you? What can you do?",
    expected_intents: ["greeting", "personal_question", "capability_query"],
    gen1_behavior: "Picks one intent only",
    gen2_behavior: "Addresses all three"
  },
  
  // Complex query
  {
    input: "Hey I'm confused about coding, can you help?",
    expected_intents: ["greeting", "emotional_state", "help_request"],
    gen1_behavior: "Generic help response",
    gen2_behavior: "Acknowledges confusion, offers specific coding help"
  }
];
```

**Variety Test:**
```javascript
// Generate 100 responses to same input
const responses = [];
for (let i = 0; i < 100; i++) {
  responses.push(await respond("Hey!"));
}

// Measure uniqueness
const uniqueResponses = new Set(responses.map(r => r.response));
console.log(`Gen2 variety: ${uniqueResponses.size}/100 unique`);
// Expected: 40-60 unique (high variety)
// Gen1: 1-3 unique (picks from same small pool)
```

**Files:**
- `gen2-compositional/test.js`
- `gen2-compositional/benchmark.js`

---

### ✅ Phase 6: Tool/Capability System (FINAL PHASE)

**Goal:** Make the system actually useful beyond conversation

**Components:**
- [x] Tool registry and routing
- [x] Math/calculator tool
- [x] Knowledge base tool (Wikipedia + Wikidata + DDG dictionary)
- [x] Date/time tool (local + world time via DDG)
- [ ] Code execution tool (future)
- [x] Tool result integration

#### Tool Architecture

```javascript
// Tool registry
const tools = {
  math: {
    detect: (classification) => {
      return classification.intents.some(i => 
        i.type === "math_calculation" || 
        i.type === "computation"
      );
    },
    execute: async (userMessage, context) => {
      const expression = extractMathExpression(userMessage);
      const result = await calculateMath(expression);
      return {
        type: "math",
        expression,
        answer: result,
        format: "equation"
      };
    },
    responseIntegration: "inline" // Embed in response
  },
  
  knowledge: {
    detect: (classification) => {
      return classification.intents.some(i => 
        i.type === "knowledge_question" ||
        i.type === "definition_request"
      );
    },
    execute: async (userMessage, context) => {
      const query = extractQuery(userMessage);
      const knowledge = await lookupKnowledge(query);
      return {
        type: "knowledge",
        query,
        definition: knowledge.definition,
        details: knowledge.details
      };
    },
    responseIntegration: "inline"
  },
  
  datetime: {
    detect: (classification) => {
      return classification.intents.some(i => 
        i.type === "time_query" ||
        i.type === "date_query"
      );
    },
    execute: async (userMessage, context) => {
      const queryType = detectTimeQuery(userMessage);
      return {
        type: "datetime",
        current: new Date(),
        formatted: formatTime(queryType)
      };
    },
    responseIntegration: "inline"
  }
};
```

#### Tool-Enhanced Pipeline

```javascript
async function respondWithTools(userMessage) {
  // Step 1: Classify
  const classification = await classifyMessage(userMessage);
  
  // Step 2: Detect and execute tools
  const toolResults = [];
  for (const [toolName, tool] of Object.entries(tools)) {
    if (tool.detect(classification)) {
      const result = await tool.execute(userMessage, classification);
      toolResults.push(result);
    }
  }
  
  // Step 3: Plan response (incorporating tool results)
  const plan = await planResponse(userMessage, classification, toolResults);
  
  // Step 4: Select phrases
  const phrases = await selectPhrases(plan, classification);
  
  // Step 5: Assemble (with tool results)
  const response = assembleResponse(phrases, plan, classification, toolResults);
  
  return response;
}
```

#### Example: Math Tool Integration

**Input:** "Hey! What's 156 * 23?"

**Pipeline:**
1. Classify: [greeting, math_calculation]
2. Tool detected: math
3. Execute tool: `156 * 23 = 3588`
4. Plan: greeting → result → followup
5. Select phrases: "Hey!" / "Sure!" / "Anything else?"
6. Assemble: "Hey! Sure! 156 × 23 = 3588. Anything else?"

#### Example: Multi-Tool

**Input:** "What's 50*12 and what time is it?"

**Pipeline:**
1. Classify: [math_calculation, time_query]
2. Tools detected: math + datetime
3. Execute both:
   - Math: `50 * 12 = 600`
   - Time: `3:45 PM`
4. Plan: result1 → connector → result2 → followup
5. Assemble: "50 × 12 = 600. Also, it's 3:45 PM. What else?"

#### Tool Implementation

**Math Tool** (`tools/math.js`):
```javascript
const math = require('mathjs');

async function executeMath(expression) {
  try {
    const result = math.evaluate(expression);
    return {
      success: true,
      expression: expression,
      answer: result,
      formatted: `${expression} = ${result}`
    };
  } catch (error) {
    return {
      success: false,
      error: "Invalid math expression"
    };
  }
}
```

**Knowledge Tool** (`tools/knowledge.js`):
```javascript
const knowledgeBase = require('./knowledge-base.json');

async function lookupKnowledge(query) {
  const normalized = query.toLowerCase().trim();
  
  if (knowledgeBase[normalized]) {
    return {
      success: true,
      term: query,
      definition: knowledgeBase[normalized].definition,
      details: knowledgeBase[normalized].details
    };
  }
  
  // Fallback: try ConceptNet API
  return await queryConceptNet(query);
}
```

**DateTime Tool** (`tools/datetime.js`):
```javascript
function getDateTime(queryType) {
  const now = new Date();
  
  switch(queryType) {
    case "time":
      return now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    case "date":
      return now.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    case "day":
      return now.toLocaleDateString('en-US', { weekday: 'long' });
    default:
      return now.toLocaleString();
  }
}
```

**Files:**
- `gen2-compositional/tools/registry.js`
- `gen2-compositional/tools/math.js`
- `gen2-compositional/tools/knowledge.js`
- `gen2-compositional/tools/datetime.js`
- `gen2-compositional/tools/knowledge-base.json`

---

## Project Structure

```
gen2-compositional/
├── ARCHITECTURE.md          # This file
├── index.js                 # Main entry point
├── orchestrator.js          # Pipeline coordinator
│
├── classification/
│   ├── classifier.js        # Multi-intent classification
│   └── planner.js          # Response structure planning
│
├── phrases/
│   ├── library.js          # Complete phrase library
│   └── selector.js         # Jev-driven phrase selection
│
├── assembler/
│   ├── grammar-rules.js    # Composition grammar
│   ├── composer.js         # Main assembly logic
│   └── punctuation.js      # Smart punctuation engine
│
├── tools/
│   ├── registry.js         # Tool detection & routing
│   ├── math.js            # Math calculations
│   ├── knowledge.js       # Knowledge lookup
│   ├── datetime.js        # Time/date queries
│   └── knowledge-base.json # Curated knowledge
│
├── test.js                 # Test suite
├── benchmark.js            # Gen1 vs Gen2 comparison
└── README.md              # Usage guide
```

---

## Performance Targets

| Metric | Target | Gen1 Baseline |
|--------|--------|---------------|
| **Latency** | < 500ms | ~300ms |
| **Variety** | 50+ unique per prompt | 1-3 unique |
| **Multi-intent** | Handle 3+ intents | 1 intent only |
| **Tool calls** | < 200ms overhead | N/A |
| **Cost per response** | < $0.004 | ~$0.002 |

---

## Testing Checklist

After each phase:

- [ ] Unit tests pass
- [ ] Integration with previous phases works
- [ ] Performance within targets
- [ ] Examples produce natural responses
- [ ] Better than gen1 equivalent (if applicable)

Final validation:
- [ ] 100 test cases pass
- [ ] Variety test shows 40+ unique responses
- [ ] Multi-intent handling works
- [ ] Tools integrate seamlessly
- [ ] Overall better than gen1

---

## Next Steps

1. **Phase 1**: Build classifier with multi-intent support
2. **Phase 2**: Create phrase library (start with ~50 phrases)
3. **Phase 3**: Implement assembly engine
4. **Phase 4**: Wire up orchestrator
5. **Phase 5**: Create test suite and prove superiority
6. **Phase 6**: Add tools (math first, then others)

**Ready to start implementation!**
