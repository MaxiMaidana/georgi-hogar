"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/src/store/cartStore";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  previous_price: number | null;
  stock: number;
  image_url: string | null;
  imagenes: string[] | null;
  category: string | null;
  estado: boolean;
}

function formatARS(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  const thumbnail =
    product.imagenes && product.imagenes.length > 0
      ? product.imagenes[0]
      : product.image_url;

  const hasDiscount =
    product.previous_price != null &&
    product.previous_price > 0 &&
    product.previous_price > product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.previous_price! - product.price) / product.previous_price!) *
          100
      )
    : 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900 transition-all hover:border-zinc-700">
      {/* Image + discount badge */}
      <Link href={`/producto/${product.id}`} className="relative block">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.name}
            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-52"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-zinc-800 sm:h-52">
            <span className="text-xs text-zinc-500">Sin imagen</span>
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            -{discountPercent}% OFF
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <Link
          href={`/producto/${product.id}`}
          className="line-clamp-2 text-sm font-medium text-zinc-100 transition-colors hover:text-white sm:text-base"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          {hasDiscount && (
            <span className="text-xs text-zinc-500 line-through sm:text-sm">
              {formatARS(product.previous_price!)}
            </span>
          )}
          <span className="text-base font-bold text-white sm:text-lg">
            {formatARS(product.price)}
          </span>
        </div>

        <button
          onClick={() =>
            addItem({
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: thumbnail ?? null,
            })
          }
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 active:scale-[0.98]"
        >
          <ShoppingCart size={16} />
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
