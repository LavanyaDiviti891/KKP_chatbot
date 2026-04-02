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
    .filter(d => d.rate !== null && d.quantity)
    .map(d => {
      const dateObj = new Date(d.date);

      return {
        date: d.date,
        day: dateObj.getDate(),
        month: dateObj.getMonth() + 1,

        agent: normalizeAgent(d.agentName),
        customer: d.customerName?.toLowerCase(),

        quantity: d.quantity,
        rate: d.rate,
        revenue: d.quantity * d.rate,

        status: d.status,
        quality: cleanQuality(d.quality),
        weave: d.weave
      };
    });
}

module.exports = { cleanData };