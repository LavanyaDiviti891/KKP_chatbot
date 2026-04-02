const express = require("express");
const cors = require("cors");

const { getRawData } = require("./db/queries");
const { cleanData } = require("./utils/cleanData");
const {
  topAgent,
  compareAgents,
  getTrend,
  highValueOrders
} = require("./utils/insights");

const app = express();

app.use(cors());
app.use(express.json());

/* ---------- ROOT ---------- */
app.get("/", (req, res) => {
  res.send("✅ Backend running");
});

/* ---------- AI CHAT ---------- */
app.post("/api/ask", async (req, res) => {
  const q = req.body.question.toLowerCase();

  try {
    const raw = await getRawData();
    const data = cleanData(raw);

    // 🟢 TOP AGENT
    if (q.includes("top") || q.includes("best")) {
      const [agent, revenue] = topAgent(data);

      return res.send({
        answer: `🏆 ${agent} is the top agent with revenue ₹${revenue}`
      });
    }

    // 🟡 COMPARE
    if (q.includes("compare")) {
      const result = compareAgents(data);

      const text = result
        .map(([a, r]) => `${a} (₹${r})`)
        .join(", ");

      return res.send({
        answer: `📊 Top agents: ${text}`
      });
    }

    // 🔵 TREND
    if (q.includes("trend") || q.includes("growth")) {
      const trend = getTrend(data);

      return res.send({
        answer: `📈 Sales trend is ${trend}`
      });
    }

    // 🟣 HIGH VALUE
    if (q.includes("high") || q.includes("large")) {
      const count = highValueOrders(data);

      return res.send({
        answer: `💰 There are ${count} high-value orders`
      });
    }

    // fallback
    res.send({
      answer: "❓ Ask about top agents, trends, comparisons, or high-value orders"
    });

  } catch (err) {
    console.error(err);
    res.send({ answer: "⚠️ Error processing data" });
  }
});

/* ---------- SERVER ---------- */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});