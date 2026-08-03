import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdmin } from "@/lib/admin";

// Ajuste manual de la tarjeta de fidelidad. Los sellos normalmente los suma un
// trigger de la base al entregar un pedido, pero el local necesita poder
// corregir a mano: pedidos por WhatsApp, un sello que no se otorgo, etc.
const bodySchema = z.object({
  // Cuanto sumar (o restar, en negativo) a los sellos del cliente.
  delta: z.number().int().min(-100).max(100),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ajuste invalido" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: perfil } = await admin
    .from("profiles")
    .select("sellos")
    .eq("id", params.id)
    .maybeSingle();

  if (!perfil) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // Nunca por debajo de cero: una tarjeta no puede tener sellos negativos.
  const sellos = Math.max(0, (perfil.sellos ?? 0) + parsed.data.delta);

  const { error } = await admin.from("profiles").update({ sellos }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, sellos });
}
