function detectIntent(q) {
  q = q.toLowerCase();

  if (q.includes("predict") || q.includes("forecast")) return "PREDICT";

  if (q.includes("highest") && q.includes("day")) return "HIGHEST_DAY";

  if (q.includes("lowest") && q.includes("day")) return "LOWEST_DAY";

  if (q.includes("top") || q.includes("best")) return "TOP_AGENT";

  if (q.includes("compare")) return "COMPARE";

  if (q.includes("trend") || q.includes("growth")) return "TREND";

  if (q.includes("high value") || q.includes("large")) return "HIGH_VALUE";

  return "UNKNOWN";
}

module.exports = { detectIntent };