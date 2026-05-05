import { NextResponse } from "next/server";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { safeJSON } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      profile: user.profile
        ? {
            age: user.profile.age,
            gender: user.profile.gender,
            skinType: user.profile.skinType,
            concerns: safeJSON<string[]>(user.profile.concerns, []),
          }
        : null,
      premium: isPremium(user.subscription),
      subscription: user.subscription,
      healthScore: user.healthScore,
    },
  });
}
