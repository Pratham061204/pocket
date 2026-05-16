"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

export function CurrencySelect() {
  const [selected, setSelected] = useState("INR");

  return (
    <>
      <input type="hidden" name="currency" value={selected} />
      <Select value={selected} onValueChange={(v) => v && setSelected(v)}>
        <SelectTrigger id="currency">
          <span className="flex-1 text-left text-sm">
            {SUPPORTED_CURRENCIES.find((c) => c.code === selected)?.label ?? selected}
          </span>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
