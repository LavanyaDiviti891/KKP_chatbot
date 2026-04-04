const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const { detectIntent } = require("./utils/intent");
const { runPrediction } = require("./utils/pythonRunner");

const {
  topAgent,
  compareAgents,
  getTrend,
  highValueOrders,
  highestSalesDay,
  lowestSalesDay
} = require("./utils/insights");

const { getRawData } = require("./db/queries");
const { cleanData } = require("./utils/cleanData");

app.get("/", (req, res) => {
  res.send("✅ Backend running");
});

app.post("/api/ask", async (req, res) => {
  const q = (req.body.question || "").toLowerCase();

  console.log("QUESTION:", q);

  try {
    const raw = await getRawData();
    console.log("RAW LENGTH:", raw.length);

    const data = cleanData(raw);
    console.log("CLEAN SAMPLE:", data[0]);

    const intent = detectIntent(q);
    console.log("INTENT:", intent);

    switch (intent) {

      case "PREDICT": {
        const match = q.match(/\d+/);
        const day = match ? parseInt(match[0]) : 1;

        const pred = await runPrediction(day);

        return res.send({
          answer: `📊 Predicted revenue for day ${day} is ₹${pred.toFixed(2)}`
        });
      }

      case "HIGHEST_DAY": {
        const result = highestSalesDay(data);
        if (!result) return res.send({ answer: "No data available" });

        const [day, value] = result;

        return res.send({
          answer: `📈 Day ${day} had the highest sales with ₹${value.toFixed(2)}`
        });
      }

      case "LOWEST_DAY": {
        const result = lowestSalesDay(data);
        if (!result) return res.send({ answer: "No data available" });

        const [day, value] = result;

        return res.send({
          answer: `📉 Day ${day} had the lowest sales with ₹${value.toFixed(2)}`
        });
      }

      case "TOP_AGENT": {
        const [agent, revenue] = topAgent(data);

        return res.send({
          answer: `🏆 ${agent} is the top agent with ₹${revenue.toFixed(2)}`
        });
      }

      case "COMPARE": {
        const result = compareAgents(data);

        const text = result
          .map(([a, r]) => `${a} (₹${r.toFixed(2)})`)
          .join(", ");

        return res.send({
          answer: `📊 Top agents: ${text}`
        });
      }

      case "TREND": {
        const trend = getTrend(data);

        return res.send({
          answer: `📈 Sales trend is ${trend}`
        });
      }

      case "HIGH_VALUE": {
        const count = highValueOrders(data);

        return res.send({
          answer: `💰 ${count} high-value orders found`
        });
      }

      default:
        return res.send({
          answer: "❓ Try asking about top agents, trends, or predictions"
        });
    }

  } catch (err) {
    console.error("ERROR:", err);
    res.send({ answer: "⚠️ Error processing request" });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});