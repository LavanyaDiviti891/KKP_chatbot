// backend/services/apiService.js

const axios = require("axios");

let cache = null;
let lastFetch = 0;

async function fetchClientData() {
  try {
    // 🔁 CHANGE THIS to your real API
    const url = "http://localhost:5000/api/form-data";

    // ✅ cache for 1 min
    if (cache && Date.now() - lastFetch < 60000) {
      return cache;
    }

    const res = await axios.get(url);

    const data = res.data.formData || res.data || [];

    cache = data;
    lastFetch = Date.now();

    console.log("✅ API DATA:", data.length);

    return data;

  } catch (err) {
    console.error("❌ API ERROR:", err.message);
    return [];
  }
}

module.exports = { fetchClientData };