// ═══════════════════════════════════════════════════════════════════════════════
// AWS CONFIGURATION FILE
// ═══════════════════════════════════════════════════════════════════════════════
// Fill in the values below based on your AWS setup before deploying.
// DO NOT commit this file to version control with real credentials.
// Use environment variables or AWS Secrets Manager in production.
// ───────────────────────────────────────────────────────────────────────────────

const AWS_CONFIG = {

  // ── GENERAL AWS SETTINGS ───────────────────────────────────────────────────
  region: process.env.AWS_REGION || "ap-south-1", // e.g. us-east-1, ap-south-1

  // ── OPTION 1: AWS RDS (MySQL / PostgreSQL) ─────────────────────────────────
  // Use this if your data is in a relational database
  rds: {
    host:     process.env.RDS_HOST     || "YOUR_RDS_ENDPOINT",     // e.g. mydb.abc123.ap-south-1.rds.amazonaws.com
    port:     process.env.RDS_PORT     || 3306,                     // 3306 for MySQL, 5432 for PostgreSQL
    database: process.env.RDS_DATABASE || "YOUR_DATABASE_NAME",    // e.g. kkp_sales
    user:     process.env.RDS_USER     || "YOUR_DB_USERNAME",       // e.g. admin
    password: process.env.RDS_PASSWORD || "YOUR_DB_PASSWORD",      // e.g. mypassword
    table:    process.env.RDS_TABLE    || "YOUR_TABLE_NAME",        // e.g. orders
  },

  // ── OPTION 2: AWS DynamoDB ─────────────────────────────────────────────────
  // Use this if your data is in a NoSQL DynamoDB table
  dynamodb: {
    tableName:      process.env.DYNAMO_TABLE       || "YOUR_DYNAMODB_TABLE_NAME", // e.g. KKP_Orders
    accessKeyId:    process.env.AWS_ACCESS_KEY_ID  || "YOUR_AWS_ACCESS_KEY_ID",
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY || "YOUR_AWS_SECRET_ACCESS_KEY",
  },

  // ── OPTION 3: AWS S3 (JSON / CSV File) ────────────────────────────────────
  // Use this if your data is stored as a JSON or CSV file in an S3 bucket
  s3: {
    bucketName:     process.env.S3_BUCKET_NAME     || "YOUR_S3_BUCKET_NAME",     // e.g. kkp-sales-data
    fileKey:        process.env.S3_FILE_KEY         || "YOUR_FILE_PATH_IN_BUCKET",// e.g. data/orders.json
    accessKeyId:    process.env.AWS_ACCESS_KEY_ID  || "YOUR_AWS_ACCESS_KEY_ID",
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY || "YOUR_AWS_SECRET_ACCESS_KEY",
  },

  // ── OPTION 4: AWS API Gateway + Lambda ────────────────────────────────────
  // Use this if your data is served via an API Gateway endpoint
  apiGateway: {
    endpoint: process.env.API_GATEWAY_URL || "YOUR_API_GATEWAY_URL", // e.g. https://abc123.execute-api.ap-south-1.amazonaws.com/prod/data
    apiKey:   process.env.API_GATEWAY_KEY || "YOUR_API_GATEWAY_KEY", // if your API requires an API key
  },

};

// ── ACTIVE SOURCE ──────────────────────────────────────────────────────────────
// Set this to whichever AWS service you are using:
// "rds" | "dynamodb" | "s3" | "apigateway"
const ACTIVE_SOURCE = process.env.AWS_DATA_SOURCE || "apigateway";

module.exports = { AWS_CONFIG, ACTIVE_SOURCE };
