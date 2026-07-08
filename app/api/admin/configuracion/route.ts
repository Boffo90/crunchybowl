import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = "annelid@gmail.com";

const bodySchema = z.object({
  sellos_meta: z.number().int().min(1).max(100),
});

export async function PATCH(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Meta de sellos invalida" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("configuracion")
    .upsert({ key: "fidelidad", value: { sellos_meta: parsed.data.sellos_meta } }, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
