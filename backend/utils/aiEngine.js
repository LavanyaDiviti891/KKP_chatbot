// 🔥 HYBRID AI ENGINE (Rule + NLP)

// -----------------------------
// 🧠 INTENT DEFINITIONS
// -----------------------------
const intents = [
  {
    name: "highest_sales",
    patterns: [
      "highest sales",
      "max sales",
      "top sales day",
      "which day sold most",
      "best day"
    ]
  },
  {
    name: "lowest_sales",
    patterns: [
      "lowest sales",
      "minimum sales",
      "worst day"
    ]
  },
  {
    name: "top_agent",
    patterns: [
      "top agent",
      "best agent",
      "who sold most",
      "highest performer"
    ]
  },
  {
    name: "trend",
    patterns: [
      "trend",
      "sales trend",
      "increase or decrease",
      "growth"
    ]
  },
  {
    name: "forecast",
    patterns: [
      "forecast",
      "predict",
      "future sales",
      "next days",
      "prediction"
    ]
  },
  {
    name: "high_value",
    patterns: [
      "high value",
      "big orders",
      "large sales"
    ]
  }
];

// -----------------------------
// 🧠 TEXT CLEANING
// -----------------------------
function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

// -----------------------------
// 🧠 SIMPLE SIMILARITY (Jaccard)
// -----------------------------
function similarity(a, b) {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  const intersection = [...setA].filter(x => setB.has(x));
  return intersection.length / (setA.size + setB.size - intersection.length);
}

// -----------------------------
// 🧠 DETECT INTENT (HYBRID)
// -----------------------------
function detectIntent(question) {
  const q = cleanText(question);

  let bestIntent = "unknown";
  let bestScore = 0;

  intents.forEach(intent => {
    intent.patterns.forEach(pattern => {
      const score = similarity(q, pattern);

      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent.name;
      }
    });
  });

  return bestScore > 0.2 ? bestIntent : "unknown";
}

// -----------------------------
// 🧠 ENTITY EXTRACTION
// -----------------------------
function extractEntities(question) {
  const numbers = question.match(/\d+/g);
  return {
    days: numbers ? parseInt(numbers[0]) : null
  };
}

// -----------------------------
// 🧠 RESPONSE GENERATOR
// -----------------------------
function generateResponse(intent, data, entities, insights) {
  try {
    switch (intent) {

      case "highest_sales": {
        const res = insights.highestSalesDay(data);
        return `📈 Day ${res.day} had highest sales ₹${res.revenue}`;
      }

      case "lowest_sales": {
        const res = insights.lowestSalesDay(data);
        return `📉 Day ${res.day} had lowest sales ₹${res.revenue}`;
      }

      case "top_agent": {
        const res = insights.topAgent(data);
        return `🏆 Top agent is ${res.agent} with ₹${res.revenue}`;
      }

      case "trend": {
        const trend = insights.getTrend(data);
        return `📊 Sales trend is ${trend}`;
      }

      case "high_value": {
        const orders = insights.highValueOrders(data);
        return `💰 Found ${orders.length} high value orders`;
      }

      case "forecast": {
        const days = entities.days || 3;

        // 🔥 simple prediction (avg based)
        const avg =
          data.reduce((sum, d) => sum + d.revenue, 0) / data.length;

        const prediction = Math.round(avg * days);

        return `🔮 Estimated revenue for next ${days} days is ₹${prediction}`;
      }

      default:
        return "🤖 I didn’t understand. Try asking about sales, agents, or trends.";
    }
  } catch (err) {
    console.error("AI ERROR:", err);
    return "⚠️ Error generating response";
  }
}

module.exports = {
  detectIntent,
  extractEntities,
  generateResponse
};