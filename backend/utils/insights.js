// ─── Helper: build agent stats map (includes zero-revenue agents) ─────────────
function buildAgentMap(data) {
  const map = {};
  data.forEach(d => {
    if (!d.agent || d.agent === "Unknown User" || d.agent === "Unknown") return;
    if (!map[d.agent]) map[d.agent] = { revenue: 0, orders: 0, confirmed: 0, declined: 0, pending: 0, processed: 0 };
    map[d.agent].revenue  += d.revenue;
    map[d.agent].orders   += 1;
    if (d.status === "confirmed")  map[d.agent].confirmed  += 1;
    if (d.status === "declined")   map[d.agent].declined   += 1;
    if (d.status === "pending")    map[d.agent].pending    += 1;
    if (d.status === "processed")  map[d.agent].processed  += 1;
  });
  return map;
}

// ─── Helper: build product stats map — tracks by ORDER COUNT not revenue ──────
// Many orders have rate=null so revenue=0, but orders are still real
function buildProductMap(data) {
  const map = {};
  data.forEach(d => {
    const p = (d.quality || "").trim();
    if (!p || p === "Unknown") return;
    if (!map[p]) map[p] = { orders: 0, revenue: 0, confirmed: 0, declined: 0, processed: 0, pending: 0, quantity: 0 };
    map[p].orders   += 1;
    map[p].revenue  += d.revenue || 0;
    map[p].quantity += d.quantity || 0;
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
    const w = (d.weave || "").trim();
    if (!w || w === "Unknown") return;
    if (!map[w]) map[w] = { orders: 0, confirmed: 0, declined: 0, processed: 0, pending: 0 };
    map[w].orders   += 1;
    if (d.status === "confirmed")  map[w].confirmed  += 1;
    if (d.status === "declined")   map[w].declined   += 1;
    if (d.status === "processed")  map[w].processed  += 1;
    if (d.status === "pending")    map[w].pending    += 1;
  });
  return map;
}

// ─── Highest Sales Day ────────────────────────────────────────────────────────
function highestSalesDay(data) {
  if (!data || data.length === 0) return ["N/A", 0];
  // Only consider days with revenue > 0
  const withRevenue = data.filter(d => d.revenue > 0);
  if (!withRevenue.length) return ["N/A", 0];
  let max = -Infinity, bestDay = "N/A";
  withRevenue.forEach(d => { if (d.revenue > max) { max = d.revenue; bestDay = d.day; } });
  return [bestDay, max];
}

// ─── Lowest Sales Day ─────────────────────────────────────────────────────────
function lowestSalesDay(data) {
  if (!data || data.length === 0) return ["N/A", 0];
  const withRevenue = data.filter(d => d.revenue > 0);
  if (!withRevenue.length) return ["N/A", 0];
  let min = withRevenue[0];
  withRevenue.forEach(d => { if (d.revenue < min.revenue) min = d; });
  return [min.day, min.revenue];
}

// ─── Top Agent (by orders if revenue tied at 0) ───────────────────────────────
function topAgent(data) {
  if (!data || data.length === 0) return ["N/A", 0];
  const agentMap = buildAgentMap(data);
  if (!Object.keys(agentMap).length) return ["N/A", 0];
  // Sort by revenue first, then by orders if revenue is equal
  const sorted = Object.entries(agentMap).sort((a, b) =>
    b[1].revenue !== a[1].revenue ? b[1].revenue - a[1].revenue : b[1].orders - a[1].orders
  );
  return [sorted[0][0], sorted[0][1].revenue];
}

// ─── Agent Sales by Name ──────────────────────────────────────────────────────
function agentSales(data, agentName) {
  if (!agentName) return null;
  const agentMap = buildAgentMap(data);
  const key = Object.keys(agentMap).find(k => k.toLowerCase() === agentName.toLowerCase());
  if (!key) return null;
  return [key, agentMap[key].revenue, agentMap[key]];
}

// ─── Agent Rank (by orders if revenue tied) ───────────────────────────────────
function agentRank(data, agentName) {
  if (!agentName) return null;
  const agentMap = buildAgentMap(data);
  if (!Object.keys(agentMap).length) return null;
  const sorted = Object.entries(agentMap).sort((a, b) =>
    b[1].revenue !== a[1].revenue ? b[1].revenue - a[1].revenue : b[1].orders - a[1].orders
  );
  const idx = sorted.findIndex(([name]) => name.toLowerCase() === agentName.toLowerCase());
  if (idx === -1) return null;
  const s = sorted[idx][1];
  return {
    rank: idx + 1, name: sorted[idx][0],
    revenue: s.revenue, orders: s.orders,
    confirmed: s.confirmed, declined: s.declined,
    total: sorted.length
  };
}

// ─── Compare Agents ───────────────────────────────────────────────────────────
function compareAgents(data) {
  const agentMap = buildAgentMap(data);
  return Object.entries(agentMap)
    .sort((a, b) => b[1].revenue !== a[1].revenue ? b[1].revenue - a[1].revenue : b[1].orders - a[1].orders)
    .map(([name, s]) => [name, s.revenue, s]);
}

// ─── Sales Trend ──────────────────────────────────────────────────────────────
function getTrend(data) {
  const withRevenue = data.filter(d => d.revenue > 0);
  if (!withRevenue || withRevenue.length < 2) return "insufficient revenue data to determine a trend";
  const third    = Math.max(1, Math.floor(withRevenue.length / 3));
  const firstAvg = withRevenue.slice(0, third).reduce((s, d) => s + d.revenue, 0) / third;
  const lastAvg  = withRevenue.slice(-third).reduce((s, d) => s + d.revenue, 0) / third;
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
  return data.reduce((sum, d) => sum + (d.revenue || 0), 0);
}

// ─── Order Count by Status ────────────────────────────────────────────────────
function orderCountByStatus(data, status) {
  if (!status) return data.length;
  return data.filter(d => d.status && d.status.toLowerCase() === status.toLowerCase()).length;
}

// ─── Confirmed Percentage ─────────────────────────────────────────────────────
function confirmedPercentage(data) {
  if (!data.length) return "0.0";
  const confirmed = data.filter(d => d.status === "confirmed").length;
  return ((confirmed / data.length) * 100).toFixed(1);
}

// ─── Get Agent Names ──────────────────────────────────────────────────────────
function getAgentNames(data) {
  return [...new Set(data.map(d => d.agent).filter(a => a && a !== "Unknown" && a !== "Unknown User"))];
}

// ─── Top Products (ranked by order count) ────────────────────────────────────
function topProducts(data, limit = 5) {
  const map = buildProductMap(data);
  if (!Object.keys(map).length) return [];
  return Object.entries(map)
    .sort((a, b) => b[1].orders - a[1].orders)
    .slice(0, limit);
}

// ─── Product Details by name ──────────────────────────────────────────────────
function productDetails(data, productName) {
  if (!productName) return null;
  const map = buildProductMap(data);
  const key = Object.keys(map).find(k => k.toLowerCase().includes(productName.toLowerCase()));
  if (!key) return null;
  return { name: key, ...map[key] };
}

// ─── Top Weave Types ──────────────────────────────────────────────────────────
function topWeaves(data) {
  const map = buildWeaveMap(data);
  if (!Object.keys(map).length) return [];
  return Object.entries(map).sort((a, b) => b[1].orders - a[1].orders);
}

// ─── Decline Reasons ─────────────────────────────────────────────────────────
function declineReasons(data) {
  const reasons = {};
  data.filter(d => d.status === "declined" && d.reason && d.reason.trim()).forEach(d => {
    const r = d.reason.toLowerCase().trim();
    reasons[r] = (reasons[r] || 0) + 1;
  });
  return Object.entries(reasons).sort((a, b) => b[1] - a[1]);
}

// ─── Customer Orders ─────────────────────────────────────────────────────────
function customerOrders(data, customerName) {
  if (!customerName) return [];
  return data.filter(d =>
    d.customerName && d.customerName.toLowerCase().includes(customerName.toLowerCase())
  );
}

// ─── Orders by Month ─────────────────────────────────────────────────────────
function ordersByMonth(data, month, year) {
  return data.filter(d => {
    if (!d.date) return false;
    const date       = new Date(d.date);
    const matchMonth = month ? date.getMonth() + 1 === month : true;
    const matchYear  = year  ? date.getFullYear()  === year  : true;
    return matchMonth && matchYear;
  });
}

// ─── Conversion Rate ─────────────────────────────────────────────────────────
function conversionRate(data) {
  if (!data.length) return "0.0";
  const confirmed = data.filter(d => d.status === "confirmed").length;
  return ((confirmed / data.length) * 100).toFixed(1);
}

// ─── Average Order Value (only orders with rate set) ─────────────────────────
function avgOrderValue(data) {
  const withRevenue = data.filter(d => d.revenue > 0);
  if (!withRevenue.length) return 0;
  return withRevenue.reduce((s, d) => s + d.revenue, 0) / withRevenue.length;
}

module.exports = {
  highestSalesDay, lowestSalesDay,
  topAgent, agentSales, agentRank, compareAgents,
  getTrend, highValueOrders, totalRevenue,
  orderCountByStatus, confirmedPercentage, getAgentNames,
  topProducts, productDetails, topWeaves,
  declineReasons, customerOrders, ordersByMonth,
  conversionRate, avgOrderValue
};
