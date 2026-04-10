import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase-server";
import AdminNav from "@/src/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AdminNav email={user.email ?? ""} />
      <main className="flex-1 bg-zinc-950 p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
