import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estadoPagoFlow } from "@/lib/flow";
import { recomputarSellos } from "@/lib/sellos";

// Webhook de Flow: llega un POST form-encoded con el token del pago.
// Consultamos el estado real a Flow (nunca confiar solo en el POST).
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const token = form.get("token")?.toString();
    if (!token) return NextResponse.json({ error: "token requerido" }, { status: 400 });

    const estado = await estadoPagoFlow(token);

    if (estado.status === 2) {
      const admin = createAdminClient();
      const { data: pedido } = await admin
        .from("pedidos")
        .update({ estado: "pagado" })
        .eq("id", estado.commerceOrder)
        .eq("estado", "pendiente")
        .select("user_id")
        .maybeSingle();

      // Pagar confirma el pedido: suma el sello de fidelidad al cliente.
      if (pedido) await recomputarSellos(admin, pedido.user_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en confirmacion Flow:", err);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
