const { evaluate } = require("mathjs");

function detect(classification) {
  return classification.intents.some(
    (i) => i.type === "math_calculation"
  );
}

function extractExpression(userMessage) {
  let msg = userMessage;

  // Handle "X% of Y" pattern before cleaning
  const percentOfMatch = msg.match(/(\d+\.?\d*)\s*%\s*of\s*(\d+\.?\d*)/i);
  if (percentOfMatch) {
    return `(${percentOfMatch[1]}/100) * ${percentOfMatch[2]}`;
  }

  // Remove common question framing
  msg = msg.replace(/what('s| is| are)\s*/gi, "");
  msg = msg.replace(/calculate\s*/gi, "");
  msg = msg.replace(/compute\s*/gi, "");
  msg = msg.replace(/how much is\s*/gi, "");
  msg = msg.replace(/solve\s*/gi, "");
  msg = msg.replace(/the answer to\s*/gi, "");
  msg = msg.replace(/\?/g, "");

  const patterns = [
    /(sqrt\s*\(\s*[\d.]+\s*\))/i,
    /(log\s*\(\s*[\d.]+\s*\))/i,
    /([\d.]+\s*[x×]\s*[\d.]+)/i,
    /([\d.]+\s*\*\*\s*[\d.]+)/,
    /([\d.][\d.\s]*[\+\-\*\/\^\%]\s*[\d.\s\+\-\*\/\^\%\(\)]+)/,
  ];

  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      let expr = match[1].trim();
      expr = expr.replace(/[x×]/gi, "*");
      return expr;
    }
  }

  return null;
}

function formatExpression(expr) {
  return expr
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ")
    .replace(/\+/g, " + ")
    .replace(/(?<!\d)-(?=\d)/g, " - ")
    .replace(/\s+/g, " ")
    .trim();
}

async function execute(userMessage) {
  const percentOfMatch = userMessage.match(/(\d+\.?\d*)\s*%\s*of\s*(\d+\.?\d*)/i);
  const expression = extractExpression(userMessage);

  if (!expression) {
    return {
      type: "math",
      success: false,
      error: "Couldn't find a math expression",
    };
  }

  try {
    const answer = evaluate(expression);
    let displayExpr;
    if (percentOfMatch) {
      displayExpr = `${percentOfMatch[1]}% of ${percentOfMatch[2]}`;
    } else {
      displayExpr = formatExpression(expression);
    }

    return {
      type: "math",
      success: true,
      expression: displayExpr,
      answer: Number(answer),
      formatted: `${displayExpr} = ${answer}`,
    };
  } catch (err) {
    return {
      type: "math",
      success: false,
      expression,
      error: err.message,
    };
  }
}

module.exports = { detect, execute };
