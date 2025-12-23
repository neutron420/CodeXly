import prisma from "@/lib/prisma";

export async function userHasActivePlan(userId: string): Promise<boolean> {
  if (!userId) return false;

  const payment = await prisma.payment.findFirst({
    where: {
      userId,
      status: "SUCCESS",
    },
    orderBy: { updatedAt: "desc" },
  });

  return Boolean(payment);
}


