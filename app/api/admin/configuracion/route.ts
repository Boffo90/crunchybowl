import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { esAdmin } from "@/lib/admin";

const parHorario = z.tuple([z.number().int().min(0).max(1440), z.number().int().min(0).max(1440)])
  .refine(([a, c]) => a < c, "apertura debe ser antes del cierre");

const bodySchema = z.object({
  sellos_meta: z.number().int().min(1).max(100).optional(),
  horarios: z.object({
    lun: parHorario, mar: parHorario, mie: parHorario, jue: parHorario,
    vie: parHorario, sab: parHorario, dom: parHorario,
  }).optional(),
  descuento: z.object({
    activo: z.boolean(),
    porcentaje: z.number().int().min(1).max(99),
    motivo: z.string().trim().max(80),
  }).optional(),
  // slug del producto -> grupo -> { incluidos, precio, precios }
  // "precios" lleva las opciones que valen distinto al resto (ej: el huevo).
  extras_grupos: z.record(
    z.record(
      z.object({
        incluidos: z.number().int().min(0).max(50),
        precio: z.number().int().min(0).max(100000),
        precios: z.record(z.number().int().min(0).max(100000)).optional(),
      })
    )
  ).optional(),
}).refine(
  (b) =>
    b.sellos_meta !== undefined ||
    b.horarios !== undefined ||
    b.descuento !== undefined ||
    b.extras_grupos !== undefined,
  "Nada que actualizar"
);

export async function PATCH(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!esAdmin(user?.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Configuracion invalida" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (parsed.data.sellos_meta !== undefined) {
    const { error } = await admin
      .from("configuracion")
      .upsert({ key: "fidelidad", value: { sellos_meta: parsed.data.sellos_meta } }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (parsed.data.horarios !== undefined) {
    const { error } = await admin
      .from("configuracion")
      .upsert({ key: "horarios", value: parsed.data.horarios }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (parsed.data.descuento !== undefined) {
    const { error } = await admin
      .from("configuracion")
      .upsert({ key: "descuento", value: parsed.data.descuento }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (parsed.data.extras_grupos !== undefined) {
    const { error } = await admin
      .from("configuracion")
      .upsert({ key: "extras_grupos", value: parsed.data.extras_grupos }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
