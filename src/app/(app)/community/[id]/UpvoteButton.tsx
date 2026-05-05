"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";

export default function UpvoteButton({ postId, initial }: { postId: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/community/posts/${postId}/upvote`, { method: "POST" });
      const data = await r.json();
      setActive(!!data.upvoted);
      setCount((c) => c + (data.upvoted ? 1 : -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
        active
          ? "bg-brand text-white"
          : "bg-brand-50 text-brand-700 hover:bg-brand-100"
      }`}
      disabled={busy}
    >
      <ArrowUp size={16} strokeWidth={2.5} />
      {count} {active ? "Upvoted" : "Upvote"}
    </button>
  );
}
