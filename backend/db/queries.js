const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "sales.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("DB ERROR:", err.message);
  } else {
    console.log("✅ Connected to sales.db");
  }
});

function getRawData() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM sales", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { getRawData };