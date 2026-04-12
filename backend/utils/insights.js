function buildAgentMap(data) {
  const map = {};
  data.forEach(d => {
    if (d.agent && d.agent !== "Unknown") {
      map[d.agent] = (map[d.agent] || 0) + d.revenue;
    }
  });
  return map;
}

function highestSalesDay(data) {
  if (!data || data.length === 0) return ["N/A", 0];
  let max = -Infinity, bestDay = "N/A";
  data.forEach(d => { if (d.revenue > max) { max = d.revenue; bestDay = d.day; } });
  return [bestDay, max];
}

function lowestSalesDay(data) {
  if (!data || data.length === 0) return ["N/A", 0];
  let min = data[0];
  data.forEach(d => { if (d.revenue < min.revenue) min = d; });
  return [min.day, min.revenue];
}

function topAgent(data) {
  if (!data || data.length === 0) return ["N/A", 0];
  const agentMap = buildAgentMap(data);
  let topName = "N/A", topRevenue = 0;
  for (let agent in agentMap) {
    if (agentMap[agent] > topRevenue) { topRevenue = agentMap[agent]; topName = agent; }
  }
  return [topName, topRevenue];
}

function agentSales(data, agentName) {
  if (!agentName) return null;
  const agentMap = buildAgentMap(data);
  const key = Object.keys(agentMap).find(k => k.toLowerCase() === agentName.toLowerCase());
  if (!key) return null;
  return [key, agentMap[key]];
}

function agentRank(data, agentName) {
  if (!agentName) return null;
  const sorted = compareAgents(data);
  const idx = sorted.findIndex(([name]) => name.toLowerCase() === agentName.toLowerCase());
  if (idx === -1) return null;
  return { rank: idx + 1, name: sorted[idx][0], revenue: sorted[idx][1], total: sorted.length };
}

function compareAgents(data) {
  const agentMap = buildAgentMap(data);
  return Object.entries(agentMap).sort((a, b) => b[1] - a[1]);
}

function getTrend(data) {
  if (!data || data.length < 2) return "insufficient data to determine a trend";
  const third = Math.max(1, Math.floor(data.length / 3));
  const firstAvg = data.slice(0, third).reduce((s, d) => s + d.revenue, 0) / third;
  const lastAvg = data.slice(-third).reduce((s, d) => s + d.revenue, 0) / third;
  const pct = (((lastAvg - firstAvg) / (firstAvg || 1)) * 100).toFixed(1);
  if (lastAvg > firstAvg) return `increasing (approx. +${pct}%)`;
  if (lastAvg < firstAvg) return `decreasing (approx. ${pct}%)`;
  return "stable";
}

function highValueOrders(data, threshold = 100000) {
  return data.filter(d => d.revenue > threshold).length;
}

function totalRevenue(data) {
  return data.reduce((sum, d) => sum + d.revenue, 0);
}

function orderCountByStatus(data, status) {
  if (!status) return data.length;
  return data.filter(d => d.status && d.status.toLowerCase() === status.toLowerCase()).length;
}

function confirmedPercentage(data) {
  if (!data.length) return 0;
  const confirmed = data.filter(d => d.status && d.status.toLowerCase() === "confirmed").length;
  return ((confirmed / data.length) * 100).toFixed(1);
}

function getAgentNames(data) {
  return [...new Set(data.map(d => d.agent).filter(a => a && a !== "Unknown"))];
}

module.exports = {
  highestSalesDay,
  lowestSalesDay,
  topAgent,
  agentSales,
  agentRank,
  compareAgents,
  getTrend,
  highValueOrders,
  totalRevenue,
  orderCountByStatus,
  confirmedPercentage,
  getAgentNames
};
