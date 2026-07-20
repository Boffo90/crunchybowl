import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Estados que otorgan un sello de fidelidad: el pedido fue confirmado por el
 * local y no se cancelo. "pendiente" aun no cuenta (el local no lo tomo) y
 * "cancelado" nunca cuenta.
 */
export const ESTADOS_CON_SELLO = ["pagado", "preparando", "listo", "en_camino", "entregado"];

/**
 * Recalcula los sellos disponibles de un cliente a partir de sus pedidos.
 * Es idempotente: se puede llamar en cada cambio de estado sin duplicar, y
 * corrige de paso los pedidos antiguos que quedaron sin sello.
 *
 * sellos disponibles = pedidos que otorgan sello − sellos ya canjeados.
 * Los pedidos de invitado (user_id null) no suman: se ignoran.
 */
export async function recomputarSellos(admin: SupabaseClient, userId: string | null | undefined) {
  if (!userId) return;

  const [{ count }, { data: profile }] = await Promise.all([
    admin
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("estado", ESTADOS_CON_SELLO),
    admin.from("profiles").select("sellos_canjeados").eq("id", userId).maybeSingle(),
  ]);

  const ganados = count ?? 0;
  const canjeados = profile?.sellos_canjeados ?? 0;
  const sellos = Math.max(0, ganados - canjeados);

  await admin.from("profiles").update({ sellos }).eq("id", userId);
}
