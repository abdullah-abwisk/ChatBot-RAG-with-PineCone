"use client";

import React, { useState, useRef } from "react";

interface Message {
  role: "user" | "bot";
  content: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setMessages((prev) => [...prev, { role: "bot", content: data.answer }]);
    } catch (err: any) {
      setError(err.message || "Failed to get response");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSend();
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card shadow-md min-h-[400px] flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.length === 0 && (
          <div className="flex-1 text-muted-foreground flex items-center justify-center h-full">
            <span>Start a conversation...</span>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg max-w-[80%] ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground self-end ml-auto"
                : "bg-muted text-muted-foreground self-start mr-auto"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={isLoading}
        />
        <button
          className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
