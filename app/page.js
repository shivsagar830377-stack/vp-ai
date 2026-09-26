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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setReply(data.reply);
    } catch (error) {
      setReply("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-5">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-4xl font-bold text-center mt-10">
          VP AI 🤖
        </h1>

        <p className="text-center text-gray-400 mt-2">
          Bhojpuri + Hindi AI Teacher
        </p>

        <div className="mt-10">

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Apna sawal likho..."
            className="w-full h-32 p-4 rounded-xl bg-zinc-900 border border-zinc-700 outline-none"
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="mt-4 w-full bg-white text-black font-bold py-3 rounded-xl"
          >
            {loading ? "VP AI सोच रहा है..." : "पूछो 🚀"}
          </button>

        </div>

        {reply && (
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5 whitespace-pre-wrap leading-7">
            {reply}
          </div>
        )}

      </div>
    </main>
  );
              
