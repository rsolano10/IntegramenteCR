import type { ReactNode } from "react";

export function ChatBubble({ role, children }: { role: "user" | "bot"; children: ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          isUser ? "bg-verde-serenidad text-white rounded-br-sm" : "bg-white border border-borde text-tinta rounded-bl-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
