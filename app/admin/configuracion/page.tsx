import { createAdminClient } from "@/lib/supabase/admin";
import { ConfiguracionForm } from "@/components/admin/ConfiguracionForm";
import { parseHorarios } from "@/lib/horarios";
import { parseDescuento } from "@/lib/descuento";
import { EXTRAS_DEFAULT } from "@/lib/extras";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  const supabase = createAdminClient();
  const [{ data: fidelidad }, { data: horariosRow }, { data: descuentoRow }, { data: extrasRow }] = await Promise.all([
    supabase.from("configuracion").select("value").eq("key", "fidelidad").maybeSingle(),
    supabase.from("configuracion").select("value").eq("key", "horarios").maybeSingle(),
    supabase.from("configuracion").select("value").eq("key", "descuento").maybeSingle(),
    supabase.from("configuracion").select("value").eq("key", "extras_grupos").maybeSingle(),
  ]);

  const meta = (fidelidad?.value as { sellos_meta?: number } | null)?.sellos_meta ?? 10;
  const horarios = parseHorarios(horariosRow?.value);
  const descuentoRaw = (descuentoRow?.value ?? {}) as { activo?: boolean; porcentaje?: number; motivo?: string };
  // Para el formulario se muestran los valores guardados aunque este inactivo
  // (parseDescuento fuerza porcentaje 0 al estar inactivo, aqui no sirve).
  const descuento = {
    activo: parseDescuento(descuentoRow?.value).activo,
    porcentaje: typeof descuentoRaw.porcentaje === "number" ? Math.floor(descuentoRaw.porcentaje) : 10,
    motivo: typeof descuentoRaw.motivo === "string" ? descuentoRaw.motivo : "",
  };

  // Se leen los valores crudos para que el formulario muestre lo guardado
  // aunque este desactivado (precio 0), igual que con el descuento.
  const toppingsRaw = (extrasRow?.value as { bibimbap?: { toppings?: { incluidos?: number; precio?: number } } } | null)
    ?.bibimbap?.toppings;
  const toppings = {
    incluidos: typeof toppingsRaw?.incluidos === "number"
      ? toppingsRaw.incluidos
      : EXTRAS_DEFAULT.bibimbap.toppings.incluidos,
    precio: typeof toppingsRaw?.precio === "number"
      ? toppingsRaw.precio
      : EXTRAS_DEFAULT.bibimbap.toppings.precio,
  };

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Configuración</h1>
      <ConfiguracionForm
        metaInicial={meta}
        horariosIniciales={horarios}
        descuentoInicial={descuento}
        toppingsInicial={toppings}
      />
    </div>
  );
}
