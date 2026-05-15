import { prisma } from "@/lib/prisma";

export async function generateDueRecurring(groupId: string) {
  const today = new Date();
  const currentDay = today.getDate();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const templates = await prisma.expense.findMany({
    where: {
      groupId,
      isRecurring: true,
      deletedAt: null,
      recurringDay: { lte: currentDay },
      OR: [
        { lastGeneratedAt: null },
        { lastGeneratedAt: { lt: startOfMonth } },
      ],
    },
    include: { splits: true },
  });

  for (const t of templates) {
    await prisma.$transaction(async (tx) => {
      await tx.expense.create({
        data: {
          groupId: t.groupId,
          title: t.title,
          totalAmount: t.totalAmount,
          paidById: t.paidById,
          splitType: t.splitType,
          splits: {
            create: t.splits.map((s) => ({
              userId: s.userId,
              amountOwed: s.amountOwed,
            })),
          },
        },
      });
      await tx.expense.update({
        where: { id: t.id },
        data: { lastGeneratedAt: today },
      });
      await tx.activity.create({
        data: {
          groupId: t.groupId,
          userId: t.paidById,
          type: "EXPENSE_ADDED",
          description: `"${t.title}" auto-generated (recurring)`,
          metadata: { amount: Number(t.totalAmount), recurring: true },
        },
      });
    });
  }

  return templates.length;
}
