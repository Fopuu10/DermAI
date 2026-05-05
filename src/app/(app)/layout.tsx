import { redirect } from "next/navigation";
import { getCurrentUser, isPremium } from "@/lib/auth";
import AppShell from "@/components/AppShell";

// Always render per-request — these pages depend on the auth cookie
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell
      user={{
        fullName: user.fullName,
        email: user.email,
        premium: isPremium(user.subscription),
      }}
    >
      {children}
    </AppShell>
  );
}
