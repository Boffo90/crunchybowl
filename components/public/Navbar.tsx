"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { CartBadge } from "@/components/public/CartBadge";

const links = [
  { href: ROUTES.HOME, label: "Inicio" },
  { href: ROUTES.CARTA, label: "Carta" },
  { href: ROUTES.COMO_FUNCIONA, label: "Cómo funciona" },
  { href: ROUTES.FIDELIDAD, label: "Fidelidad" },
  { href: ROUTES.NOSOTROS, label: "Nosotros" },
  { href: ROUTES.CONTACTO, label: "Contacto" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-crunchy-pink-soft bg-crunchy-cream/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href={ROUTES.HOME} className="flex items-center gap-2">
          <Image src="/brand/logo.webp" alt="CrunchyBowl" width={44} height={44} className="rounded-full" priority />
          <span className="font-display text-2xl font-bold text-crunchy-accent">CrunchyBowl</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-crunchy-dark transition-colors hover:text-crunchy-accent">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link href={ROUTES.MI_CUENTA} className="rounded-full p-2 transition-colors hover:bg-crunchy-pink-soft" aria-label="Mi cuenta">
            <User className="h-5 w-5 text-crunchy-dark" />
          </Link>
          <CartBadge />
          <button type="button" onClick={() => setOpen((p) => !p)} className="rounded-full p-2 transition-colors hover:bg-crunchy-pink-soft md:hidden" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <div className={cn("overflow-hidden transition-all md:hidden", open ? "max-h-96" : "max-h-0")}>
        <ul className="flex flex-col gap-2 px-4 pb-4">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 font-medium text-crunchy-dark hover:bg-crunchy-pink-soft">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
