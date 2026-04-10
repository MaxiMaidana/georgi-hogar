"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/src/store/cartStore";

interface AddToCartButtonProps {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

export default function AddToCartButton({
  id,
  name,
  price,
  image_url,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <button
      onClick={() => {
        addItem({ id, name, price, image_url });
        openCart();
      }}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-black transition-colors hover:bg-zinc-200 active:scale-[0.98]"
    >
      <ShoppingCart size={20} />
      Agregar al carrito
    </button>
  );
}
