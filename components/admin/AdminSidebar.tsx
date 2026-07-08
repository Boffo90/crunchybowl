"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const links = [
  { href: ROUTES.ADMIN, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.ADMIN_PEDIDOS, label: "Pedidos", icon: ShoppingBag },
  { href: ROUTES.ADMIN_PRODUCTOS, label: "Productos", icon: UtensilsCrossed },
  { href: ROUTES.ADMIN_CLIENTES, label: "Clientes", icon: Users },
  { href: ROUTES.ADMIN_CONFIG, label: "Configuracion", icon: Settings },
];

export function AdminSidebar({ nombreAdmin }: { nombreAdmin: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = ROUTES.HOME;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-full bg-white p-2 shadow-kawaii md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5 text-crunchy-dark" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-kawaii transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between border-b border-crunchy-pink-soft p-6">
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <Image src="/brand/logo.webp" alt="CrunchyBowl" width={36} height={36} className="rounded-full" />
            <span className="font-display text-xl font-bold text-crunchy-accent">Admin</span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="md:hidden" aria-label="Cerrar">
            <X className="h-5 w-5 text-crunchy-dark" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {links.map((l) => {
            const activo = pathname === l.href || (l.href !== ROUTES.ADMIN && pathname.startsWith(l.href));
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 font-medium transition-colors",
                  activo
                    ? "bg-crunchy-accent text-white"
                    : "text-crunchy-dark hover:bg-crunchy-pink-soft"
                )}
              >
                <Icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-crunchy-pink-soft p-4">
          <p className="mb-3 text-sm text-crunchy-muted">Hola, {nombreAdmin}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-sm font-medium text-crunchy-dark hover:bg-crunchy-pink-soft"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesion
          </button>
        </div>
      </aside>
    </>
  );
}
