// ─── Helper: build agent revenue map ─────────────────────────────────────────
function buildAgentMap(data) {
  const map = {};
  data.forEach(d => {
    if (d.agent && d.agent !== "Unknown") {
      map[d.agent] = (map[d.agent] || 0) + d.revenue;
    }
  });
  return map;
}

// ─── Helper: build product stats map ─────────────────────────────────────────
function buildProductMap(data) {
  const map = {};
  data.forEach(d => {
    const p = d.quality || "Unknown";
    if (p === "Unknown") return;
    if (!map[p]) map[p] = { orders: 0, revenue: 0, confirmed: 0, declined: 0, processed: 0, pending: 0, quantity: 0 };
    map[p].orders    += 1;
    map[p].revenue   += d.revenue;
    map[p].quantity  += d.quantity || 0;
    if (d.status === "confirmed")  map[p].confirmed  += 1;
    if (d.status === "declined")   map[p].declined   += 1;
    if (d.status === "processed")  map[p].processed  += 1;
    if (d.status === "pending")    map[p].pending    += 1;
  });
  return map;
}

// ─── Helper: build weave stats map ───────────────────────────────────────────
function buildWeaveMap(data) {
  const map = {};
  data.forEach(d => {
    const w = d.weave || "Unknown";
    if (!map[w]) map[w] = { orders: 0, confirmed: 0, declined: 0, processed: 0 };
    map[w].orders    += 1;
    if (d.status === "confirmed")  map[w].confirmed  += 1;
    if (d.status === "declined")   map[w].declined   += 1;
    if (d.status === "processed")  map[w].processed  += 1;
  });
  return map;
}

// ─── Highest Sales Day ────────────────────────────────────────────────────────
function highestSalesDay(data) {
  if (!data || data.length === 0) return ["N/A", 0];
  let max = -Infinity, bestDay = "N/A";
  data.forEach(d => { if (d.revenue > max) { max = d.revenue; bestDay = d.day; } });
  return [bestDay, max];
}

// ─── Lowest Sales Day ─────────────────────────────────────────────────────────
function lowestSalesDay(data) {
  if (!data || data.length === 0) return ["N/A", 0];
  let min = data[0];
  data.forEach(d => { if (d.revenue < min.revenue) min = d; });
  return [min.day, min.revenue];
}

// ─── Top Agent ────────────────────────────────────────────────────────────────
function topAgent(data) {
  if (!data || data.length === 0) return ["N/A", 0];
  const agentMap = buildAgentMap(data);
  let topName = "N/A", topRevenue = 0;
  for (let agent in agentMap) {
    if (agentMap[agent] > topRevenue) { topRevenue = agentMap[agent]; topName = agent; }
  }
  return [topName, topRevenue];
}

// ─── Agent Sales by Name ──────────────────────────────────────────────────────
function agentSales(data, agentName) {
  if (!agentName) return null;
  const agentMap = buildAgentMap(data);
  const key = Object.keys(agentMap).find(k => k.toLowerCase() === agentName.toLowerCase());
  if (!key) return null;
  return [key, agentMap[key]];
}

// ─── Agent Rank ───────────────────────────────────────────────────────────────
function agentRank(data, agentName) {
  if (!agentName) return null;
  const sorted = compareAgents(data);
  const idx = sorted.findIndex(([name]) => name.toLowerCase() === agentName.toLowerCase());
  if (idx === -1) return null;
  return { rank: idx + 1, name: sorted[idx][0], revenue: sorted[idx][1], total: sorted.length };
}

// ─── Compare Agents ───────────────────────────────────────────────────────────
function compareAgents(data) {
  const agentMap = buildAgentMap(data);
  return Object.entries(agentMap).sort((a, b) => b[1] - a[1]);
}

// ─── Sales Trend ──────────────────────────────────────────────────────────────
function getTrend(data) {
  if (!data || data.length < 2) return "insufficient data to determine a trend";
  const third = Math.max(1, Math.floor(data.length / 3));
  const firstAvg = data.slice(0, third).reduce((s, d) => s + d.revenue, 0) / third;
  const lastAvg  = data.slice(-third).reduce((s, d) => s + d.revenue, 0) / third;
  const pct = (((lastAvg - firstAvg) / (firstAvg || 1)) * 100).toFixed(1);
  if (lastAvg > firstAvg) return `increasing (approx. +${pct}%)`;
  if (lastAvg < firstAvg) return `decreasing (approx. ${pct}%)`;
  return "stable";
}

// ─── High Value Orders ────────────────────────────────────────────────────────
function highValueOrders(data, threshold = 100000) {
  return data.filter(d => d.revenue > threshold).length;
}

// ─── Total Revenue ────────────────────────────────────────────────────────────
function totalRevenue(data) {
  return data.reduce((sum, d) => sum + d.revenue, 0);
}

// ─── Order Count by Status ────────────────────────────────────────────────────
function orderCountByStatus(data, status) {
  if (!status) return data.length;
  return data.filter(d => d.status && d.status.toLowerCase() === status.toLowerCase()).length;
}

// ─── Confirmed Percentage ─────────────────────────────────────────────────────
function confirmedPercentage(data) {
  if (!data.length) return 0;
  const confirmed = data.filter(d => d.status === "confirmed").length;
  return ((confirmed / data.length) * 100).toFixed(1);
}

// ─── Get Agent Names ──────────────────────────────────────────────────────────
function getAgentNames(data) {
  return [...new Set(data.map(d => d.agent).filter(a => a && a !== "Unknown"))];
}

// ─── TOP PRODUCTS ─────────────────────────────────────────────────────────────
function topProducts(data, limit = 5) {
  const map = buildProductMap(data);
  return Object.entries(map)
    .sort((a, b) => b[1].orders - a[1].orders)
    .slice(0, limit);
}

// ─── PRODUCT DETAILS by name ──────────────────────────────────────────────────
function productDetails(data, productName) {
  if (!productName) return null;
  const map = buildProductMap(data);
  const key = Object.keys(map).find(k => k.toLowerCase().includes(productName.toLowerCase()));
  if (!key) return null;
  return { name: key, ...map[key] };
}

// ─── TOP WEAVE TYPES ──────────────────────────────────────────────────────────
function topWeaves(data) {
  const map = buildWeaveMap(data);
  return Object.entries(map).sort((a, b) => b[1].orders - a[1].orders);
}

// ─── DECLINE REASONS ─────────────────────────────────────────────────────────
function declineReasons(data) {
  const reasons = {};
  data.filter(d => d.status === "declined" && d.reason).forEach(d => {
    const r = d.reason.toLowerCase().trim();
    reasons[r] = (reasons[r] || 0) + 1;
  });
  return Object.entries(reasons).sort((a, b) => b[1] - a[1]);
}

// ─── CUSTOMER ORDERS ─────────────────────────────────────────────────────────
function customerOrders(data, customerName) {
  if (!customerName) return [];
  return data.filter(d =>
    (d.customerName && d.customerName.toLowerCase().includes(customerName.toLowerCase()))
  );
}

// ─── ORDERS BY MONTH ─────────────────────────────────────────────────────────
function ordersByMonth(data, month, year) {
  return data.filter(d => {
    if (!d.date) return false;
    const date = new Date(d.date);
    const matchMonth = month ? date.getMonth() + 1 === month : true;
    const matchYear  = year  ? date.getFullYear()  === year  : true;
    return matchMonth && matchYear;
  });
}

// ─── CONVERSION RATE ─────────────────────────────────────────────────────────
function conversionRate(data) {
  if (!data.length) return 0;
  const confirmed = data.filter(d => d.status === "confirmed").length;
  return ((confirmed / data.length) * 100).toFixed(1);
}

// ─── AVG ORDER VALUE ─────────────────────────────────────────────────────────
function avgOrderValue(data) {
  const withRevenue = data.filter(d => d.revenue > 0);
  if (!withRevenue.length) return 0;
  return withRevenue.reduce((s, d) => s + d.revenue, 0) / withRevenue.length;
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
  getAgentNames,
  topProducts,
  productDetails,
  topWeaves,
  declineReasons,
  customerOrders,
  ordersByMonth,
  conversionRate,
  avgOrderValue
};
