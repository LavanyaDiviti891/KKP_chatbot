const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Ensure db folder exists
const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Correct DB path
const dbPath = path.join(__dirname, 'database.db');
console.log("📁 Creating/Using DB at:", dbPath);

const db = new Database(dbPath);

// ======================
// USERS TABLE
// ======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
  )
`).run();

console.log("✅ Users table ready");

// ======================
// SALES TABLE (for ML)
// ======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day INTEGER,
    revenue REAL
  )
`).run();

console.log("✅ Sales table ready");

// ======================
// INSERT SAMPLE DATA
// ======================
const count = db.prepare("SELECT COUNT(*) as count FROM sales").get();

if (count.count === 0) {
  console.log("📊 Inserting sample sales data...");

  const insert = db.prepare("INSERT INTO sales (day, revenue) VALUES (?, ?)");

  const insertMany = db.transaction(() => {
    for (let i = 1; i <= 30; i++) {
      const revenue = Math.floor(Math.random() * 500) + i * 100;
      insert.run(i, revenue);
    }
  });

  insertMany();

  console.log("✅ Sample data inserted");
} else {
  console.log("ℹ️ Sales table already has data, skipping insert");
}

console.log("🎉 Database setup complete!");