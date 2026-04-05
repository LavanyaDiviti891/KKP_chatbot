const express = require("express");
const cors = require("cors");

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors());
app.use(express.json());

/* ---------- IMPORTS ---------- */
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

const { cleanData } = require("./utils/cleanData");
const { getRawData } = require("./db/queries");

/* ---------- HEALTH CHECK ---------- */
app.get("/", (req, res) => {
  console.log("✅ ROOT HIT");
  res.status(200).send("Backend working ✅");
});

/* ---------- DEBUG ROUTE (VERY IMPORTANT) ---------- */
app.get("/api/test", async (req, res) => {
  try {
    const raw = await getRawData();

    console.log("RAW DATA LENGTH:", raw?.length);

    return res.json({
      success: true,
      count: raw.length,
      sample: raw[0] || null
    });

  } catch (err) {
    console.error("TEST ERROR:", err);
    res.status(500).json({ error: "DB ERROR" });
  }
});

/* ---------- MAIN CHAT API ---------- */
app.post("/api/ask", async (req, res) => {
  const q = (req.body.question || "").toLowerCase();

  console.log("QUESTION:", q);

  try {
    /* ---- FETCH DATA ---- */
    let raw;
    try {
      raw = await getRawData();
    } catch (dbErr) {
      console.error("DB ERROR:", dbErr);
      return res.status(500).send({
        answer: "Database error"
      });
    }

    if (!raw || raw.length === 0) {
      return res.send({
        answer: "No data available"
      });
    }

    /* ---- CLEAN DATA ---- */
    const data = cleanData(raw);

    console.log("CLEAN DATA LENGTH:", data.length);

    /* ---- DETECT INTENT ---- */
    const intent = detectIntent(q);
    console.log("INTENT:", intent);

    /* ---- HANDLE INTENTS ---- */
    switch (intent) {

      case "PREDICT": {
        const match = q.match(/\d+/);
        const day = match ? parseInt(match[0]) : 1;

        try {
          const pred = await runPrediction(day);

          return res.send({
            answer: `Predicted revenue for day ${day} is ${pred.toFixed(2)}`
          });
        } catch (err) {
          console.error("PREDICT ERROR:", err);
          return res.send({
            answer: "Prediction failed"
          });
        }
      }

      case "HIGHEST_DAY": {
        const result = highestSalesDay(data);
        if (!result) return res.send({ answer: "No data found" });

        const [day, value] = result;

        return res.send({
          answer: `Day ${day} had highest sales ${value.toFixed(2)}`
        });
      }

      case "LOWEST_DAY": {
        const result = lowestSalesDay(data);
        if (!result) return res.send({ answer: "No data found" });

        const [day, value] = result;

        return res.send({
          answer: `Day ${day} had lowest sales ${value.toFixed(2)}`
        });
      }

      case "TOP_AGENT": {
        const result = topAgent(data);
        if (!result) return res.send({ answer: "No data found" });

        const [agent, revenue] = result;

        return res.send({
          answer: `${agent} is top agent with ${revenue.toFixed(2)}`
        });
      }

      case "COMPARE": {
        const result = compareAgents(data);

        const text = result
          .map(([a, r]) => `${a} (${r.toFixed(2)})`)
          .join(", ");

        return res.send({
          answer: `Top agents: ${text}`
        });
      }

      case "TREND": {
        const trend = getTrend(data);

        return res.send({
          answer: `Sales trend is ${trend}`
        });
      }

      case "HIGH_VALUE": {
        const count = highValueOrders(data);

        return res.send({
          answer: `${count} high-value orders found`
        });
      }

      default:
        return res.send({
          answer: "Ask about sales, agents, trends, or predictions"
        });
    }

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).send({
      answer: "Server error"
    });
  }
});

/* ---------- START SERVER ---------- */
app.listen(5000, "127.0.0.1", () => {
  console.log("🚀 Server running on http://127.0.0.1:5000");
});