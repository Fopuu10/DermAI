import { redirect } from "next/navigation";
import { getCurrentUser, isPremium } from "@/lib/auth";
import AppShell from "@/components/AppShell";

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
