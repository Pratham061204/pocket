"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

const createGroupSchema = z.object({
  name: z.string().min(1).max(60),
  currency: z.string().length(3),
});

export async function createGroup(formData: FormData) {
  const user = await getDbUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
  });
  if (!parsed.success) throw new Error("Invalid input");

  const { name, currency } = parsed.data;

  const group = await prisma.group.create({
    data: {
      name,
      currency,
      createdById: user.id,
      members: { create: { userId: user.id } },
      activities: {
        create: {
          userId: user.id,
          type: "MEMBER_JOINED",
          description: `${user.name} created the group`,
        },
      },
    },
  });

  revalidatePath("/");
  redirect(`/groups/${group.id}`);
}

export async function joinGroup(code: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Not authenticated");

  const group = await prisma.group.findUnique({ where: { inviteCode: code } });
  if (!group) throw new Error("Invalid invite code");

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: group.id } },
  });
  if (existing) {
    redirect(`/groups/${group.id}`);
    return;
  }

  await prisma.$transaction([
    prisma.groupMember.create({ data: { userId: user.id, groupId: group.id } }),
    prisma.activity.create({
      data: {
        groupId: group.id,
        userId: user.id,
        type: "MEMBER_JOINED",
        description: `${user.name} joined the group`,
      },
    }),
  ]);

  revalidatePath(`/groups/${group.id}`);
  redirect(`/groups/${group.id}`);
}

export async function getMyGroups() {
  const user = await getDbUser();
  if (!user) return [];

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
          expenses: {
            where: { deletedAt: null },
            select: { totalAmount: true, splits: { where: { userId: user.id }, select: { amountOwed: true } } },
          },
          settlements: {
            select: { payerId: true, receiverId: true, amount: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map(({ group }) => {
    const memberIds = [user.id];
    const expenses = group.expenses.map((e) => ({
      paidById: "",
      splits: e.splits,
    }));
    // Simplified: just return group data; balance computed in group page
    return {
      id: group.id,
      name: group.name,
      currency: group.currency,
      inviteCode: group.inviteCode,
      memberCount: group._count.members,
    };
  });
}

export async function getGroupDetail(groupId: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Not authenticated");

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  });
  if (!membership) throw new Error("Not a member of this group");

  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: true },
        orderBy: { joinedAt: "asc" },
      },
      expenses: {
        where: { deletedAt: null },
        include: {
          paidBy: true,
          splits: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      settlements: {
        include: { payer: true, receiver: true },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
}

export async function getGroupForJoin(code: string) {
  return prisma.group.findUnique({
    where: { inviteCode: code },
    select: { id: true, name: true, currency: true, _count: { select: { members: true } } },
  });
}
