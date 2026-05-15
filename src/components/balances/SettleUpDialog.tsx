"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { settleUp } from "@/actions/settlements";
import type { MinimalTx } from "@/lib/balance";

interface SettleUpDialogProps {
  groupId: string;
  tx: MinimalTx;
  fromName: string;
  toName: string;
  currency: string;
  currentUserId: string;
}

export function SettleUpDialog({
  groupId,
  tx,
  fromName,
  toName,
  currency,
  currentUserId,
}: SettleUpDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPayer = tx.fromUserId === currentUserId;

  async function handleSettle() {
    setLoading(true);
    try {
      await settleUp({
        groupId,
        payerId: tx.fromUserId,
        receiverId: tx.toUserId,
        amount: tx.amount,
      });
      toast.success("Payment recorded");
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: "sm", variant: isPayer ? "default" : "outline" }),
          "text-xs h-7 px-2"
        )}
      >
        {isPayer ? "Mark paid" : "Record"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm payment</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center space-y-2">
          <p className="text-3xl font-bold">{formatCurrency(tx.amount, currency)}</p>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{fromName}</span>
            {" → "}
            <span className="font-medium text-gray-900">{toName}</span>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSettle} disabled={loading}>
            {loading ? "Recording…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
