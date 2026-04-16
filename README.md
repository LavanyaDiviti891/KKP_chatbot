# KKP Chatbot — Sales Analytics Assistant

A fully local, rule-based sales analytics chatbot that answers natural language questions about sales data, agent performance, order status, and provides strategic business recommendations.

---

## Project Structure

```
KKP_chatbot/
├── backend/
│   ├── server.js                  ← Main chat API server (port 5001)
│   ├── package.json
│   ├── services/
│   │   ├── apiServer.js           ← Local data server (port 4000) — used in development only
│   │   ├── dataService.js         ← AWS data acquisition layer (used in production)
│   │   └── awsConfig.js           ← AWS credentials and configuration
│   └── utils/
│       ├── aiEngine.js            ← Intent detection and entity extraction
│       └── insights.js            ← Data analysis and calculation functions
└── frontend/
    ├── src/
    │   ├── app.jsx                ← Main React app
    │   ├── api.js                 ← Backend API call
    │   └── components/
    │       └── chat.jsx           ← Chat UI component
    └── package.json
```

---

## Prerequisites

- Node.js v18 or above
- npm v9 or above

---

## Installation

### Step 1 — Backend

```bash
cd KKP_chatbot/backend
npm install
```

Packages installed:

| Package | Purpose |
|---|---|
| `express` | HTTP server framework |
| `cors` | Allows frontend to call the backend |
| `string-similarity` | Fuzzy intent matching in aiEngine.js |

---

### Step 2 — Frontend

```bash
cd KKP_chatbot/frontend
npm install
```

Packages installed:

| Package | Purpose |
|---|---|
| `vite` | Frontend build tool and dev server |
| `react` | UI framework |
| `react-dom` | React DOM rendering |

---

### Step 3 — AWS Packages (Production only)

Install only the package that matches your AWS data source.
Run this inside the `backend` folder:

| AWS Source | Command |
|---|---|
| RDS MySQL | `npm install mysql2` |
| RDS PostgreSQL | `npm install pg` |
| DynamoDB | `npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb` |
| S3 | `npm install @aws-sdk/client-s3` |
| API Gateway | No install needed |

---

## Running the Project

### Development Mode (Local Data — 3 Terminals Required)

In development, data is served locally by `apiServer.js` on port 4000.
You need 3 separate terminals running simultaneously.

**Terminal 1 — Start the local data server**
```bash
cd KKP_chatbot/backend/services
node apiServer.js
```
Expected output:
```
API running on http://127.0.0.1:4000/data
```

**Terminal 2 — Start the backend chat server**
```bash
cd KKP_chatbot/backend
node server.js
```
Expected output:
```
Server running on http://127.0.0.1:5001
```

**Terminal 3 — Start the frontend**
```bash
cd KKP_chatbot/frontend
npm run dev
```
Expected output:
```
VITE ready on http://localhost:5173
```

Then open your browser at: **http://localhost:5173**

---

### Production Mode (AWS Data — 2 Terminals Required)

In production, data comes from AWS so `apiServer.js` is no longer needed.
You only need 2 terminals.

**Step 1 — Configure AWS**

Open `backend/services/awsConfig.js` and:
1. Set `ACTIVE_SOURCE` to your AWS service: `"rds"`, `"dynamodb"`, `"s3"`, or `"apigateway"`
2. Fill in the credentials for your chosen source
3. In `backend/services/dataService.js`, uncomment the code block for your chosen source

**Terminal 1 — Start the backend chat server**
```bash
cd KKP_chatbot/backend
node server.js
```

**Terminal 2 — Start the frontend**
```bash
cd KKP_chatbot/frontend
npm run dev
```

---

## Environment Variables (Optional but Recommended for Production)

Instead of hardcoding credentials in `awsConfig.js`, you can use environment variables.
Create a `.env` file inside the `backend` folder:

```env
# AWS General
AWS_REGION=ap-south-1
AWS_DATA_SOURCE=apigateway

# API Gateway
API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/prod/data
API_GATEWAY_KEY=your-api-key

# RDS (if using)
RDS_HOST=your-rds-endpoint.rds.amazonaws.com
RDS_PORT=3306
RDS_DATABASE=your_database
RDS_USER=your_username
RDS_PASSWORD=your_password
RDS_TABLE=your_table

# DynamoDB (if using)
DYNAMO_TABLE=your-table-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 (if using)
S3_BUCKET_NAME=your-bucket-name
S3_FILE_KEY=data/orders.json
```

Then install dotenv in the backend:
```bash
cd KKP_chatbot/backend
npm install dotenv
```

And add this as the very first line of `server.js`:
```js
require("dotenv").config();
```

---

## Sample Questions to Test the Chatbot

### Data Queries
- "What is the total revenue?"
- "How many orders are there?"
- "How many confirmed orders?"
- "How many pending orders?"
- "What ratio of orders are confirmed?"

### Day Performance
- "Which day had the highest sales?"
- "What was the worst performing day?"

### Agent Performance
- "Who is the top agent?"
- "Who sold the most?"
- "Compare all agents"
- "Rank all agents"
- "How much did [AgentName] sell?"
- "What rank is [AgentName]?"

### Trend Analysis
- "What is the sales trend?"
- "Are sales increasing?"

### Advisory and Strategy
- "What strategy should I follow?"
- "What should I stock up on?"
- "Which agent should I assign?"
- "Who needs improvement?"
- "Forecast future revenue"
- "How can I improve sales?"

---

## Port Reference

| Service | Port | Used In |
|---|---|---|
| Local data server (apiServer.js) | 4000 | Development only |
| Backend chat server (server.js) | 5001 | Development and Production |
| Frontend (Vite) | 5173 | Development and Production |

---

## Important Notes

- `aiEngine.js` and `insights.js` do not need to be modified for AWS integration
- Only `awsConfig.js` and `dataService.js` need to be updated for production
- Never commit `awsConfig.js` with real credentials to version control
- Add `awsConfig.js` and `.env` to your `.gitignore` file

---

## .gitignore Recommendation

Add the following to your `.gitignore`:

```
node_modules/
.env
backend/services/awsConfig.js
```
