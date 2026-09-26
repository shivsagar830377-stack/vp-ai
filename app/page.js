"use client";

import { useState, useRef, useEffect } from "react";

// Markdown को सुंदर और साफ HTML में बदलने वाला क्लीन पार्सर
function renderCleanContent(text) {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((line, index) => {
    let cleanLine = line.trim();

    if (!cleanLine) {
      return <div key={index} style={{ height: "10px" }} />;
    }

    // Divider
    if (cleanLine === "---" || cleanLine === "***") {
      return <hr key={index} style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "14px 0" }} />;
    }

    // Headings (### या ## या #)
    if (cleanLine.startsWith("#")) {
      const heading = cleanLine.replace(/^#+\s*/, "");
      return (
        <h3 key={index} style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", margin: "14px 0 6px 0" }}>
          {formatBold(heading)}
        </h3>
      );
    }

    // Bullet Points (- या * या •)
    if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ") || cleanLine.startsWith("• ")) {
      const bullet = cleanLine.replace(/^[-*•]\s*/, "");
      return (
        <div key={index} style={{ display: "flex", gap: "8px", marginLeft: "10px", marginBottom: "6px", lineHeight: "1.6" }}>
          <span style={{ color: "#2563eb", fontWeight: "bold" }}>•</span>
          <span style={{ color: "#334155" }}>{formatBold(bullet)}</span>
        </div>
      );
    }

    // Numbered List (1. 2. आदि)
    if (/^\d+\.\s/.test(cleanLine)) {
      return (
        <div key={index} style={{ marginLeft: "10px", marginBottom: "6px", lineHeight: "1.6", color: "#334155" }}>
          {formatBold(cleanLine)}
        </div>
      );
    }

    // Normal paragraph
    return (
      <p key={index} style={{ margin: "5px 0", lineHeight: "1.6", color: "#334155" }}>
        {formatBold(cleanLine)}
      </p>
    );
  });
}

function formatBold(str) {
  // टेबल लाइन्स को साफ़ करें
  if (str.startsWith("|") && str.endsWith("|")) {
    str = str.replace(/\|/g, " ").replace(/-+/g, "").trim();
  }
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#0f172a", fontWeight: "600" }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "प्रणाम! हम बानी रउआ सब के **VP AI Assistant**। 🚀\nपढ़ाई-लिखाई, कोडिंग या कवनो भी सवाल होखे, बेझिझक पूछीं!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    
    // यूज़र का मैसेज जोड़ें
    const newHistory = [...messages, { role: "user", content: userMsg }];
    setMessages(newHistory);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages([...newHistory, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...newHistory, { role: "assistant", content: data.error || "कोई जवाब नहीं मिल पाया।" }]);
      }
    } catch (err) {
      setMessages([...newHistory, { role: "assistant", content: "कनेक्शन में समस्या हुई। कृपया दोबारा प्रयास करें।" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Navbar */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
            VP
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#0f172a" }}>VP AI Assistant</h1>
            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>● ऑनलाइन</span>
          </div>
        </div>
        <span style={{ fontSize: "11px", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", color: "#64748b", fontWeight: "500" }}>
          Next-Gen AI
        </span>
      </header>

      {/* Chat Messages Container */}
      <div style={{ flex: 1, maxWidth: "720px", width: "100%", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              background: msg.role === "user" ? "#2563eb" : "#ffffff",
              color: msg.role === "user" ? "#ffffff" : "#1e293b",
              padding: "12px 16px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              border: msg.role === "assistant" ? "1px solid #e2e8f0" : "none",
            }}
          >
            {msg.role === "assistant" && (
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "6px" }}>
                VP AI
              </div>
            )}
            <div>
              {msg.role === "user" ? (
                <span style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{msg.content}</span>
              ) : (
                renderCleanContent(msg.content)
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: "flex-start", background: "#ffffff", padding: "12px 18px", borderRadius: "16px 16px 16px 4px", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "14px", fontStyle: "italic" }}>
            VP AI सोच रहा है... ✍️
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Bottom Sticky Input Bar */}
      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "12px 16px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="सवाल लिखीं (जैसे: Photosynthesis समझा दो)..."
            style={{ flex: 1, padding: "12px 16px", fontSize: "15px", borderRadius: "24px", border: "1.5px solid #cbd5e1", outline: "none" }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            style={{ padding: "0 20px", fontSize: "15px", fontWeight: "600", borderRadius: "24px", border: "none", background: loading ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: loading ? "not-allowed" : "pointer" }}
          >
            भेजें
          </button>
        </div>
      </div>
    </main>
  );
}

