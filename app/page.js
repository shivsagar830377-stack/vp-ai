"use client";

import { useState, useRef, useEffect } from "react";

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "प्रणाम! हम बानी रउआ सब के **VP AI Assistant**। 🚀\nबोल के, लिख के या कवनो **फोटो अपलोड** करके भी सवाल पूछ सकीं!",
      type: "text",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Speech Recognition (माइक)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
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
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) {
      alert("माइक सपोर्ट केवल Chrome ब्राउज़र में उपलब्ध है।");
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

  // फोटो चुनना और Base64 में बदलना
  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  // आवाज़ में सुनाना
  function handleSpeak(text, idx) {
    if (!("speechSynthesis" in window)) {
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

  async function handleSend() {
    if ((!input.trim() && !selectedImage) || loading) return;

    const userText = input.trim();
    const userImage = selectedImage;

    setInput("");
    setSelectedImage(null);

    const newUserMsg = {
      role: "user",
      content: userText || "इस फोटो को समझाइए",
      userImage: userImage,
      type: "text",
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, image: userImage }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages([...updatedHistory, { role: "assistant", content: data.reply, type: "text" }]);
      } else {
        setMessages([...updatedHistory, { role: "assistant", content: data.error || "कोई जवाब नहीं मिला।", type: "text" }]);
      }
    } catch (err) {
      setMessages([...updatedHistory, { role: "assistant", content: "कनेक्शन में समस्या हुई। दोबारा प्रयास करें।", type: "text" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top Navbar */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
            VP
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#0f172a" }}>VP AI Assistant</h1>
            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>● ऑनलाइन (Vision + Mic Active)</span>
          </div>
        </div>
      </header>

      {/* Messages Area */}
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
                <button
                  onClick={() => handleSpeak(msg.content, idx)}
                  style={{ background: speakingIdx === idx ? "#fee2e2" : "#f1f5f9", border: "none", borderRadius: "6px", padding: "3px 8px", fontSize: "12px", cursor: "pointer", color: speakingIdx === idx ? "#dc2626" : "#475569", fontWeight: "600" }}
                >
                  {speakingIdx === idx ? "⏹️ रोकें" : "🔊 सुनें"}
                </button>
              </div>
            )}

            {/* अगर यूज़र ने फोटो भेजी है */}
            {msg.userImage && (
              <div style={{ marginBottom: "8px" }}>
                <img src={msg.userImage} alt="Uploaded" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }} />
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
            VP AI फोटो और सवाल समझ रहा है... 🧐
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Selected Image Preview (ऊपर छोटी थंबनेल) */}
      {selectedImage && (
        <div style={{ maxWidth: "720px", width: "100%", margin: "0 auto", padding: "6px 16px", display: "flex", alignItems: "center", gap: "10px", background: "#f1f5f9", borderTop: "1px solid #e2e8f0" }}>
          <img src={selectedImage} alt="Preview" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }} />
          <span style={{ fontSize: "12px", color: "#475569", flex: 1 }}>फोटो सेलेक्ट हो गई है</span>
          <button onClick={() => setSelectedImage(null)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "16px", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Input Bar */}
      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "10px 14px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", alignItems: "center", gap: "8px" }}>
          
          {/* छिपा हुआ File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            style={{ display: "none" }}
          />

          {/* 📎 फोटो अपलोड बटन */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="फोटो जोड़ें"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1.5px solid #cbd5e1",
              background: "#f8fafc",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            📎
          </button>

          {/* 🎙️ माइक बटन */}
          <button
            onClick={toggleListening}
            title="बोलकर टाइप करें"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: isListening ? "2px solid #ef4444" : "1.5px solid #cbd5e1",
              background: isListening ? "#fee2e2" : "#f8fafc",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            {isListening ? "🔴" : "🎙️"}
          </button>

          {/* टेक्स्ट बॉक्स */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedImage ? "इस फोटो के बारे में क्या पूछना है?" : "सवाल लिखें या फोटो जोड़ें..."}
            style={{ flex: 1, padding: "10px 16px", fontSize: "15px", borderRadius: "24px", border: "1.5px solid #cbd5e1", outline: "none" }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          {/* भेजें बटन */}
          <button
            onClick={handleSend}
            disabled={loading}
            style={{ padding: "0 18px", height: "40px", fontSize: "14px", fontWeight: "600", borderRadius: "24px", border: "none", background: loading ? "#93c5fd" : "#2563eb", color: "#ffffff", cursor: loading ? "not-allowed" : "pointer", flexShrink: 0 }}
          >
            भेजें
          </button>
        </div>
      </div>
    </main>
  );
}
