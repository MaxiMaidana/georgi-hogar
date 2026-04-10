"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Pencil, Check, Pause, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  imagenes: string[] | null;
  estado: boolean;
  created_at: string;
}

function useSupabase() {
  return useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );
}

function formatARS(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-green-950/50 text-green-400"
          : "bg-yellow-950/50 text-yellow-400"
      }`}
    >
      {isActive ? <Check size={12} /> : <Pause size={12} />}
      {isActive ? "Activo" : "Pausado"}
    </span>
  );
}

function ProductThumb({ url, name }: { url: string | null; name: string }) {
  if (url) {
    return <img src={url} alt={name} className="h-10 w-10 rounded-xl object-cover" />;
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800">
      <span className="text-[9px] text-zinc-500">Sin img</span>
    </div>
  );
}

export default function ProductsTable({
  products: initialProducts,
}: {
  products: AdminProduct[];
}) {
  const supabase = useSupabase();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setProducts(initialProducts);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, stock, image_url, imagenes, estado, created_at")
        .ilike("name", `%${searchTerm.trim()}%`)
        .order("created_at", { ascending: false });
      setProducts((data as AdminProduct[]) ?? []);
      setLoading(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [searchTerm, initialProducts, supabase]);

  return (
    <>
      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        {loading ? (
          <Loader2
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin text-zinc-500"
          />
        ) : (
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
        )}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar producto por nombre..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      {products.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center">
          <p className="text-sm text-zinc-500">
            No se encontraron productos{searchTerm ? ` para "${searchTerm}"` : ""}.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div
            className={`flex flex-col gap-3 transition-opacity duration-200 md:hidden ${
              loading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <ProductThumb url={product.image_url} name={product.name} />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <p className="truncate font-semibold text-zinc-100">{product.name}</p>
                    <p className="mt-0.5 text-sm text-zinc-400">{formatARS(product.price)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusBadge isActive={product.estado} />
                      <span className="text-xs text-zinc-500">Stock: {product.stock}</span>
                    </div>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
                      aria-label="Editar producto"
                    >
                      <Pencil size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div
            className={`hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-opacity duration-200 md:block ${
              loading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60">
                <tr>
                  <th className="px-5 py-3.5 font-medium text-zinc-500">Imagen</th>
                  <th className="px-5 py-3.5 font-medium text-zinc-500">Nombre</th>
                  <th className="px-5 py-3.5 font-medium text-zinc-500">Precio</th>
                  <th className="px-5 py-3.5 font-medium text-zinc-500">Stock</th>
                  <th className="px-5 py-3.5 font-medium text-zinc-500">Estado</th>
                  <th className="px-5 py-3.5 font-medium text-zinc-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-zinc-800/40">
                    <td className="px-5 py-4">
                      <ProductThumb url={product.image_url} name={product.name} />
                    </td>
                    <td className="px-5 py-4 font-medium text-zinc-100">{product.name}</td>
                    <td className="px-5 py-4 text-zinc-400">{formatARS(product.price)}</td>
                    <td className="px-5 py-4 text-zinc-400">{product.stock}</td>
                    <td className="px-5 py-4">
                      <StatusBadge isActive={product.estado} />
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                      >
                        <Pencil size={13} />
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
