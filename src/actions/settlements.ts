"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

const settleUpSchema = z.object({
  groupId: z.string(),
  payerId: z.string(),
  receiverId: z.string(),
  amount: z.number().positive(),
});

export type SettleUpInput = z.infer<typeof settleUpSchema>;

export async function settleUp(input: SettleUpInput) {
  const user = await getDbUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = settleUpSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  const { groupId, payerId, receiverId, amount } = parsed.data;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  });
  if (!membership) throw new Error("Not a member of this group");

  if (payerId === receiverId) throw new Error("Payer and receiver cannot be the same");

  const [payer, receiver] = await Promise.all([
    prisma.user.findUnique({ where: { id: payerId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: receiverId }, select: { name: true } }),
  ]);

  await prisma.$transaction([
    prisma.settlement.create({
      data: { groupId, payerId, receiverId, amount },
    }),
    prisma.activity.create({
      data: {
        groupId,
        userId: user.id,
        type: "SETTLEMENT_COMPLETED",
        description: `${payer?.name} paid ${receiver?.name}`,
        metadata: { amount, payerId, receiverId },
      },
    }),
  ]);

  revalidatePath(`/groups/${groupId}`);
}
