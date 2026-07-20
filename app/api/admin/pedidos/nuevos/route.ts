import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdmin } from "@/lib/admin";

// Estados que todavia esperan que el local mire el pedido. "pagado" entra aca
// porque el webhook de Flow mueve el pedido a pagado sin que nadie lo acepte.
const SIN_ATENDER = ["pendiente", "pagado"];

export const dynamic = "force-dynamic";

/**
 * Sondeo del panel de admin: devuelve los pedidos sin atender creados despues
 * de `desde`, mas el total pendiente para el contador del titulo de la pestania.
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const desde = new URL(req.url).searchParams.get("desde");
  if (!desde || Number.isNaN(Date.parse(desde))) {
    return NextResponse.json({ error: "Parametro 'desde' invalido" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: nuevos, error } = await admin
    .from("pedidos")
    .select("id, numero, nombre, total, tipo_entrega, created_at")
    .in("estado", SIN_ATENDER)
    .gt("created_at", desde)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { count } = await admin
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .in("estado", SIN_ATENDER);

  return NextResponse.json({
    nuevos: nuevos ?? [],
    sinAtender: count ?? 0,
    // Reloj del servidor: evita que un desfase horario del equipo del local
    // haga que se repitan o se pierdan avisos entre sondeos.
    ahora: new Date().toISOString(),
  });
}
