"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Send, Sparkles, Trash2, ChevronRight, MessageCircle } from "lucide-react";
import { Bubble, TypingIndicator } from "@/components/ChatDrawer";
import { cn, timeAgo } from "@/lib/utils";

type Session = { id: string; title: string; updatedAt: string; messages?: { content: string }[] };
type Msg = { id: string; role: "user" | "assistant"; content: string; safetyFlag?: boolean };

const STARTERS = [
  "What's causing my acne?",
  "Is my condition getting better?",
  "What routine is best for my skin type?",
  "What do my recent scans mean?",
  "How do I reduce oily skin?",
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function loadSessions() {
    const r = await fetch("/api/chat/sessions");
    const d = await r.json();
    setSessions(d.sessions ?? []);
  }

  async function loadMessages(id: string) {
    setActive(id);
    const r = await fetch(`/api/chat/sessions/${id}`);
    const d = await r.json();
    setMessages(
      (d.session?.messages ?? []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        safetyFlag: m.safetyFlag,
      })),
    );
  }

  async function newChat() {
    const r = await fetch("/api/chat/sessions", { method: "POST" });
    const d = await r.json();
    await loadSessions();
    setActive(d.session.id);
    setMessages([]);
  }

  async function archive(id: string) {
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
    if (active === id) {
      setActive(null);
      setMessages([]);
    }
    await loadSessions();
  }

  useEffect(() => {
    loadSessions();
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    let sessionId = active;
    if (!sessionId) {
      const r = await fetch("/api/chat/sessions", { method: "POST" });
      const d = await r.json();
      sessionId = d.session.id;
      setActive(sessionId);
      await loadSessions();
    }
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError(null);
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
      await loadSessions();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const isWelcome = !active || messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4.5rem)] bg-cream">
      {/* Sessions list */}
      <aside className="hidden md:flex md:w-80 flex-col border-r border-slate-200 bg-white">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="font-semibold text-slate-800">Chats</div>
          <button
            onClick={newChat}
            className="w-9 h-9 rounded-lg bg-brand text-white grid place-items-center hover:bg-brand-700"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {sessions.length === 0 && (
            <div className="text-sm text-slate-400 px-2 py-4 text-center">No chats yet</div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "group flex items-start gap-2 p-3 rounded-xl cursor-pointer",
                active === s.id ? "bg-brand-50" : "hover:bg-slate-50",
              )}
            >
              <button onClick={() => loadMessages(s.id)} className="flex-1 text-left min-w-0">
                <div className="font-medium text-sm text-slate-800 line-clamp-1">{s.title}</div>
                <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {s.messages?.[0]?.content ?? "No messages yet"}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{timeAgo(s.updatedAt)}</div>
              </button>
              <button
                onClick={() => archive(s.id)}
                className="opacity-0 group-hover:opacity-100 p-1"
              >
                <Trash2 size={14} className="text-slate-400 hover:text-coral-600" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Conversation pane */}
      <main className="flex-1 flex flex-col bg-white">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand text-white grid place-items-center">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">Derma</div>
            <div className="text-xs text-slate-400">AI Skincare Assistant</div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-cream">
          {isWelcome ? (
            <div className="max-w-md mx-auto py-10 px-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-brand-50 grid place-items-center mb-4">
                <Sparkles size={36} className="text-brand-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Hi, I'm Derma <span>✨</span>
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Your personal AI skincare assistant. Ask me anything about your skin health.
              </p>
              <p className="text-[11px] text-slate-400 mt-4">
                Derma is an AI assistant. Always consult a real dermatologist for medical advice.
              </p>
              <div className="space-y-2 mt-6">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-sm text-slate-700 text-left"
                  >
                    {s}
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
              <button onClick={newChat} className="btn-primary mt-6">
                <Plus size={16} /> Start New Chat
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {messages.map((m) => (
                <Bubble key={m.id} msg={m} />
              ))}
              {loading && <TypingIndicator />}
              {error && <div className="text-xs text-coral-600 bg-coral-100 rounded-xl p-3">{error}</div>}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="p-3 border-t border-slate-100 flex gap-2 bg-white"
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
      </main>
    </div>
  );
}
