"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

const splitSchema = z.object({
  userId: z.string(),
  amountOwed: z.number().positive(),
});

const addExpenseSchema = z.object({
  groupId: z.string(),
  title: z.string().min(1).max(120),
  totalAmount: z.number().positive(),
  paidById: z.string(),
  splitType: z.enum(["EQUAL", "UNEQUAL"]),
  splits: z.array(splitSchema).min(1),
  receiptUrl: z.string().url().optional(),
  isRecurring: z.boolean().default(false),
  recurringDay: z.number().int().min(1).max(28).optional(),
});

export type AddExpenseInput = z.infer<typeof addExpenseSchema>;

export async function addExpense(input: AddExpenseInput) {
  const user = await getDbUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = addExpenseSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input: " + parsed.error.message);

  const { groupId, title, totalAmount, paidById, splitType, splits, receiptUrl, isRecurring, recurringDay } = parsed.data;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  });
  if (!membership) throw new Error("Not a member of this group");

  if (splitType === "UNEQUAL") {
    const sum = splits.reduce((acc, s) => acc + s.amountOwed, 0);
    if (Math.abs(sum - totalAmount) > 0.01)
      throw new Error(`Split amounts (${sum.toFixed(2)}) must equal total (${totalAmount.toFixed(2)})`);
  }

  const paidByUser = await prisma.user.findUnique({ where: { id: paidById }, select: { name: true } });

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        groupId,
        title,
        totalAmount,
        paidById,
        splitType,
        receiptUrl,
        isRecurring,
        recurringDay: isRecurring ? recurringDay : null,
        splits: { create: splits.map((s) => ({ userId: s.userId, amountOwed: s.amountOwed })) },
      },
    });

    await tx.activity.create({
      data: {
        groupId,
        userId: user.id,
        type: "EXPENSE_ADDED",
        description: `${user.name} added "${title}"${isRecurring ? " (recurring)" : ""}`,
        metadata: { expenseId: expense.id, amount: totalAmount, paidBy: paidByUser?.name },
      },
    });
  });

  revalidatePath(`/groups/${groupId}`);
}

export async function deleteExpense(expenseId: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Not authenticated");

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { groupId: true, title: true, deletedAt: true },
  });
  if (!expense || expense.deletedAt) throw new Error("Expense not found");

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: expense.groupId } },
  });
  if (!membership) throw new Error("Not a member of this group");

  await prisma.$transaction([
    prisma.expense.update({ where: { id: expenseId }, data: { deletedAt: new Date() } }),
    prisma.activity.create({
      data: {
        groupId: expense.groupId,
        userId: user.id,
        type: "EXPENSE_DELETED",
        description: `${user.name} deleted "${expense.title}"`,
      },
    }),
  ]);

  revalidatePath(`/groups/${expense.groupId}`);
}
