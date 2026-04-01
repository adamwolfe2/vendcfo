"use client";

import { useEffect, useRef, useState } from "react";

// ─── Brand config ─────────────────────────────────────────────────
// Vendingpreneurs brand — terracotta from reference calculator
const BRAND = {
  primary: "#B85C43",
  primaryDark: "#9A4A33",
  primaryLight: "#F5EDE9",
  name: "Vendingpreneurs",
  tagline: "Margin Calculator",
};

// ─── Types ────────────────────────────────────────────────────────
interface ComparisonItem {
  id: string;
  name: string;
  cost: number;
  price: number;
  margin: number;
  markup: number;
  profit: number;
}

interface Message {
  role: "bot" | "user";
  content: string;
  items?: ComparisonItem[];
}

const WELCOME: Message = {
  role: "bot",
  content:
    'Enter a product with its cost and selling price to calculate your margin.\n\nExample: "Chips, cost $1.20, sell $2.50" — or tap a suggestion below.',
};

const SUGGESTIONS = [
  "Chips $1.20 $2.50",
  "Water $0.50 $1.25",
  "Energy drink $1.80 $3.50",
];

// ─── Result card — emulates CalculatorSoup layout ─────────────────
function ResultCard({
  items,
  brand,
}: {
  items: ComparisonItem[];
  brand: typeof BRAND;
}) {
  const sorted = [...items].sort((a, b) => b.margin - a.margin);
  const best = sorted[0]?.margin ?? 0;
  const worst = sorted[sorted.length - 1]?.margin ?? 0;

  function marginColor(m: number) {
    if (items.length === 1) return "#2D6A4F";
    if (m === best) return "#2D6A4F";
    if (m === worst) return "#C0392B";
    return "#E67E22";
  }

  if (items.length === 1) {
    const item = items[0];
    if (!item) return null;
    return (
      <div
        className="mt-2 rounded-lg overflow-hidden text-xs border"
        style={{ borderColor: "#D4C5BF" }}
      >
        {/* Answer box header */}
        <div
          className="px-3 py-1.5 text-[11px] font-medium"
          style={{ background: "#EDE0DC", color: "#6B4035" }}
        >
          Answer
        </div>
        {/* Results grid */}
        <div
          className="bg-white px-3 py-2 space-y-1"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {[
            { label: "Margin", value: `${item.margin.toFixed(2)}%`, highlight: true },
            { label: "Markup", value: `${item.markup.toFixed(2)}%`, highlight: false },
            { label: "Profit", value: `$ ${item.profit.toFixed(2)}`, highlight: false },
            { label: "Cost", value: `$ ${item.cost.toFixed(2)}`, highlight: false },
            { label: "Revenue", value: `$ ${item.price.toFixed(2)}`, highlight: false },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="flex justify-between items-center py-0.5">
              <span className="text-slate-600">{label}:</span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: highlight ? marginColor(item.margin) : "#1a1a1a" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-2 rounded-lg overflow-hidden text-xs border"
      style={{ borderColor: "#D4C5BF" }}
    >
      <div
        className="px-3 py-1.5 text-[11px] font-medium flex items-center justify-between"
        style={{ background: "#EDE0DC", color: "#6B4035" }}
      >
        <span>Comparison</span>
        <span className="text-[10px]" style={{ color: "#9A7060" }}>
          sorted by margin
        </span>
      </div>
      <table className="w-full bg-white" style={{ fontFamily: "Georgia, serif" }}>
        <thead>
          <tr
            className="text-[10px] uppercase tracking-wide"
            style={{ color: "#9A7060", borderBottom: "1px solid #EDE0DC" }}
          >
            <th className="text-left px-3 py-1.5 font-medium">Product</th>
            <th className="text-right px-2 py-1.5 font-medium">Cost</th>
            <th className="text-right px-2 py-1.5 font-medium">Price</th>
            <th className="text-right px-3 py-1.5 font-medium">Margin</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, i) => (
            <tr
              key={item.id}
              style={{ borderBottom: i < sorted.length - 1 ? "1px solid #F5EEEB" : "none" }}
            >
              <td className="px-3 py-2 font-medium text-slate-700 truncate max-w-[90px]">
                {i === 0 && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5"
                    style={{ background: "#2D6A4F" }}
                  />
                )}
                {item.name}
              </td>
              <td className="px-2 py-2 text-right text-slate-500 tabular-nums">
                ${item.cost.toFixed(2)}
              </td>
              <td className="px-2 py-2 text-right text-slate-500 tabular-nums">
                ${item.price.toFixed(2)}
              </td>
              <td
                className="px-3 py-2 text-right font-bold tabular-nums"
                style={{ color: marginColor(item.margin) }}
              >
                {item.margin.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center"
        style={{ background: BRAND.primaryLight }}
      >
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{
              background: BRAND.primary,
              animationDelay: `${delay}ms`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/embed/vendingpreneurs-logo.png"
        alt="Vendingpreneurs"
        style={{ height: "28px", width: "auto", objectFit: "contain" }}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────
export default function MarginChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [items, setItems] = useState<ComparisonItem[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || isTyping) return;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setIsTyping(true);

    try {
      const res = await fetch("/api/embed/margin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, items }),
      });

      const data = (await res.json()) as {
        action: string;
        reply: string;
        item: ComparisonItem | null;
        removeId: string | null;
      };

      let updatedItems = items;

      if (data.action === "add_item" && data.item) {
        updatedItems = [...items, data.item];
        setItems(updatedItems);
      } else if (data.action === "remove_item" && data.removeId) {
        updatedItems = items.filter((i) => i.id !== data.removeId);
        setItems(updatedItems);
      } else if (data.action === "clear_all") {
        updatedItems = [];
        setItems([]);
      }

      const showTable =
        (data.action === "add_item" || data.action === "compare") &&
        updatedItems.length >= 1;

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.reply,
          items: showTable ? updatedItems : undefined,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  const showSuggestions = items.length === 0 && messages.length <= 2;

  return (
    <div
      className="flex flex-col antialiased"
      style={{
        height: "100dvh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#F8F4F2",
      }}
    >
      {/* Header — terracotta matching reference calculator */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: BRAND.primary }}
      >
        <Logo />
        {items.length > 0 && (
          <span
            className="text-xs rounded-full px-2.5 py-1 font-medium"
            style={{ background: BRAND.primaryDark, color: "rgba(255,255,255,0.9)" }}
          >
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3 min-h-0"
        style={{ background: "#F8F4F2" }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
              style={
                msg.role === "user"
                  ? {
                      background: BRAND.primary,
                      color: "white",
                      borderBottomRightRadius: "4px",
                    }
                  : {
                      background: "white",
                      color: "#2D1F1A",
                      borderBottomLeftRadius: "4px",
                      border: "1px solid #E8D8D1",
                    }
              }
            >
              <span style={{ whiteSpace: "pre-line" }}>{msg.content}</span>
              {msg.items && msg.items.length > 0 && (
                <ResultCard items={msg.items} brand={BRAND} />
              )}
            </div>
          </div>
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {showSuggestions && (
        <div className="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs rounded-full px-3 py-1.5 transition-colors"
              style={{
                background: BRAND.primaryLight,
                color: BRAND.primaryDark,
                border: `1px solid ${BRAND.primary}40`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Clear */}
      {items.length > 0 && (
        <div className="px-3 pb-1.5 flex-shrink-0">
          <button
            onClick={() => send("clear")}
            className="text-xs transition-colors"
            style={{ color: "#9A7060" }}
          >
            Clear list
          </button>
        </div>
      )}

      {/* Input bar */}
      <div
        className="px-3 py-3 flex gap-2 flex-shrink-0"
        style={{ background: "white", borderTop: "1px solid #E8D8D1" }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={
            items.length === 0
              ? 'e.g. "Chips $1.20 $2.50"'
              : "Add another product..."
          }
          className="flex-1 text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all"
          style={{
            background: "#F8F4F2",
            border: `1px solid #DDD0CA`,
            color: "#2D1F1A",
          }}
          disabled={isTyping}
          autoComplete="off"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || isTyping}
          className="rounded-xl px-4 py-2.5 transition-colors flex items-center justify-center"
          style={{
            background: !input.trim() || isTyping ? "#D4C5BF" : BRAND.primary,
            color: "white",
            cursor: !input.trim() || isTyping ? "not-allowed" : "pointer",
          }}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}
