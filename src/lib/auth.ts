import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getDbUser = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  return prisma.user.findUnique({ where: { supabaseId: user.id } });
});

export async function syncUser() {
  const user = await getUser();
  if (!user) return null;

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    update: {
      name,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
    create: {
      supabaseId: user.id,
      email: user.email!,
      name,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    },
  });

  if (user.email === "demo@pocket.app") {
    const flatmates = await prisma.group.findFirst({ where: { name: "Flatmates" } });
    if (flatmates) {
      await prisma.groupMember.upsert({
        where: { userId_groupId: { userId: dbUser.id, groupId: flatmates.id } },
        update: {},
        create: { userId: dbUser.id, groupId: flatmates.id },
      });
    }
  }

  return dbUser;
}
