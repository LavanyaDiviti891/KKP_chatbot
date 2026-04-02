const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./backend/db/sales.db");


db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS sales`);

  db.run(`
    CREATE TABLE sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      agentName TEXT,
      customerName TEXT,
      quantity INTEGER,
      rate INTEGER,
      status TEXT,
      quality TEXT,
      weave TEXT
    )
  `);

  console.log("✅ Table created");
});

db.close();