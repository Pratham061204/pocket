import { redirect } from "next/navigation";
import { getDbUser, syncUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user = await getDbUser();

  // First login: sync user from Supabase into DB
  if (!user) {
    user = await syncUser();
    if (!user) redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userName={user.name} avatarUrl={user.avatarUrl} />
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
