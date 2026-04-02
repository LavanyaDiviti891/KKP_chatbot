const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./backend/db/sales.db");

exports.getRawData = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM sales`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};