const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./backend/db/sales.db");

const raw = require("../data/data.json");
const data = raw.formData || [];

console.log("DATA LENGTH:", data.length);

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO sales 
    (date, agentName, customerName, quantity, rate, status, quality, weave)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  data.forEach(d => {
    stmt.run(
      d.date,
      d.agentName || "Unknown",
      d.customerName || "Unknown",
      d.quantity || 0,
      d.rate || Math.floor(Math.random() * 200) + 50,
      d.status || "Unknown",
      d.quality || "",
      d.weave || ""
    );
  });

  stmt.finalize();
  console.log("✅ Data inserted:", data.length);
});

db.close();