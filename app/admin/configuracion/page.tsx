import { createAdminClient } from "@/lib/supabase/admin";
import { ConfiguracionForm } from "@/components/admin/ConfiguracionForm";
import { parseHorarios } from "@/lib/horarios";
import { parseDescuento } from "@/lib/descuento";
import { EXTRAS_DEFAULT, TOPPING_CON_PRECIO_PROPIO } from "@/lib/extras";
import { AVISO_INACTIVO, parseAviso } from "@/lib/aviso";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracionPage() {
  const supabase = createAdminClient();
  const [{ data: fidelidad }, { data: horariosRow }, { data: descuentoRow }, { data: extrasRow }, { data: avisoRow }] =
    await Promise.all([
      supabase.from("configuracion").select("value").eq("key", "fidelidad").maybeSingle(),
      supabase.from("configuracion").select("value").eq("key", "horarios").maybeSingle(),
      supabase.from("configuracion").select("value").eq("key", "descuento").maybeSingle(),
      supabase.from("configuracion").select("value").eq("key", "extras_grupos").maybeSingle(),
      supabase.from("configuracion").select("value").eq("key", "aviso").maybeSingle(),
    ]);

  // Se muestra el texto guardado aunque este apagado, para poder encenderlo
  // de nuevo sin tener que reescribirlo.
  const avisoGuardado = avisoRow?.value as { texto?: string; tono?: string } | null;
  const aviso = {
    ...AVISO_INACTIVO,
    ...parseAviso(avisoRow?.value),
    texto: typeof avisoGuardado?.texto === "string" ? avisoGuardado.texto : "",
    tono: avisoGuardado?.tono === "alerta" ? ("alerta" as const) : ("info" as const),
  };

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
  const toppingsRaw = (extrasRow?.value as {
    bibimbap?: { toppings?: { incluidos?: number; precio?: number; precios?: Record<string, number> } };
  } | null)?.bibimbap?.toppings;
  const defaults = EXTRAS_DEFAULT.bibimbap.toppings;
  const toppings = {
    incluidos: typeof toppingsRaw?.incluidos === "number" ? toppingsRaw.incluidos : defaults.incluidos,
    precio: typeof toppingsRaw?.precio === "number" ? toppingsRaw.precio : defaults.precio,
    precioHuevo:
      typeof toppingsRaw?.precios?.[TOPPING_CON_PRECIO_PROPIO] === "number"
        ? toppingsRaw.precios[TOPPING_CON_PRECIO_PROPIO]
        : defaults.precios?.[TOPPING_CON_PRECIO_PROPIO] ?? defaults.precio,
  };

  return (
    <div className="p-6 md:p-10">
      <h1 className="mb-8 font-display text-4xl font-bold text-crunchy-dark">Configuración</h1>
      <ConfiguracionForm
        metaInicial={meta}
        horariosIniciales={horarios}
        descuentoInicial={descuento}
        toppingsInicial={toppings}
        avisoInicial={aviso}
      />
    </div>
  );
}
