import { useState, useRef, useEffect } from "react";

export default function App() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!msg) return;

    const userMsg = msg;
    setMsg("");
    setLoading(true);

    setChat(prev => [...prev, { q: userMsg, a: "..." }]);

    try {
      const res = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg })
      });

      const data = await res.json();

      setChat(prev => {
        const updated = [...prev];
        updated[updated.length - 1].a = data.answer;
        return updated;
      });
    } catch {
      setChat(prev => {
        const updated = [...prev];
        updated[updated.length - 1].a = "❌ Error";
        return updated;
      });
    }

    setLoading(false);
  };

  // auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>💬 AI Sales Chat</h2>

      <div style={{
        height: 400,
        overflowY: "auto",
        border: "1px solid #ccc",
        padding: 10,
        marginBottom: 10
      }}>
        {chat.map((c, i) => (
          <div key={i}>
            <p><b>You:</b> {c.q}</p>
            <p><b>AI:</b> {c.a}</p>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Ask something..."
        style={{ width: "70%", padding: 8 }}
      />

      <button onClick={send} disabled={loading} style={{ marginLeft: 10 }}>
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
}