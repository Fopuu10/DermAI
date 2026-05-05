import { prisma } from "./db";

export async function recomputeHealthScore(userId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  const [scanCount, completedFollowUps, totalFollowUps, routines, posts, upvotes] = await Promise.all([
    prisma.diagnosisRecord.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.followUp.count({ where: { userId, status: "completed" } }),
    prisma.followUp.count({ where: { userId } }),
    prisma.routine.count({ where: { userId } }),
    prisma.communityPost.count({ where: { userId } }),
    prisma.postUpvote.count({ where: { userId } }),
  ]);

  const scanConsistency = Math.min(25, scanCount * 8);
  const followupCompletion =
    totalFollowUps === 0 ? 0 : Math.round((completedFollowUps / totalFollowUps) * 25);
  const routineAdherence = Math.min(25, routines * 12);
  const communityEngagement = Math.min(25, posts * 5 + upvotes * 2);

  const score = scanConsistency + followupCompletion + routineAdherence + communityEngagement;

  await prisma.skinHealthScore.upsert({
    where: { userId },
    create: {
      userId,
      score,
      scanConsistency,
      followupCompletion,
      routineAdherence,
      communityEngagement,
    },
    update: {
      score,
      scanConsistency,
      followupCompletion,
      routineAdherence,
      communityEngagement,
      lastUpdated: new Date(),
    },
  });

  return { score, scanConsistency, followupCompletion, routineAdherence, communityEngagement };
}
