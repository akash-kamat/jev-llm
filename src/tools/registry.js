const mathTool = require("./math");
const datetimeTool = require("./datetime");
const knowledgeTool = require("./knowledge");

const tools = {
  math: mathTool,
  datetime: datetimeTool,
  knowledge: knowledgeTool,
};

function detectTools(classification) {
  const matched = [];
  for (const [name, tool] of Object.entries(tools)) {
    if (tool.detect(classification)) {
      matched.push(name);
    }
  }
  return matched;
}

async function executeTools(matched, userMessage, classification) {
  const results = [];
  for (const name of matched) {
    const tool = tools[name];
    const result = await tool.execute(userMessage, classification);
    if (result) results.push(result);
  }
  return results;
}

module.exports = { tools, detectTools, executeTools };
