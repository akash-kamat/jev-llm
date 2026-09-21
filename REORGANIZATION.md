# Project Reorganization Summary

## What Changed

The project has been reorganized to separate two different approaches:

### Generation 1: Selection-Based (in `gen1-selection-based/`)

**Original system** - Selects ONE complete response from 550+ pre-written responses.

**Files moved:**
- `index.js` → `gen1-selection-based/index.js`
- `jev-llm.js` → `gen1-selection-based/jev-llm.js`
- `response-bank.js` → `gen1-selection-based/response-bank.js`
- `templates.js` → `gen1-selection-based/templates.js`
- `llm-fallback.js` → `gen1-selection-based/llm-fallback.js`
- `test.js` → `gen1-selection-based/test.js`

### Generation 2: Compositional (in `gen2-compositional/`)

**New compositional system** - Builds responses dynamically using:
- Semantic planning (Jev decides WHAT to say)
- Phrase-level selection (~100 phrases → 10,000+ combinations)
- Grammar-based assembly (code handles HOW to say it)
- Tool integration (math, knowledge, time, etc.)

**Folder:**
- `gen2-compositional/` - Complete gen2 implementation
- `gen2-compositional/ARCHITECTURE.md` - Full design specification with 6 implementation phases

## Updated References

### package.json
```json
{
  "main": "gen1-selection-based/index.js",
  "scripts": {
    "start": "node gen1-selection-based/index.js",
    "test": "node gen1-selection-based/test.js",
    "test:gen2": "node test-compositional.js"
  }
}
```

### API Files
- `api/chat.js` - Updated to import from `gen1-selection-based/`
- `api/pipeline.js` - Updated to import from `gen1-selection-based/`

## Running the Systems

### Gen1 (Selection-Based)
```bash
# Interactive CLI
npm start

# Or directly
node gen1-selection-based/index.js
```

### Gen2 (Compositional)
```bash
# Once implemented
node gen2-compositional/index.js

# Or via package.json (after setup)
npm run gen2
```

## API Endpoints

Both API endpoints (`/api/chat` and `/api/pipeline`) continue to use **Gen1** by default.

To switch to Gen2, the API files would need to import from `gen2-compositional/` instead.

## Why This Reorganization?

1. **Clarity** - Separate two fundamentally different approaches
2. **Experimentation** - Test compositional approach without breaking existing system
3. **Comparison** - Easy to A/B test both systems
4. **Migration** - If Gen2 proves better, gradual migration is easier

## Next Steps

1. Test both systems with real users
2. Compare quality, variety, and user satisfaction
3. Decide whether to migrate to Gen2
4. If migrating, update API endpoints to use Gen2
