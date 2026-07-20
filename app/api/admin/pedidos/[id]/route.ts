import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdmin } from "@/lib/admin";
import { recomputarSellos } from "@/lib/sellos";

const bodySchema = z.object({
  estado: z.enum(["pendiente", "pagado", "preparando", "listo", "en_camino", "entregado", "cancelado"]),
  motivo: z.string().trim().max(200).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { estado, motivo } = parsed.data;

  const { data: actual } = await admin
    .from("pedidos")
    .select("user_id, notas_generales")
    .eq("id", params.id)
    .single();

  const cambios: { estado: string; notas_generales?: string } = { estado };

  // Al rechazar se deja el motivo registrado en el pedido: queda el historial de
  // por que se cancelo, aunque el aviso al cliente se mande aparte por WhatsApp.
  if (estado === "cancelado" && motivo) {
    cambios.notas_generales = [actual?.notas_generales, `❌ Rechazado: ${motivo}`]
      .filter(Boolean)
      .join("\n");
  }

  const { error } = await admin
    .from("pedidos")
    .update(cambios)
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // El sello de fidelidad se recalcula segun el nuevo estado: aceptar suma,
  // cancelar resta. Es idempotente, asi que no duplica al mover entre estados.
  await recomputarSellos(admin, actual?.user_id);

  return NextResponse.json({ success: true });
}
