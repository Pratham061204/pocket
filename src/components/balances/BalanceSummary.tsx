"use client";

import { computeNetBalances, minimizeTransactions } from "@/lib/balance";
import { formatCurrency } from "@/lib/currency";
import { SettleUpDialog } from "./SettleUpDialog";

interface Member {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

interface Expense {
  paidById: string;
  splits: { userId: string; amountOwed: number | string }[];
}

interface Settlement {
  payerId: string;
  receiverId: string;
  amount: number | string;
}

interface BalanceSummaryProps {
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  currency: string;
  currentUserId: string;
  groupId: string;
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
    "bg-indigo-100 text-indigo-700",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-10 h-10 text-base" : "w-8 h-8 text-sm";
  return (
    <span className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${sizeClass} ${color}`}>
      {initials}
    </span>
  );
}

export function BalanceSummary({
  members,
  expenses,
  settlements,
  currency,
  currentUserId,
  groupId,
}: BalanceSummaryProps) {
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

  const netBalances = computeNetBalances({
    memberIds: members.map((m) => m.id),
    expenses,
    settlements,
  });

  const transactions = minimizeTransactions(netBalances);
  const currentUserNet = netBalances.find((b) => b.userId === currentUserId)?.net ?? 0;
  const allSettled = transactions.length === 0;

  return (
    <div className="space-y-4">

      {/* Who owes whom — hero section */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Who owes whom</p>
          {!allSettled && (
            <span className="text-xs text-gray-400">
              {transactions.length} payment{transactions.length !== 1 ? "s" : ""} to settle
            </span>
          )}
        </div>

        {allSettled ? (
          <div className="py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Everyone is settled up</p>
            <p className="text-xs text-gray-400 mt-0.5">No outstanding balances</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx, i) => {
              const from = memberMap[tx.fromUserId];
              const to = memberMap[tx.toUserId];
              const involvesMe = tx.fromUserId === currentUserId || tx.toUserId === currentUserId;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${involvesMe ? "bg-amber-50" : ""}`}
                >
                  <Avatar name={from?.name ?? "?"} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-sm font-semibold ${tx.fromUserId === currentUserId ? "text-amber-700" : "text-gray-900"}`}>
                        {tx.fromUserId === currentUserId ? "You" : from?.name}
                      </span>
                      <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <span className={`text-sm font-semibold ${tx.toUserId === currentUserId ? "text-amber-700" : "text-gray-900"}`}>
                        {tx.toUserId === currentUserId ? "You" : to?.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tx.fromUserId === currentUserId
                        ? `You owe ${to?.name}`
                        : tx.toUserId === currentUserId
                        ? `${from?.name} owes you`
                        : `${from?.name} owes ${to?.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-gray-900">
                      {formatCurrency(tx.amount, currency)}
                    </span>
                    {involvesMe && (
                      <SettleUpDialog
                        groupId={groupId}
                        tx={tx}
                        fromName={tx.fromUserId === currentUserId ? "You" : (from?.name ?? "")}
                        toName={tx.toUserId === currentUserId ? "You" : (to?.name ?? "")}
                        currency={currency}
                        currentUserId={currentUserId}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Your personal balance chip */}
      <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${
        currentUserNet > 0.009
          ? "bg-green-50 border border-green-200"
          : currentUserNet < -0.009
          ? "bg-red-50 border border-red-200"
          : "bg-gray-50 border border-gray-200"
      }`}>
        <div>
          <p className="text-xs text-gray-500">Your balance</p>
          <p className={`text-lg font-bold mt-0.5 ${
            currentUserNet > 0.009 ? "text-green-700" : currentUserNet < -0.009 ? "text-red-600" : "text-gray-400"
          }`}>
            {currentUserNet > 0.009
              ? `+${formatCurrency(currentUserNet, currency)}`
              : currentUserNet < -0.009
              ? `-${formatCurrency(Math.abs(currentUserNet), currency)}`
              : "Settled up"}
          </p>
        </div>
        <p className="text-xs text-gray-400">
          {currentUserNet > 0.009 ? "owed to you" : currentUserNet < -0.009 ? "you owe" : ""}
        </p>
      </div>

      {/* All member balances */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Member balances</p>
        </div>
        <div className="divide-y divide-gray-50">
          {netBalances.map(({ userId, net }) => {
            const member = memberMap[userId];
            if (!member) return null;
            return (
              <div key={userId} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={member.name} size="sm" />
                <span className="text-sm text-gray-800 flex-1">
                  {userId === currentUserId ? `${member.name} (you)` : member.name}
                </span>
                <span className={`text-sm font-semibold tabular-nums ${
                  net > 0.009 ? "text-green-600" : net < -0.009 ? "text-red-500" : "text-gray-400"
                }`}>
                  {net > 0.009
                    ? `+${formatCurrency(net, currency)}`
                    : net < -0.009
                    ? `-${formatCurrency(Math.abs(net), currency)}`
                    : "settled"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
