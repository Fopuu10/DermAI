import { redirect } from "next/navigation";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/pricing";
import CheckoutForm from "./CheckoutForm";
import BackButton from "@/components/BackButton";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { plan: planId } = await searchParams;
  if (!planId || !(planId in PLANS)) redirect("/subscription");
  if (isPremium(user.subscription)) redirect("/subscription");

  const plan = PLANS[planId as PlanId];

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-4">
      <BackButton href="/subscription" label="Back to plans" />
      <CheckoutForm
        plan={{
          id: plan.id,
          label: plan.label,
          amountInr: plan.amountInr,
          savingsLabel: plan.savingsLabel ?? null,
          durationDays: plan.durationDays,
        }}
        user={{ email: user.email, fullName: user.fullName }}
      />
    </div>
  );
}
