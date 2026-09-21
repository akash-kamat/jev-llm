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

### Generation 2: Compositional (in project root)

**New experimental system** - Composes responses from ~50 building blocks into thousands of combinations.

**Files:**
- `jev-compositional-example.js` - Core compositional logic
- `test-compositional.js` - Test runner for gen2

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
# Test runner
npm run test:gen2

# Or directly
node test-compositional.js
```

## API Endpoints

Both API endpoints (`/api/chat` and `/api/pipeline`) continue to use **Gen1** by default.

To switch to Gen2, the API files would need to import from the root-level compositional files instead.

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
