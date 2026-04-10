"use client";

import { useEffect } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCartStore, CartItem } from "@/src/store/cartStore";

const WHATSAPP_NUMBER = "5491100000000";

function formatARS(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CartDrawer() {
  const isCartOpen = useCartStore((state) => state.isCartOpen);
  const closeCart = useCartStore((state) => state.closeCart);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const total = items.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  );

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  function handleWhatsAppOrder() {
    const lines = items.map(
      (item: CartItem) => `- ${item.quantity}x ${item.name} (${formatARS(item.price)})`
    );
    const text = `Hola! Quiero pedir:\n${lines.join("\n")}\nTotal: ${formatARS(total)}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          isCartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-zinc-950 shadow-xl transition-transform duration-300 ease-in-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
          <h2 className="text-lg font-semibold text-white">
            Tu carrito
          </h2>
          <button
            onClick={closeCart}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            aria-label="Cerrar carrito"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-zinc-500">
                Tu carrito está vacío.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item: CartItem) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                >
                  {/* Thumbnail */}
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                      <span className="text-[10px] text-zinc-400">
                        Sin img
                      </span>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-100">
                        {item.name}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="rounded p-0.5 text-zinc-400 transition-colors hover:text-red-500"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800"
                          aria-label="Reducir cantidad"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-zinc-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span className="text-sm font-semibold text-zinc-100">
                        {formatARS(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-zinc-800 px-4 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-medium text-zinc-400">
                Total
              </span>
              <span className="text-xl font-bold text-white">
                {formatARS(total)}
              </span>
            </div>

            <button
              onClick={handleWhatsAppOrder}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              Pedir por WhatsApp
            </button>

            <button
              onClick={clearCart}
              className="mt-2 w-full rounded-xl px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
