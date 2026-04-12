const BASE_URL = "http://127.0.0.1:5001";

export async function askQuestion(question) {
  try {
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    return data.answer;

  } catch (err) {
    console.error(err);
    return "Error connecting to server";
  }
}