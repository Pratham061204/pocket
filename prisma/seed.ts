import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  const [sid, rahul] = await Promise.all([
    prisma.user.upsert({
      where: { email: "sid@demo.pocket" },
      update: { name: "Sid" },
      create: { supabaseId: "demo-sid-0000-0000-0000-000000000001", name: "Sid", email: "sid@demo.pocket" },
    }),
    prisma.user.upsert({
      where: { email: "rahul@demo.pocket" },
      update: { name: "Rahul" },
      create: { supabaseId: "demo-rahul-000-0000-0000-000000000002", name: "Rahul", email: "rahul@demo.pocket" },
    }),
  ]);

  // Clean up old 4-person seed users if they exist
  await prisma.user.deleteMany({
    where: { email: { in: ["aman@demo.pocket", "neha@demo.pocket"] } },
  }).catch(() => {});

  const seedUsers = [sid, rahul];

  let group = await prisma.group.findFirst({ where: { name: "Flatmates" } });

  if (!group) {
    group = await prisma.group.create({
      data: {
        name: "Flatmates",
        currency: "INR",
        inviteCode: "flatmates-demo-2024",
        createdById: sid.id,
      },
    });
    console.log(`Created group: ${group.name} (${group.id})`);
  } else {
    console.log(`Using existing group: ${group.name} (${group.id})`);
  }

  for (const u of seedUsers) {
    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId: u.id, groupId: group.id } },
      update: {},
      create: { userId: u.id, groupId: group.id },
    });
  }

  const existingExpenses = await prisma.expense.count({ where: { groupId: group.id } });
  if (existingExpenses > 0) {
    console.log("Expenses already seeded, skipping.");
    console.log("\nSeed complete! Demo invite code: flatmates-demo-2024");
    return;
  }

  const expenses = [
    {
      title: "March Rent",
      totalAmount: 40000,
      paidById: sid.id,
      splitType: "EQUAL" as const,
      splits: [
        { userId: sid.id, amountOwed: 20000 },
        { userId: rahul.id, amountOwed: 20000 },
      ],
    },
    {
      title: "Groceries",
      totalAmount: 1500,
      paidById: rahul.id,
      splitType: "EQUAL" as const,
      splits: [
        { userId: sid.id, amountOwed: 750 },
        { userId: rahul.id, amountOwed: 750 },
      ],
    },
    {
      title: "Electricity Bill",
      totalAmount: 2400,
      paidById: sid.id,
      splitType: "UNEQUAL" as const,
      splits: [
        { userId: sid.id, amountOwed: 1500 },
        { userId: rahul.id, amountOwed: 900 },
      ],
    },
    {
      title: "Netflix",
      totalAmount: 649,
      paidById: rahul.id,
      splitType: "EQUAL" as const,
      splits: [
        { userId: sid.id, amountOwed: 324.5 },
        { userId: rahul.id, amountOwed: 324.5 },
      ],
    },
    {
      title: "WiFi",
      totalAmount: 999,
      paidById: sid.id,
      splitType: "EQUAL" as const,
      splits: [
        { userId: sid.id, amountOwed: 499.5 },
        { userId: rahul.id, amountOwed: 499.5 },
      ],
    },
    {
      title: "Dinner out",
      totalAmount: 3200,
      paidById: rahul.id,
      splitType: "UNEQUAL" as const,
      splits: [
        { userId: sid.id, amountOwed: 1800 },
        { userId: rahul.id, amountOwed: 1400 },
      ],
    },
  ];

  for (const exp of expenses) {
    await prisma.expense.create({
      data: {
        groupId: group.id,
        title: exp.title,
        totalAmount: exp.totalAmount,
        paidById: exp.paidById,
        splitType: exp.splitType,
        splits: { create: exp.splits },
      },
    });
    await prisma.activity.create({
      data: {
        groupId: group.id,
        userId: exp.paidById,
        type: "EXPENSE_ADDED",
        description: `${seedUsers.find((u) => u.id === exp.paidById)!.name} added "${exp.title}"`,
        metadata: { amount: exp.totalAmount },
      },
    });
    console.log(`  Added expense: ${exp.title} (₹${exp.totalAmount})`);
  }

  await prisma.settlement.create({
    data: { groupId: group.id, payerId: rahul.id, receiverId: sid.id, amount: 500 },
  });
  await prisma.activity.create({
    data: {
      groupId: group.id,
      userId: rahul.id,
      type: "SETTLEMENT_COMPLETED",
      description: "Rahul paid Sid",
      metadata: { amount: 500 },
    },
  });

  console.log("\nSeed complete! Demo invite code: flatmates-demo-2024");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
