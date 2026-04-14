const stringSimilarity = require("string-similarity");

// ─── Intent phrase library ────────────────────────────────────────────────────
const intents = {
  HIGHEST_DAY: [
    "highest sales day", "best day", "top day", "maximum revenue day",
    "best sales day", "which day performed best", "most revenue day",
    "which day had most sales", "day with highest revenue",
    "what was the best day", "peak sales day", "day with maximum sales"
  ],
  LOWEST_DAY: [
    "lowest sales day", "worst day", "minimum sales day", "least revenue day",
    "which day had least sales", "day with lowest revenue",
    "what was the worst day", "poorest performing day"
  ],
  TOP_AGENT: [
    "top agent", "best agent", "highest performing agent",
    "who sold the most", "who is the best salesperson",
    "which agent made most revenue", "highest revenue agent",
    "best performing salesperson", "agent with most sales", "leading agent"
  ],
  AGENT_SALES: [
    "how much did agent sell", "sales by agent", "revenue of agent",
    "what did agent earn", "agent revenue", "agent sales total",
    "how much did person sell", "individual agent performance"
  ],
  COMPARE: [
    "compare agents", "agent comparison", "list top agents",
    "who are best agents", "show agent performance", "rank agents",
    "all agents revenue", "agents leaderboard", "show all agents",
    "agent rankings", "top 5 agents", "who performed better"
  ],
  TREND: [
    "sales trend", "trend", "is sales increasing", "growth trend",
    "how are sales going", "are sales going up", "sales direction",
    "revenue trend", "is revenue growing", "performance over time"
  ],
  HIGH_VALUE: [
    "high value orders", "expensive orders", "big orders",
    "orders above", "orders greater than", "large orders",
    "premium orders", "high revenue orders", "orders over"
  ],
  CONFIRMED_ORDERS: [
    "confirmed orders", "how many confirmed", "count confirmed orders",
    "number of confirmed", "total confirmed", "confirmed count"
  ],
  PENDING_ORDERS: [
    "pending orders", "how many pending", "unconfirmed orders",
    "orders not confirmed", "open orders"
  ],
  TOTAL_REVENUE: [
    "total revenue", "overall revenue", "total sales", "sum of revenue",
    "how much total", "grand total", "overall sales", "total earnings"
  ],
  ORDER_COUNT: [
    "how many orders", "total orders", "count orders", "number of orders",
    "order count", "total number of orders"
  ],
  AGENT_RANK: [
    "rank of agent", "where does agent stand", "agent position",
    "what rank is agent", "agent ranking"
  ],
  CONFIRMED_PERCENTAGE: [
    "percentage confirmed", "percent confirmed", "confirmation rate",
    "what percent orders confirmed", "ratio of confirmed"
  ],
  SUGGEST_PRODUCT: [
    "what product to buy", "which product should i purchase",
    "what should i order", "recommend a product", "product recommendation",
    "best product to invest in", "what to stock up on",
    "which product is worth buying", "suggest a product",
    "what product performs best", "which product has most demand",
    "what should i stock", "stock up", "what to buy",
    "what to purchase", "what to invest in", "which product",
    "what product", "should i buy", "should i stock",
    "good product", "best item to buy"
  ],
  SUGGEST_AGENT: [
    "which agent should i assign", "who should handle this",
    "recommend an agent", "best agent for the job",
    "which agent is most reliable", "suggest an agent",
    "who should i work with", "which salesperson to choose",
    "who to assign", "who to trust", "reliable agent"
  ],
  SUGGEST_STRATEGY: [
    "what should i focus on", "how can i improve sales",
    "suggest a strategy", "what strategy should i follow",
    "how to increase revenue", "how to boost sales",
    "what should i do next", "business advice",
    "how to improve performance", "what areas need attention",
    "how to grow the business", "what is the best course of action",
    "what strategy", "which strategy", "strategic recommendation",
    "what to do", "how to proceed", "what plan", "improvement plan",
    "what should i follow", "what should i do", "guide me",
    "what steps", "action plan", "growth plan", "sales plan",
    "how do i improve", "how do i grow", "what do i do",
    "what are the steps", "tell me what to do"
  ],
  SUGGEST_IMPROVEMENT: [
    "who needs improvement", "which agent is underperforming",
    "who should improve", "weakest agent", "lowest performer",
    "who is falling behind", "which agent needs help",
    "areas of improvement", "what needs to be fixed",
    "who is weak", "bad agent", "poor agent", "worst agent",
    "who is not performing", "low performing agent"
  ],
  FORECAST: [
    "what will sales be", "predict future sales", "sales forecast",
    "expected revenue", "future performance", "what to expect next",
    "sales prediction", "forecast revenue", "next month sales",
    "how will sales look", "project future revenue",
    "next week sales", "coming month", "upcoming sales",
    "what will happen", "future revenue", "future sales"
  ]
};

// ─── Detect Intent ────────────────────────────────────────────────────────────
function detectIntent(q) {
  q = q.toLowerCase().trim();

  // ── 1. FORECAST ──────────────────────────────────────────────────────────
  if (
    q.includes("forecast") || q.includes("predict") ||
    q.includes("future") || q.includes("next month") ||
    q.includes("next week") || q.includes("projection") ||
    q.includes("coming month") || q.includes("what will happen")
  ) return "FORECAST";

  // ── 2. SUGGEST_IMPROVEMENT ───────────────────────────────────────────────
  if (
    q.includes("who needs improvement") ||
    q.includes("weakest agent") ||
    q.includes("lowest performer") ||
    q.includes("worst agent") ||
    q.includes("poor agent") ||
    q.includes("who is not performing") ||
    q.includes("low performing") ||
    (q.includes("who") && q.includes("falling behind")) ||
    (q.includes("underperform") && q.includes("agent")) ||
    (q.includes("needs") && q.includes("improve") && q.includes("agent")) ||
    (q.includes("improve") && q.includes("agent") && !q.includes("how can i improve"))
  ) return "SUGGEST_IMPROVEMENT";

  // ── 3. SUGGEST_STRATEGY ──────────────────────────────────────────────────
  if (
    q.includes("strategy") ||
    q.includes("strategic") ||
    q.includes("what should i follow") ||
    q.includes("what plan") ||
    q.includes("action plan") ||
    q.includes("growth plan") ||
    q.includes("sales plan") ||
    q.includes("improvement plan") ||
    q.includes("how to proceed") ||
    q.includes("guide me") ||
    q.includes("tell me what to do") ||
    q.includes("what are the steps") ||
    q.includes("what steps") ||
    q.includes("how can i improve") ||
    q.includes("how do i improve") ||
    q.includes("how do i grow") ||
    q.includes("how to increase") ||
    q.includes("how to boost") ||
    q.includes("how to grow") ||
    q.includes("how to improve") ||
    q.includes("business advice") ||
    q.includes("what areas need") ||
    q.includes("focus on") ||
    (q.includes("what should i") && !q.includes("stock") && !q.includes("buy") && !q.includes("purchase") && !q.includes("order"))
  ) return "SUGGEST_STRATEGY";

  // ── 4. SUGGEST_PRODUCT ───────────────────────────────────────────────────
  if (
    q.includes("stock up") ||
    q.includes("what to buy") ||
    q.includes("should i buy") ||
    q.includes("what to purchase") ||
    q.includes("what to invest") ||
    q.includes("what to stock") ||
    q.includes("should i stock") ||
    q.includes("which product") ||
    q.includes("what product") ||
    q.includes("good product") ||
    q.includes("best item") ||
    q.includes("best product") ||
    (q.includes("recommend") && (q.includes("product") || q.includes("stock") || q.includes("buy") || q.includes("item"))) ||
    (q.includes("suggest") && (q.includes("product") || q.includes("stock") || q.includes("buy") || q.includes("item"))) ||
    (q.includes("what") && (q.includes("stock") || q.includes("purchase") || q.includes("invest")))
  ) return "SUGGEST_PRODUCT";

  // ── 5. SUGGEST_AGENT ─────────────────────────────────────────────────────
  if (
    (q.includes("recommend") || q.includes("suggest") || q.includes("assign") || q.includes("who should") || q.includes("who to")) &&
    (q.includes("agent") || q.includes("salesperson"))
  ) return "SUGGEST_AGENT";

  // ── 6. Agent-specific queries ────────────────────────────────────────────
  if (q.includes("compare") && (q.includes("agent") || q.includes("salesperson"))) return "COMPARE";
  if ((q.includes("rank") || q.includes("position") || q.includes("where does")) && q.includes("agent")) return "AGENT_RANK";
  if ((q.includes("how much") || q.includes("revenue") || q.includes("sales")) && q.includes("did") && !q.includes("day")) return "AGENT_SALES";

  // ── 7. Percentage / Ratio ────────────────────────────────────────────────
  if ((q.includes("percent") || q.includes("ratio") || q.includes("rate")) && q.includes("confirm")) return "CONFIRMED_PERCENTAGE";

  // ── 8. Status ────────────────────────────────────────────────────────────
  if (q.includes("confirmed") && !q.includes("percent") && !q.includes("ratio")) return "CONFIRMED_ORDERS";
  if (q.includes("pending")) return "PENDING_ORDERS";

  // ── 9. Totals ────────────────────────────────────────────────────────────
  if ((q.includes("total") || q.includes("overall") || q.includes("sum") || q.includes("grand")) && !q.includes("agent")) return "TOTAL_REVENUE";
  if (q.includes("how many orders") || q.includes("count orders") || q.includes("number of orders")) return "ORDER_COUNT";

  // ── 10. Trend ────────────────────────────────────────────────────────────
  if (q.includes("trend") || q.includes("going up") || q.includes("going down") || q.includes("increasing") || q.includes("decreasing")) return "TREND";

  // ── 11. High value ───────────────────────────────────────────────────────
  if (q.includes("high value") || q.includes("big order") || q.includes("large order") || q.includes("expensive order")) return "HIGH_VALUE";
  if ((q.includes("above") || q.includes("greater than") || q.includes("over")) && q.includes("order")) return "HIGH_VALUE";

  // ── 12. Compare / leaderboard ────────────────────────────────────────────
  if (q.includes("compare") || q.includes("leaderboard") || q.includes("rank all")) return "COMPARE";
  if (q.includes("list") && q.includes("agent")) return "COMPARE";
  if (q.includes("all agent")) return "COMPARE";

  // ── 13. Agent queries ────────────────────────────────────────────────────
  if (q.includes("agent") || q.includes("salesperson") || q.includes("who sold")) {
    if (q.includes("top") || q.includes("best") || q.includes("highest") || q.includes("most")) return "TOP_AGENT";
    return "TOP_AGENT";
  }

  // ── 14. Day queries ──────────────────────────────────────────────────────
  if (q.includes("lowest") || q.includes("least") || q.includes("worst") || q.includes("minimum")) return "LOWEST_DAY";
  if (q.includes("best") || q.includes("highest") || q.includes("top") || q.includes("most") || q.includes("maximum") || q.includes("peak")) return "HIGHEST_DAY";

  // ── 15. Fuzzy fallback ───────────────────────────────────────────────────
  let bestIntent = "UNKNOWN";
  let bestScore = 0;

  for (const intent in intents) {
    const match = stringSimilarity.findBestMatch(q, intents[intent]);
    if (match.bestMatch.rating > bestScore) {
      bestScore = match.bestMatch.rating;
      bestIntent = intent;
    }
  }

  console.log("Fuzzy score:", bestScore, "->", bestIntent);
  return bestScore > 0.3 ? bestIntent : "UNKNOWN";
}

// ─── Extract Entities ─────────────────────────────────────────────────────────
function extractEntities(q, knownAgents = []) {
  q = q.toLowerCase();

  const numberMatch = q.match(/[\d,]+/);
  const number = numberMatch ? parseInt(numberMatch[0].replace(/,/g, "")) : null;

  let agentName = null;
  if (knownAgents.length > 0) {
    agentName = knownAgents.find(name => q.includes(name.toLowerCase())) || null;
    if (!agentName) {
      const words = q.split(/\s+/);
      for (const word of words) {
        if (word.length < 3) continue;
        const match = stringSimilarity.findBestMatch(word, knownAgents.map(n => n.toLowerCase()));
        if (match.bestMatch.rating > 0.7) {
          agentName = knownAgents[match.bestMatchIndex];
          break;
        }
      }
    }
  }

  return { day: number, threshold: number, agentName };
}

function generateResponse(intent) {
  return intent === "UNKNOWN"
    ? "I was unable to interpret your query. Please try asking about sales figures, agent performance, order status, or request a recommendation."
    : "Processing your request...";
}

module.exports = { detectIntent, extractEntities, generateResponse };
