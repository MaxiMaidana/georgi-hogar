import { createSupabaseServerClient } from "@/src/lib/supabase-server";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Bienvenido al Panel de Administración de Georgi Hogar
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
        Sesión iniciada como{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {user?.email}
        </span>
      </p>
    </div>
  );
}
