const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");

const app = express(); // ✅ IMPORTANT

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

// ML Chat Route
app.post("/api/ask", (req, res) => {
  const { question } = req.body;

  console.log("User asked:", question);

  // Extract number (day)
  const match = question.match(/\d+/);
  const day = match ? match[0] : 1;

  // Absolute path to Python script
  const scriptPath = path.join(__dirname, "ml", "predict.py");

  exec(`python "${scriptPath}" ${day}`, (err, stdout, stderr) => {
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    if (err) {
      console.error("ERROR:", err);
      return res.json({ answer: "❌ ML error" });
    }

    const result = stdout.trim();

    res.json({
      answer: `📊 Predicted revenue for day ${day} is ${result}`
    });
  });
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});