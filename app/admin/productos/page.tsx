import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCLP, PRODUCTO_LABELS } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import type { Producto } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  const supabase = createAdminClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .order("orden");

  const items = (productos as Producto[] | null) ?? [];

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Productos</h1>

      <div className="rounded-kawaii bg-white shadow-kawaii">
        {items.length === 0 ? (
          <p className="py-12 text-center text-crunchy-muted">Aun no hay productos.</p>
        ) : (
          <div className="divide-y divide-crunchy-pink-soft">
            {items.map((p) => (
              <Link
                key={p.id}
                href={ROUTES.ADMIN_PRODUCTO(p.id)}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-crunchy-cream"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-crunchy-pink-soft to-crunchy-cream">
                  {p.imagen_url ? (
                    <Image src={p.imagen_url} alt={p.nombre} fill sizes="56px" className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-bold text-crunchy-accent">
                      {PRODUCTO_LABELS[p.tipo] ?? "MENU"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-crunchy-dark">{p.nombre}</p>
                  <p className="text-sm text-crunchy-muted line-clamp-1">{p.descripcion}</p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold " +
                    (p.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500")
                  }
                >
                  {p.activo ? "Activo" : "Inactivo"}
                </span>
                <p className="w-24 shrink-0 text-right text-lg font-bold text-crunchy-accent">{formatCLP(p.precio_base)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
