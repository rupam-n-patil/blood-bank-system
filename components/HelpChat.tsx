"use client";

import { useState } from "react";
import { Bot, Send, User, MessageCircleHeart } from "lucide-react";

type Message = {
  role: "bot" | "user";
  text: string;
};

const getBotReply = (input: string) => {
  const q = input.toLowerCase();

  if (q.includes("donor") || q.includes("donate")) {
    return "Donor records should include name, blood group, age, phone, address, last donation date, and eligibility status.";
  }

  if (q.includes("recipient") || q.includes("patient") || q.includes("request")) {
    return "Recipient requests should track patient name, hospital name, blood group needed, units required, and request status.";
  }

  if (q.includes("inventory") || q.includes("stock")) {
    return "Inventory should include blood group, units, collection date, expiry date, and stock status such as Available, Reserved, or Expired.";
  }

  if (q.includes("blood group")) {
    return "Common blood groups are A+, A-, B+, B-, AB+, AB-, O+, and O-.";
  }

  if (q.includes("eligible")) {
    return "In this project, eligibility is represented using a simple donor eligibility field for operational use.";
  }

  return "I can help with donor registration, blood stock, request flow, and blood group information.";
};

export default function HelpChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hello. I am the blood bank assistant. Ask about donors, inventory, or requests.",
    },
  ]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input };
    const botMessage: Message = { role: "bot", text: getBotReply(input) };

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput("");
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/70 shadow-xl">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="rounded-2xl bg-rose-300/10 p-3 ring-1 ring-rose-300/10">
          <MessageCircleHeart className="h-5 w-5 text-rose-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Assistant</h3>
          <p className="text-sm text-zinc-400">
            Quick help for blood bank operations
          </p>
        </div>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "bot" && (
              <div className="mt-1 rounded-full bg-rose-300/10 p-2">
                <Bot className="h-4 w-4 text-rose-300" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-zinc-100 text-zinc-950"
                  : "border border-white/10 bg-zinc-950/70 text-zinc-200"
              }`}
            >
              {msg.text}
            </div>

            {msg.role === "user" && (
              <div className="mt-1 rounded-full bg-white/10 p-2">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder="Ask about donors, stock, requests..."
            className="flex-1 rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
          />
          <button
            onClick={sendMessage}
            className="rounded-2xl bg-rose-200 px-4 py-3 text-zinc-950 transition hover:bg-rose-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}