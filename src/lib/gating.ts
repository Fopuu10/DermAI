import { prisma } from "./db";
import { isPremium } from "./auth";
import { currentMonthKey, currentDayKey } from "./utils";

export const FREE_SCAN_LIMIT = 3;
export const FREE_CHAT_DAILY_LIMIT = 10;

export async function getScanQuota(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const premium = isPremium(sub);
  if (premium) return { premium: true, used: 0, limit: Infinity, remaining: Infinity };

  const month = currentMonthKey();
  const usage = await prisma.scanUsage.findUnique({ where: { userId_month: { userId, month } } });
  const used = usage?.scansCount ?? 0;
  return { premium: false, used, limit: FREE_SCAN_LIMIT, remaining: Math.max(0, FREE_SCAN_LIMIT - used) };
}

export async function incrementScanUsage(userId: string) {
  const month = currentMonthKey();
  await prisma.scanUsage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, scansCount: 1 },
    update: { scansCount: { increment: 1 } },
  });
}

export async function getChatQuota(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const premium = isPremium(sub);
  if (premium) return { premium: true, used: 0, limit: Infinity, remaining: Infinity };

  const day = currentDayKey();
  const usage = await prisma.chatUsage.findUnique({ where: { userId_day: { userId, day } } });
  const used = usage?.count ?? 0;
  return { premium: false, used, limit: FREE_CHAT_DAILY_LIMIT, remaining: Math.max(0, FREE_CHAT_DAILY_LIMIT - used) };
}

export async function incrementChatUsage(userId: string) {
  const day = currentDayKey();
  await prisma.chatUsage.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, count: 1 },
    update: { count: { increment: 1 } },
  });
}
