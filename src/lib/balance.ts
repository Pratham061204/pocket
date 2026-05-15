export interface NetBalance {
  userId: string;
  net: number;
}

export interface MinimalTx {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export function computeNetBalances(params: {
  memberIds: string[];
  expenses: {
    paidById: string;
    splits: { userId: string; amountOwed: number | string }[];
  }[];
  settlements: { payerId: string; receiverId: string; amount: number | string }[];
}): NetBalance[] {
  const net: Record<string, number> = {};
  for (const id of params.memberIds) net[id] = 0;

  for (const exp of params.expenses) {
    for (const split of exp.splits) {
      if (split.userId !== exp.paidById) {
        const amt = Number(split.amountOwed);
        net[exp.paidById] = (net[exp.paidById] ?? 0) + amt;
        net[split.userId] = (net[split.userId] ?? 0) - amt;
      }
    }
  }

  for (const s of params.settlements) {
    const amt = Number(s.amount);
    net[s.payerId] = (net[s.payerId] ?? 0) + amt;
    net[s.receiverId] = (net[s.receiverId] ?? 0) - amt;
  }

  return Object.entries(net).map(([userId, n]) => ({
    userId,
    net: Math.round(n * 100) / 100,
  }));
}

// Greedy two-pointer: O(n log n), minimises number of transactions
export function minimizeTransactions(balances: NetBalance[]): MinimalTx[] {
  const creditors = balances
    .filter((b) => b.net > 0.009)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);

  const debtors = balances
    .filter((b) => b.net < -0.009)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.net - b.net);

  const txns: MinimalTx[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const amount = Math.min(creditors[i].net, -debtors[j].net);
    txns.push({
      fromUserId: debtors[j].userId,
      toUserId: creditors[i].userId,
      amount: Math.round(amount * 100) / 100,
    });
    creditors[i].net -= amount;
    debtors[j].net += amount;
    if (creditors[i].net < 0.009) i++;
    if (-debtors[j].net < 0.009) j++;
  }

  return txns;
}
