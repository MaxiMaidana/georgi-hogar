import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/src/lib/supabase-server";
import EditProductForm, { ProductToEdit } from "@/src/components/EditProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single<ProductToEdit>();

  if (!product) return notFound();

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/products"
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Volver a productos"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Editar Producto</h1>
          <p className="mt-0.5 text-sm text-zinc-500 truncate max-w-sm">{product.name}</p>
        </div>
      </div>

      <EditProductForm product={product} />
    </div>
  );
}
