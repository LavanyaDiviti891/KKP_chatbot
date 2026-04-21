const stringSimilarity = require("string-similarity");

const intents = {
  HIGHEST_DAY:          ["highest sales day","best day","top day","maximum revenue day","peak sales day","day with maximum sales","most revenue day"],
  LOWEST_DAY:           ["lowest sales day","worst day","minimum sales day","least revenue day","poorest performing day"],
  TOP_AGENT:            ["top agent","best agent","who sold the most","highest performing agent","leading agent","agent with most sales"],
  AGENT_SALES:          ["how much did agent sell","sales by agent","revenue of agent","what did agent earn","individual agent performance"],
  AGENT_RANK:           ["rank of agent","where does agent stand","agent position","what rank is agent"],
  COMPARE:              ["compare agents","agent comparison","list top agents","show agent performance","rank agents","agents leaderboard"],
  TREND:                ["sales trend","trend","is sales increasing","growth trend","revenue trend","performance over time"],
  HIGH_VALUE:           ["high value orders","expensive orders","big orders","orders above","orders greater than","large orders"],
  CONFIRMED_ORDERS:     ["confirmed orders","how many confirmed","count confirmed orders","total confirmed"],
  PENDING_ORDERS:       ["pending orders","how many pending","unconfirmed orders","open orders"],
  TOTAL_REVENUE:        ["total revenue","overall revenue","total sales","grand total","overall earnings"],
  ORDER_COUNT:          ["how many orders","total orders","count orders","number of orders","order count"],
  CONFIRMED_PERCENTAGE: ["percentage confirmed","percent confirmed","confirmation rate","ratio of confirmed","conversion rate"],
  AVG_ORDER_VALUE:      ["average order value","avg order value","mean order value","average revenue per order"],

  // ── Product intents ──
  TOP_PRODUCTS:         ["top products","best selling product","most ordered product","which product sells most","trending products","popular products","what product mostly sell","most selling product","highest demand product","product ranking","best product","product leaderboard"],
  PRODUCT_DETAILS:      ["details of product","product info","tell me about product","product performance","how is product doing","orders for product"],
  TOP_WEAVES:           ["top weave","best weave type","most ordered weave","weave performance","weave types","which weave sells most","popular weave"],
  WEAVE_STATUS:         ["weave status","confirmed weave","declined weave","processed weave","weave by status"],

  // ── Decline intents ──
  DECLINE_REASONS:      ["why declined","decline reasons","reason for decline","why orders declined","what caused decline","declined because"],
  DECLINED_ORDERS:      ["declined orders","how many declined","count declined","total declined","number of declined orders"],

  // ── Customer intents ──
  CUSTOMER_ORDERS:      ["orders by customer","customer orders","how many orders from customer","what did customer order","customer history"],

  // ── Date intents ──
  ORDERS_THIS_MONTH:    ["orders this month","this month orders","current month orders","monthly orders","orders in april","orders in march"],
  ORDERS_BY_DATE:       ["orders on date","orders today","daily orders","orders this week"],

  // ── Advisory intents ──
  SUGGEST_PRODUCT:      ["what product to buy","which product should i purchase","what should i stock","recommend a product","best product to invest in","what to stock up on","suggest a product","what to buy","what to purchase","what to invest in","good product","best item to buy"],
  SUGGEST_AGENT:        ["which agent should i assign","recommend an agent","best agent for the job","which agent is most reliable","suggest an agent","who should i work with"],
  SUGGEST_STRATEGY:     ["what should i focus on","how can i improve sales","suggest a strategy","what strategy should i follow","how to increase revenue","how to boost sales","what should i do","business advice","how to improve","action plan","growth plan","guide me","tell me what to do","what steps","what plan","how do i grow","how do i improve"],
  SUGGEST_IMPROVEMENT:  ["who needs improvement","which agent is underperforming","weakest agent","lowest performer","who is falling behind","which agent needs help","poor agent","worst agent"],
  FORECAST:             ["forecast","predict future sales","sales forecast","expected revenue","future performance","next month sales","what will happen","future revenue","projection","coming month"],
};

// ── Month name to number ──────────────────────────────────────────────────────
const MONTHS = { january:1, february:2, march:3, april:4, may:5, june:6, july:7, august:8, september:9, october:10, november:11, december:12 };

// ─── Detect Intent ────────────────────────────────────────────────────────────
function detectIntent(q) {
  q = q.toLowerCase().trim();

  // 1. Forecast
  if (q.includes("forecast") || q.includes("predict") || q.includes("future") || q.includes("next month") || q.includes("projection") || q.includes("coming month")) return "FORECAST";

  // 2. Improvement
  if (q.includes("who needs improvement") || q.includes("weakest agent") || q.includes("lowest performer") || q.includes("worst agent") || q.includes("poor agent") || q.includes("who is not performing") || (q.includes("underperform") && q.includes("agent")) || (q.includes("falling behind") && q.includes("agent"))) return "SUGGEST_IMPROVEMENT";

  // 3. Strategy
  if (q.includes("strategy") || q.includes("action plan") || q.includes("growth plan") || q.includes("guide me") || q.includes("tell me what to do") || q.includes("what steps") || q.includes("how can i improve") || q.includes("how do i improve") || q.includes("how do i grow") || q.includes("how to increase") || q.includes("how to boost") || q.includes("how to grow") || q.includes("how to improve") || q.includes("business advice") || q.includes("what areas need") || q.includes("focus on") || (q.includes("what should i") && !q.includes("stock") && !q.includes("buy") && !q.includes("purchase") && !q.includes("order") && !q.includes("sell"))) return "SUGGEST_STRATEGY";

  // 4. Product recommendation
  if (q.includes("stock up") || q.includes("what to buy") || q.includes("should i buy") || q.includes("what to purchase") || q.includes("what to invest") || q.includes("what to stock") || q.includes("should i stock") || (q.includes("recommend") && (q.includes("product") || q.includes("stock") || q.includes("buy") || q.includes("item"))) || (q.includes("suggest") && (q.includes("product") || q.includes("item")))) return "SUGGEST_PRODUCT";

  // 5. Agent suggestion
  if ((q.includes("recommend") || q.includes("suggest") || q.includes("assign") || q.includes("who should")) && q.includes("agent")) return "SUGGEST_AGENT";

  // 6. Decline reasons
  if (q.includes("why") && (q.includes("declin") || q.includes("reject"))) return "DECLINE_REASONS";
  if (q.includes("reason") && q.includes("declin")) return "DECLINE_REASONS";
  if (q.includes("declin") && (q.includes("reason") || q.includes("because") || q.includes("cause") || q.includes("why"))) return "DECLINE_REASONS";

  // 7. Declined orders count
  if (q.includes("declin") && (q.includes("how many") || q.includes("count") || q.includes("total") || q.includes("number"))) return "DECLINED_ORDERS";
  if (q.includes("how many declin") || q.includes("total declin") || q.includes("count declin")) return "DECLINED_ORDERS";

  // 8. Product queries
  if (q.includes("top product") || q.includes("best selling") || q.includes("most ordered") || q.includes("trending product") || q.includes("popular product") || q.includes("most selling") || q.includes("product rank") || q.includes("product leaderboard") || (q.includes("which product") && (q.includes("sell") || q.includes("most") || q.includes("popular") || q.includes("best") || q.includes("top"))) || (q.includes("what product") && (q.includes("sell") || q.includes("most") || q.includes("popular") || q.includes("best") || q.includes("month")))) return "TOP_PRODUCTS";

  if ((q.includes("product") || q.includes("quality")) && (q.includes("detail") || q.includes("info") || q.includes("about") || q.includes("performance") || q.includes("how is"))) return "PRODUCT_DETAILS";

  // 9. Weave queries
  if (q.includes("weave") && (q.includes("status") || q.includes("confirmed") || q.includes("declined") || q.includes("processed"))) return "WEAVE_STATUS";
  if (q.includes("weave") || q.includes("plain weave") || q.includes("twill") || q.includes("heavy weave")) return "TOP_WEAVES";

  // 10. Customer queries
  if (q.includes("customer") && (q.includes("order") || q.includes("buy") || q.includes("purchase") || q.includes("history"))) return "CUSTOMER_ORDERS";

  // 11. Monthly queries
  if (q.includes("this month") || q.includes("current month") || q.includes("monthly") || Object.keys(MONTHS).some(m => q.includes(m))) return "ORDERS_THIS_MONTH";
  if (q.includes("today") || q.includes("this week") || q.includes("daily")) return "ORDERS_BY_DATE";

  // 12. Avg order value
  if ((q.includes("average") || q.includes("avg") || q.includes("mean")) && (q.includes("order") || q.includes("revenue") || q.includes("value"))) return "AVG_ORDER_VALUE";

  // 13. Percentage / Ratio
  if ((q.includes("percent") || q.includes("ratio") || q.includes("rate") || q.includes("conversion")) && (q.includes("confirm") || q.includes("success"))) return "CONFIRMED_PERCENTAGE";

  // 14. Status
  if (q.includes("confirmed") && !q.includes("percent") && !q.includes("ratio")) return "CONFIRMED_ORDERS";
  if (q.includes("pending")) return "PENDING_ORDERS";

  // 15. Totals
  if ((q.includes("total revenue") || q.includes("overall revenue") || q.includes("grand total") || (q.includes("sum") && !q.includes("summary"))) && !q.includes("agent")) return "TOTAL_REVENUE";
  if (q.includes("how many orders") || q.includes("count orders") || q.includes("number of orders")) return "ORDER_COUNT";

  // 16. Trend
  if (q.includes("trend") || q.includes("going up") || q.includes("going down") || q.includes("increasing") || q.includes("decreasing")) return "TREND";

  // 17. High value
  if (q.includes("high value") || q.includes("big order") || q.includes("large order") || q.includes("expensive")) return "HIGH_VALUE";
  if ((q.includes("above") || q.includes("greater than") || q.includes("over")) && q.includes("order")) return "HIGH_VALUE";

  // 18. Compare / leaderboard
  if (q.includes("compare") && (q.includes("agent") || q.includes("salesperson"))) return "COMPARE";
  if (q.includes("compare") || q.includes("leaderboard") || q.includes("rank all")) return "COMPARE";
  if (q.includes("list") && q.includes("agent")) return "COMPARE";

  // 19. Agent queries — after all product/advisory checks
  if (q.includes("agent") || q.includes("salesperson") || q.includes("who sold")) {
    if (q.includes("rank") || q.includes("position")) return "AGENT_RANK";
    if (q.includes("top") || q.includes("best") || q.includes("highest") || q.includes("most")) return "TOP_AGENT";
    return "TOP_AGENT";
  }

  // 20. Day queries
  if (q.includes("lowest") || q.includes("least") || q.includes("worst") || q.includes("minimum")) return "LOWEST_DAY";
  if (q.includes("best") || q.includes("highest") || q.includes("top") || q.includes("most") || q.includes("maximum") || q.includes("peak")) return "HIGHEST_DAY";

  // 21. Fuzzy fallback
  let bestIntent = "UNKNOWN";
  let bestScore  = 0;
  for (const intent in intents) {
    const match = stringSimilarity.findBestMatch(q, intents[intent]);
    if (match.bestMatch.rating > bestScore) { bestScore = match.bestMatch.rating; bestIntent = intent; }
  }
  console.log("Fuzzy score:", bestScore, "->", bestIntent);
  return bestScore > 0.3 ? bestIntent : "UNKNOWN";
}

// ─── Extract Entities ─────────────────────────────────────────────────────────
function extractEntities(q, knownAgents = [], knownProducts = [], knownCustomers = []) {
  const qLower = q.toLowerCase();

  // Number extraction
  const numberMatch = qLower.match(/[\d,]+/);
  const number = numberMatch ? parseInt(numberMatch[0].replace(/,/g, "")) : null;

  // Month extraction
  let month = null, year = null;
  for (const [name, num] of Object.entries(MONTHS)) {
    if (qLower.includes(name)) { month = num; break; }
  }
  const yearMatch = qLower.match(/20\d{2}/);
  if (yearMatch) year = parseInt(yearMatch[0]);
  if (!year && (qLower.includes("this month") || qLower.includes("current month"))) {
    const now = new Date();
    month = month || now.getMonth() + 1;
    year  = now.getFullYear();
  }

  // Agent name fuzzy match
  let agentName = null;
  if (knownAgents.length > 0) {
    agentName = knownAgents.find(name => qLower.includes(name.toLowerCase())) || null;
    if (!agentName) {
      for (const word of qLower.split(/\s+/)) {
        if (word.length < 3) continue;
        const match = stringSimilarity.findBestMatch(word, knownAgents.map(n => n.toLowerCase()));
        if (match.bestMatch.rating > 0.7) { agentName = knownAgents[match.bestMatchIndex]; break; }
      }
    }
  }

  // Product name match
  let productName = null;
  if (knownProducts.length > 0) {
    productName = knownProducts.find(p => qLower.includes(p.toLowerCase().substring(0, 10))) || null;
  }

  // Customer name match
  let customerName = null;
  if (knownCustomers.length > 0) {
    customerName = knownCustomers.find(c => qLower.includes(c.toLowerCase())) || null;
  }

  return { day: number, threshold: number, agentName, productName, customerName, month, year };
}

function generateResponse(intent) {
  return intent === "UNKNOWN"
    ? "I was unable to interpret your query. You can ask about products, agents, weave types, decline reasons, order status, revenue, or request a recommendation."
    : "Processing your request...";
}

module.exports = { detectIntent, extractEntities, generateResponse };
