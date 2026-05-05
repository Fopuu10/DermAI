import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./db";
import { safeJSON } from "./utils";

const URGENT_PATTERNS = [
  /black\s+spot.*growing/i,
  /bleeding\s+mole/i,
  /spreading\s+rash.*fever/i,
  /high\s+fever/i,
  /rapidly\s+growing/i,
];

const SYSTEM_TEMPLATE = (ctx: {
  fullName: string | null;
  age: number | null | undefined;
  skinType: string | null | undefined;
  concerns: string[];
  recentDiagnoses: { name: string; confidence: number; date: string; bodyPart: string }[];
  pendingFollowUps: { date: string; condition: string }[];
  routineSummary: string | null;
}) => `You are Derma, a friendly and knowledgeable skincare assistant inside the DermAI app.

USER PROFILE
- Name: ${ctx.fullName ?? "User"}
- Age: ${ctx.age ?? "unknown"}
- Skin type: ${ctx.skinType ?? "unknown"}
- Main concerns: ${ctx.concerns.length ? ctx.concerns.join(", ") : "none recorded"}

RECENT DIAGNOSES (most recent first)
${
  ctx.recentDiagnoses.length
    ? ctx.recentDiagnoses
        .map(
          (d) =>
            `- ${d.date}: ${d.name} (${Math.round(d.confidence * 100)}% confidence) on ${d.bodyPart}`,
        )
        .join("\n")
    : "- No prior scans"
}

PENDING FOLLOW-UPS
${
  ctx.pendingFollowUps.length
    ? ctx.pendingFollowUps.map((f) => `- ${f.date}: follow-up for ${f.condition}`).join("\n")
    : "- None"
}

ACTIVE ROUTINE
${ctx.routineSummary ?? "None"}

YOUR JOB
1. Answer skincare and skin condition questions clearly and helpfully.
2. Reference the user's profile and history when relevant (e.g. "Since you have oily skin...").
3. Suggest the user run a scan if they describe new symptoms.
4. Remind them of pending follow-ups if relevant.
5. Recommend upgrading to premium if they ask about a premium feature.
6. Never diagnose definitively — always frame answers as suggestions.
7. Always add a medical disclaimer when discussing specific conditions or treatments.
8. Keep responses concise — 3 to 5 sentences max unless the user asks for detail.
9. Never recommend specific prescription medications by name.
10. If the user describes urgent symptoms (rapidly growing/bleeding moles, spreading rash with fever), tell them to see a dermatologist or visit a clinic urgently.`;

export async function buildContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  const recent = await prisma.diagnosisRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
  const followUps = await prisma.followUp.findMany({
    where: { userId, status: "pending" },
    include: { originalDiagnosis: true },
    orderBy: { scheduledDate: "asc" },
    take: 5,
  });
  const routines = await prisma.routine.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 2,
  });

  const routineSummary = routines.length
    ? routines
        .map(
          (r) =>
            `${r.type} routine: ${safeJSON<{ description: string }[]>(r.steps, [])
              .map((s) => s.description)
              .join("; ")}`,
        )
        .join("\n")
    : null;

  return {
    fullName: user?.fullName ?? null,
    age: user?.profile?.age,
    skinType: user?.profile?.skinType,
    concerns: safeJSON<string[]>(user?.profile?.concerns ?? null, []),
    recentDiagnoses: recent.map((d) => ({
      name: d.predictedCondition,
      confidence: d.confidence,
      date: d.createdAt.toISOString().slice(0, 10),
      bodyPart: d.bodyPart,
    })),
    pendingFollowUps: followUps.map((f) => ({
      date: f.scheduledDate.toISOString().slice(0, 10),
      condition: f.originalDiagnosis.predictedCondition,
    })),
    routineSummary,
  };
}

export function checkUrgent(text: string) {
  return URGENT_PATTERNS.some((p) => p.test(text));
}

export type SimpleMessage = { role: "user" | "assistant"; content: string };

export async function getChatReply(
  userId: string,
  history: SimpleMessage[],
  userMessage: string,
): Promise<{ content: string; safety_flag: boolean }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ctx = await buildContext(userId);
  const system = SYSTEM_TEMPLATE(ctx);
  const safety_flag = checkUrgent(userMessage);

  if (!apiKey) {
    // Graceful local fallback when no key is configured
    const reply = safety_flag
      ? "These symptoms may require urgent medical attention. Please see a dermatologist or visit a clinic as soon as possible."
      : `Thanks for sharing. Based on your skin profile (${ctx.skinType ?? "unknown"} skin) and recent scans, I'd suggest running a fresh scan if symptoms are new. Note: this is general guidance, not a diagnosis — please consult a dermatologist if you're concerned. (Add ANTHROPIC_API_KEY to .env to enable full chat.)`;
    return { content: reply, safety_flag };
  }

  const client = new Anthropic({ apiKey });
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system,
    messages,
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const finalText =
    safety_flag && !/dermatologist|clinic|urgent/i.test(text)
      ? `${text}\n\nThese symptoms may require urgent medical attention — please see a dermatologist as soon as possible.`
      : text;

  return { content: finalText, safety_flag };
}
