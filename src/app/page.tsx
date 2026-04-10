import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { Product } from "@/src/components/ProductCard";
import CatalogSection from "@/src/components/CatalogSection";
import WhatsAppButton from "@/src/components/WhatsAppButton";

export const revalidate = 60;

export default async function Home() {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("estado", true)
    .eq("destacado", true)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 flex-col bg-black">
      <CatalogSection
        initialProducts={(products as Product[]) ?? []}
        title="Destacados"
      />

      {/* "Ver todo el catálogo" button */}
      <div className="-mt-8 mb-16 flex justify-center px-4">
        <Link
          href="/catalogo"
          className="rounded-full border border-zinc-700 bg-zinc-900 px-8 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
        >
          Ver todo el catálogo
        </Link>
      </div>

      <WhatsAppButton />
    </div>
  );
}
