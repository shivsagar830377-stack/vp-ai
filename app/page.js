"use client";
import { useState, useRef, useEffect } from "react";

const BOT_AVATAR = "https://i.postimg.cc/C5pbh5zN/file-00000000583082118b16369073f60da3.png";

function formatText(text) {
  if (!text) return "";
  return text.split("\n").map((line, idx) => {
    const l = line.trim();
    if (!l) return <div key={idx} style={{ height: 6 }} />;
    const img = l.match(/!\[(.*?)\]\((https?:\/\/.*?)\)/);
    if (img) {
      return (
        <div key={idx} style={{ margin: "10px 0", textAlign: "center" }}>
          <img src={img[2]} alt={img[1] || "Diagram"} style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8, border: "1px solid #cbd5e1" }} />
          <div style={{ fontSize: 11, color: "#64748b" }}>🎨 {img[1] || "विजुअल चित्र"}</div>
        </div>
      );
    }
    return <p key={idx} style={{ margin: "4px 0", lineHeight: 1.5 }}>{l.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
  });
}

export default function Home() {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "प्रणाम! हम बानी रउआ सब के VP AI Assistant। 🚀 कौनों भी सवाल लिख के, बोल के या फोटो भेज के पूछीं!" }
  ]);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const chatEndRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSpeak = (text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/!\[.*?\]\(.*?\)/g, "").replace(/[*#_]/g, "").slice(0, 150);
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = "hi-IN";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;
    const txt = input.trim();
    const img = selectedImage;
    setInput("");
    setSelectedImage(null);

    const nextMsgs = [...messages, { role: "user", content: txt || "फोटो का डायग्राम बनाइए", userImage: img }];
    setMessages(nextMsgs);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: txt, image: img })
      });
      const data = await res.json();
      setMessages([...nextMsgs, { role: "assistant", content: data.reply || data.error || "कोई जवाब नहीं मिला।" }]);
    } catch (e) {
      setMessages([...nextMsgs, { role: "assistant", content: "कनेक्शन में समस्या हुई।" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
        <img src={BOT_AVATAR} alt="VP AI" style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #2563eb" }} />
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>VP AI Assistant</h1>
          <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>● एक्टिव</span>
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: 760, width: "100%", margin: "0 auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%", background: m.role === "user" ? "#2563eb" : "#ffffff", color: m.role === "user" ? "#ffffff" : "#1e293b", padding: "10px 14px", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", border: m.role === "assistant" ? "1px solid #e2e8f0" : "none" }}>
            {m.role === "assistant" && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, borderBottom: "1px solid #f1f5f9", paddingBottom: 4 }}>
                <span style={{ fontWeight: 700, color: "#475569" }}>VP AI</span>
                <button onClick={() => handleSpeak(m.content)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12 }}>
                  {speaking ? "⏹️ रोकें" : "🔊 सुनें"}
                </button>
              </div>
            )}
            {m.userImage && <img src={m.userImage} alt="User" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 6, marginBottom: 6 }} />}
            <div>{m.role === "user" ? m.content : formatText(m.content)}</div>
          </div>
        ))}
        {loading && <div style={{ alignSelf: "flex-start", color: "#64748b", fontSize: 13 }}>VP AI जवाब तैयार कर रहा है... ✍️</div>}
        <div ref={chatEndRef} />
      </div>

      {selectedImage && (
        <div style={{ padding: "6px 14px", background: "#f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
          <img src={selectedImage} alt="Preview" style={{ width: 36, height: 36, borderRadius: 4 }} />
          <span style={{ fontSize: 12, color: "#475569", flex: 1 }}>फोटो सेलेक्ट हो गई</span>
          <button onClick={() => setSelectedImage(null)} style={{ border: "none", background: "none", color: "#ef4444", fontSize: 16 }}>✕</button>
        </div>
      )}

      <div style={{ position: "sticky", bottom: 0, background: "#ffffff", borderTop: "1px solid #e2e8f0", padding: "10px 14px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", gap: 8 }}>
          <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              const r = new FileReader();
              r.onloadend = () => setSelectedImage(r.result);
              r.readAsDataURL(f);
            }
          }} />
          <button onClick={() => fileRef.current?.click()} style={{ width: 40, height: 40, borderRadius: 20, border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer" }}>📎</button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="सवाल पूछें या डायग्राम बनवाएं..." style={{ flex: 1, padding: "10px 14px", borderRadius: 20, border: "1px solid #cbd5e1", outline: "none" }} />
          <button onClick={handleSend} disabled={loading} style={{ padding: "0 16px", borderRadius: 20, border: "none", background: "#2563eb", color: "#ffffff", fontWeight: 600, cursor: "pointer" }}>भेजें</button>
        </div>
      </div>
    </main>
  );
      }
              
