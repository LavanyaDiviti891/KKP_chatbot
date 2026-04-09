// backend/utils/cleanData.js

function normalizeAgent(name) {
  if (!name) return "Unknown";

  name = name.toLowerCase();

  if (name.includes("unknown")) return "Unknown";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function cleanQuality(q) {
  if (!q) return "unknown";

  q = q.toLowerCase();

  if (q.includes("premium")) return "premium";
  if (q.includes("standard")) return "standard";

  return "other";
}

function cleanData(data) {
  return data.map(d => ({
    date: d.date,
    revenue: (d.quantity || 0) * (d.rate || 0), 
    status: d.status || "unknown",
    agent: d.agent || "unknown"
  }));
}

module.exports = { cleanData };