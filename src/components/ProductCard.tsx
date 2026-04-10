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
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-300">
      {/* Image + discount badge */}
      <Link href={`/producto/${product.id}`} className="relative block">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.name}
            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-52"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gray-100 sm:h-52">
            <span className="text-xs text-gray-400">Sin imagen</span>
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-lg bg-brand-500 px-2 py-1 text-[11px] font-semibold text-white">
            -{discountPercent}% OFF
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <Link
          href={`/producto/${product.id}`}
          className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors hover:text-navy-700 sm:text-base"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex flex-col gap-1 pt-1">
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through sm:text-sm">
                {formatARS(product.previous_price!)}
              </span>
            )}
            <span className="text-base font-bold text-gray-900 sm:text-lg">
              {formatARS(product.price)}
            </span>
          </div>
          {product.stock === 0 && (
            <span className="text-xs font-medium text-red-500">Sin stock</span>
          )}
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
          disabled={product.stock === 0}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingCart size={16} />
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}
