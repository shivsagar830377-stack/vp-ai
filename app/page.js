"use client";

import { useState } from "react";

// Markdown को सुंदर HTML में बदलने वाला आसान फंक्शन
function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((line, index) => {
    let cleanLine = line.trim();

    // खाली लाइन
    if (!cleanLine) {
      return <div key={index} style={{ height: "10px" }} />;
    }

    // Divider (---)
    if (cleanLine === "---" || cleanLine === "***") {
      return <hr key={index} style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" }} />;
    }

    // Headings (### या ## या #)
    if (cleanLine.startsWith("#")) {
      const headingText = cleanLine.replace(/^#+\s*/, "");
      return (
        <h3 key={index} style={{ fontSize: "18px", fontWeight: "700", color: "#1a202c", margin: "16px 0 8px 0" }}>
          {formatInline(headingText)}
        </h3>
      );
    }

    // List items (- या * या •)
    if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ") || cleanLine.startsWith("• ")) {
      const bulletText = cleanLine.replace(/^[-*•]\s*/, "");
      return (
        <li key={index} style={{ marginLeft: "20px", marginBottom: "6px", lineHeight: "1.6", color: "#2d3748" }}>
          {formatInline(bulletText)}
        </li>
      );
    }

    // सामान्य पैराग्राफ
    return (
      <p key={index} style={{ margin: "6px 0", lineHeight: "1.6", color: "#2d3748" }}>
        {formatInline(cleanLine)}
      </p>
    );
  });
}

// **bold** को असली बोल्ड में बदलने वाला फंक्शन
function formatInline(str) {
  // अगर टेबल की लाइन हो तो साधारण टेक्स्ट बना दें
  if (str.startsWith("|") && str.endsWith("|")) {
    return str.replace(/\|/g, " ").replace(/-+/g, "").trim();
  }

  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#000", fontWeight: "600" }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim() || loading) return;

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
    <main style={{ minHeight: "100vh", backgroundColor: "#f7fafc", padding: "20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", background: "#ffffff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", borderBottom: "1px solid #edf2f7", paddingBottom: "16px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "18px" }}>
            VP
          </div>
          <div>
            <h1 style={{ fontSize: "20px", margin: 0, color: "#1a202c" }}>VP AI Assistant</h1>
            <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "500" }}>● ऑनलाइन</span>
          </div>
        </div>

        {/* Output Box */}
        {reply && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", marginBottom: "20px" }}>
            <div style={{ fontWeight: "600", fontSize: "14px", color: "#4b5563", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🤖</span> VP AI:
            </div>
            <div>{renderFormattedText(reply)}</div>
          </div>
        )}

        {/* Input Box */}
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="अपना सवाल लिखें..."
            style={{ flex: 1, padding: "14px 16px", fontSize: "16px", borderRadius: "12px", border: "1.5px solid #e2e8f0", outline: "none" }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{ padding: "0 24px", fontSize: "16px", fontWeight: "600", borderRadius: "12px", border: "none", background: loading ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "..." : "भेजें"}
          </button>
        </div>

      </div>
    </main>
  );
}
       
