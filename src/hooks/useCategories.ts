"use client";

import { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function useCategories() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("categorias")
      .select("nombre")
      .order("nombre", { ascending: true })
      .then(({ data }) => {
        setCategories((data ?? []).map((r: { nombre: string }) => r.nombre));
        setLoading(false);
      });
  }, [supabase]);

  return { categories, loading };
}
