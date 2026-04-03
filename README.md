# AI-Powered Sales Intelligence Chat System

##  Features

* Chat-based interface (React)
* Real-time data insights from database
* Data cleaning & preprocessing layer
* Rule-based intelligence engine
* Trend analysis & aggregation
* Revenue-based analytics
* Fully local (no API keys required)

---

## Tech Stack

* **Frontend:** React (Create React App)
* **Backend:** Node.js + Express
* **Database:** SQLite
* **Language:** JavaScript

---

## Project Structure

``
project/
├── backend/
│   ├── db/
│   │   ├── setup.js       # Creates database schema
│   │   ├── seed.js        # Inserts dataset into DB
│   │   ├── sales.db       # SQLite database
│   │   └── queries.js     # DB access functions
│   ├── utils/
│   │   ├── cleanData.js   # Data cleaning & transformation
│   │   └── insights.js    # Business logic & analytics
│   ├── data/
│   │   └── data.json      # Raw dataset
│   └── server.js          # Express server
│
├── frontend/
│   ├── src/
│   │   └── App.js         # Chat UI
│   └── package.json
```

---

## Setup Instructions

### 1. Clone / Navigate to Project

```bash
cd D:\project
```
### Install dependencies

```bash
npm install express cors sqlite3

pip install pandas scikit-learn
```
---

### 🔹 2. Setup Database

```bash
node backend/db/setup.js
```
 Creates the `sales` table

---

### 🔹 3. Add Dataset

Place your dataset here:

```
backend/data/data.json
```

Expected format:

```json
{
  "formData": [ ... ]
}
```

---

### 🔹 4. Seed Database

```bash
node backend/db/seed.js
```

Inserts data into SQLite

### Train the model

```bash
cd ml
python train.py
```

---

### 🔹 5. Start Backend

```bash
node backend/server.js
```

Runs on:

```
http://localhost:5000
```

---

### 🔹 6. Start Frontend

```bash
cd frontend

npm run dev
```

Runs on:

```
http://localhost:3000
```

---

## Usage

Open the frontend and ask questions like:

* `top agent`
* `compare agents`
* `sales trend`
* `high value orders`

---

## How It Works

```
User Input (Chat)
        ↓
React Frontend
        ↓
POST /api/ask
        ↓
Node Backend
        ↓
SQLite Database
        ↓
Data Cleaning Layer
        ↓
Insight Engine (Aggregation + Logic)
        ↓
Response to Chat UI
```

---

## Data Processing

* Removes invalid rows (null rate/quantity)
* Normalizes agent names
* Computes:

  * Revenue = quantity × rate
* Extracts:

  * Day, month for trend analysis

---

## Supported Queries

| Query Type | Example             |
| ---------- | ------------------- |
| Top Agent  | "top agent"         |
| Comparison | "compare agents"    |
| Trend      | "sales trend"       |
| High Value | "high value orders" |

---

## Notes

* Works completely offline (no API keys)
* Insights depend on dataset size
* More data → better insights

---

## Conclusion

This project demonstrates how to build a **data-driven AI chat system** using:

* Database queries
* Data transformation
* Business logic
* Interactive UI

Without relying on external AI APIs.


