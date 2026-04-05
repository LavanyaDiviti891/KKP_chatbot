function groupByDay(data) {
  const map = {};

  data.forEach(d => {
    if (!d.day) return;
    map[d.day] = (map[d.day] || 0) + d.revenue;
  });

  return map;
}

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
  if (!data.length) return "no data";

  const sorted = [...data].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const first = sorted[0].revenue;
  const last = sorted[sorted.length - 1].revenue;

  return last > first ? "increasing 📈" : "decreasing 📉";
}

function highValueOrders(data) {
  return data.filter(d => d.revenue > 50000).length;
}

function highestSalesDay(data) {
  const map = groupByDay(data);

  const entries = Object.entries(map);
  if (!entries.length) return null;

  return entries.sort((a, b) => b[1] - a[1])[0];
}

function lowestSalesDay(data) {
  const map = groupByDay(data);

  const entries = Object.entries(map);
  if (!entries.length) return null;

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