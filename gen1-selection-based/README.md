# Generation 1: Selection-Based System

This folder contains the original **selection-based** Jev implementation.

## Architecture

**Core Principle**: Select ONE complete pre-written response from a bank of 550+ responses.

### Files

- **index.js** - Main CLI interface (interactive chat)
- **jev-llm.js** - Classification and scoring logic (2 Jev API calls)
- **response-bank.js** - 550+ pre-written responses organized by intent/subcategory
- **templates.js** - Template resolution for dynamic slots like {abilities}
- **llm-fallback.js** - Fallback to external LLM when confidence is low
- **test.js** - Test runner

### Pipeline (2 Jev API Calls)

1. **Classify** - Understand user intent, formality, emotion
2. **Score** - Evaluate all candidates on 6 dimensions, pick best

### Limitations

- Fixed response set (550 responses)
- Cannot combine or compose responses
- Adding variety requires writing many complete responses
- No dynamic adaptation of response length

### Usage

```bash
# Interactive CLI
npm start

# Or directly
node gen1-selection-based/index.js

# Test
node gen1-selection-based/test.js
```

### When to Use

- Need guaranteed safe, pre-approved responses
- Want zero hallucination risk
- Response bank is comprehensive
- Don't need dynamic composition

---

**See parent folder for Generation 2 (compositional system)**
