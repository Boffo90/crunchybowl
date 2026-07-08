import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductoEditForm } from "@/components/admin/ProductoEditForm";
import type { Producto } from "@/types";

export default async function AdminProductoEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: producto } = await supabase
    .from("productos")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!producto) notFound();

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Editar producto</h1>
      <ProductoEditForm producto={producto as Producto} />
    </div>
  );
}
