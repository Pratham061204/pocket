import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    currency: string;
    memberCount: number;
  };
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{group.name}</p>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span>{group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2 shrink-0">
              {group.currency}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
