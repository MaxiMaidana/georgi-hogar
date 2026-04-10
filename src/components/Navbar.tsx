"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { useCartStore } from "@/src/store/cartStore";
import { useSearchStore } from "@/src/store/searchStore";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
  { label: "Contacto", href: "https://wa.me/5491100000000" },
];

export default function Navbar() {
  const openCart = useCartStore((state) => state.openCart);
  const items = useCartStore((state) => state.items);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const [menuOpen, setMenuOpen] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-navy-800/40 bg-navy-700 shadow-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left — hamburger (mobile) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="shrink-0 rounded-lg p-2 text-navy-100 transition-colors hover:bg-navy-800 hover:text-white md:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          {/* Brand */}
          <Link
            href="/"
            className="shrink-0 text-lg font-semibold tracking-tight text-white" style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Georgi Hogar
          </Link>

          {/* Desktop search — hidden on mobile */}
          <div className="hidden flex-1 justify-center px-4 md:flex">
            <div className="relative w-full max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-300"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="¿Qué estás buscando?"
                className="w-full rounded-full bg-navy-800 py-2 pl-10 pr-4 text-sm text-white placeholder:text-navy-300 outline-none transition-colors focus:bg-navy-900 focus:ring-1 focus:ring-navy-400"
              />
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden shrink-0 items-center gap-5 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-navy-200 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Spacer on mobile to push cart right */}
          <div className="flex-1 md:hidden" />

          {/* Right — cart */}
          <button
            onClick={openCart}
            className="relative shrink-0 rounded-lg p-2 text-navy-100 transition-colors hover:bg-navy-800 hover:text-white"
            aria-label="Abrir carrito"
          >
            <ShoppingCart size={22} />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile menu drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-navy-700 px-4 py-4">
          <span className="text-base font-semibold text-white">Menú</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="rounded-lg p-1.5 text-navy-100 transition-colors hover:text-white"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-navy-50 hover:text-navy-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
