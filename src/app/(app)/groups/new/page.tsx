import { createGroup } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewGroupPage() {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create a group</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGroup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Group name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Flatmates, Road trip, Office lunch…"
                required
                maxLength={60}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue="INR">
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Create group
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
