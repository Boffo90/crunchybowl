import { createClient } from "@/lib/supabase/server";
import { getVentanasProductos } from "@/lib/horarios-db";
import { ProductCard } from "@/components/public/ProductCard";
import type { Producto, Categoria } from "@/types";

export const revalidate = 60;

export default async function CartaPage() {
  const supabase = createClient();

  const [{ data: categorias }, { data: productos }, ventanas] = await Promise.all([
    supabase.from("categorias").select("*").eq("activo", true).order("orden"),
    supabase.from("productos").select("*").eq("activo", true).order("orden"),
    getVentanasProductos(),
  ]);

  const cats = (categorias as Categoria[] | null) ?? [];
  const prods = (productos as Producto[] | null) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-2 font-display text-5xl font-bold text-crunchy-dark">Nuestra carta</h1>
        <p className="text-crunchy-muted">Elige tus favoritos y arma tu pedido</p>
      </div>

      {cats.length === 0 ? (
        <div className="py-12 text-center text-crunchy-muted">Aún no hay productos disponibles.</div>
      ) : (
        cats.map((cat) => {
          const productosCat = prods.filter((p) => p.categoria_id === cat.id);
          if (productosCat.length === 0) return null;
          return (
            <section key={cat.id} className="mb-12">
              <h2 className="mb-6 font-display text-3xl font-bold text-crunchy-accent">{cat.nombre}</h2>
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {productosCat.map((p) => (
                  <ProductCard key={p.id} producto={p} ventana={ventanas[p.slug]} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
