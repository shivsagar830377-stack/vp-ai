"use client";

import { useState, useRef, useEffect } from "react";

const BOT_AVATAR = "https://i.postimg.cc/C5pbh5zN/file-00000000583082118b16369073f60da3.png";

function formatBold(str) {
  if (!str) return "";
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "#0f172a", fontWeight: "700" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderTextLines(text) {
  const lines = text.split("\n");
  return lines.map((line, index) => {
    let cleanLine = line.trim();

    if (!cleanLine) {
      return <div key={index} style={{ height: "6px" }} />;
    }

    const imgMatch = cleanLine.match(/!\[(.*?)\]\((https?:\/\/.*?)\)/);
    if (imgMatch) {
      return (
        <div key={index} style={{ margin: "14px 0", textAlign: "center" }}>
          <img
            src={imgMatch[2]}
            alt={imgMatch[1] || "AI Image"}
            style={{
              maxWidth: "100%",
              maxHeight: "380px",
              borderRadius: "14px",
              boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              border: "1.5px solid #cbd5e1",
              objectFit: "contain",
              backgroundColor: "#ffffff",
            }}
          />
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontStyle: "italic" }}>
            🎨 {imgMatch[1] || "चित्र"}
          </div>
        </div>
      );
    }

    if (cleanLine === "---" || cleanLine === "***") {
      return (
        <hr
          key={index}
          style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "12px 0" }}
        />
      );
    }

    if (cleanLine.startsWith("#")) {
      const heading = cleanLine.replace(/^#+\s*/, "");
      return (
        <h3
          key={index}
          style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "10px 0 6px 0" }}
        >
          {formatBold(heading)}
        </h3>
      );
    }

    if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ") || cleanLine.startsWith("• ")) {
      const bullet = cleanLine.replace(/^[-*•]\s*/, "");
      return (
        <div
          key={index}
          style={{ display: "flex", gap: "8px", marginLeft: "6px", marginBottom: "5px", lineHeight: "1.6" }}
        >
          <span style={{ color: "#2563eb", fontWeight: "bold" }}>•</span>
          <span style={{ color: "#334155" }}>{formatBold(bullet)}</span>
        </div>
      );
    }

    if (/^\d+\.\s/.test(cleanLine)) {
      return (
        <div
          key={index}
          style={{ marginLeft: "6px", marginBottom: "5px", lineHeight: "1.6", color: "#334155" }}
        >
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

export default function Home() {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [isImageGenMode, setIsImageGenMode] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: 
        "नमस्ते! मैं आपका **VP AI Assistant** हूँ। 🚀\nकिसी भी विषय पर लिखकर या बोलकर (🎙️) सवाल पूछें। यदि आपको तस्वीर बनवानी है, तो **🎨 फोटो बनाएँ** बटन चालू करके प्रॉम्प्ट लिखें!",
      
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
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

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleSpeak(text, idx) {
    if (speakingIdx === idx) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingIdx(null);
      return;
    }

    const cleanText = text
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/[*#_~`]/g, "")
      .replace(/\[.*?\]/g, "")
      .slice(0, 200);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "hi-IN";
        utterance.onend = () => setSpeakingIdx(null);
        utterance.onerror = () => setSpeakingIdx(null);
        setSpeakingIdx(idx);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setSpeakingIdx(null);
      }
    }
  }

  function handleCopy(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function handleDownloadPDF(text) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("कृपया पॉप-अप की अनुमति दें।");
      return;
    }

    const formattedContent = text
      .split("\n")
      .map((line) => {
        let l = line.trim();
        if (!l) return "<br/>";
        const imgMatch = l.match(/!\[(.*?)\]\((https?:\/\/.*?)\)/);
        if (imgMatch) {
          return `<div style="text-align:center; margin: 15px 0;"><img src="${imgMatch[2]}" style="max-width:90%; max-height:300px; border-radius:8px;" /></div>`;
        }
        if (l.startsWith("#")) return `<h2>${l.replace(/^#+\s*/, "")}</h2>`;
        if (l.startsWith("- ") || l.startsWith("* "))
          return `<li>${l.replace(/^[-*]\s*/, "")}</li>`;
        return `<p>${l}</p>`;
      })
      .join("")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VP AI Export Notes</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; }
            h1 { color: #2563eb; font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 20px; }
            h2 { color: #0f172a; font-size: 16px; margin-top: 16px; margin-bottom: 6px; }
            p { margin: 6px 0; font-size: 14px; }
            li { margin-left: 20px; margin-bottom: 4px; font-size: 14px; }
            .footer { margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>VP AI Assistant 📝</h1>
          <div>${formattedContent}</div>
          <div class="footer">Generated by VP AI Assistant</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }

  async function handleSend() {
    if ((!input.trim() && !selectedImage) || loading) return;

    const userText = input.trim();
    const userImage = selectedImage;

    setInput("");
    setSelectedImage(null);

    const newUserMsg = {
      role: "user",
      content: userText || (isImageGenMode ? "इमेज जनरेट करें" : "उत्तर दीजिए"),
      userImage: userImage,
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          image: userImage,
          isNotesMode,
          isImageGenMode,
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages([...updatedHistory, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([
          ...updatedHistory,
          { role: "assistant", content: data.error || "कोई जवाब नहीं मिला।" },
        ]);
      }
    } catch (err) {
      setMessages([...updatedHistory, { role: "assistant", content: "कनेक्शन में समस्या हुई।" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img
            src={BOT_AVATAR}
            alt="VP AI"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#eff6ff",
              border: "2px solid #2563eb",
              objectFit: "cover",
            }}
          />
          <div>
            <h1 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
              VP AI
            </h1>
            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>
              ● एक्टिव
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => {
              setIsImageGenMode(!isImageGenMode);
              if (!isImageGenMode) setIsNotesMode(false);
            }}
            style={{
              background: isImageGenMode ? "#9333ea" : "#f1f5f9",
              color: isImageGenMode ? "#ffffff" : "#475569",
              border: "1px solid " + (isImageGenMode ? "#9333ea" : "#cbd5e1"),
              borderRadius: "20px",
              padding: "5px 10px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            🎨 {isImageGenMode ? "फोटो ON" : "फोटो बनाएँ"}
          </button>

          <button
            onClick={() => {
              setIsNotesMode(!isNotesMode);
              if (!isNotesMode) setIsImageGenMode(false);
            }}
            style={{
              background: isNotesMode ? "#2563eb" : "#f1f5f9",
              color: isNotesMode ? "#ffffff" : "#475569",
              border: "1px solid " + (isNotesMode ? "#2563eb" : "#cbd5e1"),
              borderRadius: "20px",
              padding: "5px 10px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            📝 {isNotesMode ? "नोट्स ON" : "नोट्स"}
          </button>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          maxWidth: "760px",
          width: "100%",
          margin: "0 auto",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "94%",
              background: msg.role === "user" ? "#2563eb" : "#ffffff",
              color: msg.role === "user" ? "#ffffff" : "#1e293b",
              padding: "12px 16px",
              borderRadius:
                msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              border: msg.role === "assistant" ? "1px solid #e2e8f0" : "none",
            }}
          >
            {msg.role === "assistant" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>
                  VP AI Assistant
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleDownloadPDF(msg.content)}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "2px 7px",
                      fontSize: "11px",
                      color: "#2563eb",
                      fontWeight: "600",
                    }}
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    style={{
                      background: copiedIdx === idx ? "#dcfce7" : "#f1f5f9",
                      border: "none",
                      borderRadius: "6px",
                      padding: "2px 7px",
                      fontSize: "11px",
                      color: copiedIdx === idx ? "#16a34a" : "#475569",
                      fontWeight: "600",
                    }}
                  >
                    {copiedIdx === idx ? "✓" : "📋"}
                  </button>
                  <button
                    onClick={() => handleSpeak(msg.content, idx)}
                    style={{
                      background: speakingIdx === idx ? "#fee2e2" : "#f1f5f9",
                      border: "none",
                      borderRadius: "6px",
                      padding: "2px 7px",
                      fontSize: "11px",
                      color: speakingIdx === idx ? "#dc2626" : "#475569",
                      fontWeight: "600",
                    }}
                  >
                    {speakingIdx === idx ? "⏹️" : "🔊"}
                  </button>
                </div>
              </div>
            )}

            {msg.userImage && (
              <div style={{ marginBottom: "8px" }}>
                <img
                  src={msg.userImage}
                  alt="Uploaded"
                  style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
                />
              </div>
            )}

            <div>
              {msg.role === "user" ? (
                <span style={{ whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{msg.content}</span>
              ) : (
                renderTextLines(msg.content)
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "#ffffff",
              padding: "10px 16px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            {isImageGenMode ? "🎨 AI आपकी फोटो जनरेट कर रहा है..." : "✍️ VP AI जवाब लिख रहा है..."}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {selectedImage && (
        <div
          style={{
            maxWidth: "760px",
            width: "100%",
            margin: "0 auto",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#f1f5f9",
          }}
        >
          <img
            src={selectedImage}
            alt="Preview"
            style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px" }}
          />
          <span style={{ fontSize: "12px", color: "#475569", flex: 1 }}>फोटो सेलेक्ट है</span>
          <button
            onClick={() => setSelectedImage(null)}
            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "16px" }}
          >
            ✕
          </button>
        </div>
      )}

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          padding: "10px 14px",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            style={{ display: "none" }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="फ़ाइल जोड़ें"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              fontSize: "18px",
            }}
          >
            📎
          </button>

          <button
            onClick={toggleListening}
            title="बोलकर लिखें"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: isListening ? "2px solid #ef4444" : "1px solid #cbd5e1",
              background: isListening ? "#fee2e2" : "#f8fafc",
              fontSize: "18px",
            }}
          >
            {isListening ? "🔴" : "🎙️"}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isImageGenMode
                ? "इमेज का प्रॉम्प्ट लिखें..."
                : "सवाल पूछें या डायग्राम बनवाएं..."
            }
            style={{
              flex: 1,
              padding: "10px 14px",
              fontSize: "14px",
              borderRadius: "24px",
              border: "1.5px solid #cbd5e1",
              outline: "none",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              padding: "0 16px",
              height: "40px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "24px",
              border: "none",
                          background: isImageGenMode ? "#9333ea" : "#2563eb",
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {isImageGenMode ? "बनाएँ 🎨" : "भेजें"}
          </button>
        </div>
      </div>
    </main>
  );
}
