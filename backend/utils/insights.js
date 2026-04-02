// backend/utils/insights.js

function topAgent(data) {
  const map = {};

  data.forEach(d => {
    map[d.agent] = (map[d.agent] || 0) + d.revenue;
  });

  return Object.entries(map).sort((a, b) => b[1] - a[1])[0];
}

function compareAgents(data) {
  const map = {};

  data.forEach(d => {
    map[d.agent] = (map[d.agent] || 0) + d.revenue;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

function getTrend(data) {
  const sorted = [...data].sort((a, b) => a.day - b.day);

  const first = sorted[0].revenue;
  const last = sorted[sorted.length - 1].revenue;

  if (last > first) return "increasing";
  if (last < first) return "decreasing";
  return "stable";
}

function highValueOrders(data) {
  return data.filter(d => d.revenue > 50000).length;
}

module.exports = {
  topAgent,
  compareAgents,
  getTrend,
  highValueOrders
};