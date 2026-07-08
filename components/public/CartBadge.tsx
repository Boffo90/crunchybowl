"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { ROUTES } from "@/lib/routes";

export function CartBadge() {
  const [mounted, setMounted] = useState(false);
  const count = useCart((s) => s.getCount());

  useEffect(() => setMounted(true), []);

  return (
    <Link
      href={ROUTES.CARRITO}
      className="relative rounded-full p-2 transition-colors hover:bg-crunchy-pink-soft"
      aria-label="Carrito"
    >
      <ShoppingBag className="h-5 w-5 text-crunchy-dark" />
      {mounted && count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-crunchy-accent text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
