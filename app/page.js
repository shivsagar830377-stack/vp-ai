"use client";

import { useState, useRef, useEffect } from "react";

const BOT_AVATAR = "https://i.postimg.cc/C5pbh5zN/file-00000000583082118b16369073f60da3.png";

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
  if (!str) return "";
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
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "प्रणाम! हम बानी रउआ सब के **VP AI Assistant**। 🚀\nकवनो भी सवाल पूछीं, या ऊपर **'📝 नोट्स मोड'** ऑन करके किसी भी टॉपिक के नोट्स बनवा लीं!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = "hi-IN";

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? prev + " " + transcript : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) {
      alert("माइक केवल Chrome ब्राउज़र में सपोर्टेड है।");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  }

  function handleSpeak(text, idx) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("ब्राउज़र में आवाज़ सपोर्ट नहीं है।");
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_~`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  }

  function handleCopy(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    const newUserMsg = { role: "user", content: userText };
    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, isNotesMode }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages([...updatedHistory, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([...updatedHistory, { role: "assistant", content: data.error || "कोई जवाब नहीं मिला।" }]);
      }
    } catch (err) {
      setMessages([...updatedHistory, { role: "assistant", content: "कनेक्शन में समस्या हुई।" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* हेडर */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={BOT_AVATAR}
            alt="VP AI Avatar"
            style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#eff6ff", border: "2px solid #2563eb", objectFit: "cover" }}
          />
          <div>
            <h1 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "#0f172a" }}>VP AI Assistant</h1>
            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>● ऑनलाइन</span>
          </div>
        </div>

        {/* नोट्स मोड टॉगल बटन */}
        <button
          onClick={() => setIsNotesMode(!isNotesMode)}
          style={{
            background: isNotesMode ? "#2563eb" : "#f1f5f9",
            color: isNotesMode ? "#ffffff" : "#475569",
            border: "1px solid " + (isNotesMode ? "#2563eb" : "#cbd5e1"),
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          📝 {isNotesMode ? "नोट्स मोड ON" : "नोट्स मोड"}
        </button>
      </header>

      {/* चैट मैसेजेस */}
      <div style={{ flex: 1, maxWidth: "720px", width: "100%", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "92%",
              background: msg.role === "user" ? "#2563eb" : "#ffffff",
              color: msg.role === "user" ? "#ffffff" : "#1e293b",
              padding: "14px 16px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              border: msg.role === "assistant" ? "1px solid #e2e8f0" : "none",
            }}
          >
            {msg.role === "assistant" && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <img
                    src={BOT_AVATAR}
                    alt="VP AI"
                    style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#eff6ff", objectFit: "cover" }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>VP AI</span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    style={{ background: copiedIdx === idx ? "#dcfce7" : "#f1f5f9", border: "none", borderRadius: "6px", padding: "3px 8px", fontSize: "12px", cursor: "pointer", color: copiedIdx === idx ? "#16a34a" : "#475569", fontWeight: "600" }}
                  >
                    {copiedIdx === idx ? "✓ कॉपी हुआ" : "📋 कॉपी"}
                  </button>
                  <button
                    onClick={() => handleSpeak(msg.content, idx)}
                    style={{ background: speakingIdx === idx ? "#fee2e2" : "#f1f5f9", border: "none", borderRadius: "6px", padding: "3px 8px", fontSize: "12px", cursor: "pointer", color: speakingIdx === idx ? "#dc2626" : "#475569", fontWeight: "600" }}
                  >
                    {speakingIdx === idx ? "⏹️ रोकें" : "🔊 सुनें"}
                  </button>
                </div>
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
          <div style={{ alignSelf: "flex-start", background: "#ffffff", padding: "12px 18px", borderRadius: "16px 16px 16px 4px", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "14px", fontStyle: "italic", display: "flex", alignItems: "center", gap: "8px" }}>
            <img src={BOT_AVATAR} alt="Thinking" style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} />
            {isNotesMode ? "VP AI नोट्स तैयार कर रहा है... 📝" : "VP AI सोच रहा है... ✍️"}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* इनपुट बार */}
      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "10px 14px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={toggleListening}
            title="बोलकर लिखें"
            style={{ width: "40px", height: "40px", borderRadius: "50%", border: isListening ? "2px solid #ef4444" : "1.5px solid #cbd5e1", background: isListening ? "#fee2e2" : "#f8fafc", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            {isListening ? "🔴" : "🎙️"}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isNotesMode ? "किस विषय या टॉपिक पर नोट्स बनाना है?" : "सवाल पूछें या नोट्स बनवाएं..."}
            style={{ flex: 1, padding: "10px 16px", fontSize: "15px", borderRadius: "24px", border: "1.5px solid #cbd5e1", outline: "none" }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            style={{ padding: "0 18px", height: "40px", fontSize: "14px", fontWeight: "600", borderRadius: "24px", border: "none", background: loading ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: loading ? "not-allowed" : "pointer", flexShrink: 0 }}
          >
            {isNotesMode ? "नोट्स बनाएँ" : "भेजें"}
          </button>
        </div>
      </div>
    </main>
  );
}
