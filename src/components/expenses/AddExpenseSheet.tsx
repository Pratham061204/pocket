"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Paperclip, X, RefreshCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, convertAmount, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { addExpense } from "@/actions/expenses";
import { uploadReceipt } from "@/actions/receipts";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  totalAmount: z.number().positive("Must be positive"),
  paidById: z.string().min(1, "Select who paid"),
  splitType: z.enum(["EQUAL", "UNEQUAL"]),
  splits: z.array(z.object({ userId: z.string(), amountOwed: z.number().min(0) })),
  isRecurring: z.boolean(),
  recurringDay: z.number().int().min(1).max(28).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Member { id: string; name: string }

interface AddExpenseSheetProps {
  groupId: string;
  members: Member[];
  currency: string;
  currentUserId: string;
}

export function AddExpenseSheet({ groupId, members, currency, currentUserId }: AddExpenseSheetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputCurrency, setInputCurrency] = useState(currency);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || rates) return;
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => d.rates && setRates(d.rates))
      .catch(() => {});
  }, [open]);

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        title: "",
        totalAmount: 0,
        paidById: currentUserId,
        splitType: "EQUAL",
        splits: members.map((m) => ({ userId: m.id, amountOwed: 0 })),
        isRecurring: false,
        recurringDay: new Date().getDate(),
      },
    });

  const { fields } = useFieldArray({ control, name: "splits" });

  const watchTotal = watch("totalAmount");
  const watchSplitType = watch("splitType");
  const watchSplits = watch("splits");
  const watchRecurring = watch("isRecurring");

  const convertedTotal =
    inputCurrency !== currency && watchTotal > 0
      ? convertAmount(watchTotal, inputCurrency, currency, rates ?? undefined)
      : watchTotal;

  useEffect(() => {
    if (watchSplitType === "EQUAL" && convertedTotal > 0) {
      const share = Math.round((convertedTotal / members.length) * 100) / 100;
      members.forEach((_, i) => setValue(`splits.${i}.amountOwed`, share));
    }
  }, [convertedTotal, watchSplitType, members.length]);

  const splitSum = watchSplits.reduce((s, sp) => s + (Number(sp.amountOwed) || 0), 0);
  const splitDiff = Math.abs(splitSum - (Number(convertedTotal) || 0));
  const isUnequalValid = watchSplitType === "EQUAL" || splitDiff < 0.01;

  async function onSubmit(data: FormValues) {
    if (!isUnequalValid) {
      toast.error(`Splits sum to ${formatCurrency(splitSum, currency)}, expected ${formatCurrency(convertedTotal, currency)}`);
      return;
    }
    setLoading(true);
    try {
      let receiptUrl: string | undefined;
      if (receiptFile) {
        const fd = new FormData();
        fd.append("file", receiptFile);
        receiptUrl = await uploadReceipt(fd);
      }

      await addExpense({
        groupId,
        title: data.title,
        totalAmount: convertedTotal,
        paidById: data.paidById,
        splitType: data.splitType,
        splits: data.splits.map((s) => ({ userId: s.userId, amountOwed: s.amountOwed })),
        receiptUrl,
        isRecurring: data.isRecurring,
        recurringDay: data.isRecurring ? data.recurringDay : undefined,
      });

      toast.success("Expense added");
      reset();
      setInputCurrency(currency);
      setReceiptFile(null);
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className={cn(buttonVariants({ size: "sm" }), "gap-1")}>
        <Plus className="w-4 h-4" />
        Add expense
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Add expense</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>What was it for?</Label>
            <Input placeholder="Groceries, Rent, Dinner…" {...register("title")} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          {/* Amount + currency */}
          <div className="space-y-1.5">
            <Label>Total amount</Label>
            <div className="flex gap-2">
              <Select value={inputCurrency} onValueChange={(v) => v && setInputCurrency(v)}>
                <SelectTrigger className="w-28 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="flex-1"
                {...register("totalAmount", { valueAsNumber: true })}
              />
            </div>
            {inputCurrency !== currency && watchTotal > 0 && (
              <p className="text-xs text-gray-500">
                ≈ {formatCurrency(convertedTotal, currency)} (saved in {currency})
              </p>
            )}
            {errors.totalAmount && <p className="text-xs text-red-500">{errors.totalAmount.message}</p>}
          </div>

          {/* Paid by */}
          <div className="space-y-1.5">
            <Label>Paid by</Label>
            <Select value={watch("paidById")} onValueChange={(v) => v && setValue("paidById", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.id === currentUserId ? `${m.name} (you)` : m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split type */}
          <div className="space-y-1.5">
            <Label>Split type</Label>
            <div className="flex gap-2">
              {(["EQUAL", "UNEQUAL"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue("splitType", type)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    watchSplitType === type
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {type === "EQUAL" ? "Equal" : "Custom"}
                </button>
              ))}
            </div>
          </div>

          {/* Split details */}
          <div className="space-y-2">
            <Label>
              Split details
              {watchSplitType === "EQUAL" && convertedTotal > 0 && (
                <span className="text-gray-400 font-normal ml-2 text-xs">
                  ({formatCurrency(convertedTotal / members.length, currency)} each)
                </span>
              )}
            </Label>
            {fields.map((field, i) => {
              const member = members[i];
              return (
                <div key={field.id} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 flex-1">{member?.name}</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-28 text-right"
                    readOnly={watchSplitType === "EQUAL"}
                    {...register(`splits.${i}.amountOwed`, { valueAsNumber: true })}
                  />
                </div>
              );
            })}
            {watchSplitType === "UNEQUAL" && (
              <div className={`flex justify-between text-xs pt-1 ${isUnequalValid ? "text-gray-400" : "text-red-500 font-medium"}`}>
                <span>Sum: {formatCurrency(splitSum, currency)}</span>
                {!isUnequalValid && <span>Off by {formatCurrency(splitDiff, currency)}</span>}
              </div>
            )}
          </div>

          {/* Recurring toggle */}
          <div className="rounded-lg border border-gray-200 p-3 space-y-3">
            <button
              type="button"
              onClick={() => setValue("isRecurring", !watchRecurring)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-800">Recurring monthly</span>
              </div>
              <div className={`w-9 h-5 rounded-full transition-colors relative ${watchRecurring ? "bg-black" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${watchRecurring ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </button>
            {watchRecurring && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Auto-generate on day</span>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  className="w-16 h-7 text-sm text-center"
                  {...register("recurringDay", { valueAsNumber: true })}
                />
                <span className="text-xs text-gray-500">of each month</span>
              </div>
            )}
          </div>

          {/* Receipt upload */}
          <div className="space-y-1.5">
            <Label>Receipt (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            />
            {receiptFile ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">{receiptFile.name}</span>
                <button type="button" onClick={() => setReceiptFile(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 w-full p-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                Attach receipt
              </button>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading || !isUnequalValid}>
            {loading ? "Adding…" : "Add expense"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
