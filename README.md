#  KKP Chatbot – Hybrid AI + API-Based Sales Analytics

This project is a **Hybrid AI Chatbot** that answers natural language questions about sales data using:

* API-based data (no database required)
* Hybrid NLP (rule-based + similarity matching)
* Analytics (sales, agents, trends, forecasting)

---

# Project Structure

```
KKP_chatbot/
│
├── apiServer.js              # Mock API (data provider)
├── backend/
│   ├── server.js            # Main backend server
│   └── utils/
│       ├── apiService.js    # Fetch API data
│       ├── aiEngine.js      # NLP + chatbot logic
│       └── insights.js      # Analytics functions
│
├── frontend/                # React frontend (Vite)
│   ├── src/
│   └── package.json
│
├── package.json             # Backend dependencies
└── .gitignore
```

---

# How It Works

```
Frontend → Backend → API → Data → AI Engine → Response
```

1. User asks a question
2. Backend fetches data from API
3. AI engine detects intent
4. Insights are computed
5. Response is returned

---

# Setup Instructions

---

## 1. Clone the Repository

```
git clone <your-repo-url>
cd KKP_chatbot
```


# Running the Project

 You must run **3 servers simultaneously**

---

##  Terminal 1 – Run API Server

```
npm install express
```

```
node apiServer.js
```

Expected:

```
API running on http://127.0.0.1:4000/data
```

---

## Terminal 2 – Run Backend

```
cd KKP_chatbot/backend

npm install express cors string-similarity

npm install express
```

```
node server.js
```

Expected:

```
Server running on http://127.0.0.1:5001
```

---

## Terminal 3 – Run Frontend

```
cd frontend

npm install

npm run dev
```

Open in browser:

```
http://localhost:5173/
```

---

#  Example Questions

### Sales

* which day had highest sales
* best sales day
* worst day

###  Agents

* who is best agent
* top performer

###  Trends

* what is the sales trend
* is business growing

###  Forecast

* forecast revenue for 3
* predict next 5 days

###  High Value

* show high value orders

---

#  Features

* Handles different question variations
* Extracts numbers (e.g., forecast days)
* Works without database (API-driven)
* Handles null/invalid data safely
* Lightweight NLP (no heavy ML required)

---



##  node_modules is NOT included

After cloning, ALWAYS run:

```
npm install
cd frontend && npm install
```

---

# Summary

This project demonstrates:

```
Hybrid AI Chatbot + API Integration + Sales Analytics
```

A clean, scalable approach used in real-world systems 

---


