import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodificarDireccion } from "@/lib/geocodificar";
import { calcularDelivery } from "@/lib/delivery";

const bodySchema = z.object({
  direccion: z.string().trim().min(5).max(200),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Direccion invalida" }, { status: 400 });
    }

    const geo = await geocodificarDireccion(parsed.data.direccion);
    if (!geo) {
      return NextResponse.json({ encontrada: false });
    }

    const delivery = calcularDelivery(geo.lat, geo.lng);
    return NextResponse.json({
      encontrada: true,
      direccion: geo.direccion,
      disponible: delivery.disponible,
      distancia_km: delivery.distancia_km,
      costo: delivery.costo,
      mensaje: delivery.mensaje ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
