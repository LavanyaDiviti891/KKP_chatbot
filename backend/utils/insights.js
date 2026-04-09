function highestSalesDay(data) {
  if (!data || data.length === 0) return ["N/A", 0];

  let max = -Infinity;
  let bestDay = "N/A";

  data.forEach(d => {
    if (d.revenue > max) {
      max = d.revenue;
      bestDay = d.day; // ✅ fixed: was d.date in the duplicate override
    }
  });

  return [bestDay, max]; // ✅ returns array so server.js can destructure as [day, value]
}

function lowestSalesDay(data) {
  if (!data || data.length === 0) return ["N/A", 0];

  let min = data[0];

  data.forEach(d => {
    if (d.revenue < min.revenue) min = d;
  });

  return [min.day, min.revenue]; // ✅ fixed: was returning object, now returns array
}

function topAgent(data) {
  if (!data || data.length === 0) return ["N/A", 0];

  const agentMap = {};

  data.forEach(d => {
    agentMap[d.agent] = (agentMap[d.agent] || 0) + d.revenue;
  });

  let topName = "N/A";
  let topRevenue = 0;

  for (let agent in agentMap) {
    if (agentMap[agent] > topRevenue) {
      topRevenue = agentMap[agent];
      topName = agent;
    }
  }

  return [topName, topRevenue]; // ✅ fixed: was returning object, now returns array
}

function getTrend(data) {
  if (!data || data.length < 2) return "Not enough data";

  const first = data[0].revenue;
  const last = data[data.length - 1].revenue;

  if (last > first) return "increasing 📈";
  if (last < first) return "decreasing 📉";
  return "stable ➡️";
}

function highValueOrders(data) {
  return data.filter(d => d.revenue > 100000).length; // ✅ returns count not array
}

function compareAgents(data) {
  // ✅ fixed: no longer requires a1/a2 args — returns sorted array of [name, revenue] pairs
  const sum = {};

  data.forEach(d => {
    if (d.agent && d.agent !== "Unknown") {
      sum[d.agent] = (sum[d.agent] || 0) + d.revenue;
    }
  });

  return Object.entries(sum)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5 agents
}

module.exports = {
  highestSalesDay,
  lowestSalesDay,
  topAgent,
  getTrend,
  highValueOrders,
  compareAgents
};
