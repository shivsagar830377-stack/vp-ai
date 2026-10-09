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
            alt={imgMatch[1] || "Diagram"}
            style={{
              maxWidth: "100%",
              maxHeight: "360px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              border: "1px solid #cbd5e1",
              objectFit: "contain",
              backgroundColor: "#ffffff",
            }}
          />
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>
            🎨 {imgMatch[1] || "विजुअल चित्र"}
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
          style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "12px 0 6px 0" }}
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
  const [showSplash, setShowSplash] = useState(true);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "प्रणाम! हम बानी रउआ सब के **VP AI Assistant**। 🚀\nकौनों भी टॉपिक पर लिख के, बोल के या **फोटो 📎** भेज के पूछीं। हम ओकर **सचित्र विजुअल डायग्राम बनाके** एकदम साफ़-साफ़ समझा देब!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://code.responsivevoice.org/responsivevoice.js?key=FREE_KEY";
      script.async = true;
      document.body.appendChild(script);

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
      if (typeof window !== "undefined" && window.responsiveVoice) {
        window.responsiveVoice.cancel();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setSpeakingIdx(null);
      return;
    }

    const cleanText = text
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/[*#_~`]/g, "")
      .replace(/\[.*?\]/g, "")
      .slice(0, 180);

    if (typeof window !== "undefined" && window.responsiveVoice) {
      setSpeakingIdx(idx);
      window.responsiveVoice.speak(cleanText, "Hindi Female", {
        rate: 0.95,
        onend: () => setSpeakingIdx(null),
        onerror: () => setSpeakingIdx(null),
      });
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "hi-IN";
        utterance.onend = () => setSpeakingIdx(null);
        utterance.onerror = () => setSpeakingIdx(null);
        setSpeakingIdx(idx);
        window.speechSynthesis.speak(utterance);
        return;
      } catch (e) {
        setSpeakingIdx(null);
      }
    }

    setSpeakingIdx(null);
  }

  function handleCopy(text, idx) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function handleDownloadPDF(text) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("पॉप-अप ब्लॉक है! कृपया अनुमति दें।");
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
          <title>VP AI Study Notes & Diagram</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; }
            h1 { color: #2563eb; font-size: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 20px; }
            h2 { color: #0f172a; font-size: 16px; margin-top: 16px; margin-bottom: 6px; }
            p { margin: 6px 0; font-size: 14px; }
            li { margin-left: 20px; margin-bottom: 4px; font-size: 14px; }
            .footer { margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>VP AI Assistant - Notes & Diagram 📝</h1>
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
      content: userText || (isNotesMode ? "इस फोटो के नोट्स बनाइए" : "इस फोटो का सचित्र डायग्राम बनाकर समझाइए"),
      userImage: userImage,
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, image: userImage, isNotesMode }),
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

  if (showSplash) {
    return (
      <main
        style={{
          height: "100vh",
          backgroundColor: "#160507",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "340px",
            width: "100%",
            borderRadius: "24px",
            padding: "36px 20px",
            border: "2px solid #854d0e",
            backgroundColor: "#200609",
            boxShadow: "0 0 35px rgba(255, 215, 0, 0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "14px",
          }}
        >
          <div style={{ fontSize: "56px", filter: "drop-shadow(0 0 16px rgba(255, 215, 0, 0.8))" }}>
            ☀️
          </div>

          <div style={{ fontSize: "18px", color: "#facc15", marginTop: "-6px" }}>
            ✦
          </div>

          <div style={{ fontSize: "78px", filter: "drop-shadow(0 0 18px rgba(217, 119, 6, 0.6))", margin: "-6px 0" }}>
            🦁
          </div>

          <div style={{ marginTop: "8px" }}>
            <h1
              style={{
                color: "#f59e0b",
                fontSize: "21px",
                fontWeight: "800",
                letterSpacing: "3px",
                margin: "0 0 6px 0",
                textTransform: "uppercase",
                fontFamily: "Georgia, serif",
              }}
            >
              SHIV SAGAR GUPTA
            </h1>
            <p
              style={{
                color: "#fef08a",
                opacity: 0.9,
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "2.5px",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              AI PRODUCT BUILDER
            </p>
          </div>

          <div
            style={{
              width: "70px",
              height: "2px",
              backgroundColor: "#d97706",
              borderRadius: "2px",
              marginTop: "4px",
            }}
          />
        </div>
      </main>
    );
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
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={BOT_AVATAR}
            alt="VP AI Avatar"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "#eff6ff",
              border: "2px solid #2563eb",
              objectFit: "cover",
            }}
          />
          <div>
            <h1 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "#0f172a" }}>
              VP AI Assistant
            </h1>
            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>
              ● सचित्र विजुअल्स एक्टिव
            </span>
          </div>
        </div>

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

      <div
        style={{
          flex: 1,
          maxWidth: "760px",
          width: "100%",
          margin: "0 auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
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
              padding: "14px 16px",
              borderRadius:
                msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
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
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <img
                    src={BOT_AVATAR}
                    alt="VP AI"
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "#eff6ff",
                      objectFit: "cover",
                    }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>
                    VP AI
                  </span>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleDownloadPDF(msg.content)}
                    title="PDF डाउनलोड करें"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "12px",
                      cursor: "pointer",
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
                      padding: "3px 8px",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: copiedIdx === idx ? "#16a34a" : "#475569",
                      fontWeight: "600",
                    }}
                  >
                    {copiedIdx === idx ? "✓ कॉपी" : "📋 कॉपी"}
                  </button>
                  <button
                    onClick={() => handleSpeak(msg.content, idx)}
                    style={{
                      background: speakingIdx === idx ? "#fee2e2" : "#f1f5f9",
                      border: "none",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: speakingIdx === idx ? "#dc2626" : "#475569",
                      fontWeight: "600",
                    }}
                  >
                    {speakingIdx === idx ? "⏹️ रोकें" : "🔊 सुनें"}
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
              padding: "12px 18px",
              borderRadius: "16px 16px 16px 4px",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "14px",
              fontStyle: "italic",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <img
              src={BOT_AVATAR}
              alt="Thinking"
