// ═══════════════════════════════════════════════════════════════════════════════
// DATA SERVICE — AWS DATA ACQUISITION LAYER
// ═══════════════════════════════════════════════════════════════════════════════
// This file handles fetching data from AWS.
// Only this file needs to change if you switch AWS services.
// server.js always calls getData() — it never talks to AWS directly.
// ───────────────────────────────────────────────────────────────────────────────

const https = require("https");
const http  = require("http");
const { AWS_CONFIG, ACTIVE_SOURCE } = require("./awsConfig");

// ── NORMALIZE raw records into the standard format server.js expects ──────────
function normalizeRecords(rawArray) {
  return rawArray.map((item, i) => {
    const quantity = Number(item.quantity);
    const rate     = Number(item.rate);
    const revenue  = (!isNaN(quantity) && !isNaN(rate) && item.rate !== null)
      ? quantity * rate : 0;
    return {
      day:      i + 1,
      date:     item.date || item.createdAt || null,
      revenue,
      agent:    item.agentName  || item.agent_name  || item.agent  || "Unknown",
      status:  (item.status     || "unknown").toLowerCase(),
      quantity: isNaN(quantity) ? 0 : quantity,
      rate:     isNaN(rate)     ? 0 : rate,
    };
  });
}

// ── OPTION 1: RDS (MySQL / PostgreSQL) ────────────────────────────────────────
// Requires: npm install mysql2   (for MySQL)
//           npm install pg       (for PostgreSQL)
// Uncomment the driver you need below.
async function fetchFromRDS() {
  const cfg = AWS_CONFIG.rds;

  // ── MySQL example ──
  // const mysql = require("mysql2/promise");
  // const conn = await mysql.createConnection({
  //   host: cfg.host, port: cfg.port,
  //   database: cfg.database, user: cfg.user, password: cfg.password
  // });
  // const [rows] = await conn.execute(`SELECT * FROM ${cfg.table}`);
  // await conn.end();
  // return normalizeRecords(rows);

  // ── PostgreSQL example ──
  // const { Client } = require("pg");
  // const client = new Client({
  //   host: cfg.host, port: cfg.port,
  //   database: cfg.database, user: cfg.user, password: cfg.password
  // });
  // await client.connect();
  // const res = await client.query(`SELECT * FROM ${cfg.table}`);
  // await client.end();
  // return normalizeRecords(res.rows);

  throw new Error("RDS: Uncomment and configure your DB driver in dataService.js");
}

// ── OPTION 2: DynamoDB ────────────────────────────────────────────────────────
// Requires: npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
async function fetchFromDynamoDB() {
  const cfg = AWS_CONFIG.dynamodb;

  // const { DynamoDBClient }        = require("@aws-sdk/client-dynamodb");
  // const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
  //
  // const client = new DynamoDBClient({
  //   region: AWS_CONFIG.region,
  //   credentials: {
  //     accessKeyId:     cfg.accessKeyId,
  //     secretAccessKey: cfg.secretAccessKey,
  //   }
  // });
  // const docClient = DynamoDBDocumentClient.from(client);
  // const response  = await docClient.send(new ScanCommand({ TableName: cfg.tableName }));
  // return normalizeRecords(response.Items || []);

  throw new Error("DynamoDB: Uncomment and configure DynamoDB client in dataService.js");
}

// ── OPTION 3: S3 (JSON file) ──────────────────────────────────────────────────
// Requires: npm install @aws-sdk/client-s3
async function fetchFromS3() {
  const cfg = AWS_CONFIG.s3;

  // const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
  //
  // const client = new S3Client({
  //   region: AWS_CONFIG.region,
  //   credentials: {
  //     accessKeyId:     cfg.accessKeyId,
  //     secretAccessKey: cfg.secretAccessKey,
  //   }
  // });
  // const response = await client.send(new GetObjectCommand({
  //   Bucket: cfg.bucketName,
  //   Key:    cfg.fileKey,
  // }));
  // const bodyString = await response.Body.transformToString();
  // const json = JSON.parse(bodyString);
  // const arr  = Array.isArray(json) ? json : json.formData || json.data || [];
  // return normalizeRecords(arr);

  throw new Error("S3: Uncomment and configure S3 client in dataService.js");
}

// ── OPTION 4: API Gateway + Lambda ───────────────────────────────────────────
// No extra npm install needed — uses built-in https module
async function fetchFromAPIGateway() {
  const cfg = AWS_CONFIG.apiGateway;
  const url = new URL(cfg.endpoint);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      path:     url.pathname + (url.search || ""),
      method:   "GET",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.apiKey ? { "x-api-key": cfg.apiKey } : {})
      }
    };

    const protocol = url.protocol === "https:" ? https : http;

    protocol.get(options, (res) => {
      let raw = "";
      res.on("data", chunk => raw += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(raw);
          const arr  = Array.isArray(json) ? json : json.formData || json.data || [];
          resolve(normalizeRecords(arr));
        } catch (e) {
          reject(new Error("API Gateway: Failed to parse response — " + e.message));
        }
      });
    }).on("error", (e) => {
      reject(new Error("API Gateway: Connection failed — " + e.message));
    });
  });
}

// ── MAIN getData() — called by server.js ──────────────────────────────────────
let cachedData = null;

async function getData() {
  if (cachedData) return cachedData;

  console.log(`📡 Fetching data from AWS source: ${ACTIVE_SOURCE.toUpperCase()}`);

  let records;

  switch (ACTIVE_SOURCE.toLowerCase()) {
    case "rds":
      records = await fetchFromRDS();
      break;
    case "dynamodb":
      records = await fetchFromDynamoDB();
      break;
    case "s3":
      records = await fetchFromS3();
      break;
    case "apigateway":
    default:
      records = await fetchFromAPIGateway();
      break;
  }

  cachedData = records;
  console.log(`✅ Data loaded: ${cachedData.length} records from ${ACTIVE_SOURCE.toUpperCase()}`);
  return cachedData;
}

function clearCache() {
  cachedData = null;
}

module.exports = { getData, clearCache };
