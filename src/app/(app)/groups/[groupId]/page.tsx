import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Link2, Users, Download } from "lucide-react";
import { getGroupDetail } from "@/actions/groups";
import { getDbUser } from "@/lib/auth";
import { generateDueRecurring } from "@/lib/recurring";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { BalanceSummary } from "@/components/balances/BalanceSummary";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { AddExpenseSheet } from "@/components/expenses/AddExpenseSheet";
import { ActivityFeed } from "@/components/groups/ActivityFeed";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupPage({ params }: PageProps) {
  const { groupId } = await params;

  // Auto-generate any due recurring expenses before rendering
  await generateDueRecurring(groupId).catch(console.error);

  const [group, currentUser] = await Promise.all([getGroupDetail(groupId), getDbUser()]);

  if (!group || !currentUser) notFound();

  const members = group.members.map((m: typeof group.members[number]) => ({
    id: m.user.id,
    name: m.user.name,
    avatarUrl: m.user.avatarUrl,
  }));

  const expenses = group.expenses.map((e: typeof group.expenses[number]) => ({
    id: e.id,
    title: e.title,
    totalAmount: Number(e.totalAmount),
    splitType: e.splitType as string,
    createdAt: e.createdAt,
    paidBy: { id: e.paidBy.id, name: e.paidBy.name },
    paidById: e.paidById,
    splits: e.splits.map((s: typeof e.splits[number]) => ({
      userId: s.userId,
      amountOwed: Number(s.amountOwed),
      user: { name: s.user.name },
    })),
    receiptUrl: e.receiptUrl ?? null,
    isRecurring: e.isRecurring,
  }));

  const settlements = group.settlements.map((s: typeof group.settlements[number]) => ({
    payerId: s.payerId,
    receiverId: s.receiverId,
    amount: Number(s.amount),
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Groups
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">{group.currency}</Badge>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.members.length} member{group.members.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/groups/${groupId}/export`}
            download={`${group.name}-expenses.csv`}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-gray-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
          <LinkButton href={`/groups/${groupId}/invite`} variant="outline" size="sm">
            <Link2 className="w-3.5 h-3.5 mr-1" />
            Invite
          </LinkButton>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="balances">
        <TabsList className="w-full">
          <TabsTrigger value="balances" className="flex-1">Balances</TabsTrigger>
          <TabsTrigger value="expenses" className="flex-1">
            Expenses {expenses.length > 0 && `(${expenses.length})`}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-4">
          <BalanceSummary
            members={members}
            expenses={expenses}
            settlements={settlements}
            currency={group.currency}
            currentUserId={currentUser.id}
            groupId={groupId}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              {expenses.length === 0 ? "No expenses" : `${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`}
            </p>
            <AddExpenseSheet
              groupId={groupId}
              members={members}
              currency={group.currency}
              currentUserId={currentUser.id}
            />
          </div>
          <ExpenseList
            expenses={expenses}
            currency={group.currency}
            currentUserId={currentUser.id}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityFeed activities={group.activities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
