import { supabase } from "@/src/lib/supabase";
import { Product } from "@/src/components/ProductCard";
import CatalogSection from "@/src/components/CatalogSection";
import WhatsAppButton from "@/src/components/WhatsAppButton";

export const revalidate = 60;

export const metadata = {
  title: "Catálogo Completo | Georgi Hogar",
};

export default async function CatalogoPage() {
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("estado", true)
    .order("created_at", { ascending: false })
    .range(0, 19);

  return (
    <div className="flex flex-1 flex-col bg-black">
      <CatalogSection
        initialProducts={(products as Product[]) ?? []}
        title="Catálogo Completo"
      />
      <WhatsAppButton />
    </div>
  );
}
