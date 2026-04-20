const express = require("express");
const cors    = require("cors");
const http    = require("http");

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔥 SERVER RUNNING (KKP Textile Analytics)");

let cachedData = null;

// ─── FETCH DATA FROM LOCAL apiServer on port 4000 ────────────────────────────
function getData() {
  return new Promise((resolve, reject) => {
    if (cachedData) return resolve(cachedData);
    http.get("http://127.0.0.1:4000/data", (res) => {
      let raw = "";
      res.on("data", chunk => raw += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(raw);
          const arr  = json.formData || [];
          cachedData = arr.map((item, i) => {
            const quantityRaw = String(item.quantity || "0").replace(/[^0-9.]/g, "");
            const quantity    = parseFloat(quantityRaw) || 0;
            const rate        = parseFloat(item.rate)   || 0;
            const revenue     = quantity * rate;
            return {
              day:          i + 1,
              date:         item.date        || null,
              revenue,
              agent:        item.agentName   || "Unknown",
              status:      (item.status      || "unknown").toLowerCase(),
              quality:      item.quality     || item.productName || "Unknown",
              weave:        item.weave       || "Unknown",
              composition:  item.composition || "Unknown",
              reason:       item.reason      || null,
              customerName: item.customerName || "Unknown",
              buyerName:    item.buyerName   || "Unknown",
              quantity,
              rate,
            };
          });
          console.log("✅ Data loaded:", cachedData.length, "records");
          resolve(cachedData);
        } catch (e) { reject(new Error("Failed to parse data: " + e.message)); }
      });
    }).on("error", (e) => reject(new Error("Could not connect to apiServer on port 4000: " + e.message)));
  });
}

// ─── IMPORTS ──────────────────────────────────────────────────────────────────
const {
  highestSalesDay, lowestSalesDay, topAgent, agentSales, agentRank,
  compareAgents, getTrend, highValueOrders, totalRevenue,
  orderCountByStatus, confirmedPercentage, getAgentNames,
  topProducts, productDetails, topWeaves,
  declineReasons, customerOrders, ordersByMonth,
  conversionRate, avgOrderValue
} = require("./utils/insights");

const { detectIntent, extractEntities } = require("./utils/aiEngine");

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(num) {
  return `₹${Number(num).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
function getKnownProducts(data) {
  return [...new Set(data.map(d => d.quality).filter(q => q && q !== "Unknown"))];
}
function getKnownCustomers(data) {
  return [...new Set(data.map(d => d.customerName).filter(c => c && c !== "Unknown"))];
}

// ─── RULE-BASED ANSWER BUILDER ────────────────────────────────────────────────
function buildAnswer(intent, payload) {
  switch (intent) {
    case "HIGHEST_DAY":
      return `Sales Performance Report — Peak Day\n\nDay ${payload.day} recorded the highest sales with a total revenue of ${fmt(payload.value)}.`;
    case "LOWEST_DAY":
      return `Sales Performance Report — Lowest Day\n\nDay ${payload.day} recorded the lowest sales with a total revenue of ${fmt(payload.value)}.`;
    case "TOP_AGENT":
      return `Agent Performance Summary — Top Performer\n\n${payload.agent} is the highest-performing agent with a total revenue of ${fmt(payload.revenue)}.`;
    case "AGENT_SALES":
      return `Agent Revenue Report — ${payload.name}\n\n${payload.name} has contributed a total revenue of ${fmt(payload.revenue)} across all recorded orders.`;
    case "AGENT_RANK":
      return `Agent Ranking Report — ${payload.name}\n\n${payload.name} is ranked #${payload.rank} out of ${payload.total} agents with a total revenue of ${fmt(payload.revenue)}.`;
    case "COMPARE": {
      const rows = payload.agents.map(([name, rev], i) => `  ${i + 1}. ${name.padEnd(20)} ${fmt(rev)}`).join("\n");
      return `Agent Leaderboard — Top ${payload.agents.length} Performers\n\n${rows}`;
    }
    case "TREND":
      return `Sales Trend Analysis\n\nRevenue is currently ${payload.trend}.`;
    case "HIGH_VALUE":
      return `High-Value Order Summary\n\n${payload.count} order${payload.count !== 1 ? "s" : ""} exceed${payload.count === 1 ? "s" : ""} ${fmt(payload.threshold)}.`;
    case "CONFIRMED_ORDERS":
      return `Order Status Report — Confirmed\n\n${payload.count} confirmed orders are currently in the system.`;
    case "PENDING_ORDERS":
      return `Order Status Report — Pending\n\n${payload.count} orders are currently in a pending state.`;
    case "DECLINED_ORDERS":
      return `Order Status Report — Declined\n\n${payload.count} orders have been declined.`;
    case "TOTAL_REVENUE":
      return `Revenue Summary\n\nTotal revenue across all orders: ${fmt(payload.total)}.`;
    case "ORDER_COUNT":
      return `Order Volume Report\n\nTotal orders in the dataset: ${payload.count}.`;
    case "CONFIRMED_PERCENTAGE":
      return `Conversion Rate Report\n\nOut of ${payload.total} total orders, ${payload.confirmed} are confirmed — a conversion rate of ${payload.pct}%.`;
    case "AVG_ORDER_VALUE":
      return `Average Order Value Report\n\nThe average revenue per order is ${fmt(payload.avg)}. This is calculated from all orders with a non-zero rate.`;

    // ── Product answers ──
    case "TOP_PRODUCTS": {
      if (!payload.products.length) return `Top Products Report\n\nNo product data is available in the current dataset.`;
      const rows = payload.products.map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(0) : 0;
        return `  ${i + 1}. ${name}\n     Orders: ${s.orders} | Confirmed: ${s.confirmed} | Declined: ${s.declined} | Confirmation Rate: ${cr}%`;
      }).join("\n\n");
      return `Top Products Report — Ranked by Order Volume\n\n${rows}\n\nThis ranking is based on total number of orders placed for each product quality.`;
    }
    case "PRODUCT_DETAILS": {
      if (!payload.product) return `Product Not Found\n\nNo matching product was found. Please specify the product quality name.`;
      const p  = payload.product;
      const cr = p.orders ? ((p.confirmed / p.orders) * 100).toFixed(1) : 0;
      return `Product Performance Report — ${p.name}\n\n  Total Orders      : ${p.orders}\n  Confirmed Orders  : ${p.confirmed}\n  Declined Orders   : ${p.declined}\n  Processed Orders  : ${p.processed}\n  Confirmation Rate : ${cr}%\n  Total Revenue     : ${fmt(p.revenue)}`;
    }

    // ── Weave answers ──
    case "TOP_WEAVES": {
      const rows = payload.weaves.map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(0) : 0;
        return `  ${i + 1}. ${name.padEnd(25)} Orders: ${s.orders} | Confirmation Rate: ${cr}%`;
      }).join("\n");
      return `Weave Type Performance Report\n\n${rows}`;
    }
    case "WEAVE_STATUS": {
      const rows = payload.weaves.map(([name, s]) =>
        `  ${name.padEnd(25)} Confirmed: ${s.confirmed} | Processed: ${s.processed} | Declined: ${s.declined}`
      ).join("\n");
      return `Weave Type Status Report\n\n${rows}`;
    }

    // ── Decline reasons ──
    case "DECLINE_REASONS": {
      if (!payload.reasons.length) return `Decline Reasons Report\n\nNo decline reasons have been recorded in the current dataset.`;
      const rows = payload.reasons.map(([reason, count], i) => `  ${i + 1}. "${reason}" — ${count} order${count > 1 ? "s" : ""}`).join("\n");
      return `Decline Reasons Report\n\nThe following reasons were cited for declined orders:\n\n${rows}\n\nAddressing these issues may significantly improve the overall confirmation rate.`;
    }

    // ── Customer orders ──
    case "CUSTOMER_ORDERS": {
      if (!payload.orders.length) return `Customer Order Report\n\nNo orders found for the specified customer.`;
      const statusCounts = {};
      payload.orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      const statusStr = Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(", ");
      return `Customer Order Report — ${payload.customerName}\n\n  Total Orders : ${payload.orders.length}\n  Status Breakdown : ${statusStr}\n\nProducts ordered: ${[...new Set(payload.orders.map(o => o.quality))].join(", ")}`;
    }

    // ── Monthly orders ──
    case "ORDERS_THIS_MONTH": {
      const confirmed = payload.orders.filter(o => o.status === "confirmed").length;
      const declined  = payload.orders.filter(o => o.status === "declined").length;
      const processed = payload.orders.filter(o => o.status === "processed").length;
      const rev       = payload.orders.reduce((s, o) => s + o.revenue, 0);
      return `Monthly Order Report — ${payload.label}\n\n  Total Orders     : ${payload.orders.length}\n  Confirmed        : ${confirmed}\n  Processed        : ${processed}\n  Declined         : ${declined}\n  Total Revenue    : ${fmt(rev)}`;
    }

    default: return null;
  }
}

// ─── LOCAL ADVISORY ENGINE ────────────────────────────────────────────────────
function buildAgentStats(data) {
  const map = {};
  data.forEach(d => {
    if (!d.agent || d.agent === "Unknown") return;
    if (!map[d.agent]) map[d.agent] = { revenue: 0, orders: 0, confirmed: 0, declined: 0, pending: 0, processed: 0 };
    map[d.agent].revenue += d.revenue;
    map[d.agent].orders  += 1;
    if (d.status === "confirmed") map[d.agent].confirmed += 1;
    if (d.status === "declined")  map[d.agent].declined  += 1;
    if (d.status === "pending")   map[d.agent].pending   += 1;
    if (d.status === "processed") map[d.agent].processed += 1;
  });
  return map;
}

function advisoryEngine(intent, data) {
  const agentStats   = buildAgentStats(data);
  const sortedAgents = Object.entries(agentStats).sort((a, b) => b[1].revenue - a[1].revenue);
  const total        = totalRevenue(data);
  const confirmed    = orderCountByStatus(data, "confirmed");
  const declined     = orderCountByStatus(data, "declined");
  const pending      = orderCountByStatus(data, "pending");
  const pct          = confirmedPercentage(data);
  const trend        = getTrend(data);
  const [bestDay, bestRev] = highestSalesDay(data);
  const topAgentName  = sortedAgents[0]?.[0] || "N/A";
  const topAgentData  = sortedAgents[0]?.[1] || {};
  const highVal       = highValueOrders(data, 100000);
  const confirmRate   = parseFloat(pct);
  const products      = topProducts(data, 3);
  const topProductName = products[0]?.[0] || "N/A";
  const reasons       = declineReasons(data);

  switch (intent) {

    case "SUGGEST_PRODUCT": {
      const avgRevenue   = avgOrderValue(data);
      const highValuePct = ((highVal / (data.length || 1)) * 100).toFixed(1);
      const declinedPct  = ((declined / (data.length || 1)) * 100).toFixed(1);
      const productLines = products.map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(0) : 0;
        return `  ${i + 1}. ${name} — ${s.orders} orders, ${cr}% confirmation rate`;
      }).join("\n");
      let rec = "";
      if (products.length > 0) {
        rec = `Based on order volume and confirmation rates, the following products show the strongest market demand:\n\n${productLines}\n\n"${topProductName}" leads in order volume and is recommended for priority stocking.`;
      } else {
        rec = confirmRate >= 50
          ? `With a ${pct}% confirmation rate and average order value of ${fmt(avgRevenue)}, stock products in the mid-range price band.`
          : `The decline rate of ${declinedPct}% suggests pricing misalignment. Review the product catalogue before major procurement decisions.`;
      }
      return `Product Procurement Recommendation\n\n${rec}\n\nDay ${bestDay} recorded peak demand at ${fmt(bestRev)}, indicating a pattern worth leveraging for future purchasing cycles.`;
    }

    case "SUGGEST_AGENT": {
      const topCR    = topAgentData.orders ? ((topAgentData.confirmed / topAgentData.orders) * 100).toFixed(1) : 0;
      const lines    = sortedAgents.slice(0, 3).map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(1) : 0;
        return `  ${i + 1}. ${name} — Revenue: ${fmt(s.revenue)}, Orders: ${s.orders}, Confirmation Rate: ${cr}%`;
      }).join("\n");
      return `Agent Assignment Recommendation\n\nTop agents for priority assignments:\n\n${lines}\n\nRecommendation: ${topAgentName} is best suited for high-value assignments with ${fmt(topAgentData.revenue)} in revenue and a ${topCR}% confirmation rate.`;
    }

    case "SUGGEST_STRATEGY": {
      const declinedPct = ((declined / (data.length || 1)) * 100).toFixed(1);
      const pendingPct  = ((pending  / (data.length || 1)) * 100).toFixed(1);
      const steps       = [];
      if (reasons.length > 0)
        steps.push(`- Address Decline Reasons: The most common reason for declined orders is "${reasons[0][0]}". Resolving this directly could improve the confirmation rate.`);
      if (parseFloat(declinedPct) > 30)
        steps.push(`- Reduce Declined Orders: ${declinedPct}% decline rate is high. Review pricing flexibility and agent communication.`);
      if (parseFloat(pendingPct) > 20)
        steps.push(`- Clear Pending Orders: ${pendingPct}% of orders remain pending. Implement a 24–48 hour follow-up protocol.`);
      if (confirmRate < 40)
        steps.push(`- Improve Confirmation Rate: Current rate of ${pct}% is below benchmark. Focus on agent training and streamlined approvals.`);
      if (trend.includes("decreasing"))
        steps.push(`- Reverse Declining Trend: Sales are falling. Consider targeted promotions or reallocation to top agents.`);
      if (products.length > 0)
        steps.push(`- Focus on Top Products: "${topProductName}" is your best-performing product. Prioritise its availability and agent familiarity.`);
      if (steps.length === 0) {
        steps.push(`- Sustain Performance: Confirmation rate is ${pct}% with a ${trend} trend. Scale activities of top agent ${topAgentName}.`);
        steps.push(`- Grow High-Value Segment: ${highVal} high-value orders recorded. Actively pursue this premium segment.`);
      }
      return `Strategic Recommendations Report\n\nBased on ${data.length} orders, ${fmt(total)} total revenue, and a ${trend} sales trend:\n\n${steps.join("\n\n")}`;
    }

    case "SUGGEST_IMPROVEMENT": {
      const underperformers = sortedAgents.filter(([, s]) => s.orders > 0).slice(-3).reverse();
      if (!underperformers.length) return `Agent Improvement Report\n\nInsufficient data to identify underperformers.`;
      const lines = underperformers.map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(1) : 0;
        const dr = s.orders ? ((s.declined  / s.orders) * 100).toFixed(1) : 0;
        const advice = parseFloat(dr) > 40
          ? "Focus on improving client communication and pricing negotiation to reduce the high decline rate."
          : parseFloat(cr) < 30
          ? "Prioritise lead qualification and consistent follow-up to improve the confirmation rate."
          : "Revenue is below average. Consider additional product training or territory reassignment.";
        return `  ${i + 1}. ${name}\n     Revenue: ${fmt(s.revenue)} | Orders: ${s.orders} | Confirmation: ${cr}% | Decline: ${dr}%\n     Action: ${advice}`;
      }).join("\n\n");
      return `Agent Improvement Report\n\nAgents requiring performance attention:\n\n${lines}\n\nTargeted coaching within 30 days is recommended.`;
    }

    case "FORECAST": {
      const avg  = avgOrderValue(data) || totalRevenue(data) / (data.length || 1);
      const dir  = trend.includes("increasing") ? "upward" : trend.includes("decreasing") ? "downward" : "stable";
      const mult = dir === "upward" ? 1.10 : dir === "downward" ? 0.90 : 1.0;
      const risk = dir === "downward"
        ? "Declining trend — higher uncertainty. Immediate corrective action is advised."
        : dir === "upward"
        ? "Upward trend — positive outlook. Monitor market and pricing factors closely."
        : "Stable trend — predictable near-term performance expected.";
      return `Sales Forecast Report\n\nBased on ${data.length} orders and a current ${dir} revenue trend:\n\n  Average Daily Revenue     : ${fmt(avg)}\n  Projected Weekly Revenue  : ${fmt(avg * 7 * mult)}\n  Projected Monthly Revenue : ${fmt(avg * 30 * mult)}\n\nTop product to watch: ${topProductName}\nRisk Assessment: ${risk}`;
    }

    default: {
      const agentLine  = sortedAgents.slice(0, 3).map(([n, s], i) => `  ${i + 1}. ${n} — ${fmt(s.revenue)} (${s.orders} orders)`).join("\n");
      const productLine = products.slice(0, 3).map(([n, s], i) => `  ${i + 1}. ${n} (${s.orders} orders)`).join("\n");
      return `Sales Analytics Summary — KKP Group\n\n  Total Orders     : ${data.length}\n  Total Revenue    : ${fmt(total)}\n  Confirmed Orders : ${confirmed} (${pct}%)\n  Pending Orders   : ${pending}\n  Declined Orders  : ${declined}\n  Sales Trend      : ${trend}\n  Peak Sales Day   : Day ${bestDay} — ${fmt(bestRev)}\n\nTop Performing Agents:\n${agentLine}\n\nTop Products:\n${productLine}\n\nFor specific insights, ask about products, agents, weave types, decline reasons, or request a strategic recommendation.`;
    }
  }
}

// ─── TEST ROUTE ───────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("✅ KKP Backend running"));

// ─── MAIN CHAT API ────────────────────────────────────────────────────────────
app.post("/api/ask", async (req, res) => {
  try {
    const q      = (req.body.question || "").trim();
    const qLower = q.toLowerCase();
    console.log("\n📨 QUESTION:", q);

    cachedData = null;
    const data = await getData();

    const agentNames    = getAgentNames(data);
    const knownProducts = getKnownProducts(data);
    const knownCustomers= getKnownCustomers(data);

    const intent   = detectIntent(qLower);
    const entities = extractEntities(qLower, agentNames, knownProducts, knownCustomers);

    console.log("🎯 INTENT:", intent);
    console.log("🔎 ENTITIES:", entities);

    const advisoryIntents = ["SUGGEST_PRODUCT","SUGGEST_AGENT","SUGGEST_STRATEGY","SUGGEST_IMPROVEMENT","FORECAST","UNKNOWN"];
    if (advisoryIntents.includes(intent)) {
      return res.json({ answer: advisoryEngine(intent, data) });
    }

    let answer = null;

    switch (intent) {
      case "HIGHEST_DAY":  { const [day, value] = highestSalesDay(data); answer = buildAnswer("HIGHEST_DAY", { day, value }); break; }
      case "LOWEST_DAY":   { const [day, value] = lowestSalesDay(data);  answer = buildAnswer("LOWEST_DAY",  { day, value }); break; }
      case "TOP_AGENT":    { const [agent, revenue] = topAgent(data);    answer = buildAnswer("TOP_AGENT",   { agent, revenue }); break; }
      case "AGENT_SALES":  {
        if (entities.agentName) {
          const r = agentSales(data, entities.agentName);
          answer = r ? buildAnswer("AGENT_SALES", { name: r[0], revenue: r[1] }) : `No records found for agent "${entities.agentName}".`;
        } break;
      }
      case "AGENT_RANK": {
        if (entities.agentName) {
          const r = agentRank(data, entities.agentName);
          answer = r ? buildAnswer("AGENT_RANK", r) : `No records found for agent "${entities.agentName}".`;
        } break;
      }
      case "COMPARE":              { answer = buildAnswer("COMPARE",             { agents: compareAgents(data).slice(0, 5) }); break; }
      case "TREND":                { answer = buildAnswer("TREND",               { trend: getTrend(data) }); break; }
      case "HIGH_VALUE":           { const t = entities.threshold && entities.threshold > 1000 ? entities.threshold : 100000; answer = buildAnswer("HIGH_VALUE", { count: highValueOrders(data, t), threshold: t }); break; }
      case "CONFIRMED_ORDERS":     { answer = buildAnswer("CONFIRMED_ORDERS",    { count: orderCountByStatus(data, "confirmed") }); break; }
      case "PENDING_ORDERS":       { answer = buildAnswer("PENDING_ORDERS",      { count: orderCountByStatus(data, "pending") }); break; }
      case "DECLINED_ORDERS":      { answer = buildAnswer("DECLINED_ORDERS",     { count: orderCountByStatus(data, "declined") }); break; }
      case "TOTAL_REVENUE":        { answer = buildAnswer("TOTAL_REVENUE",       { total: totalRevenue(data) }); break; }
      case "ORDER_COUNT":          { answer = buildAnswer("ORDER_COUNT",         { count: data.length }); break; }
      case "CONFIRMED_PERCENTAGE": { const pct = confirmedPercentage(data); answer = buildAnswer("CONFIRMED_PERCENTAGE", { pct, confirmed: orderCountByStatus(data, "confirmed"), total: data.length }); break; }
      case "AVG_ORDER_VALUE":      { answer = buildAnswer("AVG_ORDER_VALUE",     { avg: avgOrderValue(data) }); break; }
      case "TOP_PRODUCTS":         { answer = buildAnswer("TOP_PRODUCTS",        { products: topProducts(data, 5) }); break; }
      case "PRODUCT_DETAILS":      { answer = buildAnswer("PRODUCT_DETAILS",     { product: productDetails(data, entities.productName || "") }); break; }
      case "TOP_WEAVES":           { answer = buildAnswer("TOP_WEAVES",          { weaves: topWeaves(data) }); break; }
      case "WEAVE_STATUS":         { answer = buildAnswer("WEAVE_STATUS",        { weaves: topWeaves(data) }); break; }
      case "DECLINE_REASONS":      { answer = buildAnswer("DECLINE_REASONS",     { reasons: declineReasons(data) }); break; }
      case "CUSTOMER_ORDERS": {
        const cname  = entities.customerName || "";
        const orders = customerOrders(data, cname);
        answer = buildAnswer("CUSTOMER_ORDERS", { orders, customerName: cname });
        break;
      }
      case "ORDERS_THIS_MONTH":
      case "ORDERS_BY_DATE": {
        const now    = new Date();
        const month  = entities.month || now.getMonth() + 1;
        const year   = entities.year  || now.getFullYear();
        const orders = ordersByMonth(data, month, year);
        const monthNames = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
        answer = buildAnswer("ORDERS_THIS_MONTH", { orders, label: `${monthNames[month]} ${year}` });
        break;
      }
    }

    if (!answer) answer = advisoryEngine("UNKNOWN", data);
    return res.json({ answer });

  } catch (err) {
    console.error("🔥 ERROR:", err.message);
    res.json({ answer: `An error occurred: ${err.message}` });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(5001, () => console.log("🚀 Server running on http://127.0.0.1:5001"));
