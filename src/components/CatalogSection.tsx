"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import ProductCard, { Product } from "@/src/components/ProductCard";
import { useSearchStore } from "@/src/store/searchStore";
import { supabase } from "@/src/lib/supabase";
import { useCategories } from "@/src/hooks/useCategories";

const PAGE_SIZE = 20;

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

  const { categories: dbCategories } = useCategories();
  const CATEGORIES = ["Todos", ...dbCategories];

  // Infinite scroll states (catalog mode only, when !limit)
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length >= PAGE_SIZE);

  const sentinelRef = useRef<HTMLDivElement>(null);
  // Skip the very first fetch — SSR already populated `products`
  const skipInitialFetch = useRef(true);
  // Prevent a stale fetch when filters change while page > 0
  const pendingReset = useRef(false);

  const isInfiniteMode = !limit;

  // Debounce the search query
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // ── HOME PAGE (limit mode): filter against initialProducts or DB ──────────
  useEffect(() => {
    if (isInfiniteMode) return;

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
  }, [query, activeCategory, initialProducts, isInfiniteMode]);

  // ── CATALOG MODE: reset when search/filter changes ───────────────────────
  useEffect(() => {
    if (!isInfiniteMode) return;
    // Initial mount: just set hasMore from SSR data, don't reset
    if (skipInitialFetch.current) return;

    pendingReset.current = true;
    setProducts([]);
    setHasMore(true);
    setPage(0);
  }, [debouncedQuery, activeCategory, isInfiniteMode]);

  // ── CATALOG MODE: fetch a page ────────────────────────────────────────────
  useEffect(() => {
    if (!isInfiniteMode) return;

    // First mount: SSR data already in state
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      setHasMore(initialProducts.length >= PAGE_SIZE);
      return;
    }

    // Wait until page resets to 0 after a filter change
    if (pendingReset.current && page !== 0) return;
    pendingReset.current = false;

    const isAppend = page > 0;
    if (isAppend) setIsLoadingMore(true);
    else setLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let dbQuery = supabase
      .from("products")
      .select("*")
      .eq("estado", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.trim();
      dbQuery = dbQuery.or(
        `name.ilike.%${q}%,description.ilike.%${q}%,short_description.ilike.%${q}%,category.ilike.%${q}%`
      );
    }
    if (activeCategory !== "Todos") {
      dbQuery = dbQuery.ilike("category", activeCategory);
    }

    dbQuery.then(({ data }) => {
      const results = (data as Product[]) ?? [];

      if (isAppend) {
        setProducts((prev) => [...prev, ...results]);
        setIsLoadingMore(false);
      } else {
        setProducts(results);
        setLoading(false);
      }

      setHasMore(results.length >= PAGE_SIZE);
    });
  }, [page, debouncedQuery, activeCategory, isInfiniteMode, initialProducts]);

  // ── INTERSECTION OBSERVER ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isInfiniteMode) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore && !loading) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isInfiniteMode, hasMore, isLoadingMore, loading]);

  const displayedProducts = limit ? products.slice(0, limit) : products;

  return (
    <>
      {/* Mobile search */}
      <div className="px-4 pt-4 md:hidden">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="w-full rounded-full border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-navy-400 focus:ring-1 focus:ring-navy-400"
          />
        </div>
      </div>

      {/* Categories */}
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Categorías</h2>
          <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-navy-700 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section id="destacados" className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {loading && <Loader2 size={18} className="animate-spin text-gray-400" />}
          </div>

          {!loading && displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-20">
              <p className="text-base text-gray-500">No se encontraron productos.</p>
              <p className="mt-1 text-sm text-gray-400">
                Probá con otra búsqueda o categoría.
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 gap-3 transition-opacity duration-200 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 ${
                loading ? "pointer-events-none opacity-40" : "opacity-100"
              }`}
            >
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Sentinel + feedback (catalog mode only) */}
          {isInfiniteMode && (
            <>
              <div ref={sentinelRef} className="h-1" />

              {isLoadingMore && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Cargando más productos...</span>
                </div>
              )}

              {!hasMore && displayedProducts.length > 0 && !isLoadingMore && (
                <p className="mt-8 text-center text-xs text-gray-400">
                  No hay más productos para mostrar
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
