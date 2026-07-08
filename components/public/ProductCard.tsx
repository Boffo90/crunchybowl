import Link from "next/link";
import Image from "next/image";
import { formatCLP, PRODUCTO_LABELS } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import type { Producto } from "@/types";

export function ProductCard({ producto }: { producto: Producto }) {
  return (
    <Link href={ROUTES.PRODUCTO(producto.slug)} className="group block">
      <div className="overflow-hidden rounded-kawaii bg-white shadow-kawaii transition-all group-hover:-translate-y-1 group-hover:shadow-kawaii-lg">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-crunchy-pink-soft to-crunchy-cream">
          {producto.imagen_url ? (
            <Image
              src={producto.imagen_url}
              alt={producto.nombre}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl font-bold text-crunchy-accent">
              {PRODUCTO_LABELS[producto.tipo] ?? "MENU"}
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="mb-1 font-display text-xl font-bold text-crunchy-dark">{producto.nombre}</h3>
          <p className="mb-3 line-clamp-2 min-h-[40px] text-sm text-crunchy-muted">{producto.descripcion}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-crunchy-accent">
              {producto.tipo === "pollo" ? "desde " : ""}{formatCLP(producto.precio_base)}
            </span>
            <span className="text-sm font-semibold text-crunchy-accent group-hover:underline">Ver más</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
