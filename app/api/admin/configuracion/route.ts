import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "annelid@gmail.com";

const parHorario = z.tuple([z.number().int().min(0).max(1440), z.number().int().min(0).max(1440)])
  .refine(([a, c]) => a < c, "apertura debe ser antes del cierre");

const bodySchema = z.object({
  sellos_meta: z.number().int().min(1).max(100).optional(),
  horarios: z.object({
    lun: parHorario, mar: parHorario, mie: parHorario, jue: parHorario,
    vie: parHorario, sab: parHorario, dom: parHorario,
  }).optional(),
}).refine((b) => b.sellos_meta !== undefined || b.horarios !== undefined, "Nada que actualizar");

export async function PATCH(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
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

  return NextResponse.json({ success: true });
}
