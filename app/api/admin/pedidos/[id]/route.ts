import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "annelid@gmail.com";

const bodySchema = z.object({
  estado: z.enum(["pendiente", "pagado", "preparando", "listo", "en_camino", "entregado", "cancelado"]),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("pedidos")
    .update({ estado: parsed.data.estado })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
