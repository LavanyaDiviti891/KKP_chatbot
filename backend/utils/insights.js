function topAgent(data) {
  const map = {};

  data.forEach(d => {
    map[d.agentName] = (map[d.agentName] || 0) + d.revenue;
  });

  return Object.entries(map).sort((a, b) => b[1] - a[1])[0];
}

function compareAgents(data) {
  const map = {};

  data.forEach(d => {
    map[d.agentName] = (map[d.agentName] || 0) + d.revenue;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

function getTrend(data) {
  const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));

  const first = sorted[0]?.revenue || 0;
  const last = sorted[sorted.length - 1]?.revenue || 0;

  return last > first ? "increasing 📈" : "decreasing 📉";
}

function highValueOrders(data) {
  return data.filter(d => d.revenue > 50000).length;
}

function highestSalesDay(data) {
  if (!data || data.length === 0) return null;

  const map = {};

  data.forEach(d => {
    if (!d.day || !d.revenue) return;
    map[d.day] = (map[d.day] || 0) + d.revenue;
  });

  const entries = Object.entries(map);
  if (entries.length === 0) return null;

  return entries.sort((a, b) => b[1] - a[1])[0];
}

function lowestSalesDay(data) {
  if (!data || data.length === 0) return null;

  const map = {};

  data.forEach(d => {
    if (!d.day || !d.revenue) return;
    map[d.day] = (map[d.day] || 0) + d.revenue;
  });

  const entries = Object.entries(map);
  if (entries.length === 0) return null;

  return entries.sort((a, b) => a[1] - b[1])[0];
}

module.exports = {
  topAgent,
  compareAgents,
  getTrend,
  highValueOrders,
  highestSalesDay,
  lowestSalesDay
};