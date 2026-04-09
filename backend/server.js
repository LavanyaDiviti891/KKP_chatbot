const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔥 CLEAN SERVER RUNNING (API MODE)");

let cachedData = null;

// ✅ LOAD DATA
function getData() {
  if (cachedData) return cachedData;

  const file1 = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data/data1.json"))
  );

  const file2 = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data/data2.json"))
  );

  // ✅ FIXED: JSON is nested under "formData", not "data"
  const arr1 = Array.isArray(file1) ? file1 : file1.formData || file1.data || [];
  const arr2 = Array.isArray(file2) ? file2 : file2.formData || file2.data || [];

  cachedData = [...arr1, ...arr2];

  return cachedData;
}

// ✅ IMPORT LOGIC
const {
  highestSalesDay,
  lowestSalesDay,
  topAgent,
  compareAgents,
  getTrend,
  highValueOrders
} = require("./utils/insights");

const { detectIntent, extractEntities } = require("./utils/aiEngine");

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("✅ Backend running (API mode)");
});

// ✅ MAIN CHAT API
app.post("/api/ask", (req, res) => {
  try {
    const q = (req.body.question || "").toLowerCase();

    console.log("QUESTION:", q);

    const raw = getData();
    console.log("RAW DATA LENGTH:", raw.length);

    const data = (raw || []).map((item, i) => {
      const quantity = Number(item.quantity);
      const rate = Number(item.rate);

      // ✅ FIXED: skip null/NaN rate — treat as 0 revenue
      const revenue = (!isNaN(quantity) && !isNaN(rate) && rate !== null)
        ? quantity * rate
        : 0;

      // ✅ FIXED: use actual date string for meaningful "day" label
      const dateLabel = item.date
        ? new Date(item.date).toISOString().slice(0, 10)
        : `Day ${i + 1}`;

      return {
        day: dateLabel,
        revenue: revenue,
        agent: item.agentName || "Unknown",
        status: (item.status || "unknown").toLowerCase()
      };
    });

    console.log("SAMPLE DATA:", data.slice(0, 5));

    const intent = detectIntent(q);
    const entities = extractEntities(q);

    console.log("INTENT:", intent);
    console.log("ENTITIES:", entities);

    switch (intent) {

      case "HIGHEST_DAY": {
        const [day, value] = highestSalesDay(data);
        return res.json({
          answer: `📈 ${day} had the highest sales with ₹${value.toLocaleString()}`
        });
      }

      case "LOWEST_DAY": {
        const [day, value] = lowestSalesDay(data);
        return res.json({
          answer: `📉 ${day} had the lowest sales with ₹${value.toLocaleString()}`
        });
      }

      case "TOP_AGENT": {
        const [agent, revenue] = topAgent(data);
        return res.json({
          answer: `🏆 ${agent} is the top agent with ₹${revenue.toLocaleString()}`
        });
      }

      case "COMPARE": {
        const result = compareAgents(data);
        const text = result.map(([a, r]) => `${a} (₹${r.toLocaleString()})`).join(", ");
        return res.json({
          answer: `📊 Top agents: ${text}`
        });
      }

      case "TREND": {
        const trend = getTrend(data);
        return res.json({
          answer: `📈 Sales trend is ${trend}`
        });
      }

      case "HIGH_VALUE": {
        const count = highValueOrders(data);
        return res.json({
          answer: `💰 ${count} high-value orders found`
        });
      }

      case "CONFIRMED_ORDERS": {
        const count = data.filter(d => d.status === "confirmed").length;
        return res.json({
          answer: `✅ ${count} confirmed orders found`
        });
      }

      default:
        return res.json({
          answer: "🤖 I didn't understand. Try asking about sales, agents, or trends."
        });
    }

  } catch (err) {
    console.error("🔥 FULL ERROR:", err);
    res.json({ answer: "⚠️ Error processing request" });
  }
});

// ✅ START SERVER
app.listen(5000, () => {
  console.log("🚀 Server running on http://127.0.0.1:5000");
});
