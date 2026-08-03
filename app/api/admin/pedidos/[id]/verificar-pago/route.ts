import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esAdmin } from "@/lib/admin";
import { verificarPagoFlow } from "@/lib/flow-verificar";

export const dynamic = "force-dynamic";

/** Le pregunta a Flow si el pedido esta pagado y actualiza el estado. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const resultado = await verificarPagoFlow(params.id);
  return NextResponse.json(resultado);
}
