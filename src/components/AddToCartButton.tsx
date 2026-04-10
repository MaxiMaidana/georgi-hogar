"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/src/store/cartStore";

interface AddToCartButtonProps {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock: number;
}

export default function AddToCartButton({
  id,
  name,
  price,
  image_url,
  stock,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <button
      onClick={() => {
        addItem({ id, name, price, image_url });
        openCart();
      }}
      disabled={stock === 0}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-black transition-colors hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ShoppingCart size={20} />
      {stock === 0 ? "Sin stock" : "Agregar al carrito"}
    </button>
  );
}
