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
        recognition.onend
                   
