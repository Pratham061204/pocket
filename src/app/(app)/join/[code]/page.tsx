import { Users } from "lucide-react";
import { getGroupForJoin, joinGroup } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;
  const group = await getGroupForJoin(code);

  if (!group) {
    return (
      <div className="max-w-sm mx-auto text-center py-16">
        <p className="font-semibold text-gray-800">Invalid invite code</p>
        <p className="text-sm text-gray-500 mt-1">This link may have expired or been revoked.</p>
        <LinkButton href="/" className="mt-4">Go home</LinkButton>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-black text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
            P
          </div>
          <CardTitle>You&apos;ve been invited</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{group.name}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge variant="secondary">{group.currency}</Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {group._count.members} member{group._count.members !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await joinGroup(code);
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Join group
            </Button>
          </form>

          <LinkButton href="/" variant="ghost" size="sm" className="w-full justify-center">
            Not now
          </LinkButton>
        </CardContent>
      </Card>
    </div>
  );
}
