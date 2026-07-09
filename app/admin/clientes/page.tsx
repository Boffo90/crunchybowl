// Service role: el middleware ya restringe /admin/*; RLS ocultaria perfiles ajenos.
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  const supabase = createAdminClient();
  const { data: clientes } = await supabase
    .from("profiles")
    .select("id, nombre, email, telefono, sellos, sellos_canjeados")
    .eq("rol", "cliente")
    .order("nombre");

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Clientes</h1>

      <div className="rounded-kawaii bg-white shadow-kawaii">
        {!clientes || clientes.length === 0 ? (
          <p className="py-12 text-center text-crunchy-muted">Aun no hay clientes registrados.</p>
        ) : (
          <div className="divide-y divide-crunchy-pink-soft">
            {clientes.map((c) => (
              <div key={c.id} className="grid gap-3 p-4 md:grid-cols-4 md:items-center">
                <div className="md:col-span-2">
                  <p className="font-semibold text-crunchy-dark">{c.nombre}</p>
                  <p className="text-sm text-crunchy-muted">{c.email}</p>
                </div>
                <p className="text-sm text-crunchy-muted">{c.telefono}</p>
                <p className="text-right text-sm font-semibold text-crunchy-accent">
                  {c.sellos} sellos {c.sellos_canjeados > 0 ? `· ${c.sellos_canjeados} canjeados` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
