const stringSimilarity = require("string-similarity");

const intents = {
  HIGHEST_DAY: [
    "highest sales",
    "best day",
    "top day",
    "maximum revenue",
    "best sales day",
    "which day performed best"
  ],

  LOWEST_DAY: [
    "lowest sales",
    "worst day",
    "minimum sales",
    "least revenue"
  ],

  TOP_AGENT: [
    "top agent",
    "best agent",
    "highest performing agent"
  ],

  COMPARE: [
    "compare agents",
    "agent comparison",
    "list top agents",
    "who are best agents",
    "show agent performance"
  ],

  TREND: [
    "sales trend",
    "trend",
    "is sales increasing",
    "growth trend"
  ],

  HIGH_VALUE: [
    "high value orders",
    "expensive orders",
    "big orders"
  ],

  CONFIRMED_ORDERS: [
    "confirmed orders",
    "how many confirmed",
    "count confirmed orders"
  ]
};

function detectIntent(q) {
  q = q.toLowerCase();

  if (q.includes("best") || q.includes("highest") || q.includes("top")) {
    return "HIGHEST_DAY";
  }

  if (q.includes("lowest") || q.includes("least") || q.includes("worst")) {
    return "LOWEST_DAY";
  }

  if (q.includes("compare")) {
    return "COMPARE";
  }

  if (q.includes("trend")) {
    return "TREND";
  }

  if (q.includes("agent")) {
    return "TOP_AGENT";
  }

  if (q.includes("confirmed")) {
    return "CONFIRMED_ORDERS";
  }


  let bestIntent = "UNKNOWN";
  let bestScore = 0;

  for (const intent in intents) {
    const match = stringSimilarity.findBestMatch(q, intents[intent]);

    if (match.bestMatch.rating > bestScore) {
      bestScore = match.bestMatch.rating;
      bestIntent = intent;
    }
  }

  console.log(" Similarity Score:", bestScore);

  return bestScore > 0.25 ? bestIntent : "UNKNOWN";
}

function extractEntities(q) {
  const numberMatch = q.match(/\d+/);

  return {
    day: numberMatch ? parseInt(numberMatch[0]) : null
  };
}

function generateResponse(intent) {
  switch (intent) {
    case "UNKNOWN":
      return " I didn’t understand. Try asking about sales, agents, or trends.";

    default:
      return "Processing your request...";
  }
}

module.exports = {
  detectIntent,
  extractEntities,
  generateResponse
};