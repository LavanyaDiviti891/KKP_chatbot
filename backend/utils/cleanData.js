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
  return data
    .filter(d => d.quantity && d.rate)
    .map(d => ({
      ...d,
      agentName: d.agentName || "Unknown",
      day: new Date(d.date).getDate(),
      revenue: Number(d.quantity) * Number(d.rate)
    }));
}

module.exports = { cleanData };