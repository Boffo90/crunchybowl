import { NextResponse } from "next/server";
import { estadoPagoFlow } from "@/lib/flow";

// Flow devuelve al pagador con un POST (no GET) hacia urlReturn.
// Resolvemos el pedido desde el token y redirigimos a su confirmacion.
async function redirigir(token: string | null, origin: string) {
  if (token) {
    try {
      const estado = await estadoPagoFlow(token);
      if (estado.commerceOrder) {
        return NextResponse.redirect(`${origin}/pedido/${estado.commerceOrder}`, 303);
      }
    } catch (err) {
      console.error("Error en retorno Flow:", err);
    }
  }
  return NextResponse.redirect(origin, 303);
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const token = form?.get("token")?.toString() ?? null;
  return redirigir(token, new URL(req.url).origin);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  return redirigir(url.searchParams.get("token"), url.origin);
}
