const express = require("express");
const cors = require("cors");
const https = require("https");
const http = require("http");

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔥 UPGRADED SERVER RUNNING (Rule-based + Claude AI Fallback)");

let cachedData = null;

// ─── FETCH DATA FROM apiServer.js on port 4000 ────────────────────────────────
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
              ? quantity * rate
              : 0;

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

          console.log("✅ Data loaded:", cachedData.length, "records");
          resolve(cachedData);
        } catch (e) {
          reject(new Error("Failed to parse data from apiServer: " + e.message));
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

// ─── PROFESSIONAL RESPONSE TEMPLATES ─────────────────────────────────────────
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

// ─── CLAUDE AI FALLBACK ───────────────────────────────────────────────────────
async function askClaude(question, data) {
  const agentMap = {};
  data.forEach(d => {
    agentMap[d.agent] = (agentMap[d.agent] || 0) + d.revenue;
  });

  const agentSummary = Object.entries(agentMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, rev]) => `${name}: ₹${rev.toFixed(0)}`)
    .join(", ");

  const total = data.reduce((s, d) => s + d.revenue, 0);
  const confirmed = data.filter(d => d.status === "confirmed").length;
  const pending = data.filter(d => d.status === "pending").length;
  const declined = data.filter(d => d.status === "declined").length;
  const processed = data.filter(d => d.status === "processed").length;
  const [bestDay, bestRev] = highestSalesDay(data);
  const [worstDay, worstRev] = lowestSalesDay(data);

  const summary = `
Sales Data Summary:
- Total records: ${data.length}
- Total revenue: ₹${total.toFixed(0)}
- Confirmed orders: ${confirmed}
- Pending orders: ${pending}
- Declined orders: ${declined}
- Processed orders: ${processed}
- Best sales day: Day ${bestDay} (₹${bestRev})
- Worst sales day: Day ${worstDay} (₹${worstRev})
- Agent revenues: ${agentSummary}
- Sales trend: ${getTrend(data)}
  `.trim();

  const prompt = `You are a professional sales analytics assistant for a business intelligence platform. 
Answer the user's question based ONLY on the data summary provided below.

Guidelines:
- Use formal, professional business language
- Structure your response with a clear heading followed by the analysis
- Use ₹ for all currency values with Indian number formatting
- Be concise but thorough
- Do not use emojis
- Do not fabricate data not present in the summary

Data Summary:
${summary}

User Question: ${question}`;

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }]
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const text = json.content?.[0]?.text || "Unable to generate a response at this time.";
          resolve(text);
        } catch {
          resolve("Unable to generate a response at this time. Please try rephrasing your question.");
        }
      });
    });

    req.on("error", () => resolve("The AI assistant is currently unavailable. Please try a more specific question such as 'total revenue' or 'top agent'."));
    req.write(body);
    req.end();
  });
}

// ─── TEST ROUTE ───────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("✅ Backend running"));

// ─── MAIN CHAT API ────────────────────────────────────────────────────────────
app.post("/api/ask", async (req, res) => {
  try {
    const q = (req.body.question || "").trim();
    const qLower = q.toLowerCase();

    console.log("\n📨 QUESTION:", q);

    cachedData = null;
    const data = await getData();

    const agentNames = getAgentNames(data);
    const intent = detectIntent(qLower);
    const entities = extractEntities(qLower, agentNames);

    console.log("🎯 INTENT:", intent);
    console.log("🔎 ENTITIES:", entities);

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
          if (result) {
            const [name, revenue] = result;
            answer = buildAnswer("AGENT_SALES", { name, revenue });
          } else {
            answer = `Agent Not Found\n\nNo records were found for an agent named "${entities.agentName}". Please verify the name and try again.`;
          }
        }
        break;
      }

      case "AGENT_RANK": {
        if (entities.agentName) {
          const result = agentRank(data, entities.agentName);
          if (result) {
            answer = buildAnswer("AGENT_RANK", result);
          } else {
            answer = `Agent Not Found\n\nNo records were found for an agent named "${entities.agentName}". Please verify the name and try again.`;
          }
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
        const pct = confirmedPercentage(data);
        const confirmed = orderCountByStatus(data, "confirmed");
        answer = buildAnswer("CONFIRMED_PERCENTAGE", { pct, confirmed, total: data.length });
        break;
      }

      default:
        break;
    }

    // If no answer built (unknown intent or missing entity) → Claude fallback
    if (!answer) {
      console.log("🤖 Falling back to Claude AI...");
      answer = await askClaude(q, data);
    }

    return res.json({ answer });

  } catch (err) {
    console.error("🔥 ERROR:", err.message);
    res.json({ answer: `An error occurred while processing your request: ${err.message}` });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(5001, () => {
  console.log("🚀 Server running on http://127.0.0.1:5001");
});
