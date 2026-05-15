import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/groups/CopyButton";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { groupId } = await params;
  const [group, user] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, inviteCode: true },
    }),
    getDbUser(),
  ]);

  if (!group || !user) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const inviteLink = `${siteUrl}/join/${group.inviteCode}`;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {group.name}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Invite to {group.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Invite code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 border rounded-lg px-3 py-2 text-lg font-mono font-bold tracking-widest text-center">
                {group.inviteCode}
              </code>
              <CopyButton text={group.inviteCode} label="Copy code" />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1.5">Or share link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 border rounded-lg px-3 py-2 text-xs truncate">
                {inviteLink}
              </code>
              <CopyButton text={inviteLink} label="Copy link" />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Anyone with this code or link can join the group.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
