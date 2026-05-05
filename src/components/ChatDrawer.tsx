"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Send, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string; safetyFlag?: boolean };

const STARTERS = [
  "What's causing my acne?",
  "Is my condition getting better?",
  "What routine fits my skin type?",
  "How do I reduce oily skin?",
];

export default function ChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || sessionId) return;
    fetch("/api/chat/sessions", { method: "POST" })
      .then((r) => r.json())
      .then((d) => setSessionId(d.session.id))
      .catch(() => setError("Could not start chat. Please log in."));
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!sessionId || !text.trim() || loading) return;
    setError(null);
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setMessages((m) => [
        ...m.filter((x) => x.id !== tempId),
        { id: data.userMessage.id, role: "user", content: data.userMessage.content },
        {
          id: data.assistantMessage.id,
          role: "assistant",
          content: data.assistantMessage.content,
          safetyFlag: data.assistantMessage.safetyFlag,
        },
      ]);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:justify-end">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-[85vh] md:h-[90vh] md:mr-6 rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-full bg-brand text-white grid place-items-center">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">Derma</div>
            <div className="text-[10px] text-slate-400">AI skincare assistant</div>
          </div>
          <Link
            href="/chat"
            className="ml-auto text-xs text-brand-700 hover:underline flex items-center gap-1"
          >
            Open full chat <ExternalLink size={12} />
          </Link>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-2 text-[10px] text-slate-400 border-b border-slate-50">
          Derma is an AI assistant. Always consult a real dermatologist for medical advice.
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-sm">
              <div className="font-medium mb-2">Hi! I'm Derma. Ask me anything.</div>
              <div className="space-y-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left px-3 py-2 rounded-xl border border-slate-200 hover:bg-brand-50 hover:border-brand-200 text-sm text-slate-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}
          {loading && <TypingIndicator />}
          {error && <div className="text-xs text-coral-600 bg-coral-100 rounded-xl p-3">{error}</div>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="p-3 border-t border-slate-100 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Derma anything…"
            className="input"
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export function Bubble({ msg }: { msg: Msg }) {
  return (
    <div className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
      {msg.role === "assistant" && (
        <div className="w-7 h-7 rounded-full bg-brand text-white grid place-items-center flex-shrink-0">
          <Sparkles size={12} />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
          msg.role === "user"
            ? "bg-brand text-white rounded-tr-sm"
            : msg.safetyFlag
              ? "bg-coral-100 text-coral-600 border border-coral-100 rounded-tl-sm"
              : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm",
        )}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-brand text-white grid place-items-center">
        <Sparkles size={12} />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1">
        <span className="typing-dot w-2 h-2 rounded-full bg-slate-400" style={{ animationDelay: "0s" }} />
        <span className="typing-dot w-2 h-2 rounded-full bg-slate-400" style={{ animationDelay: "0.2s" }} />
        <span className="typing-dot w-2 h-2 rounded-full bg-slate-400" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}
