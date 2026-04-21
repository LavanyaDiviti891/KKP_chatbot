const express = require("express");
const cors    = require("cors");
const http    = require("http");

const app = express();
app.use(cors());
app.use(express.json());

console.log(" SERVER RUNNING (KKP Textile Analytics)");

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
            const rate        = item.rate !== null && item.rate !== undefined ? parseFloat(item.rate) : null;
            const revenue     = (rate !== null && !isNaN(rate) && quantity > 0) ? quantity * rate : 0;
            return {
              day:          i + 1,
              date:         item.date          || null,
              revenue,
              agent:        item.agentName     || "Unknown",
              status:      (item.status        || "unknown").toLowerCase(),
              quality:     (item.quality       || item.productName || "").trim(),
              weave:       (item.weave         || "").trim(),
              composition:  item.composition   || "",
              reason:       item.reason        || null,
              customerName: item.customerName  || "Unknown",
              buyerName:    item.buyerName     || "Unknown",
              quantity,
              rate,
            };
          });
          console.log("Data loaded:", cachedData.length, "records");
          // Debug: show quality and weave fields
          cachedData.forEach((d, i) => console.log(`  [${i+1}] agent=${d.agent} quality="${d.quality}" weave="${d.weave}" status=${d.status} revenue=${d.revenue}`));
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
  return [...new Set(data.map(d => d.quality).filter(q => q && q.length > 0))];
}
function getKnownCustomers(data) {
  return [...new Set(data.map(d => d.customerName).filter(c => c && c !== "Unknown"))];
}
function noData(field) {
  return `No Data Available\n\nNo ${field} data is currently available in the dataset. Please ensure the records are correctly populated and try again.`;
}

// ─── RULE-BASED ANSWER BUILDER ────────────────────────────────────────────────
function buildAnswer(intent, payload) {
  switch (intent) {

    case "HIGHEST_DAY":
      if (!payload.day || payload.day === "N/A") return noData("peak sales day");
      return `Sales Performance Report — Peak Day\n\nDay ${payload.day} recorded the highest sales with a total revenue of ${fmt(payload.value)}.`;

    case "LOWEST_DAY":
      if (!payload.day || payload.day === "N/A") return noData("lowest sales day");
      return `Sales Performance Report — Lowest Day\n\nDay ${payload.day} recorded the lowest sales with a total revenue of ${fmt(payload.value)}.`;

    case "TOP_AGENT":
      if (!payload.agent || payload.agent === "N/A") return noData("agent");
      return `Agent Performance Summary — Top Performer\n\n${payload.agent} is the highest-performing agent with a total revenue of ${fmt(payload.revenue)}.`;

    case "AGENT_SALES":
      return `Agent Revenue Report — ${payload.name}\n\n${payload.name} has generated a total revenue of ${fmt(payload.revenue)} from ${payload.stats.orders} order${payload.stats.orders !== 1 ? "s" : ""} (Confirmed: ${payload.stats.confirmed}, Declined: ${payload.stats.declined}, Processed: ${payload.stats.processed}).`;

    case "AGENT_RANK": {
      const cr = payload.orders ? ((payload.confirmed / payload.orders) * 100).toFixed(1) : 0;
      const note = payload.revenue === 0
        ? `\n\nNote: ${payload.name} currently has no revenue recorded as rate is pending on their orders.`
        : "";
      return `Agent Ranking Report — ${payload.name}\n\n${payload.name} is ranked #${payload.rank} out of ${payload.total} agents.\n  Total Orders  : ${payload.orders}\n  Confirmed     : ${payload.confirmed}\n  Declined      : ${payload.declined}\n  Revenue       : ${fmt(payload.revenue)}\n  Success Rate  : ${cr}%${note}`;
    }

    case "COMPARE": {
      if (!payload.agents.length) return noData("agent comparison");
      const rows = payload.agents.map(([name, rev, s], i) => {
        const cr = s && s.orders ? ((s.confirmed / s.orders) * 100).toFixed(0) : 0;
        return `  ${i + 1}. ${name.padEnd(20)} Revenue: ${fmt(rev).padEnd(15)} Orders: ${s ? s.orders : "-"}  Success: ${cr}%`;
      }).join("\n");
      return `Agent Leaderboard\n\n${rows}`;
    }

    case "TREND":
      return `Sales Trend Analysis\n\nRevenue is currently ${payload.trend}.`;

    case "HIGH_VALUE":
      if (payload.count === 0) return `High-Value Order Summary\n\nNo orders exceeding ${fmt(payload.threshold)} were found in the current dataset.`;
      return `High-Value Order Summary\n\n${payload.count} order${payload.count !== 1 ? "s" : ""} exceed${payload.count === 1 ? "s" : ""} ${fmt(payload.threshold)}.`;

    case "CONFIRMED_ORDERS": {
      if (payload.count === 0) return `Order Status Report — Confirmed\n\nNo confirmed orders are currently recorded in the dataset.`;
      return `Order Status Report — Confirmed\n\n${payload.count} confirmed order${payload.count !== 1 ? "s" : ""} are currently in the system, representing ${payload.pct}% of all ${payload.total} orders.`;
    }

    case "PENDING_ORDERS": {
      if (payload.count === 0) return `Order Status Report — Pending\n\nThere are no pending orders in the current dataset. All orders have been processed, confirmed, or declined.`;
      return `Order Status Report — Pending\n\n${payload.count} order${payload.count !== 1 ? "s" : ""} are currently in a pending state, representing ${payload.pct}% of all ${payload.total} orders.`;
    }

    case "DECLINED_ORDERS": {
      if (payload.count === 0) return `Order Status Report — Declined\n\nNo declined orders are recorded in the current dataset.`;
      return `Order Status Report — Declined\n\n${payload.count} order${payload.count !== 1 ? "s" : ""} have been declined, representing ${payload.pct}% of all ${payload.total} orders.`;
    }

    case "TOTAL_REVENUE":
      if (payload.total === 0) return `Revenue Summary\n\nTotal revenue is currently ₹0. This may be due to rate values not being set on orders. Please verify the order data.`;
      return `Revenue Summary\n\nTotal revenue across all orders: ${fmt(payload.total)}.`;

    case "ORDER_COUNT":
      return `Order Volume Report\n\nTotal orders in the dataset: ${payload.count}.`;

    case "CONFIRMED_PERCENTAGE":
      return `Conversion Rate Report\n\nOut of ${payload.total} total orders, ${payload.confirmed} are confirmed — a conversion rate of ${payload.pct}%.`;

    case "AVG_ORDER_VALUE":
      if (payload.avg === 0) return `Average Order Value Report\n\nAverage order value cannot be calculated as rate values are not set on most orders. Please ensure rate fields are populated.`;
      return `Average Order Value Report\n\nThe average revenue per order (for orders with rate set) is ${fmt(payload.avg)}.`;

    // ── Product answers ──────────────────────────────────────────────────────
    case "TOP_PRODUCTS": {
      if (!payload.products.length) return noData("product");
      const rows = payload.products.map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(0) : 0;
        return `  ${i + 1}. ${name}\n     Orders: ${s.orders} | Confirmed: ${s.confirmed} | Declined: ${s.declined} | Processed: ${s.processed} | Success Rate: ${cr}%`;
      }).join("\n\n");
      return `Top Products Report — Ranked by Order Volume\n\n${rows}`;
    }

    case "PRODUCT_DETAILS": {
      if (!payload.product) return noData("the specified product");
      const p  = payload.product;
      const cr = p.orders ? ((p.confirmed / p.orders) * 100).toFixed(1) : 0;
      return `Product Performance Report — ${p.name}\n\n  Total Orders      : ${p.orders}\n  Confirmed Orders  : ${p.confirmed}\n  Declined Orders   : ${p.declined}\n  Processed Orders  : ${p.processed}\n  Success Rate      : ${cr}%\n  Total Revenue     : ${p.revenue > 0 ? fmt(p.revenue) : "Rate not set on this product's orders"}`;
    }

    // ── Weave answers ────────────────────────────────────────────────────────
    case "TOP_WEAVES": {
      if (!payload.weaves.length) return noData("weave type");
      const rows = payload.weaves.map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(0) : 0;
        return `  ${i + 1}. ${name}\n     Orders: ${s.orders} | Confirmed: ${s.confirmed} | Declined: ${s.declined} | Processed: ${s.processed} | Success Rate: ${cr}%`;
      }).join("\n\n");
      return `Weave Type Performance Report\n\n${rows}`;
    }

    case "WEAVE_STATUS": {
      if (!payload.weaves.length) return noData("weave type");
      const rows = payload.weaves.map(([name, s]) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(0) : 0;
        return `  ${name}\n  Orders: ${s.orders} | Confirmed: ${s.confirmed} | Processed: ${s.processed} | Declined: ${s.declined} | Success Rate: ${cr}%`;
      }).join("\n\n");
      return `Weave Type Status Report\n\n${rows}`;
    }

    // ── Decline reasons ──────────────────────────────────────────────────────
    case "DECLINE_REASONS": {
      const total = payload.totalDeclined;
      if (!payload.reasons.length) {
        if (total > 0) return `Decline Reasons Report\n\n${total} orders were declined but no specific reasons were recorded against them.`;
        return noData("decline reason");
      }
      const withReason  = payload.reasons.reduce((s, [, c]) => s + c, 0);
      const noReasonCnt = total - withReason;
      const rows = payload.reasons.map(([reason, count], i) =>
        `  ${i + 1}. "${reason}" — ${count} order${count > 1 ? "s" : ""}`
      ).join("\n");
      let note = "";
      if (noReasonCnt > 0) note = `\n\nNote: ${noReasonCnt} additional declined order${noReasonCnt > 1 ? "s have" : " has"} no reason recorded.`;
      return `Decline Reasons Report\n\nOut of ${total} declined orders, the following reasons were recorded:\n\n${rows}${note}\n\nAddressing these issues may significantly improve the overall confirmation rate.`;
    }

    // ── Customer orders ──────────────────────────────────────────────────────
    case "CUSTOMER_ORDERS": {
      if (!payload.customerName) return `Customer Order Report\n\nPlease specify a customer name to retrieve their order history.`;
      if (!payload.orders.length) return `Customer Order Report\n\nNo orders found for customer "${payload.customerName}". Please verify the customer name.`;
      const statusCounts = {};
      payload.orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      const statusStr  = Object.entries(statusCounts).map(([s, c]) => `${s}: ${c}`).join(", ");
      const products   = [...new Set(payload.orders.map(o => o.quality).filter(Boolean))];
      return `Customer Order Report — ${payload.customerName}\n\n  Total Orders     : ${payload.orders.length}\n  Status Breakdown : ${statusStr}\n  Products Ordered : ${products.join(", ") || "N/A"}`;
    }

    // ── Monthly orders ───────────────────────────────────────────────────────
    case "ORDERS_THIS_MONTH": {
      if (!payload.orders.length) return `Monthly Order Report — ${payload.label}\n\nNo orders were recorded for ${payload.label}.`;
      const confirmed  = payload.orders.filter(o => o.status === "confirmed").length;
      const declined   = payload.orders.filter(o => o.status === "declined").length;
      const processed  = payload.orders.filter(o => o.status === "processed").length;
      const rev        = payload.orders.reduce((s, o) => s + o.revenue, 0);
      const cr         = ((confirmed / payload.orders.length) * 100).toFixed(1);
      return `Monthly Order Report — ${payload.label}\n\n  Total Orders     : ${payload.orders.length}\n  Confirmed        : ${confirmed} (${cr}%)\n  Processed        : ${processed}\n  Declined         : ${declined}\n  Total Revenue    : ${rev > 0 ? fmt(rev) : "Rate not set on most orders"}`;
    }

    default: return null;
  }
}

// ─── LOCAL ADVISORY ENGINE ────────────────────────────────────────────────────
function buildAgentStats(data) {
  const map = {};
  data.forEach(d => {
    if (!d.agent || d.agent === "Unknown" || d.agent === "Unknown User") return;
    if (!map[d.agent]) map[d.agent] = { revenue: 0, orders: 0, confirmed: 0, declined: 0, pending: 0, processed: 0 };
    map[d.agent].revenue  += d.revenue;
    map[d.agent].orders   += 1;
    if (d.status === "confirmed") map[d.agent].confirmed += 1;
    if (d.status === "declined")  map[d.agent].declined  += 1;
    if (d.status === "pending")   map[d.agent].pending   += 1;
    if (d.status === "processed") map[d.agent].processed += 1;
  });
  return map;
}

function advisoryEngine(intent, data) {
  const agentStats   = buildAgentStats(data);
  const sortedAgents = Object.entries(agentStats).sort((a, b) =>
    b[1].revenue !== a[1].revenue ? b[1].revenue - a[1].revenue : b[1].orders - a[1].orders
  );
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
  const topProductName = products[0]?.[0] || null;
  const reasons       = declineReasons(data);

  switch (intent) {

    case "SUGGEST_PRODUCT": {
      if (!products.length) return `Product Procurement Recommendation\n\nInsufficient product data is available to make a specific recommendation. Please ensure the quality field is populated in your orders.`;
      const productLines = products.map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(0) : 0;
        return `  ${i + 1}. ${name}\n     Orders: ${s.orders} | Success Rate: ${cr}%`;
      }).join("\n\n");
      return `Product Procurement Recommendation\n\nBased on order volume and confirmation rates, the following products show the strongest market demand:\n\n${productLines}\n\n"${topProductName}" leads in order volume and is recommended for priority stocking.${bestDay !== "N/A" ? `\n\nDay ${bestDay} recorded peak demand at ${fmt(bestRev)}, indicating a seasonal or cyclical pattern.` : ""}`;
    }

    case "SUGGEST_AGENT": {
      if (!sortedAgents.length) return `Agent Assignment Recommendation\n\nNo agent performance data is available. Please ensure agent names are correctly recorded in orders.`;
      const topCR   = topAgentData.orders ? ((topAgentData.confirmed / topAgentData.orders) * 100).toFixed(1) : 0;
      const lines   = sortedAgents.slice(0, 3).map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(1) : 0;
        return `  ${i + 1}. ${name} — Orders: ${s.orders}, Revenue: ${fmt(s.revenue)}, Success Rate: ${cr}%`;
      }).join("\n");
      return `Agent Assignment Recommendation\n\nTop agents for priority assignments:\n\n${lines}\n\nRecommendation: ${topAgentName} is best suited for high-value assignments with a ${topCR}% success rate.`;
    }

    case "SUGGEST_STRATEGY": {
      const declinedPct = ((declined / (data.length || 1)) * 100).toFixed(1);
      const pendingPct  = ((pending  / (data.length || 1)) * 100).toFixed(1);
      const steps       = [];
      if (reasons.length > 0) steps.push(`- Address Decline Causes: The top reason for order rejection is "${reasons[0][0]}". Resolving this directly is the highest-priority action.`);
      if (parseFloat(declinedPct) > 30) steps.push(`- Reduce Declined Orders: ${declinedPct}% of orders are declined. Review pricing flexibility and agent-client communication.`);
      if (parseFloat(pendingPct)  > 20) steps.push(`- Clear Pending Orders: ${pendingPct}% remain pending. Implement a 24–48 hour follow-up protocol.`);
      if (confirmRate < 40)             steps.push(`- Improve Confirmation Rate: Current rate of ${pct}% is below the 40% benchmark. Focus on targeted agent training.`);
      if (trend.includes("decreasing")) steps.push(`- Reverse Declining Trend: Sales are falling. Consider promotional pricing or reallocation of resources to top-performing agents.`);
      if (topProductName)               steps.push(`- Focus on Top Product: "${topProductName}" has the highest order volume. Ensure its availability and prioritise it in agent pitches.`);
      if (steps.length === 0) {
        steps.push(`- Sustain Current Performance: The business is showing a ${trend} trend with a ${pct}% confirmation rate. Scale activities of top agent ${topAgentName}.`);
        steps.push(`- Expand High-Value Orders: ${highVal} high-value orders recorded. Actively pursue this premium segment.`);
      }
      return `Strategic Recommendations Report\n\nBased on ${data.length} orders, ${fmt(total)} total revenue, and a ${trend} sales trend:\n\n${steps.join("\n\n")}`;
    }

    case "SUGGEST_IMPROVEMENT": {
      if (!sortedAgents.length) return `Agent Improvement Report\n\nNo agent data is available to identify underperformers.`;
      const underperformers = sortedAgents.filter(([, s]) => s.orders > 0).slice(-3).reverse();
      const lines = underperformers.map(([name, s], i) => {
        const cr = s.orders ? ((s.confirmed / s.orders) * 100).toFixed(1) : 0;
        const dr = s.orders ? ((s.declined  / s.orders) * 100).toFixed(1) : 0;
        const advice = parseFloat(dr) > 40
          ? "Focus on improving pricing negotiation and client communication to reduce the high decline rate."
          : parseFloat(cr) < 30
          ? "Prioritise consistent follow-up and better lead qualification to improve the success rate."
          : "Revenue contribution is below average. Consider additional product training or territory reassignment.";
        return `  ${i + 1}. ${name}\n     Orders: ${s.orders} | Revenue: ${fmt(s.revenue)} | Success Rate: ${cr}% | Decline Rate: ${dr}%\n     Action: ${advice}`;
      }).join("\n\n");
      return `Agent Improvement Report\n\nThe following agents require performance attention:\n\n${lines}\n\nTargeted coaching and clearly defined improvement milestones within 30 days are recommended.`;
    }

    case "FORECAST": {
      const avg  = avgOrderValue(data);
      const dir  = trend.includes("increasing") ? "upward" : trend.includes("decreasing") ? "downward" : "stable";
      const mult = dir === "upward" ? 1.10 : dir === "downward" ? 0.90 : 1.0;
      const risk = dir === "downward" ? "Declining trend — higher forecast uncertainty. Immediate corrective action is advised."
                 : dir === "upward"   ? "Upward trend — positive outlook. Continue monitoring pricing and agent performance."
                 :                      "Stable trend — predictable near-term performance expected.";
      const revNote = avg === 0 ? "\n\nNote: Many orders have no rate set, which limits revenue-based projections. The figures above are indicative only." : "";
      return `Sales Forecast Report\n\nBased on ${data.length} orders and a current ${dir} revenue trend:\n\n  Average Order Revenue     : ${avg > 0 ? fmt(avg) : "N/A (rates missing)"}\n  Projected Weekly Revenue  : ${avg > 0 ? fmt(avg * 7 * mult) : "N/A"}\n  Projected Monthly Revenue : ${avg > 0 ? fmt(avg * 30 * mult) : "N/A"}\n\n  Top Product to Watch  : ${topProductName || "N/A"}\n  Risk Assessment       : ${risk}${revNote}`;
    }

    default: {
      const agentLine   = sortedAgents.slice(0, 3).map(([n, s], i) => `  ${i + 1}. ${n} — ${s.orders} orders, ${fmt(s.revenue)} revenue`).join("\n");
      const productLine = products.slice(0, 3).map(([n, s], i) => `  ${i + 1}. ${n} (${s.orders} orders)`).join("\n");
      return `Sales Analytics Summary — KKP Group\n\n  Total Orders     : ${data.length}\n  Total Revenue    : ${fmt(total)}\n  Confirmed Orders : ${confirmed} (${pct}%)\n  Pending Orders   : ${pending}\n  Declined Orders  : ${declined}\n  Sales Trend      : ${trend}\n\nTop Performing Agents:\n${agentLine || "  No agent data available"}\n\nTop Products:\n${productLine || "  No product data available"}\n\nFor specific insights, ask about products, agents, weave types, decline reasons, or request a strategic recommendation.`;
    }
  }
}

// ─── TEST ROUTE ───────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send(" KKP Backend running"));

// ─── MAIN CHAT API ────────────────────────────────────────────────────────────
app.post("/api/ask", async (req, res) => {
  try {
    const q      = (req.body.question || "").trim();
    const qLower = q.toLowerCase();
    console.log("\n📨 QUESTION:", q);

    cachedData = null;
    const data = await getData();

    const agentNames     = getAgentNames(data);
    const knownProducts  = getKnownProducts(data);
    const knownCustomers = getKnownCustomers(data);

    const intent   = detectIntent(qLower);
    const entities = extractEntities(qLower, agentNames, knownProducts, knownCustomers);

    console.log(" INTENT:", intent);
    console.log(" ENTITIES:", entities);

    const advisoryIntents = ["SUGGEST_PRODUCT","SUGGEST_AGENT","SUGGEST_STRATEGY","SUGGEST_IMPROVEMENT","FORECAST","UNKNOWN"];
    if (advisoryIntents.includes(intent)) return res.json({ answer: advisoryEngine(intent, data) });

    let answer = null;
    const totalOrders = data.length;

    switch (intent) {
      case "HIGHEST_DAY":  { const [day, value] = highestSalesDay(data); answer = buildAnswer("HIGHEST_DAY", { day, value }); break; }
      case "LOWEST_DAY":   { const [day, value] = lowestSalesDay(data);  answer = buildAnswer("LOWEST_DAY",  { day, value }); break; }
      case "TOP_AGENT":    { const [agent, revenue] = topAgent(data); answer = buildAnswer("TOP_AGENT", { agent, revenue }); break; }

      case "AGENT_SALES": {
        if (entities.agentName) {
          const r = agentSales(data, entities.agentName);
          answer = r ? buildAnswer("AGENT_SALES", { name: r[0], revenue: r[1], stats: r[2] })
                     : `Agent Not Found\n\nNo records found for agent "${entities.agentName}". Known agents: ${agentNames.join(", ")}.`;
        } else {
          answer = `Agent Revenue Report\n\nPlease specify an agent name. Known agents: ${agentNames.join(", ")}.`;
        }
        break;
      }

      case "AGENT_RANK": {
        if (entities.agentName) {
          const r = agentRank(data, entities.agentName);
          answer = r ? buildAnswer("AGENT_RANK", r)
                     : `Agent Not Found\n\nNo records found for agent "${entities.agentName}". Known agents: ${agentNames.join(", ")}.`;
        } else {
          answer = `Agent Ranking Report\n\nPlease specify an agent name. Known agents: ${agentNames.join(", ")}.`;
        }
        break;
      }

      case "COMPARE": { answer = buildAnswer("COMPARE", { agents: compareAgents(data).slice(0, 5) }); break; }
      case "TREND":   { answer = buildAnswer("TREND",   { trend: getTrend(data) }); break; }

      case "HIGH_VALUE": {
        const t = entities.threshold && entities.threshold > 1000 ? entities.threshold : 100000;
        answer = buildAnswer("HIGH_VALUE", { count: highValueOrders(data, t), threshold: t });
        break;
      }

      case "CONFIRMED_ORDERS": {
        const count = orderCountByStatus(data, "confirmed");
        const pct   = ((count / totalOrders) * 100).toFixed(1);
        answer = buildAnswer("CONFIRMED_ORDERS", { count, pct, total: totalOrders });
        break;
      }

      case "PENDING_ORDERS": {
        const count = orderCountByStatus(data, "pending");
        const pct   = ((count / totalOrders) * 100).toFixed(1);
        answer = buildAnswer("PENDING_ORDERS", { count, pct, total: totalOrders });
        break;
      }

      case "DECLINED_ORDERS": {
        const count = orderCountByStatus(data, "declined");
        const pct   = ((count / totalOrders) * 100).toFixed(1);
        answer = buildAnswer("DECLINED_ORDERS", { count, pct, total: totalOrders });
        break;
      }

      case "TOTAL_REVENUE":        { answer = buildAnswer("TOTAL_REVENUE",       { total: totalRevenue(data) }); break; }
      case "ORDER_COUNT":          { answer = buildAnswer("ORDER_COUNT",         { count: data.length }); break; }
      case "CONFIRMED_PERCENTAGE": { const pct2 = confirmedPercentage(data); answer = buildAnswer("CONFIRMED_PERCENTAGE", { pct: pct2, confirmed: orderCountByStatus(data, "confirmed"), total: totalOrders }); break; }
      case "AVG_ORDER_VALUE":      { answer = buildAnswer("AVG_ORDER_VALUE",     { avg: avgOrderValue(data) }); break; }
      case "TOP_PRODUCTS":         { answer = buildAnswer("TOP_PRODUCTS",        { products: topProducts(data, 5) }); break; }
      case "PRODUCT_DETAILS":      { answer = buildAnswer("PRODUCT_DETAILS",     { product: productDetails(data, entities.productName || "") }); break; }
      case "TOP_WEAVES":           { answer = buildAnswer("TOP_WEAVES",          { weaves: topWeaves(data) }); break; }
      case "WEAVE_STATUS":         { answer = buildAnswer("WEAVE_STATUS",        { weaves: topWeaves(data) }); break; }

      case "DECLINE_REASONS": {
        const totalDeclined = orderCountByStatus(data, "declined");
        answer = buildAnswer("DECLINE_REASONS", { reasons: declineReasons(data), totalDeclined });
        break;
      }

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
    console.error(" ERROR:", err.message);
    res.json({ answer: `An error occurred: ${err.message}` });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
app.listen(5001, () => console.log(" Server running on http://127.0.0.1:5001"));
