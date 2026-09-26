"use client";

import { useState, useRef, useEffect } from "react";

// Markdown को सुंदर और साफ लुक देने वाला पार्सर
function renderCleanContent(text) {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((line, index) => {
    let cleanLine = line.trim();

    if (!cleanLine) {
      return <div key={index} style={{ height: "8px" }} />;
    }

    if (cleanLine === "---" || cleanLine === "***") {
      return <hr key={index} style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "14px 0" }} />;
    }

    if (cleanLine.startsWith("#")) {
      const heading = cleanLine.replace(/^#+\s*/, "");
      return (
        <h3 key={index} style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "12px 0 6px 0" }}>
          {formatBold(heading)}
        </h3>
      );
    }

    if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ") || cleanLine.startsWith("• ")) {
      const bullet = cleanLine.replace(/^[-*•]\s*/, "");
      return (
        <div key={index} style={{ display: "flex", gap: "8px", marginLeft: "8px", marginBottom: "6px", lineHeight: "1.6" }}>
          <span style={{ color: "#2563eb", fontWeight: "bold" }}>•</span>
          <span style={{ color: "#334155" }}>{formatBold(bullet)}</span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(cleanLine)) {
      return (
        <div key={index} style={{ marginLeft: "8px", marginBottom: "6px", lineHeight: "1.6", color: "#334155" }}>
          {formatBold(cleanLine)}
        </div>
      );
    }

    return (
      <p key={index} style={{ margin: "4px 0", lineHeight: "1.6", color: "#334155" }}>
        {formatBold(cleanLine)}
      </p>
    );
  });
}

function formatBold(str) {
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
      content: "प्रणाम! हम बानी रउआ सब के **VP AI Assistant**। 🚀\nपढ़ाई-लिखाई, कोडिंग, फोटो बनवावे खातिर या कवनो भी सवाल होखे, बेझिझक पूछीं!",
      type: "text",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Voice बोलकर सुनाने वाला फंक्शन (Web Speech API)
  function handleSpeak(text, idx) {
    if (!("speechSynthesis" in window)) {
      alert("आपके ब्राउज़र में आवाज़ सपोर्ट नहीं है।");
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();

    // सिंबल हटाकर साफ़ टेक्स्ट बुलवाना
    const cleanText = text.replace(/[*#_~`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // यूज़र मैसेज जोड़ें
    const updatedHistory = [...messages, { role: "user", content: userText, type: "text" }];
    setMessages(updatedHistory);
    setLoading(true);

    // चेक करें कि क्या यूज़र ने फोटो/इमेज बनाने को कहा है
    const isImageRequest = /(photo|image|picture|diagram|चित्र|फोटो|तस्वीर|डायग्राम)/i.test(userText);

    if (isImageRequest) {
      try {
        const res = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: userText }),
        });
        const data = await res.json();

        if (data.imageUrl) {
          setMessages([
            ...updatedHistory,
            {
              role: "assistant",
              content: `रउआ खातिर चित्र तैयार बा: "${userText}"`,
              type: "image",
              imageUrl: data.imageUrl,
            },
          ]);
        } else {
          setMessages([
            ...updatedHistory,
            { role: "assistant", content: "फोटो बनाने में समस्या आई।", type: "text" },
          ]);
        }
      } catch (err) {
        setMessages([
          ...updatedHistory,
          { role: "assistant", content: "इमेज सर्वर से कनेक्ट नहीं हो सका।", type: "text" },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // सामान्य चैट रिक्वेस्ट
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages([...updatedHistory, { role: "assistant", content: data.reply, type: "text" }]);
      } else {
        setMessages([...updatedHistory, { role: "assistant", content: data.error || "कोई जवाब नहीं मिला।", type: "text" }]);
      }
    } catch (err) {
      setMessages([...updatedHistory, { role: "assistant", content: "कनेक्शन में समस्या हुई। कृपया दोबारा प्रयास करें।", type: "text" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
            VP
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#0f172a" }}>VP AI Assistant</h1>
            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>● ऑनलाइन (Voice + Image Active)</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, maxWidth: "720px", width: "100%", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "90%",
              background: msg.role === "user" ? "#2563eb" : "#ffffff",
              color: msg.role === "user" ? "#ffffff" : "#1e293b",
              padding: "14px 16px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              border: msg.role === "assistant" ? "1px solid #e2e8f0" : "none",
            }}
          >
            {msg.role === "assistant" && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>VP AI</span>
                {msg.type === "text" && (
                  <button
                    onClick={() => handleSpeak(msg.content, idx)}
                    style={{ background: speakingIdx === idx ? "#fee2e2" : "#f1f5f9", border: "none", borderRadius: "6px", padding: "3px 8px", fontSize: "12px", cursor: "pointer", color: speakingIdx === idx ? "#dc2626" : "#475569", fontWeight: "600" }}
                  >
                    {speakingIdx === idx ? "⏹️ रोकें" : "🔊 सुनें"}
                  </button>
                )}
              </div>
            )}

            {/* टेक्स्ट जवाब */}
            {msg.role === "user" ? (
              <span style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{msg.content}</span>
            ) : (
              <div>
                {renderCleanContent(msg.content)}
                {/* अगर इमेज आई है तो चित्र दिखाना */}
                {msg.type === "image" && msg.imageUrl && (
                  <div style={{ marginTop: "12px" }}>
                    <img
                      src={msg.imageUrl}
                      alt="AI Generated"
                      style={{ width: "100%", borderRadius: "10px", border: "1px solid #e2e8f0", display: "block" }}
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ alignSelf: "flex-start", background: "#ffffff", padding: "12px 18px", borderRadius: "16px 16px 16px 4px", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "14px", fontStyle: "italic" }}>
            VP AI तैयार कर रहा है... ✍️🎨
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "12px 16px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="सवाल पूछें या 'फोटो बनाओ' लिखें..."
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
