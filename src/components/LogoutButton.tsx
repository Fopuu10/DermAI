"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  if (variant === "full") {
    return (
      <button
        onClick={logout}
        disabled={busy}
        className="text-sm text-slate-500 hover:text-coral-600 transition font-medium"
      >
        {busy ? "Signing out…" : "Sign out of DermAI"}
      </button>
    );
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="text-xs text-slate-500 hover:text-coral-600 px-2 py-1 flex items-center gap-1 font-medium transition"
    >
      <LogOut size={14} /> {busy ? "…" : "Logout"}
    </button>
  );
}
