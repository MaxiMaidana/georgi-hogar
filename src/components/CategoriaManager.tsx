"use client";

import { useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Tag } from "lucide-react";
import { useCategories } from "@/src/hooks/useCategories";

type ToastState = { type: "success" | "error"; message: string } | null;

export default function CategoriaManager() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const { categories, loading } = useCategories();
  const [localCategories, setLocalCategories] = useState<string[] | null>(null);
  const [newNombre, setNewNombre] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const displayed = localCategories ?? categories;

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleAdd() {
    const nombre = newNombre.trim();
    if (!nombre) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("categorias").insert({ nombre });
      if (error) throw error;
      setLocalCategories((prev) => [...(prev ?? categories), nombre].sort());
      setNewNombre("");
      showToast("success", `Categoría "${nombre}" agregada.`);
    } catch {
      showToast("error", "No se pudo agregar la categoría.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(nombre: string) {
    setDeletingId(nombre);
    try {
      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("nombre", nombre);
      if (error) throw error;
      setLocalCategories((prev) => (prev ?? categories).filter((c) => c !== nombre));
      showToast("success", `Categoría "${nombre}" eliminada.`);
    } catch {
      showToast("error", "No se pudo eliminar la categoría.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-zinc-100">Categorías</h1>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-md">
        {/* Add new */}
        <div className="mb-5 flex gap-2">
          <div className="relative flex-1">
            <Tag
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Nueva categoría..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newNombre.trim() || saving}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Agregar
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={20} className="animate-spin text-zinc-500" />
          </div>
        ) : displayed.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-600">
            No hay categorías todavía. Agregá la primera.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-800">
            {displayed.map((nombre) => (
              <li key={nombre} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-zinc-200">{nombre}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(nombre)}
                  disabled={deletingId === nombre}
                  className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400 disabled:opacity-40"
                  aria-label={`Eliminar ${nombre}`}
                >
                  {deletingId === nombre ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {toast && (
        <div
          className={`mt-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-green-800 bg-green-950/50 text-green-400"
              : "border-red-800 bg-red-950/50 text-red-400"
          }`}
          role="alert"
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0" />
          ) : (
            <AlertCircle size={16} className="shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
