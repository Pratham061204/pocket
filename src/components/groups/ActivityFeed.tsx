import { formatDistanceToNow } from "@/lib/time";

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
  user: { name: string };
}

interface ActivityFeedProps {
  activities: Activity[];
}

const typeConfig: Record<string, { color: string; icon: string }> = {
  EXPENSE_ADDED: { color: "bg-blue-100 text-blue-600", icon: "+" },
  EXPENSE_DELETED: { color: "bg-red-100 text-red-600", icon: "−" },
  SETTLEMENT_COMPLETED: { color: "bg-green-100 text-green-600", icon: "✓" },
  MEMBER_JOINED: { color: "bg-purple-100 text-purple-600", icon: "→" },
  MEMBER_LEFT: { color: "bg-gray-100 text-gray-500", icon: "←" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const config = typeConfig[activity.type] ?? { color: "bg-gray-100 text-gray-500", icon: "·" };
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${config.color}`}>
              {config.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-800">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDistanceToNow(new Date(activity.createdAt))}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
