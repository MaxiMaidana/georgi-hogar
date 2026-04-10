"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/src/components/Navbar";
import CartDrawer from "@/src/components/CartDrawer";

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/login");

  return (
    <>
      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <CartDrawer />}
    </>
  );
}
