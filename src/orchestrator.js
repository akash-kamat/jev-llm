const { classifyMessage } = require("./classification/classifier");
const { planResponse } = require("./classification/planner");
const { selectPhrases } = require("./phrases/selector");
const { assembleResponse } = require("./assembler/composer");
const { detectTools, executeTools } = require("./tools/registry");

async function respond(userMessage) {
  const startTime = Date.now();

  const classification = await classifyMessage(userMessage);
  classification.userMessage = userMessage;
  const classifyTime = Date.now() - startTime;

  const toolStart = Date.now();
  const matchedTools = detectTools(classification);
  const toolResults = await executeTools(matchedTools, userMessage, classification);
  const toolTime = Date.now() - toolStart;

  const plan = planResponse(classification);

  const selectStart = Date.now();
  const selections = await selectPhrases(plan, classification, toolResults);
  const selectTime = Date.now() - selectStart;

  const response = assembleResponse(selections, plan, classification, toolResults);

  return {
    response,
    meta: {
      intents: classification.intents,
      primaryIntent: classification.primaryIntent,
      formality: classification.formality,
      emotionalIntensity: classification.emotionalIntensity,
      complexity: classification.complexity,
      segments: plan.segments.map((s) => s.role),
      phrasesUsed: Object.entries(selections).map(([role, phrase]) => ({
        role,
        id: phrase.id,
        text: phrase.text || phrase.format,
      })),
      toolsUsed: matchedTools,
      toolResults: toolResults.map((t) => ({
        type: t.type,
        success: t.success,
        formatted: t.formatted,
      })),
      apiCalls: 2,
      timing: {
        classify: classifyTime,
        tools: toolTime,
        select: selectTime,
        total: Date.now() - startTime,
      },
    },
  };
}

module.exports = { respond };
