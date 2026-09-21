# Generation 2: Compositional Text Generation

Dynamic response generation using Jev-driven semantic decisions + phrase-level composition.

## Key Advantages Over Gen1

✅ **10,000+ unique responses** (vs 550 pre-written)  
✅ **Handles multiple intents** in one message  
✅ **Tool integration** (math, knowledge, time)  
✅ **Easy to extend** (add phrases, not complete responses)  
✅ **Natural variety** (compositional combinations)

## Architecture

**3-Layer System:**
1. **Semantic Planning** (Jev) - Understand intent, decide what to say
2. **Phrase Selection** (Jev) - Pick building blocks
3. **Assembly** (Code + Grammar) - Compose natural response

**Performance:** 2-3 API calls, ~300-450ms latency

## Implementation Status

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete design and phased implementation plan.

### Phases

- [x] Phase 1: Core Classification & Planning
- [x] Phase 2: Phrase Library & Selection
- [x] Phase 3: Grammar-Based Assembly
- [x] Phase 4: Response Orchestration
- [ ] Phase 5: Testing & Comparison Suite
- [ ] Phase 6: Tool/Capability System

## Quick Start

```bash
# Once implemented
node index.js

# Or via npm
npm run gen2
```

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete design specification
- **[../gen1-selection-based/README.md](../gen1-selection-based/README.md)** - Gen1 comparison

## Example

**Input:** "Hey! What's 50*12? Also what can you do?"

**Gen1 Output:** *(picks one intent, ignores others)*  
"Hey there! How can I help?"

**Gen2 Output:** *(handles all intents)*  
"Hey! Sure! 50 × 12 = 600. Also, I can help with calculations, questions, and planning. What else?"

---

**Ready to build!** Start with Phase 1 in ARCHITECTURE.md.
