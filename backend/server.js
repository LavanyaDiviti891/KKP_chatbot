const fs = require("fs");
const path = require("path");

let cachedData = null;

function getData() {
  if (cachedData) return cachedData;

  const file1 = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data/data1.json"))
  );

  const file2 = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data/data2.json"))
  );


  const arr1 = Array.isArray(file1) ? file1 : file1.data || [];
  const arr2 = Array.isArray(file2) ? file2 : file2.data || [];

  cachedData = [...arr1, ...arr2];

  return cachedData;
}

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

console.log(" CLEAN SERVER RUNNING (API MODE)");


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


app.get("/", (req, res) => {
  res.send(" Backend running (API mode)");
});


app.post("/api/ask", async (req, res) => {
  try {
    const q = (req.body.question || "").toLowerCase();

    console.log("QUESTION:", q);
   


    const raw = getData();

    console.log("RAW DATA LENGTH:", raw.length);

    
    const data = (raw || [])
  .filter(item => item.rate !== null && item.rate !== 0) 
  .map((item, i) => ({
    day: i + 1,
    revenue: item.quantity * item.rate,
    agent: item.agentName || "Unknown"

    
  }));

    const intent = detectIntent(q);
    const entities = extractEntities(q);

    console.log("INTENT:", intent);
    console.log("ENTITIES:", entities);


    const answer = generateResponse(intent, data, entities, {
      highestSalesDay,
      lowestSalesDay,
      topAgent,
      compareAgents,
      getTrend,
      highValueOrders
    });

    res.json({ answer });

  }catch (err) {
   console.error(" FULL ERROR:", err);   // print full error
   send({ answer: err.message });     // send actual error to UI
 }
});


app.listen(5000, () => {
  console.log(" Server running on http://127.0.0.1:5000");
});