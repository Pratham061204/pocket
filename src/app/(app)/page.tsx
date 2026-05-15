import { Plus } from "lucide-react";
import { getMyGroups } from "@/actions/groups";
import { LinkButton } from "@/components/ui/link-button";
import { GroupCard } from "@/components/groups/GroupCard";

export default async function DashboardPage() {
  const groups = await getMyGroups();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Groups</h1>
          <p className="text-sm text-gray-500">
            {groups.length === 0 ? "No groups yet" : `${groups.length} group${groups.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <LinkButton href="/groups/new" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          New group
        </LinkButton>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
          <p className="font-medium text-gray-700">Create your first group</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">Invite roommates and start tracking expenses</p>
          <LinkButton href="/groups/new">Create group</LinkButton>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group: { id: string; name: string; currency: string; memberCount: number }) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
