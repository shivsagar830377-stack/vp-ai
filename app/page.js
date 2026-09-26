"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      if (data.reply) {
        setReply(data.reply);
      } else {
        setReply(data.error || "कोई जवाब नहीं मिला।");
      }
    } catch (error) {
      setReply("कनेक्शन में समस्या हुई। कृपया दोबारा प्रयास करें।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>VP AI Assistant</h1>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="अपना सवाल लिखें..."
          style={{ flex: 1, padding: "10px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc" }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{ padding: "10px 20px", fontSize: "16px", borderRadius: "8px", cursor: "pointer", background: "#0070f3", color: "#fff", border: "none" }}
        >
          {loading ? "सोच रहा है..." : "भेजें"}
        </button>
      </div>

      {reply && (
        <div style={{ padding: "15px", borderRadius: "8px", background: "#f1f1f1", whiteSpace: "pre-wrap" }}>
          <strong>VP AI:</strong>
          <p>{reply}</p>
        </div>
      )}
    </main>
  );
}
       
