// Service role: el middleware ya restringe /admin/*; RLS ocultaria perfiles ajenos.
import { createAdminClient } from "@/lib/supabase/admin";
import { SellosCliente } from "@/components/admin/SellosCliente";
import { parseMetaSellos } from "@/lib/fidelidad";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  const supabase = createAdminClient();
  const [{ data: clientes }, { data: fidelidad }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nombre, email, telefono, sellos, sellos_canjeados")
      .eq("rol", "cliente")
      .order("nombre"),
    supabase.from("configuracion").select("value").eq("key", "fidelidad").maybeSingle(),
  ]);

  const meta = parseMetaSellos(fidelidad?.value);

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-2 font-display text-4xl font-bold text-crunchy-dark">Clientes</h1>
      <p className="mb-8 text-sm text-crunchy-muted">
        Los sellos se suman solos al entregar un pedido. Usa los botones para corregir a mano
        (por ejemplo, un pedido tomado por WhatsApp).
      </p>

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
                <div>
                  <p className="text-sm text-crunchy-muted">{c.telefono}</p>
                  {c.sellos_canjeados > 0 && (
                    <p className="text-xs text-crunchy-muted">{c.sellos_canjeados} canjeados</p>
                  )}
                </div>
                <SellosCliente
                  clienteId={c.id}
                  nombre={c.nombre}
                  sellosIniciales={c.sellos ?? 0}
                  meta={meta}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
