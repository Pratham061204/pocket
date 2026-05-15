import { formatCurrency } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { DeleteExpenseButton } from "./DeleteExpenseButton";
import { Paperclip, RefreshCw } from "lucide-react";

interface ExpenseListProps {
  expenses: {
    id: string;
    title: string;
    totalAmount: number | string;
    splitType: string;
    createdAt: Date;
    paidBy: { id: string; name: string };
    paidById: string;
    splits: { userId: string; amountOwed: number | string; user: { name: string } }[];
    receiptUrl?: string | null;
    isRecurring?: boolean;
  }[];
  currency: string;
  currentUserId: string;
}

export function ExpenseList({ expenses, currency, currentUserId }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No expenses yet. Add the first one!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => {
        const myShare = expense.splits.find((s) => s.userId === currentUserId);
        const isMyExpense = expense.paidBy.id === currentUserId;

        return (
          <div
            key={expense.id}
            className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 truncate">{expense.title}</span>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {expense.splitType === "EQUAL" ? "Equal" : "Custom"}
                </Badge>
                {expense.isRecurring && (
                  <Badge variant="outline" className="text-xs shrink-0 gap-1 text-blue-600 border-blue-200">
                    <RefreshCw className="w-2.5 h-2.5" />
                    Recurring
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Paid by {isMyExpense ? "you" : expense.paidBy.name}
                {" · "}
                {new Date(expense.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
              {myShare && (
                <p className="text-xs mt-0.5">
                  Your share:{" "}
                  <span className={isMyExpense ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                    {formatCurrency(Number(myShare.amountOwed), currency)}
                  </span>
                </p>
              )}
              {expense.receiptUrl && (
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1"
                >
                  <Paperclip className="w-3 h-3" />
                  View receipt
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <span className="font-semibold text-sm tabular-nums">
                {formatCurrency(Number(expense.totalAmount), currency)}
              </span>
              <DeleteExpenseButton expenseId={expense.id} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
