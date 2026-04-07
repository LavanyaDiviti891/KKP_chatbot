import { useState } from "react";
import { askQuestion } from "../api";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { type: "user", text: input };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const reply = await askQuestion(input);

    const botMsg = { type: "bot", text: reply };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  return (
    <div style={{ width: "500px", margin: "auto", marginTop: "40px" }}>
      
      <h2>💬 Sales Chat</h2>

      <div style={{
        border: "1px solid #ccc",
        height: "400px",
        overflowY: "auto",
        padding: "10px",
        marginBottom: "10px"
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            textAlign: msg.type === "user" ? "right" : "left",
            margin: "5px"
          }}>
            <span style={{
              background: msg.type === "user" ? "#007bff" : "#eee",
              color: msg.type === "user" ? "#fff" : "#000",
              padding: "8px",
              borderRadius: "10px",
              display: "inline-block"
            }}>
              {msg.text}
            </span>
          </div>
        ))}

        {loading && <p>Typing...</p>}
      </div>

      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Ask something..."
        style={{ width: "80%", padding: "10px" }}
      />

      <button onClick={sendMessage} style={{ padding: "10px" }}>
        Send
      </button>

    </div>
  );
}