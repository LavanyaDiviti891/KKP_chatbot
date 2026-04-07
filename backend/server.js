const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔥 CLEAN SERVER RUNNING (API MODE)");

// 🔹 Import modules
const { fetchAPIData } = require("./utils/apiService");

const {
  highestSalesDay,
  lowestSalesDay,
  topAgent,
  compareAgents,
  getTrend,
  highValueOrders
} = require("./utils/insights");

const {
  detectIntent,
  extractEntities,
  generateResponse
} = require("./utils/aiEngine");

// 🔹 Root check
app.get("/", (req, res) => {
  res.send("✅ Backend running (API mode)");
});

// 🔹 Main chatbot endpoint
app.post("/api/ask", async (req, res) => {
  try {
    const q = (req.body.question || "").toLowerCase();

    console.log("QUESTION:", q);

    // 🔥 STEP 1: Fetch API data
    const raw = await fetchAPIData();

    console.log("RAW DATA LENGTH:", raw.length);

    // 🔥 STEP 2: Clean data (IMPORTANT FIX)
    const data = (raw || [])
  .filter(item => item.rate !== null && item.rate !== 0) // 🔥 IMPORTANT
  .map((item, i) => ({
    day: i + 1,
    revenue: item.quantity * item.rate,
    agent: item.agentName || "Unknown"

    
  }));

    // 🔥 STEP 3: AI understanding
    const intent = detectIntent(q);
    const entities = extractEntities(q);

    console.log("INTENT:", intent);
    console.log("ENTITIES:", entities);

    // 🔥 STEP 4: Generate response
    const answer = generateResponse(intent, data, entities, {
      highestSalesDay,
      lowestSalesDay,
      topAgent,
      compareAgents,
      getTrend,
      highValueOrders
    });

    res.json({ answer });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.json({ answer: "⚠️ Error processing request" });
  }
});

// 🔹 Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://127.0.0.1:5000");
});