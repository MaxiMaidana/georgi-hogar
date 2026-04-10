"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import ProductCard, { Product } from "@/src/components/ProductCard";
import { useSearchStore } from "@/src/store/searchStore";
import { supabase } from "@/src/lib/supabase";

const CATEGORIES = [
  "Todos",
  "Electrodomésticos",
  "Muebles",
  "Cocinas y Hornos",
  "Parrillas y Discos",
  "Bazar",
];

export default function CatalogSection({
  initialProducts,
  limit,
  title = "Destacados",
}: {
  initialProducts: Product[];
  limit?: number;
  title?: string;
}) {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No search/filter active → show SSR products, no DB call needed
    if (!query.trim() && activeCategory === "Todos") {
      setProducts(initialProducts);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      let dbQuery = supabase
        .from("products")
        .select("*")
        .eq("estado", true)
        .order("created_at", { ascending: false });

      if (query.trim()) {
        const q = query.trim();
        dbQuery = dbQuery.or(
          `name.ilike.%${q}%,description.ilike.%${q}%,short_description.ilike.%${q}%,category.ilike.%${q}%`
        );
      }

      if (activeCategory !== "Todos") {
        dbQuery = dbQuery.ilike("category", activeCategory);
      }

      const { data } = await dbQuery;
      setProducts((data as Product[]) ?? []);
      setLoading(false);
    }, 350);

    return () => {
      clearTimeout(timer);
      setLoading(false);
    };
  }, [query, activeCategory, initialProducts]);

  return (
    <>
      {/* Mobile search — only visible below md */}
      <div className="px-4 pt-4 md:hidden">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="w-full rounded-full bg-zinc-800 py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-400 outline-none transition-colors focus:bg-zinc-700 focus:ring-1 focus:ring-zinc-600"
          />
        </div>
      </div>

      {/* Categories */}
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Categorías</h2>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section id="destacados" className="px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {loading && (
              <Loader2 size={18} className="animate-spin text-zinc-500" />
            )}
          </div>

          {!loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 py-20">
              <p className="text-base text-zinc-500">
                No se encontraron productos.
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Probá con otra búsqueda o categoría.
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 transition-opacity duration-200 ${
                loading ? "opacity-40 pointer-events-none" : "opacity-100"
              }`}
            >
              {(limit ? products.slice(0, limit) : products).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
