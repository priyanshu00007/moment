"use client";
import React, { useState, useRef, useEffect } from "react";

export default function AIAssistantChatbot() {
  const [messages, setMessages] = useState([
    { id: 1, role: "bot", text: "Hi! I am your AI Assistant. How can I help you?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const API_KEY = "AIzaSyAMj190m7u1va-z76V0vfSu9jX0Xlo7RqY";
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now(), role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            ...messages.map((m) => ({
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: m.text }]
            })),
            { role: "user", parts: [{ text: input }] }
          ]
        })
      });

      if (!response.ok) throw new Error("Gemini API Error");
      const data = await response.json();

      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "bot", text: aiReply }]);
    } catch (err) {
      console.error("Gemini API Error:", err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, role: "bot", text: "Sorry, something went wrong." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-white to-blue-100">
      <header className="flex-none px-6 py-4 bg-indigo-700 text-white flex items-center gap-3 shadow">
        <span className="text-2xl font-bold">AI Assistant</span>
        <span className="ml-2 text-indigo-200 text-sm font-semibold">Powered by Gemini</span>
      </header>
      <section className="flex-1 flex flex-col max-w-3xl mx-auto w-full bg-white rounded-xl shadow-lg mt-8 mb-8 overflow-hidden border border-gray-200">
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-5 py-3 rounded-2xl max-w-2xl whitespace-pre-line text-base shadow
                  ${msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : "bg-gray-200 text-gray-900 rounded-bl-md"
                  }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-5 py-3 bg-gray-300 text-gray-600 rounded-2xl rounded-bl-md shadow animate-pulse max-w-2xl">
                AI is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t px-6 py-4 bg-white">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <textarea
              rows={2}
              className="flex-1 resize-none px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-base bg-gray-100"
              placeholder="Type a message and press Enter…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-60"
              disabled={loading || input.trim() === ""}
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
