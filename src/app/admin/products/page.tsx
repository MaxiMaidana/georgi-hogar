import Link from "next/link";
import { Plus, PackageOpen } from "lucide-react";
import { createSupabaseServerClient } from "@/src/lib/supabase-server";
import ProductsTable, { AdminProduct } from "@/src/components/ProductsTable";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, stock, image_url, imagenes, estado, destacado, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">
          Gestión de Productos
        </h1>
        <Link
          href="/admin/products/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 sm:w-auto"
        >
          <Plus size={18} />
          Nuevo Producto
        </Link>
      </div>

      {!products || products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 px-6 py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <PackageOpen size={32} className="text-zinc-500" />
          </div>
          <p className="text-lg font-medium text-zinc-300">
            No hay productos todavía
          </p>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            Empezá a cargar tu catálogo creando el primer producto.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            <Plus size={18} />
            Crear primer producto
          </Link>
        </div>
      ) : (
        <ProductsTable products={products as AdminProduct[]} />
      )}
    </div>
  );
}
