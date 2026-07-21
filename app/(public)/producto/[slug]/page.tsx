import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExtrasGrupos, getVentanasProductos } from "@/lib/horarios-db";
import { ProductConfigurator } from "@/components/public/ProductConfigurator";
import type { Producto, Opcion } from "@/types";

export default async function ProductoPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: producto } = await supabase
    .from("productos")
    .select("*")
    .eq("slug", params.slug)
    .eq("activo", true)
    .single();

  if (!producto) notFound();

  const [{ data: opciones }, ventanas, extras] = await Promise.all([
    supabase
      .from("opciones")
      .select("*")
      .eq("producto_id", producto.id)
      .eq("activo", true)
      .order("orden"),
    getVentanasProductos(),
    getExtrasGrupos(),
  ]);

  return (
    <ProductConfigurator
      producto={producto as Producto}
      opciones={(opciones as Opcion[] | null) ?? []}
      ventanaHoraria={ventanas[producto.slug] ?? null}
      extras={extras[producto.slug] ?? {}}
    />
  );
}
