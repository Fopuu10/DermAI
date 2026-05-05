"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, isAnonymous: anon }),
      });
      setBody("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        className="input"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a supportive comment…"
      />
      <div className="flex items-center justify-between">
        <label className="text-xs text-slate-600 flex items-center gap-1">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
          Post anonymously
        </label>
        <button className="btn-primary" disabled={busy || !body.trim()}>
          {busy ? "Posting…" : "Comment"}
        </button>
      </div>
    </form>
  );
}
