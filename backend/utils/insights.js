function highestSalesDay(data) {
  if (!data.length) return { day: "-", revenue: 0 };

  let max = data[0];

  data.forEach(d => {
    if (d.revenue > max.revenue) max = d;
  });

  return max;
}

function lowestSalesDay(data) {
  if (!data.length) return { day: "-", revenue: 0 };

  let min = data[0];

  data.forEach(d => {
    if (d.revenue < min.revenue) min = d;
  });

  return min;
}

function topAgent(data) {
  if (!data.length) return { agent: "-", revenue: 0 };

  const agentMap = {};

  data.forEach(d => {
    agentMap[d.agent] = (agentMap[d.agent] || 0) + d.revenue;
  });

  let top = { agent: "-", revenue: 0 };

  for (let agent in agentMap) {
    if (agentMap[agent] > top.revenue) {
      top = { agent, revenue: agentMap[agent] };
    }
  }

  return top;
}

function getTrend(data) {
  if (data.length < 2) return "Not enough data";

  const first = data[0].revenue;
  const last = data[data.length - 1].revenue;

  if (last > first) return "increasing ";
  if (last < first) return "decreasing ";
  return "stable";
}

function highValueOrders(data) {
  return data.filter(d => d.revenue > 100000);
}

function compareAgents(data, a1, a2) {
  const sum = {};

  data.forEach(d => {
    sum[d.agent] = (sum[d.agent] || 0) + d.revenue;
  });

  return {
    [a1]: sum[a1] || 0,
    [a2]: sum[a2] || 0
  };
}
function highestSalesDay(data) {
  if (!data || data.length === 0) return [0, 0];

  let max = -Infinity;
  let bestDay = null;

  data.forEach(d => {
    if (d.revenue > max) {
      max = d.revenue;
      bestDay = d.date;
    }
  });

  return [bestDay, max];
}
module.exports = {
  highestSalesDay,
  lowestSalesDay,
  topAgent,
  getTrend,
  highValueOrders,
  compareAgents
};