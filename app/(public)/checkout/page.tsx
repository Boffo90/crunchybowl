import { createClient } from "@/lib/supabase/server";
// RLS bloquea configuracion para usuarios normales: leerla con service role.
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckoutForm } from "@/components/public/CheckoutForm";
import { getDescuentoFresh, getHorariosFresh } from "@/lib/horarios-db";
import { flowDisponible } from "@/lib/flow";
import { CATEGORIA_PROMOS_SLUG, parseMetaSellos, type PlatoElegible } from "@/lib/fidelidad";

export default async function CheckoutPage() {
  const supabase = createClient();
  const [horarios, descuento] = await Promise.all([getHorariosFresh(), getDescuentoFresh()]);
  const { data: { user } } = await supabase.auth.getUser();

  // RLS bloquea profiles incluso para su propio dueño: se lee con service role
  // filtrando por el id del usuario ya autenticado (igual que en mi-cuenta).
  const admin = createAdminClient();

  let nombreInicial = "";
  let telefonoInicial = "";
  let sellos = 0;

  if (user) {
    const { data: profile } = await admin
      .from("profiles")
      .select("nombre, telefono, email, sellos")
      .eq("id", user.id)
      .maybeSingle();
    nombreInicial = profile?.nombre ?? "";
    telefonoInicial = profile?.telefono ?? "";
    sellos = profile?.sellos ?? 0;
  }

  // Platos que pueden ir gratis con el canje: todo lo que no sea promo (las
  // promos traen mas de una cosa). Solo se consulta si hay sesion.
  const [{ data: fidelidadRow }, { data: promos }] = await Promise.all([
    admin.from("configuracion").select("value").eq("key", "fidelidad").maybeSingle(),
    admin.from("categorias").select("id").eq("slug", CATEGORIA_PROMOS_SLUG).maybeSingle(),
  ]);

  let platosElegibles: PlatoElegible[] = [];
  if (user) {
    const query = admin.from("productos").select("id, precio_base").eq("activo", true);
    // Si la categoria promos no existe, no se excluye nada (todos elegibles).
    const { data } = promos?.id ? await query.neq("categoria_id", promos.id) : await query;
    platosElegibles = (data as PlatoElegible[] | null) ?? [];
  }

  return (
    <CheckoutForm
      userId={user?.id ?? null}
      nombreInicial={nombreInicial}
      telefonoInicial={telefonoInicial}
      horarios={horarios}
      flowHabilitado={flowDisponible()}
      descuento={descuento}
      sellos={sellos}
      metaSellos={parseMetaSellos(fidelidadRow?.value)}
      platosElegibles={platosElegibles}
    />
  );
}
