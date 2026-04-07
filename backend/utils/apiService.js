async function fetchAPIData() {
  try {
    const res = await fetch("http://127.0.0.1:4000/data");

    const json = await res.json();

    // 🔥 IMPORTANT: extract formData
    return json.formData || [];

  } catch (err) {
    console.error("❌ API FETCH ERROR:", err);
    return [];
  }
}

module.exports = { fetchAPIData };