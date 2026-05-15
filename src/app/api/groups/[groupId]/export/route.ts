import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: dbUser.id, groupId } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      expenses: {
        where: { deletedAt: null },
        include: {
          paidBy: { select: { name: true } },
          splits: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: "asc" },
      },
      settlements: {
        include: {
          payer: { select: { name: true } },
          receiver: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const memberNames = group.members.map((m) => m.user.name);

  const rows: string[] = [];

  // Header
  rows.push(["Type", "Date", "Title", `Amount (${group.currency})`, "Paid By", "Split", ...memberNames].join(","));

  // Expenses
  for (const e of group.expenses) {
    const shares = memberNames.map((name) => {
      const split = e.splits.find((s) => s.user.name === name);
      return split ? Number(split.amountOwed).toFixed(2) : "0.00";
    });
    rows.push([
      "Expense",
      new Date(e.createdAt).toLocaleDateString("en-CA"),
      `"${e.title.replace(/"/g, '""')}"`,
      Number(e.totalAmount).toFixed(2),
      e.paidBy.name,
      e.splitType,
      ...shares,
    ].join(","));
  }

  // Settlements
  for (const s of group.settlements) {
    rows.push([
      "Settlement",
      new Date(s.createdAt).toLocaleDateString("en-CA"),
      `"${s.payer.name} paid ${s.receiver.name}"`,
      Number(s.amount).toFixed(2),
      s.payer.name,
      "",
      ...memberNames.map(() => ""),
    ].join(","));
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${group.name}-expenses.csv"`,
    },
  });
}
