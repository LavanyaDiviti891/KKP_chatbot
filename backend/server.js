const express = require("express");
const cors = require("cors");
const http = require("http");

const app = express();
app.use(cors());
app.use(express.json());

console.log("UPGRADED SERVER RUNNING (Fully Local — No API Key Required)");

let cachedData = null;

// ─── FETCH DATA FROM apiServer on port 4000 ───────────────────────────────────
function getData() {
  return new Promise((resolve, reject) => {
    if (cachedData) return resolve(cachedData);

    http.get("http://127.0.0.1:4000/data", (res) => {
      let raw = "";
      res.on("data", chunk => raw += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(raw);
          const arr = json.formData || [];

          cachedData = arr.map((item, i) => {
            const quantity = Number(item.quantity);
            const rate = Number(item.rate);
            const revenue = (!isNaN(quantity) && !isNaN(rate) && item.rate !== null)
              ? quantity * rate : 0;
            return {
              day: i + 1,
              date: item.date || null,
              revenue,
              agent: item.agentName || "Unknown",
              status: (item.status || "unknown").toLowerCase(),
              quantity: isNaN(quantity) ? 0 : quantity,
              rate: isNaN(rate) ? 0 : rate,
            };
          });

          console.log("Data loaded:", cachedData.length, "records");
          resolve(cachedData);
        } catch (e) {
          reject(new Error("Failed to parse data: " + e.message));
        }
      });
    }).on("error", (e) => {
      reject(new Error("Could not connect to apiServer on port 4000: " + e.message));
    });
  });
}

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
const {
  highestSalesDay, lowestSalesDay, topAgent, agentSales, agentRank,
  compareAgents, getTrend, highValueOrders, totalRevenue,
  orderCountByStatus, confirmedPercentage, getAgentNames
} = require("./utils/insights");

const { detectIntent, extractEntities } = require("./utils/aiEngine");

// ─── FORMAT CURRENCY ──────────────────────────────────────────────────────────
function fmt(num) {
  return `₹${Number(num).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

// ─── PROFESSIONAL RESPONSE TEMPLATES (rule-based) ────────────────────────────
function buildAnswer(intent, payload) {
  switch (intent) {
    case "HIGHEST_DAY":
      return `Sales Performance Report — Peak Day\n\nBased on the available data, Day ${payload.day} recorded the highest sales figure, achieving a total revenue of ${fmt(payload.value)}. This represents the strongest single-day performance in the dataset.`;

    case "LOWEST_DAY":
      return `Sales Performance Report — Lowest Day\n\nAn analysis of the dataset reveals that Day ${payload.day} recorded the lowest sales, with a total revenue of ${fmt(payload.value)}. This may warrant further review to identify any contributing factors.`;

    case "TOP_AGENT":
      return `Agent Performance Summary — Top Performer\n\nBased on cumulative revenue, ${payload.agent} has emerged as the highest-performing sales agent, generating a total revenue of ${fmt(payload.revenue)}. This reflects consistent and strong sales contribution.`;

    case "AGENT_SALES":
      return `Agent Revenue Report — ${payload.name}\n\n${payload.name} has contributed a total revenue of ${fmt(payload.revenue)} based on all recorded transactions. This figure accounts for all confirmed and processed orders attributed to this agent.`;

    case "AGENT_RANK":
      return `Agent Ranking Report — ${payload.name}\n\n${payload.name} is currently ranked #${payload.rank} out of ${payload.total} active agents, with a total revenue of ${fmt(payload.revenue)}. This ranking is based on cumulative revenue across all order statuses.`;

    case "COMPARE": {
      const rows = payload.agents.map(([name, rev], i) =>
        `  ${i + 1}. ${name.padEnd(20)} ${fmt(rev)}`
      ).join("\n");
      return `Agent Leaderboard — Top ${payload.agents.length} Performers\n\n${rows}\n\nRankings are based on total revenue generated across all recorded orders.`;
    }

    case "TREND":
      return `Sales Trend Analysis\n\nA review of the sales data indicates that revenue is currently ${payload.trend}. This trend is derived by comparing average performance across the beginning and end periods of the dataset.`;

    case "HIGH_VALUE":
      return `High-Value Order Summary\n\nA total of ${payload.count} order${payload.count !== 1 ? "s" : ""} exceed${payload.count === 1 ? "s" : ""} the threshold of ${fmt(payload.threshold)}. These orders represent the premium segment of transactions and may merit priority attention.`;

    case "CONFIRMED_ORDERS":
      return `Order Status Report — Confirmed Orders\n\nThere are currently ${payload.count} confirmed order${payload.count !== 1 ? "s" : ""} in the system. These orders have been successfully validated and are ready for fulfilment.`;

    case "PENDING_ORDERS":
      return `Order Status Report — Pending Orders\n\nA total of ${payload.count} order${payload.count !== 1 ? "s" : ""} are currently in a pending state. These require follow-up action to progress toward confirmation or processing.`;

    case "TOTAL_REVENUE":
      return `Revenue Summary Report\n\nThe total revenue across all recorded orders amounts to ${fmt(payload.total)}. This figure encompasses all order statuses including confirmed, processed, declined, and pending transactions.`;

    case "ORDER_COUNT":
      return `Order Volume Report\n\nThe dataset currently contains a total of ${payload.count} orders. This includes orders across all statuses — confirmed, pending, processed, and declined.`;

    case "CONFIRMED_PERCENTAGE":
      return `Order Confirmation Rate Report\n\nOut of ${payload.total} total orders, ${payload.confirmed} have been confirmed, representing a confirmation rate of ${payload.pct}%. This metric reflects the proportion of successfully validated transactions in the system.`;

    default:
      return null;
  }
}

// ─── LOCAL ADVISORY ENGINE (No API Key — Pure JS Logic) ──────────────────────

function buildAgentStats(data) {
  const map = {};
  data.forEach(d => {
    if (!d.agent || d.agent === "Unknown") return;
    if (!map[d.agent]) map[d.agent] = { revenue: 0, orders: 0, confirmed: 0, declined: 0, pending: 0, processed: 0 };
    map[d.agent].revenue += d.revenue;
    map[d.agent].orders += 1;
    if (d.status === "confirmed")  map[d.agent].confirmed += 1;
    if (d.status === "declined")   map[d.agent].declined += 1;
    if (d.status === "pending")    map[d.agent].pending += 1;
    if (d.status === "processed")  map[d.agent].processed += 1;
  });
  return map;
}

function advisoryEngine(intent, data) {
  const agentStats   = buildAgentStats(data);
  const sortedAgents = Object.entries(agentStats).sort((a, b) => b[1].revenue - a[1].revenue);
  const total        = totalRevenue(data);
  const confirmed    = orderCountByStatus(data, "confirmed");
  const declined     = orderCountByStatus(data, "declined");
  const pending      = orderCountByStatus(data, "pending");
  const pct          = confirmedPercentage(data);
  const trend        = getTrend(data);
  const [bestDay, bestRev]   = highestSalesDay(data);
  const [worstDay, worstRev] = lowestSalesDay(data);
  const topAgentName  = sortedAgents[0]?.[0] || "N/A";
  const topAgentData  = sortedAgents[0]?.[1] || {};
  const worstAgentName = sortedAgents[sortedAgents.length - 1]?.[0] || "N/A";
  const worstAgentData = sortedAgents[sortedAgents.length - 1]?.[1] || {};
  const highVal = highValueOrders(data, 100000);
  const confirmRate = parseFloat(pct);

  switch (intent) {

    // ── Product / Purchase Recommendation ─────────────────────────────────────
    case "SUGGEST_PRODUCT": {
      const avgRevenue = total / (data.length || 1);
      const highValuePct = ((highVal / (data.length || 1)) * 100).toFixed(1);
      const declinedPct  = ((declined / (data.length || 1)) * 100).toFixed(1);

      let recommendation = "";
      if (highVal > 0 && parseFloat(highValuePct) >= 20) {
        recommendation = `High-value orders (above ₹1,00,000) constitute ${highValuePct}% of all transactions, indicating strong demand for premium-tier products. It is recommended to prioritise procurement and stocking of high-margin items that align with this segment.`;
      } else if (confirmRate >= 50) {
        recommendation = `With a confirmation rate of ${pct}% and an average order value of ${fmt(avgRevenue)}, the data suggests stable demand for mid-range products. Stocking products in the ${fmt(avgRevenue * 0.8)}–${fmt(avgRevenue * 1.2)} price band is advisable.`;
      } else {
        recommendation = `The current decline rate of ${declinedPct}% suggests pricing misalignment or low product-market fit. It is recommended to review the product catalogue and focus on items with historically higher confirmation rates before making significant procurement decisions.`;
      }

      return `Product Procurement Recommendation\n\nBased on an analysis of ${data.length} orders with a total revenue of ${fmt(total)}:\n\n${recommendation}\n\nAdditionally, Day ${bestDay} recorded peak demand at ${fmt(bestRev)}, which may indicate a seasonal or promotional pattern worth leveraging for future purchasing decisions.`;
    }

    // ── Agent Assignment Recommendation ───────────────────────────────────────
    case "SUGGEST_AGENT": {
      const topConfirmRate = topAgentData.orders
        ? ((topAgentData.confirmed / topAgentData.orders) * 100).toFixed(1)
        : 0;

      const agentSummaryLines = sortedAgents.slice(0, 3).map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(1) : 0;
        return `  ${i + 1}. ${name} — Revenue: ${fmt(s.revenue)}, Orders: ${s.orders}, Confirmation Rate: ${cr}%`;
      }).join("\n");

      return `Agent Assignment Recommendation\n\nBased on performance data across all recorded transactions, the following agents are best suited for priority assignments:\n\n${agentSummaryLines}\n\nRecommendation: ${topAgentName} is the most suitable candidate for high-value or critical assignments, having generated ${fmt(topAgentData.revenue)} with a confirmation rate of ${topConfirmRate}%. This agent demonstrates the strongest combination of revenue generation and order reliability.`;
    }

    // ── Strategy Recommendation ───────────────────────────────────────────────
    case "SUGGEST_STRATEGY": {
      const declinedPct = ((declined / (data.length || 1)) * 100).toFixed(1);
      const pendingPct  = ((pending  / (data.length || 1)) * 100).toFixed(1);
      const strategies  = [];

      if (parseFloat(declinedPct) > 30) {
        strategies.push(`- Reduce Declined Orders: With ${declinedPct}% of orders declined, a review of pricing, product quality, or agent communication is strongly recommended. Targeting a decline rate below 15% should be the immediate priority.`);
      }
      if (parseFloat(pendingPct) > 20) {
        strategies.push(`- Clear Pending Orders: ${pendingPct}% of orders remain pending. Implementing a follow-up protocol within 24–48 hours of order placement could significantly improve confirmation rates.`);
      }
      if (confirmRate < 40) {
        strategies.push(`- Improve Confirmation Rate: The current confirmation rate of ${pct}% is below acceptable benchmarks. Focus on agent training, streamlined approval workflows, and customer engagement strategies.`);
      }
      if (trend.includes("decreasing")) {
        strategies.push(`- Reverse Declining Trend: Sales are currently on a downward trajectory. Introducing promotional campaigns, revisiting pricing strategy, or reallocating resources to top-performing agents may help reverse this trend.`);
      }
      if (strategies.length === 0) {
        strategies.push(`- Sustain Current Performance: The business is performing well with a confirmation rate of ${pct}% and a ${trend} revenue trend. Focus on scaling what is working — particularly the activities of top agent ${topAgentName}.`);
        strategies.push(`- Expand High-Value Orders: With ${highVal} high-value orders already recorded, there is an opportunity to actively target and grow this premium segment.`);
      }

      return `Strategic Recommendations Report\n\nThe following strategies are recommended based on an analysis of ${data.length} orders, ${fmt(total)} in total revenue, and a current sales trend of ${trend}:\n\n${strategies.join("\n\n")}\n\nImplementing these recommendations in order of priority is advised for maximum impact.`;
    }

    // ── Underperformance / Improvement ───────────────────────────────────────
    case "SUGGEST_IMPROVEMENT": {
      const underperformers = sortedAgents
        .filter(([, s]) => s.orders > 0)
        .slice(-3)
        .reverse();

      if (underperformers.length === 0) {
        return `Agent Improvement Report\n\nInsufficient agent data is available to identify underperformers. Please ensure agent names are correctly recorded in the system.`;
      }

      const lines = underperformers.map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(1) : 0;
        const dr = s.orders ? ((s.declined  / s.orders) * 100).toFixed(1) : 0;
        let advice = "";
        if (parseFloat(dr) > 40)  advice = "Focus on improving client communication and setting accurate expectations to reduce the high decline rate.";
        else if (parseFloat(cr) < 30) advice = "Prioritise lead qualification and follow-up consistency to improve the confirmation rate.";
        else advice = "Revenue contribution is below average. Consider additional training or a revised territory/account assignment.";
        return `  ${i + 1}. ${name}\n     Revenue: ${fmt(s.revenue)} | Orders: ${s.orders} | Confirmation Rate: ${cr}% | Decline Rate: ${dr}%\n     Recommendation: ${advice}`;
      }).join("\n\n");

      return `Agent Improvement Report — Underperforming Agents\n\nThe following agents have been identified as requiring performance improvement based on revenue contribution and order confirmation rates:\n\n${lines}\n\nIt is recommended that these agents receive targeted coaching, performance reviews, and clearly defined improvement milestones within the next 30 days.`;
    }

    // ── Sales Forecast ────────────────────────────────────────────────────────
    case "FORECAST": {
      const avgDailyRevenue = total / (data.length || 1);
      const trendDirection  = trend.includes("increasing") ? "upward" : trend.includes("decreasing") ? "downward" : "stable";

      let multiplier = 1.0;
      if (trendDirection === "upward")   multiplier = 1.10;
      if (trendDirection === "downward") multiplier = 0.90;

      const forecastMonthly = avgDailyRevenue * 30 * multiplier;
      const forecastWeekly  = avgDailyRevenue * 7  * multiplier;
      const riskNote = trendDirection === "downward"
        ? "Given the current declining trend, this forecast carries a higher degree of uncertainty. Immediate corrective action is advised."
        : trendDirection === "upward"
        ? "The upward trend supports a positive outlook, though external market factors should be monitored closely."
        : "The stable trend suggests predictable near-term performance with low volatility.";

      return `Sales Forecast Report\n\nBased on historical performance data across ${data.length} orders and a current ${trendDirection} revenue trend:\n\n  Average Daily Revenue  : ${fmt(avgDailyRevenue)}\n  Projected Weekly Revenue  : ${fmt(forecastWeekly)}\n  Projected Monthly Revenue : ${fmt(forecastMonthly)}\n\nAssumptions:\n- Projections are derived from current average daily revenue, adjusted for the observed ${trendDirection} trend (${Math.abs((multiplier - 1) * 100).toFixed(0)}% adjustment applied).\n- Agent count and order volumes are assumed to remain constant.\n\nRisk Assessment:\n${riskNote}`;
    }

    // ── Unknown / Fallback ────────────────────────────────────────────────────
    default: {
      const agentLine = sortedAgents.slice(0, 3)
        .map(([n, s], i) => `  ${i + 1}. ${n} — ${fmt(s.revenue)} (${s.orders} orders)`)
        .join("\n");

      return `Sales Analytics Summary\n\nHere is an overview of the current sales data:\n\n  Total Orders    : ${data.length}\n  Total Revenue   : ${fmt(total)}\n  Confirmed Orders: ${confirmed} (${pct}%)\n  Pending Orders  : ${pending}\n  Declined Orders : ${declined}\n  Sales Trend     : ${trend}\n  Peak Sales Day  : Day ${bestDay} — ${fmt(bestRev)}\n\nTop Performing Agents:\n${agentLine}\n\nFor more specific insights, please ask about agent performance, sales trends, order status, or request a strategic recommendation.`;
    }
  }
}

// ─── TEST ROUTE ───────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("Backend running (fully local)"));

// ─── MAIN CHAT API ────────────────────────────────────────────────────────────
app.post("/api/ask", async (req, res) => {
  try {
    const q      = (req.body.question || "").trim();
    const qLower = q.toLowerCase();

    console.log("\nQUESTION:", q);

    cachedData = null;
    const data = await getData();

    const agentNames = getAgentNames(data);
    const intent     = detectIntent(qLower);
    const entities   = extractEntities(qLower, agentNames);

    console.log("INTENT:", intent);
    console.log("ENTITIES:", entities);

    // ─── Advisory / Suggestion intents → local advisory engine ───────────────
    const advisoryIntents = ["SUGGEST_PRODUCT", "SUGGEST_AGENT", "SUGGEST_STRATEGY", "SUGGEST_IMPROVEMENT", "FORECAST", "UNKNOWN"];

    if (advisoryIntents.includes(intent)) {
      const answer = advisoryEngine(intent, data);
      return res.json({ answer });
    }

    // ─── Rule-based intents ───────────────────────────────────────────────────
    let answer = null;

    switch (intent) {
      case "HIGHEST_DAY": {
        const [day, value] = highestSalesDay(data);
        answer = buildAnswer("HIGHEST_DAY", { day, value });
        break;
      }
      case "LOWEST_DAY": {
        const [day, value] = lowestSalesDay(data);
        answer = buildAnswer("LOWEST_DAY", { day, value });
        break;
      }
      case "TOP_AGENT": {
        const [agent, revenue] = topAgent(data);
        answer = buildAnswer("TOP_AGENT", { agent, revenue });
        break;
      }
      case "AGENT_SALES": {
        if (entities.agentName) {
          const result = agentSales(data, entities.agentName);
          answer = result
            ? buildAnswer("AGENT_SALES", { name: result[0], revenue: result[1] })
            : `Agent Not Found\n\nNo records were found for an agent named "${entities.agentName}". Please verify the name and try again.`;
        }
        break;
      }
      case "AGENT_RANK": {
        if (entities.agentName) {
          const result = agentRank(data, entities.agentName);
          answer = result
            ? buildAnswer("AGENT_RANK", result)
            : `Agent Not Found\n\nNo records were found for an agent named "${entities.agentName}". Please verify the name and try again.`;
        }
        break;
      }
      case "COMPARE": {
        const agents = compareAgents(data).slice(0, 5);
        answer = buildAnswer("COMPARE", { agents });
        break;
      }
      case "TREND": {
        const trend = getTrend(data);
        answer = buildAnswer("TREND", { trend });
        break;
      }
      case "HIGH_VALUE": {
        const threshold = entities.threshold && entities.threshold > 1000 ? entities.threshold : 100000;
        const count = highValueOrders(data, threshold);
        answer = buildAnswer("HIGH_VALUE", { count, threshold });
        break;
      }
      case "CONFIRMED_ORDERS": {
        const count = orderCountByStatus(data, "confirmed");
        answer = buildAnswer("CONFIRMED_ORDERS", { count });
        break;
      }
      case "PENDING_ORDERS": {
        const count = orderCountByStatus(data, "pending");
        answer = buildAnswer("PENDING_ORDERS", { count });
        break;
      }
      case "TOTAL_REVENUE": {
        const total = totalRevenue(data);
        answer = buildAnswer("TOTAL_REVENUE", { total });
        break;
      }
      case "ORDER_COUNT": {
        answer = buildAnswer("ORDER_COUNT", { count: data.length });
        break;
      }
      case "CONFIRMED_PERCENTAGE": {
        const pct       = confirmedPercentage(data);
        const confirmed = orderCountByStatus(data, "confirmed");
        answer = buildAnswer("CONFIRMED_PERCENTAGE", { pct, confirmed, total: data.length });
        break;
      }
    }

    // If rule matched but entity missing → fallback to advisory summary
    if (!answer) {
      answer = advisoryEngine("UNKNOWN", data);
    }

    return res.json({ answer });

  } catch (err) {
    console.error("🔥 ERROR:", err.message);
    res.json({ answer: `An error occurred while processing your request: ${err.message}` });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(5001, () => {
  console.log("Server running on http://127.0.0.1:5001");
});
